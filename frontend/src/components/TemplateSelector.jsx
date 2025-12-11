import React, { useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';

const templates = {
    color: [
        { id: 'regular', name: 'Original', desc: 'Standard 2x6', hex: '#E8DED4' },
        { id: 'vintage', name: 'Polaroid', desc: 'Warm Tone', hex: '#CBBFAF' },
        { id: 'pop', name: 'Film Strip', desc: 'Cinema Style', hex: '#8A8077' },
        { id: 'soft', name: 'Minimal', desc: 'Clean Lines', hex: '#F6F2EB' },
    ],
    bw: [
        { id: 'regular', name: 'Classic', desc: 'Timeless', hex: '#D4D4D4' },
        { id: 'vintage', name: 'Noir', desc: 'High Contrast', hex: '#808080' },
        { id: 'grain', name: 'Grain', desc: 'Texture', hex: '#505050' },
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
            style={{ rotateX, rotateY, perspective: 1200 }}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{
                opacity: 1,
                scale: 1,
                y: 0,
                filter: isSelected ? 'grayscale(0%)' : 'grayscale(100%) opacity(0.7)' // Cinematic focus
            }}
            whileHover={{ scale: 1.02, filter: 'grayscale(0%) opacity(1)' }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="relative h-[85%] flex-shrink-0 snap-center flex flex-col items-center justify-center cursor-pointer group"
        >
            {/* 1. Ambient Halo (Selected Only) */}
            {isSelected && (
                <motion.div
                    layoutId="halo-glow"
                    className="absolute inset-0 bg-[#5B4A3E] opacity-5 blur-2xl rounded-xl -z-10 scale-110"
                />
            )}

            {/* 2. The Frame Container */}
            <div
                className={`
                    relative h-full w-auto rounded-lg transition-all duration-700 p-3
                    ${isSelected
                        ? 'bg-white/80 shadow-[0_30px_60px_-15px_rgba(91,74,62,0.2)] backdrop-blur-xl'
                        : 'bg-transparent hover:bg-white/40'}
                `}
            >
                {/* 3. The 2x6 Image (Strict Logic) */}
                <img
                    src={`/frames/${filterType}/${filterType}_${template.id}.png`}
                    alt={template.name}
                    className="h-full w-auto object-contain rounded-[2px] shadow-sm z-10 relative"
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
                <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none rounded-lg z-20 mix-blend-overlay" />

                {/* 5. Refracted Badge (Selected Only) */}
                {isSelected && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute -bottom-12 left-1/2 -translate-x-1/2 z-30"
                    >
                        <div className="glass-optical px-6 py-2 rounded-full flex items-center gap-2 shadow-lg">
                            <div className="w-1.5 h-1.5 bg-[#5B4A3E] rounded-full animate-pulse" />
                            <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#5B4A3E]">
                                Selected
                            </span>
                        </div>
                    </motion.div>
                )}
            </div>

            {/* 6. Editorial Caption (Below Frame) */}
            <div className={`
                mt-6 text-center transition-all duration-500
                ${isSelected ? 'opacity-100 transform-none' : 'opacity-40 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0'}
            `}>
                <h3 className="text-[#5B4A3E] text-lg font-light tracking-wide">{template.name}</h3>
                <p className="text-[10px] uppercase tracking-widest text-[#8A8077] mt-1">{template.desc}</p>
            </div>

        </motion.div>
    );
};

// --- MAIN SELECTOR COMPONENT ---

const TemplateSelector = ({ selected, onSelect, filterType = 'color' }) => {
    const currentTemplates = templates[filterType] || templates.color;

    return (
        <div className="w-full h-full flex items-center pl-4 lg:pl-0">
            {/* Scroll Container */}
            <div className="w-full h-full overflow-x-auto overflow-y-hidden flex items-center gap-12 lg:gap-20 snap-x snap-mandatory no-scrollbar pr-24 pb-12 pt-4">

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
        </div>
    );
};

export default TemplateSelector;