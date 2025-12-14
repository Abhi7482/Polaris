import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { HOSTED_API_URL } from '../config';
import { useSession } from '../context/SessionContext';

const PaymentSuccess = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { startSession, incrementPaymentFailure, paymentFailureCount } = useSession(); // We might use this as fallback or context update
    const [status, setStatus] = useState('verifying');
    // Guard to ensure we only count this failure once per page load
    const hasIncrementedRef = useRef(false);

    useEffect(() => {
        let isMounted = true;
        let attempts = 0;
        const maxAttempts = 30; // 30 * 2s = 60 seconds timeout

        const handleFailure = () => {
            if (incrementPaymentFailure && !hasIncrementedRef.current) {
                console.log("Incrementing failure count");
                hasIncrementedRef.current = true;
                incrementPaymentFailure();
            }
        };

        const verifyPayment = async () => {
            const transactionId = searchParams.get('merchantTransactionId');
            if (!transactionId) {
                if (isMounted) {
                    setStatus('error');
                    handleFailure();
                }
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
                        handleFailure();
                    }
                } else {
                    // Still PENDING, retry
                    if (attempts < maxAttempts) {
                        attempts++;
                        setTimeout(verifyPayment, 2000); // Retry in 2s
                    } else {
                        if (isMounted) {
                            setStatus('timeout');
                            handleFailure();
                        }
                    }
                }
            } catch (err) {
                console.error("Verification pending/failed", err);
                // If 404 or network error, retry anyway (might be backend cold start)
                if (attempts < maxAttempts) {
                    attempts++;
                    setTimeout(verifyPayment, 2000);
                } else {
                    if (isMounted) {
                        setStatus('error');
                        handleFailure();
                    }
                }
            }
        };

        verifyPayment();

        return () => { isMounted = false; };
    }, [searchParams, navigate, incrementPaymentFailure]);

    // Derived state for max failures
    const isMaxFailures = paymentFailureCount >= 2;

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

                {(status === 'failed' || status === 'error' || status === 'timeout') && (
                    <div className="text-gray-800">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                        </div>
                        <h2 className="text-3xl font-bold mb-4">
                            {isMaxFailures ? "Session Failed" : "Payment Failed"}
                        </h2>
                        <p className="mb-8 text-gray-500">
                            {isMaxFailures
                                ? "Too many failed attempts. Returning to home..."
                                : "We couldn't verify your payment."}
                        </p>

                        {isMaxFailures ? (
                            <button
                                onClick={() => navigate('/')}
                                className="w-full bg-gray-800 hover:bg-gray-700 text-white font-bold py-4 rounded-xl text-lg transition-all shadow-lg"
                            >
                                Return Home
                            </button>
                        ) : (
                            <button
                                onClick={() => navigate('/checkout')}
                                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-xl text-lg transition-all shadow-lg"
                            >
                                Try Again ({paymentFailureCount}/2)
                            </button>
                        )}
                    </div>
                )}


                <p className="text-xs text-gray-300 mt-4 absolute bottom-4 left-0 right-0">
                    Debug: {status} | Count: {paymentFailureCount} | ID: {searchParams.get('merchantTransactionId')?.substring(0, 8)}
                </p>
            </div>
        </div>
    );
};

export default PaymentSuccess;
