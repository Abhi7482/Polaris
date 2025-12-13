import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';

const templates = {
    color: [
        { id: 'classic_black', name: 'Classic Black', desc: 'Minimal Dark', hex: '#1a1a1a' },
        { id: 'vintage', name: 'Polaroid', desc: 'Film Strip', hex: '#E8DED4' },
        { id: 'drunken_monkey', name: 'Drunken Monkey', desc: 'Party Vibes', hex: '#E63946' },
        { id: 'pop', name: 'After Dark', desc: 'Neon Pop', hex: '#2C2C2C' },
        { id: 'blue_royale', name: 'Blue Royale', desc: 'Royal Tones', hex: '#1E3A8A' },
        { id: 'retro_bloom', name: 'Retro Bloom', desc: 'Floral', hex: '#F472B6' },
    ],
    bw: [
        { id: 'regular', name: 'Classic Black', desc: 'Timeless', hex: '#1a1a1a' },
        { id: 'vintage', name: 'Polaroid', desc: 'Film Strip', hex: '#E8DED4' },
        { id: 'drunken_monkey', name: 'Drunken Monkey', desc: 'Party Vibes', hex: '#505050' },
    ]
};

// --- SUB-COMPONENT: PARALLAX FRAME CARD ---
const FrameCard = ({ template, isSelected, onClick, filterType }) => {
    const cardRef = useRef(null);
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    // Subtle tilt values
    const rotateX = useTransform(y, [-100, 100], [2, -2]);
    const rotateY = useTransform(x, [-100, 100], [-2, 2]);

    const handleMouseMove = (e) => {
        if (!cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        x.set(e.clientX - rect.left - rect.width / 2);
        y.set(e.clientY - rect.top - rect.height / 2);
    };

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
    };

    return (
        <motion.div
            ref={cardRef}
            onClick={onClick}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            whileTap={{ scale: 0.98 }} // Touch feedback
            style={{ rotateX, rotateY, perspective: 1200 }}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{
                opacity: 1,
                scale: isSelected ? 1.03 : 1,
                y: 0,
                boxShadow: isSelected
                    ? '0 25px 50px -12px rgba(91,74,62,0.15)'
                    : '0 8px 20px -5px rgba(0,0,0,0.05)'
            }}
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="relative h-[85%] flex-shrink-0 snap-center flex flex-col items-center justify-center cursor-pointer group z-10 frame-card-touch"
        >
            {/* 1. Activation Glow (Selected Only) */}
            {isSelected && (
                <motion.div
                    layoutId="halo-glow"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1.1 }}
                    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(91,74,62,0.05)_0%,transparent_60%)] blur-[40px] rounded-xl -z-10"
                />
            )}

            {/* 2. The Frame Container */}
            <div
                className={`
                    relative h-full w-auto rounded-lg transition-all duration-700 p-3 z-20
                    ${isSelected
                        ? 'bg-white/80 shadow-[0_30px_60px_-15px_rgba(91,74,62,0.2)] backdrop-blur-xl'
                        : 'bg-transparent hover:bg-white/40'}
                `}
            >
                {/* 3. The 2x6 Image (Strict Logic) */}
                <img
                    src={`/frames/${filterType}/${filterType}_${template.id}.png`}
                    alt={template.name}
                    className="h-full w-auto object-contain rounded-[2px] shadow-sm z-20 relative"
                    draggable="false"
                    onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.parentNode.innerHTML += `
                            <div class="h-full w-[180px] bg-[#E8DED4] flex items-center justify-center border border-[#5B4A3E]/10">
                                <span class="text-[#5B4A3E]/30 -rotate-90 font-serif italic text-2xl">Preview</span>
                            </div>`;
                    }}
                />

                {/* 4. Optical Reflection Overlay (Glass Sheen) */}
                <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none rounded-lg z-30 mix-blend-overlay" />

                {/* 5. Subtle Highlight Sweep (Selected Only) */}
                {isSelected && (
                    <div className="absolute inset-0 rounded-lg pointer-events-none z-25 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.4)_50%,transparent_100%)] bg-[length:300%_100%] sweep-highlight mix-blend-overlay" />
                )}

                {/* 6. Refracted Badge (Selected Only) */}
                {isSelected && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute -bottom-20 left-1/2 -translate-x-1/2 z-40"
                    >
                        <div className="glass-optical px-6 py-2 rounded-full flex items-center gap-2 shadow-lg backdrop-blur-xl">
                            <div className="w-1.5 h-1.5 bg-[#5B4A3E] rounded-full animate-pulse" />
                            <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#5B4A3E]">
                                Selected
                            </span>
                        </div>
                    </motion.div>
                )}
            </div>

            {/* 7. Editorial Caption (Below Frame) */}
            <div className={`
                mt-24 text-center transition-all duration-500 relative z-30
                ${isSelected ? 'opacity-100 transform-none' : 'opacity-100 translate-y-2 group-hover:translate-y-0'}
            `}>
                <h3 className={`frame-title text-[#5B4A3E] text-lg tracking-wide transition-opacity duration-500 ${isSelected ? 'opacity-100' : 'opacity-90'}`}>{template.name}</h3>
                <p className="frame-subtitle text-[10px] uppercase tracking-[0.15em] text-[#8A8077] mt-2">{template.desc}</p>
            </div>

        </motion.div>
    );
};

// --- MAIN SELECTOR COMPONENT ---

const TemplateSelector = ({ selected, onSelect, filterType = 'color' }) => {
    const currentTemplates = templates[filterType] || templates.color;
    const [currentIndex, setCurrentIndex] = useState(0);
    const scrollRef = useRef(null);

    useEffect(() => {
        const handleScroll = () => {
            if (!scrollRef.current) return;
            const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
            const index = Math.round(scrollLeft / (clientWidth / currentTemplates.length));
            setCurrentIndex(Math.max(0, Math.min(currentTemplates.length - 1, index)));
        };

        const ref = scrollRef.current;
        ref?.addEventListener('scroll', handleScroll);
        return () => ref?.removeEventListener('scroll', handleScroll);
    }, [currentTemplates.length]);

    const goToIndex = (index) => {
        if (!scrollRef.current) return;
        const cardWidth = scrollRef.current.clientWidth / currentTemplates.length;
        scrollRef.current.scrollTo({ left: index * cardWidth, behavior: 'smooth' });
    };

    return (
        <div className="w-full h-full flex flex-col pl-4 lg:pl-0">
            {/* Scroll Container */}
            <div
                ref={scrollRef}
                className="w-full flex-1 overflow-x-auto overflow-y-hidden flex items-center gap-12 lg:gap-20 snap-x snap-mandatory no-scrollbar pr-24 pb-12 pt-4"
            >

                <AnimatePresence mode='popLayout'>
                    {currentTemplates.map((t, index) => (
                        <FrameCard
                            key={t.id}
                            template={t}
                            isSelected={selected === t.id}
                            onClick={() => onSelect(t.id)}
                            filterType={filterType}
                        />
                    ))}
                </AnimatePresence>

                {/* End Spacer */}
                <div className="w-12 shrink-0" />
            </div>

            {/* Pagination Dots */}
            <div className="flex justify-center items-center gap-2 mb-4 px-4">
                {currentTemplates.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => goToIndex(index)}
                        className={`pagination-dot ${currentIndex === index ? 'pagination-dot-active' : ''}`}
                        aria-label={`Go to frame ${index + 1}`}
                    />
                ))}
            </div>
        </div>
    );
};

export default TemplateSelector;