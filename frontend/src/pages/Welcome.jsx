import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../context/SessionContext';
import { ArrowRight, Camera, Zap, Star, ScanLine } from 'lucide-react';
import axios from 'axios';
import { HOSTED_API_URL } from '../config';

const Welcome = () => {
    const navigate = useNavigate();
    const { startSession, setCopies, copies, resetSession } = useSession();
    const [isLoading, setIsLoading] = useState(false);

    // Secure Exit State
    const [showPinModal, setShowPinModal] = useState(false);
    const [pin, setPin] = useState('');
    const [logoClicks, setLogoClicks] = useState(0);

    // Wake up hosted backend on mount AND Reset Session
    React.useEffect(() => {
        if (resetSession) resetSession();

        const wakeUpBackend = async () => {
            try {
                await axios.get(HOSTED_API_URL);
                console.log("Backend Awake");
            } catch (e) {
                console.log("Waking backend...");
            }
        };
        wakeUpBackend();
    }, []);

    const handleLogoClick = () => {
        setLogoClicks(prev => prev + 1);
        setTimeout(() => setLogoClicks(0), 2000);

        if (logoClicks >= 4) {
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
            navigate('/checkout');
        } else {
            alert("Failed to connect to local backend. Is the printer/camera ready?");
        }
        setIsLoading(false);
    };

    // Animations
    const fadeUp = {
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } }
    };

    return (
        // Added select-none to prevent highlighting and blocked context menu
        <div
            className="relative h-screen w-full flex overflow-hidden font-sans bg-polaris-bg select-none"
            onContextMenu={(e) => e.preventDefault()}
        >

            {/* --- Background Texture --- */}
            <div className="bg-noise" />

            {/* --- LEFT PANEL: The "Showcase Stage" (65% Width) --- */}
            <div className="relative w-[65%] h-full bg-[#F0ECE6] flex items-center justify-center overflow-hidden pointer-events-none">

                {/* 1. Technical Viewfinder Overlay (Purely Aesthetic) */}
                <div className="absolute inset-8 border border-polaris-muted/10 rounded-[3rem] z-0">
                    {/* Corner Markers */}
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-polaris-muted/30 rounded-tl-xl" />
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-polaris-muted/30 rounded-tr-xl" />
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-polaris-muted/30 rounded-bl-xl" />
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-polaris-muted/30 rounded-br-xl" />

                    {/* Center Crosshair */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 opacity-20">
                        <div className="absolute top-1/2 left-0 w-full h-[1px] bg-polaris-muted" />
                        <div className="absolute left-1/2 top-0 h-full w-[1px] bg-polaris-muted" />
                    </div>

                    {/* Labels */}
                    <div className="absolute top-6 left-8 flex items-center gap-2 text-[10px] font-bold tracking-[0.2em] text-polaris-muted/60 uppercase">
                        <ScanLine size={14} />
                        <span>System Check: Optimal</span>
                    </div>
                    <div className="absolute bottom-6 right-8 text-[10px] font-bold tracking-[0.2em] text-polaris-muted/40 uppercase">
                        Sample Output // Not Actual Size
                    </div>
                </div>

                {/* 2. Ambient Lighting */}
                <div className="absolute top-[-20%] left-[20%] w-[600px] h-[600px] bg-polaris-accent/20 rounded-full blur-[100px] animate-blob mix-blend-multiply opacity-50" />

                {/* 3. Levitating Gallery */}
                <div className="relative w-full h-full flex justify-center items-center">
                    {[1, 2, 3].map((i, index) => {
                        const isCenter = index === 1;
                        const yOffset = isCenter ? 0 : index === 0 ? -40 : 40;
                        const delay = index * 2;

                        return (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 100 }}
                                animate={{
                                    opacity: 1,
                                    y: [yOffset, yOffset - 15, yOffset],
                                }}
                                transition={{
                                    opacity: { duration: 1, delay: 0.2 * index },
                                    y: { duration: 6, repeat: Infinity, ease: "easeInOut", delay: delay }
                                }}
                                className={`relative mx-[-20px] ${isCenter ? 'z-20 scale-110' : 'z-10 scale-90 opacity-80'}`}
                            >
                                <div className="relative group">
                                    <div className={`
                                        h-[65vh] aspect-[2/6] p-2 bg-white rounded-lg shadow-2xl overflow-hidden
                                        ${isCenter ? 'shadow-polaris-primary/20 ring-1 ring-black/5' : 'grayscale-[20%] blur-[0.5px]'}
                                    `}>
                                        <img
                                            src={`/assets/showcase_${i}.png`}
                                            alt="Sample"
                                            draggable={false} // Prevents image dragging
                                            className="w-full h-full object-contain bg-polaris-bg/30 rounded-[4px] select-none pointer-events-none"
                                        />

                                        <div className="absolute bottom-4 left-0 w-full text-center">
                                            <span className="text-[9px] font-bold tracking-[0.3em] text-polaris-muted/40 uppercase">
                                                Exhibit {i.toString().padStart(2, '0')}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            {/* --- RIGHT PANEL: The "Command Deck" (35% Width) --- */}
            <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                className="relative w-[35%] h-full bg-white/90 backdrop-blur-3xl border-l border-white shadow-[-20px_0_60px_rgba(91,74,62,0.08)] flex flex-col justify-between p-10 z-30"
            >
                {/* 1. Header Area */}
                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={fadeUp}
                    className="space-y-6 mt-4"
                >
                    <div>
                        <div className="flex items-center gap-2 text-polaris-primary/60 mb-2">
                            <Camera size={18} />
                            <span className="text-[10px] uppercase tracking-[0.3em] font-bold">Automatic Photo Booth</span>
                        </div>
                        <h1
                            onClick={handleLogoClick}
                            className="text-8xl font-black tracking-tighter text-polaris-primary leading-[0.85] cursor-default select-none -ml-1 hover:opacity-80 transition-opacity"
                        >
                            POLARIS
                        </h1>
                    </div>

                    <p className="text-xl text-polaris-text/70 font-medium leading-relaxed max-w-sm">
                        Experience the new standard. <br />
                        <span className="text-polaris-primary font-bold">Studio quality, instantly.</span>
                    </p>

                    <div className="flex gap-3 pt-2">
                        <span className="inline-flex items-center gap-2 px-4 py-2 bg-polaris-primary/5 rounded-lg border border-polaris-primary/10 text-xs font-bold text-polaris-primary uppercase tracking-wider">
                            <Star size={12} fill="currentColor" /> Premium Paper
                        </span>
                        <span className="inline-flex items-center gap-2 px-4 py-2 bg-polaris-primary/5 rounded-lg border border-polaris-primary/10 text-xs font-bold text-polaris-primary uppercase tracking-wider">
                            <Zap size={12} fill="currentColor" /> AI Enhanced
                        </span>
                    </div>
                </motion.div>

                {/* 2. Middle: Interactions */}
                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={fadeUp}
                    className="flex-grow flex flex-col justify-center space-y-8"
                >
                    <div className="space-y-4">
                        <div className="flex justify-between items-end px-1">
                            <label className="text-sm font-bold text-polaris-muted uppercase tracking-[0.2em]">Select Quantity</label>
                            <span className="text-xs font-semibold text-polaris-primary/40">Glossy Finish</span>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                            {[2, 4, 6].map((num) => (
                                <button
                                    key={num}
                                    onClick={() => setCopies(num)}
                                    className={`relative group h-36 rounded-2xl border-2 transition-all duration-300 ease-out flex flex-col items-center justify-center gap-2 overflow-hidden ${copies === num
                                        ? 'bg-polaris-primary border-polaris-primary shadow-xl shadow-polaris-primary/30 scale-105 z-10'
                                        : 'bg-white border-polaris-muted/20 hover:border-polaris-primary/40 hover:bg-polaris-bg'
                                        }`}
                                >
                                    <span className={`text-5xl font-black transition-colors ${copies === num ? 'text-white' : 'text-polaris-primary'}`}>
                                        {num}
                                    </span>
                                    <span className={`text-[10px] uppercase tracking-widest font-bold transition-colors ${copies === num ? 'text-white/80' : 'text-polaris-muted'}`}>
                                        Prints
                                    </span>

                                    {/* Active Corner Accent */}
                                    {copies === num && (
                                        <div className="absolute top-2 right-2 w-2 h-2 bg-white rounded-full animate-pulse" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </motion.div>

                {/* 3. Bottom: Action */}
                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={fadeUp}
                    className="space-y-6 mb-4"
                >
                    <div className="flex items-center justify-between border-t-2 border-dashed border-polaris-primary/10 pt-6">
                        <div className="flex flex-col">
                            <span className="text-xs font-bold text-polaris-muted uppercase tracking-widest">Total Price</span>
                            <span className="text-xs text-polaris-muted/60">Inclusive of all taxes</span>
                        </div>
                        <div className="text-6xl font-black text-polaris-primary tracking-tighter">
                            ₹{copies * 100}
                        </div>
                    </div>

                    <button
                        onClick={handleStart}
                        disabled={isLoading}
                        className="group relative w-full bg-polaris-primary text-white h-24 rounded-2xl overflow-hidden shadow-2xl shadow-polaris-primary/20 transition-transform active:scale-[0.98]"
                    >
                        {/* Shimmer Effect */}
                        <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent z-10" />

                        <div className="relative z-20 flex items-center justify-between px-8 h-full">
                            <div className="text-left">
                                <span className="block text-2xl font-black uppercase tracking-tight leading-none">Tap to Start</span>
                                <span className="text-sm text-white/60 font-medium">Ready to capture</span>
                            </div>
                            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center group-hover:translate-x-2 transition-transform duration-300">
                                {isLoading ? (
                                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <ArrowRight size={24} />
                                )}
                            </div>
                        </div>
                    </button>

                    {/* Footer Links */}
                    <div className="flex justify-center gap-6 text-[10px] uppercase tracking-widest font-bold text-polaris-muted/50">
                        <button onClick={() => navigate('/policies')} className="hover:text-polaris-primary transition-colors">Policies</button>
                        <span>•</span>
                        <button onClick={() => navigate('/about')} className="hover:text-polaris-primary transition-colors">Help</button>
                    </div>
                </motion.div>

            </motion.div>

            {/* PIN Modal */}
            {showPinModal && (
                <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-white p-10 rounded-3xl shadow-2xl w-[450px] border border-white/20"
                    >
                        <h3 className="text-3xl font-black mb-2 text-center text-polaris-primary">SYSTEM EXIT</h3>
                        <p className="text-center text-polaris-muted mb-8 text-sm uppercase tracking-widest">Authorized Personnel Only</p>

                        <form onSubmit={handlePinSubmit} className="space-y-6">
                            <input
                                type="password"
                                value={pin}
                                onChange={(e) => setPin(e.target.value)}
                                placeholder="• • • •"
                                className="w-full h-20 border-2 border-polaris-muted/20 rounded-2xl text-center text-4xl tracking-[1em] focus:border-polaris-primary focus:outline-none transition-colors"
                                autoFocus
                            />
                            <div className="flex gap-4">
                                <button
                                    type="button"
                                    onClick={() => setShowPinModal(false)}
                                    className="flex-1 h-16 bg-gray-100 rounded-xl font-bold text-lg text-polaris-text uppercase tracking-wider hover:bg-gray-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 h-16 bg-red-600 text-white rounded-xl font-bold text-lg uppercase tracking-wider hover:bg-red-700 transition-colors shadow-lg shadow-red-500/30"
                                >
                                    Exit
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default Welcome;