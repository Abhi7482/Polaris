import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_URL, { HOSTED_API_URL } from '../config';
import { useSession } from '../context/SessionContext';

const Payment = () => {
    const navigate = useNavigate();
    const { copies, paymentFailureCount, incrementPaymentFailure, startSession } = useSession();
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
            <div className="absolute inset-0 bg-polaris-accent/5 backdrop-blur-sm -z-10" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="glass-optical p-8 md:p-12 rounded-3xl text-center max-w-md w-full mx-4 relative font-sans"
            >
                {/* Back Button */}
                <button
                    onClick={handleBack}
                    className="absolute top-6 left-6 flex items-center gap-2 text-polaris-muted hover:text-polaris-primary transition-all duration-300 group"
                >
                    <div className="p-2 rounded-full bg-polaris-bg/50 group-hover:bg-polaris-accent/20 transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </div>
                    <span className="font-medium text-sm tracking-wide uppercase hidden sm:block">Back</span>
                </button>

                <h2 className="font-display text-2xl md:text-3xl font-light mb-4 text-polaris-text type-hero">Checkout</h2>
                <p className="text-polaris-muted mb-8 text-base md:text-lg text-balance">Total: ₹{copies * 100}</p>

                <div className="text-xs text-red-300 font-mono mb-2 flex flex-col gap-1">

                </div>

                {error && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-polaris-accent/20 text-polaris-primary p-3 rounded-xl mb-6 text-sm font-medium"
                    >
                        {error}
                    </motion.div>
                )}

                <button
                    onClick={handlePayment}
                    disabled={loading || paymentFailureCount >= 2}
                    className="w-full btn-magnetic bg-polaris-primary hover:bg-polaris-text text-polaris-white font-semibold py-4 px-6 rounded-xl text-base md:text-lg transition-all duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex items-center justify-center gap-2"
                >
                    {loading ? (
                        <>
                            <svg className="animate-spin h-5 w-5 text-polaris-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
                            await startSession();
                            navigate('/options');
                            setLoading(false);
                        }}
                        className="mt-6 text-xs text-polaris-muted hover:text-polaris-primary underline transition-colors duration-200"
                    >
                        [DEV] Skip Payment
                    </button>
                )}
            </motion.div>
        </div>
    );
};

export default Payment;