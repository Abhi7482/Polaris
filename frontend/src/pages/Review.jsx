import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import PhotoStrip from '../components/PhotoStrip';
import { useSession } from '../context/SessionContext';
import { Printer, RefreshCcw, Check, AlertCircle, ArrowRight, Lock } from 'lucide-react';
import axios from 'axios';
import API_URL from '../config';

const Review = () => {
    const navigate = useNavigate();
    const { photos, startSession, copies, callApi, retakeCount, incrementRetake } = useSession();
    const [isPrinting, setIsPrinting] = useState(false);
    const [processedPath, setProcessedPath] = useState(null);

    // --- Backend Processing (Preserved) ---
    useEffect(() => {
        const processStrip = async () => {
            try {
                const res = await callApi('/process', 'POST');
                setProcessedPath(res.data.path);
            } catch (err) {
                console.error("Processing failed", err);
            }
        };
        processStrip();
    }, []);

    const handlePrint = async () => {
        if (isPrinting) return;
        setIsPrinting(true);
        try {
            await callApi('/print', 'POST', { copies });
            navigate('/printing');
        } catch (err) {
            console.error("Print failed", err);
            setIsPrinting(false);
        }
    };

    const handleRetake = async () => {
        if (retakeCount >= 1) return;
        incrementRetake();
        await startSession();
        navigate('/options'); // Assuming flow goes back to options or capture
    };

    // --- Animations ---
    const panelVariants = {
        hidden: { x: "100%" },
        visible: { x: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } }
    };

    return (
        <div className="relative h-screen w-full flex overflow-hidden font-sans bg-polaris-bg select-none">

            {/* --- Background Texture --- */}
            <div className="bg-noise" />

            {/* ================= LEFT PANEL: Digital Lightbox (65%) ================= */}
            <div className="relative w-[65%] h-full flex flex-col items-center justify-center bg-[#E5E2DD]">

                {/* Ambient Glow */}
                <div className="absolute inset-0 bg-radial-gradient from-white/40 to-transparent opacity-50 pointer-events-none" />

                {/* Header / Context */}
                <div className="absolute top-12 left-12 z-10">
                    <div className="flex items-center gap-3 opacity-60">
                        <div className="w-2 h-2 bg-polaris-primary rounded-full animate-pulse" />
                        <span className="text-xs font-bold tracking-[0.2em] text-polaris-primary uppercase">Digital Proof</span>
                    </div>
                </div>

                {/* The Strip Container */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="relative z-20 max-h-[85vh] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.2)]"
                >
                    {/* We wrap the PhotoStrip in a constrained div to ensure it fits the UI.
                        The 'glass-optical' class adds that subtle lens effect over the strip.
                     */}
                    <div className="p-4 bg-white rounded-lg border border-white/40 ring-1 ring-black/5">
                        <div className="overflow-hidden rounded-[2px] min-w-[300px]">
                            <PhotoStrip photos={photos} />
                        </div>
                    </div>

                    {/* "Verified" Badge Overlay */}
                    <motion.div
                        initial={{ scale: 0, rotate: -20 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ delay: 0.6, type: "spring" }}
                        className="absolute -bottom-6 -right-6 bg-polaris-primary text-white p-4 rounded-full shadow-lg border-4 border-white flex items-center justify-center"
                    >
                        <Check size={24} strokeWidth={4} />
                    </motion.div>
                </motion.div>
            </div>


            {/* ================= RIGHT PANEL: Command Station (35%) ================= */}
            <motion.div
                initial="hidden"
                animate="visible"
                variants={panelVariants}
                className="relative w-[35%] h-full bg-white/90 backdrop-blur-3xl border-l border-white shadow-2xl flex flex-col justify-between p-10 z-30"
            >
                {/* 1. Header Information */}
                <div className="space-y-6 mt-6">
                    <div>
                        <span className="text-xs font-bold text-polaris-muted uppercase tracking-[0.2em] mb-2 block">Step 3 of 4</span>
                        <h1 className="text-6xl font-black text-polaris-primary tracking-tighter leading-none">
                            Review<br />Result
                        </h1>
                    </div>

                    <div className="p-6 bg-polaris-bg/50 rounded-2xl border border-polaris-muted/10">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-bold text-polaris-muted uppercase tracking-wider">Print Order</span>
                            <span className="text-xs font-bold bg-polaris-primary/10 text-polaris-primary px-2 py-1 rounded">READY</span>
                        </div>
                        <div className="flex items-baseline gap-1">
                            <span className="text-4xl font-black text-polaris-primary">{copies}</span>
                            <span className="text-sm font-medium text-polaris-muted">Copies Selected</span>
                        </div>
                    </div>
                </div>

                {/* 2. Primary Actions */}
                <div className="flex flex-col gap-5 mb-8">

                    {/* PRINT BUTTON (Primary) */}
                    <button
                        onClick={handlePrint}
                        disabled={isPrinting}
                        className="group relative w-full bg-polaris-primary text-white h-28 rounded-2xl overflow-hidden shadow-2xl shadow-polaris-primary/20 transition-all active:scale-[0.98] hover:shadow-polaris-primary/40"
                    >
                        <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent z-10" />

                        <div className="relative z-20 flex items-center justify-between px-8 h-full">
                            <div className="flex items-center gap-6">
                                <div className="w-14 h-14 bg-white/10 rounded-xl flex items-center justify-center">
                                    <Printer size={28} />
                                </div>
                                <div className="text-left flex flex-col">
                                    <span className="text-2xl font-black uppercase tracking-tight leading-none">Print Photos</span>
                                    <span className="text-sm text-white/60 font-medium mt-1">
                                        {isPrinting ? "Sending to printer..." : "Confirm & Finish"}
                                    </span>
                                </div>
                            </div>

                            {!isPrinting && <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform" />}
                            {isPrinting && <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                        </div>
                    </button>

                    {/* RETAKE BUTTON (Secondary) */}
                    <button
                        onClick={handleRetake}
                        disabled={retakeCount >= 1}
                        className={`
                            relative w-full h-24 rounded-2xl border-2 transition-all duration-300 flex items-center justify-between px-8
                            ${retakeCount >= 1
                                ? 'bg-gray-50 border-gray-200 cursor-not-allowed opacity-80'
                                : 'bg-white border-polaris-muted/20 hover:border-polaris-primary hover:bg-polaris-bg/30 text-polaris-primary'
                            }
                        `}
                    >
                        <div className="flex items-center gap-6">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${retakeCount >= 1 ? 'bg-gray-200 text-gray-400' : 'bg-polaris-accent/20 text-polaris-primary'}`}>
                                {retakeCount >= 1 ? <Lock size={20} /> : <RefreshCcw size={20} />}
                            </div>
                            <div className="text-left flex flex-col">
                                <span className={`text-xl font-bold uppercase tracking-tight leading-none ${retakeCount >= 1 ? 'text-gray-400' : 'text-polaris-primary'}`}>
                                    Retake Photo
                                </span>
                                <span className={`text-xs font-bold tracking-wider uppercase mt-1 ${retakeCount >= 1 ? 'text-red-400' : 'text-polaris-muted'}`}>
                                    {retakeCount >= 1 ? "Limit Reached" : "1 Attempt Remaining"}
                                </span>
                            </div>
                        </div>

                        {retakeCount >= 1 && (
                            <AlertCircle size={24} className="text-gray-300" />
                        )}
                    </button>

                    {/* Policy Note */}
                    <p className="text-center text-[10px] text-polaris-muted/50 uppercase tracking-widest font-semibold mt-2">
                        By printing, you agree to our Terms of Service
                    </p>

                </div>
            </motion.div>
        </div >
    );
};

export default Review;