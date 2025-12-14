import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_URL, { HOSTED_API_URL } from '../config';
import { useSession } from '../context/SessionContext';

const Payment = () => {
    const navigate = useNavigate();
    const { copies, paymentFailureCount, incrementPaymentFailure } = useSession();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Auto-redirect to Welcome if too many failures
    useEffect(() => {
        if (paymentFailureCount >= 2) {
            const timer = setTimeout(() => {
                navigate('/');
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [paymentFailureCount, navigate]);

    const handleBack = () => {
        navigate('/');
    };

    const handlePayment = async () => {
        setLoading(true);
        setError(null);
        try {
            const redirectUrl = window.location.origin + "/payment-success";
            const amountInPaise = copies * 100 * 100;

            const res = await axios.post(`${HOSTED_API_URL}/create_order`, {
                amount: amountInPaise,
                copies: copies,
                redirect_url: redirectUrl
            });

            if (res.data.success && res.data.payment_url) {
                window.location.href = res.data.payment_url;
            } else {
                throw new Error("Payment initialization failed");
            }
        } catch (err) {
            console.error("Payment Error", err);
            incrementPaymentFailure();

            // NOTE: paymentFailureCount is stale here (closure), so we check against current value BEFORE increment implies next value
            // Actually, safe to just show generic error. The useEffect will handle the redirect on next render.
            // But for immediate feedback:
            if (paymentFailureCount >= 1) { // Will be 2 on next render
                setError("Multiple failures detected. Redirecting to start...");
            } else {
                setError("Payment failed. Please tap to retry.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="h-screen w-screen flex flex-col items-center justify-center bg-polaris-bg relative z-50 overflow-hidden">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-md -z-10" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-12 rounded-3xl shadow-2xl text-center max-w-md w-full mx-4 relative"
            >
                {/* Back Button */}
                <button
                    onClick={handleBack}
                    className="absolute top-6 left-6 text-gray-400 hover:text-gray-600 transition-colors"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                </button>

                <h2 className="text-3xl font-bold mb-2 text-gray-800">Checkout</h2>
                <p className="text-gray-500 mb-8 text-lg">Total: ₹{copies * 100}</p>


                <div className="text-xs text-red-300 font-mono mb-2 flex flex-col gap-1">

                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-6 text-sm font-medium animate-pulse">
                        {error}
                    </div>
                )}

                <button
                    onClick={handlePayment}
                    disabled={loading || paymentFailureCount >= 2}
                    className="w-full bg-polaris-accent hover:bg-polaris-accent/90 text-white font-bold py-4 rounded-xl text-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed shadow-lg flex items-center justify-center gap-2"
                >
                    {loading ? (
                        <>
                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Processing...
                        </>
                    ) : (
                        "Tap here to pay"
                    )}
                </button>

                {/* Dev Bypass (Hidden in Prod) */}
                {import.meta.env.DEV && (
                    <button
                        onClick={async () => {
                            setLoading(true);
                            // Simulate successful payment flow locally
                            navigate('/payment-success');
                            setLoading(false);
                        }}
                        className="mt-6 text-xs text-red-300 hover:text-red-500 underline"
                    >
                        [DEV] Skip Payment
                    </button>
                )}
            </motion.div>
        </div>
    );
};

export default Payment;
