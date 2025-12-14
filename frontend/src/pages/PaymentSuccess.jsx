import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { HOSTED_API_URL } from '../config';
import { useSession } from '../context/SessionContext';

const PaymentSuccess = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { startSession, incrementPaymentFailure } = useSession(); // We might use this as fallback or context update
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
                    if (isMounted) {
                        setStatus('failed');
                        // Track this as a failure so we can limit retries
                        if (incrementPaymentFailure) {
                            console.log("Incrementing failure count"); // Debug logging
                            incrementPaymentFailure();
                        } else {
                            alert("CRITICAL ERROR: incrementPaymentFailure is missing!");
                        }
                    }
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
    }, [searchParams, navigate, incrementPaymentFailure]);

    return (
        <div className="h-screen w-screen flex flex-col items-center justify-center bg-polaris-bg relative z-50 overflow-hidden">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-md -z-10" />

            <div
                className="bg-white p-12 rounded-3xl shadow-2xl text-center max-w-md w-full mx-4"
            >
                {status === 'verifying' && (
                    <div className="animate-pulse">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-8 h-8 text-blue-600 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold mb-2 text-gray-800">Verifying Payment...</h2>
                        <p className="text-gray-500">Please wait while we confirm your transaction.</p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="text-green-600">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                        </div>
                        <h2 className="text-3xl font-bold mb-4 text-gray-800">Payment Successful!</h2>
                        <p className="text-xl text-gray-600">Starting your session...</p>
                    </div>
                )}

                {status === 'failed' && (
                    <div className="text-gray-800">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                        </div>
                        <h2 className="text-3xl font-bold mb-4">Payment Failed</h2>
                        <p className="mb-8 text-gray-500">We couldn't verify your payment.</p>
                        <button
                            onClick={() => navigate('/checkout')}
                            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-xl text-lg transition-all shadow-lg"
                        >
                            Try Again
                        </button>
                    </div>
                )}

                {status === 'error' && (
                    <div className="text-gray-800">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        </div>
                        <h2 className="text-3xl font-bold mb-4">Something went wrong</h2>
                        <p className="mb-8 text-gray-500">Please contact support.</p>
                        <button
                            onClick={() => navigate('/')}
                            className="bg-gray-800 text-white px-8 py-3 rounded-xl font-bold hover:bg-gray-700 transition-colors"
                        >
                            Back to Home
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PaymentSuccess;
