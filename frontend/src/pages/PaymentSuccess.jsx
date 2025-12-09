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
        const verifyPayment = async () => {
            const transactionId = searchParams.get('merchantTransactionId');
            if (!transactionId) {
                setStatus('error');
                return;
            }

            try {
                // 1. Verify with Hosted Backend
                const res = await axios.get(`${HOSTED_API_URL}/order_status/${transactionId}`);

                if (res.data.status === 'SUCCESS') {
                    setStatus('success');

                    // 2. Trigger Local Session via Bridge
                    if (window.polarisLocal && window.polarisLocal.startSession) {
                        await window.polarisLocal.startSession(transactionId);
                    } else {
                        console.warn("Polaris Local Bridge not found. Running in web mode?");
                        // Fallback for dev/web testing
                        // startSession(); // From context
                    }

                    // 3. Navigate to Options (Frame Selection)
                    // Add a small delay for UX
                    setTimeout(() => {
                        navigate('/options');
                    }, 2000);

                } else {
                    setStatus('failed');
                }
            } catch (err) {
                console.error("Verification failed", err);
                setStatus('error');
            }
        };

        verifyPayment();
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
