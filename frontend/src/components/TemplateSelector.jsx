import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const templates = {
    color: [
        { id: 'regular', name: 'Original', hex: '#E8DED4' },
        { id: 'vintage', name: 'Polaroid', hex: '#CBBFAF' },
        { id: 'pop', name: 'Film Strip', hex: '#8A8077' },
        { id: 'soft', name: 'Minimal', hex: '#F6F2EB' },
    ],
    bw: [
        { id: 'regular', name: 'Classic', hex: '#D4D4D4' },
        { id: 'vintage', name: 'Noir', hex: '#808080' },
        { id: 'grain', name: 'Grain', hex: '#505050' },
    ]
};

const TemplateSelector = ({ selected, onSelect, filterType = 'color' }) => {
    const currentTemplates = templates[filterType] || templates.color;
    const containerRef = useRef(null);

    return (
        <div className="w-full h-full flex items-center" ref={containerRef}>

            {/* Horizontal Scroll Area */}
            <div className="w-full h-full overflow-x-auto overflow-y-hidden whitespace-nowrap snap-x snap-mandatory no-scrollbar flex items-center px-4 gap-8">

                <AnimatePresence mode='popLayout'>
                    {currentTemplates.map((t) => {
                        const isSelected = selected === t.id;

                        return (
                            <motion.div
                                key={t.id}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                onClick={() => onSelect(t.id)}
                                className="relative inline-block h-[90%] snap-center cursor-pointer group py-4"
                            >
                                {/* Active State Indicator (Background Glow) */}
                                {isSelected && (
                                    <motion.div
                                        layoutId="glow"
                                        className="absolute inset-0 rounded-2xl bg-[#CBBFAF] blur-xl opacity-40 -z-10"
                                    />
                                )}

                                {/* Card Container - Aspect Ratio 2:3 (Portrait) */}
                                <div
                                    className={`
                                        relative h-full aspect-[2/3] rounded-2xl overflow-hidden transition-all duration-500 ease-out border
                                        ${isSelected
                                            ? 'scale-105 border-[#5B4A3E] shadow-[0_20px_40px_-10px_rgba(91,74,62,0.3)]'
                                            : 'scale-100 border-white/20 hover:scale-[1.02] opacity-80 hover:opacity-100'}
                                    `}
                                    style={{ backgroundColor: t.hex }}
                                >

                                    {/* 1. The Template Image */}
                                    {/* Using object-cover to fill the card visually, assuming templates are roughly portrait */}
                                    <img
                                        src={`/frames/${filterType}/${filterType}_${t.id}.png`}
                                        alt={t.name}
                                        className="w-full h-full object-cover z-0"
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                            // Fallback visualization if image missing
                                            e.target.parentNode.classList.add('flex', 'items-center', 'justify-center');
                                            e.target.parentNode.innerHTML += `<span class="text-[#5B4A3E] opacity-50 font-bold">${t.name}</span>`;
                                        }}
                                    />

                                    {/* 2. Glass Overlay Gradient (bottom up) for text readability */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#5B4A3E]/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                                    {/* 3. Selection Checkbox (Top Right) */}
                                    <div className={`absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${isSelected ? 'bg-[#5B4A3E] scale-100' : 'bg-white/30 scale-0'}`}>
                                        <svg className="w-4 h-4 text-[#F6F2EB]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>

                                    {/* 4. Label (Bottom) */}
                                    <div className="absolute bottom-0 left-0 right-0 p-4 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                                        <div className="bg-[#F6F2EB]/90 backdrop-blur-md px-4 py-2 rounded-xl text-center shadow-lg">
                                            <span className="text-[#5B4A3E] font-medium text-sm tracking-widest uppercase">
                                                {t.name}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Permanent Label if selected (so user knows what they picked) */}
                                    {isSelected && (
                                        <div className="absolute bottom-6 left-0 right-0 text-center pointer-events-none">
                                            <span className="inline-block px-4 py-1 rounded-full bg-[#5B4A3E] text-[#F6F2EB] text-xs font-bold tracking-widest uppercase shadow-lg">
                                                Selected
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>

                {/* Spacers for scroll centering */}
                <div className="w-4 shrink-0" />
            </div>
        </div>
    );
};

export default TemplateSelector;