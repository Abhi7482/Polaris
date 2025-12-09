import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { HOSTED_API_URL } from '../config';
import { useSession } from '../context/SessionContext';

const PaymentSuccess = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { startSession } = useSession(); // We might use this as fallback or context update
    const [status, setStatus] = useState('verifying');

    useEffect(() => {
        let isMounted = true;
        let attempts = 0;
        const maxAttempts = 30; // 30 * 2s = 60 seconds timeout

        const verifyPayment = async () => {
            const transactionId = searchParams.get('merchantTransactionId');
            if (!transactionId) {
                if (isMounted) setStatus('error');
                return;
            }

            try {
                // Poll the hosted backend
                const res = await axios.get(`${HOSTED_API_URL}/order_status/${transactionId}`);

                if (res.data.status === 'SUCCESS') {
                    if (isMounted) {
                        setStatus('success');

                        // Trigger Local Session
                        if (window.polarisLocal && window.polarisLocal.api) {
                            // Use the generic API bridge we created
                            await window.polarisLocal.api('start_session', {
                                id: transactionId,
                                copies: res.data.copies || 1
                            });
                        } else if (window.polarisLocal && window.polarisLocal.startSession) {
                            // Legacy fallback
                            await window.polarisLocal.startSession(transactionId);
                        } else {
                            console.warn("Polaris Local Bridge not found.");
                        }

                        // Delay for UX then navigate
                        setTimeout(() => navigate('/options'), 2000);
                    }
                } else if (res.data.status === 'FAILED') {
                    if (isMounted) setStatus('failed');
                } else {
                    // Still PENDING, retry
                    if (attempts < maxAttempts) {
                        attempts++;
                        setTimeout(verifyPayment, 2000); // Retry in 2s
                    } else {
                        if (isMounted) setStatus('timeout');
                    }
                }
            } catch (err) {
                console.error("Verification pending/failed", err);
                // If 404 or network error, retry anyway (might be backend cold start)
                if (attempts < maxAttempts) {
                    attempts++;
                    setTimeout(verifyPayment, 2000);
                } else {
                    if (isMounted) setStatus('error');
                }
            }
        };

        verifyPayment();

        return () => { isMounted = false; };
    }, [searchParams, navigate]);

    return (
        <div className="h-screen w-screen flex flex-col items-center justify-center bg-polaris-bg text-center">
            {status === 'verifying' && (
                <div className="animate-pulse">
                    <h2 className="text-2xl font-bold mb-2">Verifying Payment...</h2>
                    <p>Please wait while we confirm your transaction.</p>
                </div>
            )}

            {status === 'success' && (
                <div className="text-green-600">
                    <h2 className="text-4xl font-bold mb-4">Payment Successful!</h2>
                    <p className="text-xl">Starting your session...</p>
                </div>
            )}

            {status === 'failed' && (
                <div className="text-red-600">
                    <h2 className="text-3xl font-bold mb-4">Payment Failed</h2>
                    <p className="mb-6">We couldn't verify your payment.</p>
                    <button
                        onClick={() => navigate('/payment')}
                        className="bg-red-600 text-white px-6 py-3 rounded-xl font-bold"
                    >
                        Try Again
                    </button>
                </div>
            )}

            {status === 'error' && (
                <div className="text-red-600">
                    <h2 className="text-3xl font-bold mb-4">Something went wrong</h2>
                    <p className="mb-6">Please contact support.</p>
                    <button
                        onClick={() => navigate('/')}
                        className="bg-gray-800 text-white px-6 py-3 rounded-xl font-bold"
                    >
                        Back to Home
                    </button>
                </div>
            )}
        </div>
    );
};

export default PaymentSuccess;
