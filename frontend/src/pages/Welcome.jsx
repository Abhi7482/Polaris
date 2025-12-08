import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import { useSession } from '../context/SessionContext';
import { Sparkles, Camera, Zap } from 'lucide-react';

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
        <div className="h-screen w-screen flex items-center justify-center bg-polaris-bg relative overflow-hidden px-4">
            {/* Subtle background orbs */}
            <motion.div
                animate={{ y: [0, -30, 0] }}
                transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-[-20%] right-[-20%] w-96 h-96 rounded-full bg-polaris-accent/20 blur-3xl"
            />
            <motion.div
                animate={{ y: [0, 30, 0] }}
                transition={{ duration: 24, repeat: Infinity, ease: "easeInOut" }}
                className="absolute bottom-[-20%] left-[-20%] w-80 h-80 rounded-full bg-polaris-muted/15 blur-3xl"
            />

            <div className="max-w-6xl w-full text-center space-y-3">
                {/* Hero */}
                <motion.div
                    initial={{ y: -40, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.8 }}
                >
                    <h1 className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tighter text-polaris-text">
                        POLARIS<span className="text-polaris-muted text-3xl sm:text-4xl font-light">.CO</span>
                    </h1>
                    <p className="text-lg sm:text-xl md:text-2xl text-polaris-text/70 font-light tracking-widest uppercase mt-1">
                        Instant cinematic portraits
                    </p>
                </motion.div>

                {/* Tagline */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="text-base sm:text-lg md:text-xl text-polaris-muted font-medium max-w-2xl mx-auto"
                >
                    Turn any selfie into <span className="text-polaris-primary font-bold">studio-grade magic</span> in seconds.
                </motion.p>

                {/* Full-length showcase */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6, duration: 0.8 }}
                    className="flex items-center justify-center gap-3 sm:gap-5 md:gap-6 my-4"
                >
                    {[1, 2, 3].map((i) => (
                        <motion.div
                            key={i}
                            initial={{ y: 60, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.8 + i * 0.15 }}
                            whileHover={{ scale: 1.05, y: -8 }}
                            className={`${i === 2 ? 'z-10 -mt-4 sm:-mt-6 scale-105' : ''}`}
                        >
                            <img
                                src={`/assets/showcase_${i}.png`}
                                alt={`Portrait ${i}`}
                                className="w-28 sm:w-36 md:w-44 h-48 sm:h-56 md:h-64 object-cover rounded-lg border-4 border-white shadow-2xl"
                            />
                        </motion.div>
                    ))}
                </motion.div>

                {/* Feature badges – updated text */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.4 }}
                    className="flex flex-wrap justify-center gap-2 sm:gap-3"
                >
                    {[
                        { icon: Camera, text: "Pro Lighting" },
                        { icon: Zap, text: "Instant Results" },
                        { icon: Sparkles, text: "Cinematic Retouch" },
                    ].map((item, idx) => (
                        <div key={idx} className="glass-subtle px-3 sm:px-5 py-2 rounded-full flex items-center gap-2 text-xs sm:text-sm font-medium text-polaris-text">
                            <item.icon className="w-4 h-4 text-polaris-primary" />
                            {item.text}
                        </div>
                    ))}
                </motion.div>

                {/* Clean price + CTA */}
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 1.6, duration: 0.6 }}
                    className="pt-2"
                >
                    <p className="text-polaris-muted uppercase tracking-widest text-xs">One-time payment</p>
                    <div className="mt-1">
                        <span className="text-4xl sm:text-5xl md:text-6xl font-black text-polaris-primary">₹200</span>
                    </div>

                    <Button
                        onClick={handleStart}
                        className="mt-4 text-lg sm:text-xl md:text-2xl px-10 sm:px-14 md:px-20 py-4 font-bold"
                    >
                        Tap to Transform Me
                    </Button>

                    <p className="mt-3 text-polaris-muted/70 text-[10px] sm:text-xs">
                        4 stunning portraits • Delivered instantly
                    </p>
                </motion.div>

                {/* Footer */}
                <footer className="mt-8 py-4 border-t border-white/10 text-center">
                    <div className="flex justify-center gap-6 mb-2">
                        <button
                            onClick={() => navigate('/about')}
                            className="text-gray-400 hover:text-white transition-colors text-xs font-medium"
                        >
                            About Us
                        </button>
                        <button
                            onClick={() => navigate('/policies')}
                            className="text-gray-400 hover:text-white transition-colors text-xs font-medium"
                        >
                            Terms & Conditions
                        </button>
                    </div>
                    <p className="text-gray-500 text-[10px]">
                        &copy; {new Date().getFullYear()} Polaris. All rights reserved.
                    </p>
                </footer>
            </div>
        </div>
    );
};

export default Welcome;