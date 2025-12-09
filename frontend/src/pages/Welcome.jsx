import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../context/SessionContext';
import { Sparkles, ArrowRight, Camera, Zap } from 'lucide-react';

const Welcome = () => {
    const navigate = useNavigate();
    const { startSession, setCopies, copies } = useSession();
    const [isLoading, setIsLoading] = useState(false);

    // Secure Exit State
    const [showPinModal, setShowPinModal] = useState(false);
    const [pin, setPin] = useState('');
    const [logoClicks, setLogoClicks] = useState(0);

    const handleLogoClick = () => {
        setLogoClicks(prev => prev + 1);
        setTimeout(() => setLogoClicks(0), 2000); // Reset if not fast enough

        if (logoClicks >= 4) { // 5th click triggers
            setShowPinModal(true);
            setLogoClicks(0);
        }
    };

    const handlePinSubmit = (e) => {
        e.preventDefault();
        if (pin === '7482') {
            if (window.electron && window.electron.exit) {
                window.electron.exit();
            } else {
                alert("Exit signal sent (Electron not detected)");
                setShowPinModal(false);
            }
        } else {
            alert("Incorrect PIN");
            setPin('');
        }
    };

    const handleStart = async () => {
        setIsLoading(true);
        const success = await startSession();
        if (success) {
            navigate('/payment');
        }
        setIsLoading(false);
    };

    // Stagger animation variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1, delayChildren: 0.2 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 15 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } }
    };

    return (
        // Adjusted padding for better fit on 1080p height
        <div className="relative h-screen w-full flex flex-col items-center justify-center py-4 px-4 overflow-hidden font-sans">

            {/* --- Background Elements & Grain (Using existing glass-panel definition) --- */}
            <div className="bg-noise" />
            <div className="absolute inset-0 overflow-hidden -z-10">
                <div className="absolute top-[-20%] left-[-20%] w-[350px] h-[350px] bg-polaris-accent/30 rounded-full blur-[80px] animate-blob mix-blend-multiply" />
                <div className="absolute bottom-[-20%] right-[-20%] w-[300px] h-[300px] bg-white/40 rounded-full blur-[80px] animate-blob animation-delay-2000" />
            </div>

            {/* --- Main Unified Glass Card - Optimized for Height --- */}
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                // Stronger background for the glass panel for contrast
                className="relative w-full max-w-xl flex flex-col items-center shadow-2xl rounded-[2.5rem] h-full max-h-[900px] p-6 sm:p-8 bg-white/60 backdrop-blur-2xl border border-white/80"
            >
                {/* --- 1. Header (Updated Branding) --- */}
                <motion.div variants={itemVariants} className="text-center space-y-1 mb-4">
                    <div className="inline-flex items-center gap-2 text-polaris-primary/70">
                        <Camera className="w-4 h-4" />
                        <span className="text-[10px] uppercase tracking-widest font-bold">THE DIGITAL PHOTOBOOTH</span>
                    </div>
                    {/* Brand name is now just POLARIS */}
                    <h1
                        onClick={handleLogoClick}
                        className="text-5xl sm:text-6xl font-black tracking-tighter text-polaris-primary leading-tight cursor-default select-none active:scale-95 transition-transform"
                    >
                        POLARIS
                    </h1>
                    <p className="text-base text-polaris-text/80 font-medium max-w-sm mx-auto">
                        Snap, process, and get studio-quality results in under a minute.
                    </p>
                </motion.div>

                {/* --- 2. Full-Length Image Showcase (Strict Height) --- */}
                <motion.div variants={itemVariants} className="relative h-[300px] sm:h-[350px] flex justify-center items-center gap-1 sm:gap-2 my-2 w-full">
                    {[1, 2, 3].map((i, index) => {
                        const isCenter = index === 1;
                        return (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{
                                    opacity: 1,
                                    scale: isCenter ? 1 : 0.95,
                                    zIndex: isCenter ? 10 : 1,
                                    y: isCenter ? -10 : 0
                                }}
                                transition={{ delay: 0.3 + (index * 0.1), type: "spring", stiffness: 100, damping: 20 }}
                                whileHover={{ y: -20, scale: 1.05, zIndex: 20, transition: { duration: 0.3 } }}

                                // Photostrip styling
                                className={`aspect-portrait h-full p-1 bg-white rounded-xl border-[3px] border-polaris-primary/10 shadow-lg overflow-hidden transition-all duration-300 ease-out cursor-pointer ${isCenter ? 'shadow-polaris-primary/20' : 'opacity-90'}`}
                            >
                                <img
                                    src={`/assets/showcase_${i}.png`}
                                    alt={`Portrait ${i}`}
                                    // CRITICAL: object-contain ensures the image's entire vertical length is shown.
                                    className="w-full h-full object-contain bg-polaris-accent/10 rounded-lg"
                                />
                            </motion.div>
                        )
                    })}
                </motion.div>

                {/* --- 3. Interactive Controls --- */}
                <div className="flex flex-col w-full flex-grow mt-4 justify-between space-y-4">

                    {/* Feature Highlight Chips */}
                    <motion.div variants={itemVariants} className="flex justify-center gap-3 text-xs text-polaris-text font-medium border-b border-polaris-primary/5 pb-3">
                        <span className='flex items-center gap-1 px-3 py-1 bg-polaris-accent/30 rounded-full'><Zap size={14} className='text-polaris-primary' /> 60 Second Process</span>
                        <span className='flex items-center gap-1 px-3 py-1 bg-polaris-accent/30 rounded-full'><Sparkles size={14} className='text-polaris-primary' /> Retouch Included</span>
                    </motion.div>

                    {/* Copy Selector (Sliding Pill) */}
                    <motion.div variants={itemVariants} className="space-y-2">
                        <label className="text-sm font-medium text-polaris-text block uppercase tracking-wider text-center">Select your print quantity</label>
                        <div className="flex bg-polaris-muted/10 p-1 rounded-xl border border-white/50">
                            {[2, 3, 4].map((num) => (
                                <button
                                    key={num}
                                    onClick={() => setCopies(num)}
                                    className="flex-1 relative py-1.5 text-sm font-medium z-10 focus:outline-none"
                                >
                                    {copies === num && (
                                        <motion.div
                                            layoutId="selector-pill"
                                            className="absolute inset-0 bg-white rounded-lg shadow-md border border-polaris-primary/10 -z-10"
                                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                        />
                                    )}
                                    <div className={`flex flex-col items-center leading-tight transition-colors ${copies === num ? 'text-polaris-primary font-bold' : 'text-polaris-muted hover:text-polaris-text'}`}>
                                        <span className="text-lg leading-none">{num}</span>
                                        <span className="text-[9px] uppercase tracking-wider font-normal opacity-70">Prints</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </motion.div>

                    {/* Price & CTA Block */}
                    <motion.div variants={itemVariants} className="mt-4 flex flex-col gap-2">
                        <div className="text-center">
                            <span className="text-4xl font-black text-polaris-primary tracking-tight">₹{copies * 100}</span>
                            <p className="text-polaris-muted text-xs uppercase tracking-widest mt-1">TOTAL</p>
                        </div>

                        <button
                            onClick={handleStart}
                            disabled={isLoading}
                            className="group relative overflow-hidden w-full bg-polaris-primary text-white rounded-xl py-3.5 px-8 mt-2 font-bold text-lg tracking-wide transition-all duration-300 hover:shadow-xl hover:shadow-polaris-primary/30 active:scale-[0.99]"
                        >
                            <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent z-10" />
                            <div className="flex items-center justify-center gap-2">
                                {isLoading ? 'Processing Photo...' : 'Start Session & Get Prints'}
                                {!isLoading && <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />}
                            </div>
                        </button>
                    </motion.div>
                </div>

                {/* --- Footer Links --- */}
                <motion.footer variants={itemVariants} className="pt-4 w-full text-center text-polaris-muted/70">
                    <div className="flex justify-center gap-8 text-sm font-medium">
                        <button onClick={() => navigate('/about')} className="hover:text-polaris-primary transition-colors py-2 px-4">About Us</button>
                        <span className="opacity-30 py-2">•</span>
                        <button onClick={() => navigate('/policies')} className="hover:text-polaris-primary transition-colors py-2 px-4">Terms & Conditions</button>
                    </div>
                </motion.footer>
            </motion.div>

            {/* PIN Modal */}
            {showPinModal && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                    <div className="bg-white p-8 rounded-2xl shadow-2xl w-80">
                        <h3 className="text-xl font-bold mb-4 text-center">Admin Exit</h3>
                        <form onSubmit={handlePinSubmit} className="space-y-4">
                            <input
                                type="password"
                                value={pin}
                                onChange={(e) => setPin(e.target.value)}
                                placeholder="Enter PIN"
                                className="w-full p-3 border rounded-lg text-center text-2xl tracking-widest"
                                autoFocus
                            />
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setShowPinModal(false)}
                                    className="flex-1 py-3 bg-gray-200 rounded-lg font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-3 bg-red-600 text-white rounded-lg font-medium"
                                >
                                    Exit
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Welcome; 