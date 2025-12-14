import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
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
            <div className="absolute inset-0 bg-polaris-accent/5 backdrop-blur-sm -z-10" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="glass-optical p-12 md:p-20 rounded-[3rem] text-center max-w-4xl w-full mx-8 font-sans"
            >
                {status === 'verifying' && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="animate-pulse"
                    >
                        <div className="w-32 h-32 bg-polaris-accent/20 rounded-full flex items-center justify-center mx-auto mb-10">
                            <svg className="w-16 h-16 text-polaris-primary animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        </div>
                        <h2 className="font-display text-4xl md:text-5xl font-light mb-4 text-polaris-text type-hero">Verifying Payment...</h2>
                        <p className="text-polaris-muted text-xl md:text-2xl">Please wait while we confirm your transaction.</p>
                    </motion.div>
                )}

                {status === 'success' && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-polaris-primary"
                    >
                        <div className="w-32 h-32 bg-polaris-accent/20 rounded-full flex items-center justify-center mx-auto mb-10">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                        </div>
                        <h2 className="font-display text-5xl md:text-6xl font-light mb-6 text-polaris-text type-hero">Payment Successful!</h2>
                        <p className="text-polaris-muted text-2xl md:text-3xl">Starting your session...</p>
                    </motion.div>
                )}

                {(status === 'failed' || status === 'error' || status === 'timeout') && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-polaris-text"
                    >
                        <div className="w-32 h-32 bg-polaris-accent/20 rounded-full flex items-center justify-center mx-auto mb-10">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-polaris-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                        </div>
                        <h2 className="font-display text-4xl md:text-6xl font-light mb-6 type-hero">
                            {isMaxFailures ? "Session Failed" : "Payment Failed"}
                        </h2>
                        <p className="mb-12 text-polaris-muted text-xl md:text-2xl">
                            {isMaxFailures
                                ? "Too many failed attempts. Returning to home..."
                                : "We couldn't verify your payment."}
                        </p>

                        {isMaxFailures ? (
                            <button
                                onClick={() => navigate('/')}
                                className="w-full btn-magnetic bg-polaris-muted hover:bg-polaris-text text-polaris-white font-semibold py-8 px-12 rounded-3xl text-3xl md:text-4xl transition-all duration-300 ease-in-out shadow-2xl"
                            >
                                Return Home
                            </button>
                        ) : (
                            <div className="flex flex-col gap-6 w-full">
                                <button
                                    onClick={() => navigate('/checkout')}
                                    className="w-full btn-magnetic bg-polaris-primary hover:bg-polaris-text text-polaris-white font-semibold py-8 px-12 rounded-3xl text-3xl md:text-4xl transition-all duration-300 ease-in-out shadow-2xl"
                                >
                                    Try Again ({paymentFailureCount}/2)
                                </button>
                                <button
                                    onClick={() => navigate('/')}
                                    className="w-full text-polaris-muted hover:text-polaris-primary font-medium text-xl md:text-2xl transition-colors py-4 underline underline-offset-4"
                                >
                                    Cancel & Return Home
                                </button>
                            </div>
                        )}
                    </motion.div>
                )}
            </motion.div>
        </div>
    );
};

export default PaymentSuccess;