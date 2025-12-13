import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_URL, { HOSTED_API_URL } from '../config';
import { useSession } from '../context/SessionContext';

const Payment = () => {
    const navigate = useNavigate();
    const { copies, startSession } = useSession();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handlePayment = async () => {
        setLoading(true);
        setError(null);
        try {
            // Redirect URL: Where PhonePe sends the user after payment
            // We want to come back to the PaymentSuccess page
            const redirectUrl = window.location.origin + "/payment-success";

            // Amount is copies * 100 rupees * 100 paise
            const amountInPaise = copies * 100 * 100;

            // Use Hosted Backend
            const res = await axios.post(`${HOSTED_API_URL}/create_order`, {
                amount: amountInPaise,
                copies: copies, // Send copies so backend can store it
                redirect_url: redirectUrl // Optional if backend hardcodes it, but good to send
            });

            if (res.data.success && res.data.payment_url) {
                // Redirect to PhonePe
                window.location.href = res.data.payment_url;
            } else {
                setError("Failed to initiate payment. Please try again.");
            }
        } catch (err) {
            console.error("Payment Error", err);
            setError("Payment service unavailable.");
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
                className="bg-white p-12 rounded-3xl shadow-2xl text-center max-w-md w-full mx-4"
            >
                <h2 className="text-3xl font-bold mb-4 text-gray-800">Start Session</h2>
                <p className="text-gray-500 mb-8">Pay ₹{copies * 100} to begin your photobooth experience.</p>

                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-6 text-sm">
                        {error}
                    </div>
                )}

                <button
                    onClick={handlePayment}
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl text-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed shadow-lg flex items-center justify-center gap-2"
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
                        "Pay Now with PhonePe"
                    )}
                </button>

                <p className="mt-6 text-xs text-gray-400">
                    Secured by PhonePe. Test Mode Active.
                </p>

                {/* Dev Bypass */}
                {import.meta.env.DEV && (
                    <button
                        onClick={async () => {
                            setLoading(true);
                            const success = await startSession();
                            if (success) navigate('/options');
                            setLoading(false);
                        }}
                        className="mt-4 text-xs text-red-300 hover:text-red-500 underline"
                    >
                        [DEV] Skip Payment
                    </button>
                )}
            </motion.div>
        </div>
    );
};

export default Payment;
