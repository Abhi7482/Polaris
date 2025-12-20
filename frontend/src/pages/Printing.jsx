import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useSession } from '../context/SessionContext';

const Printing = () => {
    const navigate = useNavigate();
    const { resetSession } = useSession();

    useEffect(() => {
        const timer = setTimeout(async () => {
            await resetSession();
            navigate('/');
        }, 6000);
        return () => clearTimeout(timer);
    }, [navigate, resetSession]);

    return (
        <div className="h-screen w-screen flex flex-col items-center justify-center bg-polaris-bg relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute inset-0 bg-gradient-to-t from-polaris-accent/20 to-transparent pointer-events-none" />

            <motion.div
                animate={{ y: [0, -20, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="text-9xl mb-8 filter drop-shadow-2xl"
            >
                🖨️
            </motion.div>

            <div className="glass-intense px-16 py-12 rounded-[3rem] text-center shadow-2xl border border-white/60">
                <h2 className="text-6xl font-bold text-polaris-text mb-6 tracking-tight">Printing...</h2>
                <p className="text-2xl text-polaris-muted font-light">Please collect your photo below in the tray .</p>

                <div className="mt-12 w-96 h-4 bg-polaris-card/50 rounded-full overflow-hidden backdrop-blur-sm border border-white/30">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 5 }}
                        className="h-full bg-polaris-primary shadow-[0_0_20px_rgba(91,74,62,0.5)]"
                    />
                </div>
            </div>
        </div>
    );
};

export default Printing;
