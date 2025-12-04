import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import { useSession } from '../context/SessionContext';

const Welcome = () => {
    const navigate = useNavigate();
    const { startSession } = useSession();

    const handleStart = async () => {
        const success = await startSession();
        if (success) {
            navigate('/payment');
        }
    };

    return (
        <div className="h-screen w-screen flex flex-col items-center justify-center bg-polaris-bg relative overflow-hidden">
            {/* Abstract Background Orbs */}
            <div className="absolute top-[-10%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-polaris-accent/20 blur-[100px]" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-polaris-muted/20 blur-[100px]" />

            <div className="z-10 text-center flex flex-col items-center gap-16">
                <motion.div
                    initial={{ y: -50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 1, ease: "easeOut" }}
                >
                    <h1 className="text-9xl font-bold tracking-tighter text-polaris-text drop-shadow-sm">
                        POLARIS<span className="text-polaris-muted text-6xl font-light">.CO</span>
                    </h1>
                    <p className="text-xl text-polaris-muted mt-6 tracking-[0.8em] uppercase font-light">Cinematic Photobooth</p>
                </motion.div>

                {/* Glass Cards Carousel */}
                <div className="flex gap-8">
                    {[1, 2, 3].map(i => (
                        <motion.div
                            key={i}
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.5 + (i * 0.2) }}
                            className="w-32 h-48 card transform rotate-[-2deg] hover:rotate-0 transition-all duration-500 flex items-center justify-center"
                        >
                            <div className="w-24 h-40 bg-polaris-bg/50 rounded-lg" />
                        </motion.div>
                    ))}
                </div>

                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 1.5, duration: 0.5 }}
                >
                    <Button onClick={handleStart} className="text-2xl px-20 py-6">
                        Tap to Start
                    </Button>
                </motion.div>
            </div>
        </div>
    );
};

export default Welcome;
