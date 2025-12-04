import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button';

const PaymentReminder = () => {
    const navigate = useNavigate();

    const handleOperatorConfirm = () => {
        navigate('/options');
    };

    return (
        <div className="h-screen w-screen flex flex-col items-center justify-center bg-polaris-bg relative z-50">
            <div className="absolute inset-0 bg-black/20 backdrop-blur-sm -z-10" />

            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="modal text-center max-w-2xl p-16 border border-white/40"
            >
                <h2 className="text-4xl font-bold mb-8 text-polaris-text">Payment Required</h2>
                <p className="text-2xl text-polaris-muted mb-12 font-light">
                    Please pay the operator to begin your session.
                </p>

                <div className="flex justify-center">
                    <Button onClick={handleOperatorConfirm} variant="secondary">
                        Operator: Start Session
                    </Button>
                </div>
            </motion.div>
        </div>
    );
};

export default PaymentReminder;
