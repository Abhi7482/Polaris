import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import Button from '../components/Button';
import TemplateSelector from '../components/TemplateSelector';
import { useSession } from '../context/SessionContext';

// --- MICRO-INTERACTION HELPERS ---

// 3D Tilt Button Component
const TiltButton = ({ isSelected, onClick, title, subtitle, color }) => {
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const rotateX = useTransform(y, [-50, 50], [5, -5]); // Invert tilt
    const rotateY = useTransform(x, [-50, 50], [-5, 5]);

    const handleMouseMove = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        x.set(e.clientX - rect.left - rect.width / 2);
        y.set(e.clientY - rect.top - rect.height / 2);
    };

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
    };

    return (
        <motion.button
            onClick={onClick}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            whileTap={{ scale: 0.98 }} // Touch feedback
            style={{ rotateX, rotateY, perspective: 1000 }}
            className={`
                relative w-full h-24 min-h-[48px] rounded-2xl border transition-all duration-700 ease-[var(--ease-editorial)]
                flex flex-col items-center justify-center overflow-hidden group btn-magnetic frame-card-touch
                ${isSelected
                    ? 'border-[#5B4A3E] bg-[#5B4A3E] text-[#F6F2EB] shadow-2xl scale-[1.02]'
                    : 'border-[#E8DED4] bg-white/30 text-[#5B4A3E] hover:bg-white/60'}
            `}
        >
            {/* Soft Shine Overlay */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

            <span className="relative z-10 text-xl font-light tracking-wide">{title}</span>
            <span className={`relative z-10 text-[0.6rem] uppercase tracking-[0.3em] mt-1 opacity-70 transition-colors ${isSelected ? 'text-[#CBBFAF]' : 'text-[#8A8077]'}`}>
                {subtitle}
            </span>

            {/* Active Indicator Dot */}
            {isSelected && (
                <motion.div
                    layoutId="active-dot"
                    className="absolute top-3 right-3 w-1.5 h-1.5 rounded-full bg-[#CBBFAF] shadow-[0_0_8px_currentColor]"
                />
            )}
        </motion.button>
    );
};

// --- MAIN COMPONENT ---

const Options = () => {
    const navigate = useNavigate();
    const { options, updateOptions } = useSession();

    // Audio placeholder hook
    const playFeedback = () => {
        // new Audio('/sounds/click_soft.mp3').play().catch(() => {}); 
        // Placeholder for future implementation
    };

    const handleOptionSelect = (key, value) => {
        playFeedback();
        updateOptions({ [key]: value });
    };

    const handleContinue = () => {
        playFeedback();
        navigate('/capture');
    };

    return (
        <div className="relative w-full h-screen overflow-hidden flex items-center justify-center bg-[#F6F2EB]">

            {/* --- 1. AMBIENT BACKGROUND SYSTEM --- */}
            <div className="bg-noise-fine" />

            {/* Drifting Orbs */}
            <div className="absolute top-[-15%] right-[-5%] w-[900px] h-[900px] bg-gradient-to-b from-[#CBBFAF] to-transparent opacity-20 blur-[120px] rounded-full animate-drift pointer-events-none" />
            <div className="absolute bottom-[-20%] left-[-10%] w-[800px] h-[800px] bg-gradient-to-t from-[#E8DED4] to-transparent opacity-30 blur-[100px] rounded-full animate-drift-delayed pointer-events-none" />

            {/* Soft Spotlight at bottom center */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-[400px] bg-gradient-to-t from-white/40 to-transparent blur-3xl pointer-events-none" />

            {/* --- 2. EDITORIAL CONTENT GRID --- */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }} // Editorial ease
                className="relative z-10 w-full max-w-[1800px] h-full flex flex-col lg:flex-row p-8 lg:p-16 gap-16 lg:gap-24"
            >

                {/* --- LEFT PANEL: CURATION CONTROLS --- */}
                <div className="lg:w-[420px] flex flex-col justify-center h-full z-20">

                    {/* Hero Typography */}
                    <div className="mb-12 relative">
                        <motion.div
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.2, duration: 1 }}
                            className="absolute -left-4 top-0 w-1 h-24 bg-[#5B4A3E]"
                        />
                        <h1 className="type-hero text-7xl lg:text-8xl text-[#5B4A3E] leading-[0.85]">
                            Visual<br />
                            <span className="font-normal italic font-serif">Identity.</span>
                        </h1>
                        <div className="mt-6 flex items-center gap-4">
                            <span className="h-px w-12 bg-[#8A8077]/30"></span>
                            <p className="type-label">Step 01 / Curation</p>
                        </div>
                    </div>

                    {/* Controls Container */}
                    <div className="glass-optical rounded-3xl p-8 space-y-8 chromatic-edge backdrop-blur-3xl">

                        {/* Filter Section */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-end mb-2">
                                <label className="type-label text-[#5B4A3E]">Grading</label>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <TiltButton
                                    title="Chrome"
                                    subtitle="Natural"
                                    isSelected={options.filter === 'color'}
                                    onClick={() => handleOptionSelect('filter', 'color')}
                                />
                                <TiltButton
                                    title="Noir"
                                    subtitle="Analog"
                                    isSelected={options.filter === 'bw'}
                                    onClick={() => handleOptionSelect('filter', 'bw')}
                                />
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="w-full h-px bg-gradient-to-r from-transparent via-[#8A8077]/20 to-transparent" />

                        {/* Info / Micro-caption */}
                        <p className="text-center text-[#8A8077] text-xs font-light leading-relaxed opacity-80">
                            Select a visual profile to enhance the mood.<br />
                            Applied in real-time.
                        </p>

                    </div>

                    {/* Primary Action */}
                    <div className="mt-12">
                        <Button
                            onClick={handleContinue}
                            whileTap={{ scale: 0.98 }} // Touch feedback
                            className="btn-magnetic w-full py-7 min-h-[48px] rounded-full text-lg font-medium tracking-[0.15em] uppercase bg-[#5B4A3E] text-[#F6F2EB] shadow-[0_20px_40px_-10px_rgba(91,74,62,0.3)] hover:shadow-[0_25px_50px_-10px_rgba(91,74,62,0.4)] frame-card-touch"
                        >
                            Enter Booth
                        </Button>
                    </div>
                </div>

                {/* --- RIGHT PANEL: IMMERSIVE GALLERY --- */}
                <div className="flex-1 min-w-0 h-full flex items-center relative">

                    {/* Background "Stage" for Frames */}
                    <div className="absolute inset-0 bg-white/20 rounded-[4rem] -z-10 blur-3xl" />

                    <div className="w-full h-[85vh] relative flex flex-col">

                        {/* Gallery Header */}
                        <div className="flex justify-between items-center px-4 mb-4 opacity-0 animate-[fadeIn_1s_ease-out_0.5s_forwards]">
                            <span className="type-label">Format Gallery</span>
                            <span className="type-label text-[#5B4A3E]/40">Swipe to Select</span>
                        </div>

                        {/* The Component */}
                        <TemplateSelector
                            selected={options.frame}
                            onSelect={(id) => handleOptionSelect('frame', id)}
                            filterType={options.filter}
                        />
                    </div>
                </div>

            </motion.div>
        </div>
    );
};

export default Options;