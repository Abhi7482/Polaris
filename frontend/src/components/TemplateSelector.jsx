import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const templates = {
    color: [
        { id: 'regular', name: 'Regular', color: '#FFD700' },
        { id: 'vintage', name: 'Vintage', color: '#FF6347' },
        { id: 'pop', name: 'Pop Art', color: '#3b82f6' }, // Added example
        { id: 'soft', name: 'Soft', color: '#ec4899' },   // Added example
    ],
    bw: [
        { id: 'regular', name: 'Classic', color: '#808080' },
        { id: 'vintage', name: 'Noir', color: '#000000' },
        { id: 'grain', name: 'Grain', color: '#333333' }, // Added example
    ]
};

const TemplateSelector = ({ selected, onSelect, filterType = 'color' }) => {
    const currentTemplates = templates[filterType] || templates.color;

    return (
        <div className="w-full h-full flex flex-col justify-center">
            {/* Scroll Container */}
            <div className="flex gap-8 overflow-x-auto px-4 py-8 snap-x snap-mandatory no-scrollbar items-center">
                <AnimatePresence mode="popLayout">
                    {currentTemplates.map((t) => {
                        const isSelected = selected === t.id;
                        
                        return (
                            <motion.div
                                layoutId={t.id}
                                key={t.id}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                whileHover={{ y: -10 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => onSelect(t.id)}
                                className="relative flex-shrink-0 cursor-pointer snap-center group"
                            >
                                {/* Card Container */}
                                <div className={`
                                    relative w-40 h-60 rounded-2xl overflow-hidden transition-all duration-300
                                    ${isSelected 
                                        ? 'ring-4 ring-polaris-primary ring-offset-4 ring-offset-transparent shadow-[0_0_40px_rgba(0,0,0,0.2)] scale-105' 
                                        : 'opacity-70 hover:opacity-100 shadow-lg hover:shadow-xl'}
                                `}>
                                    {/* Mock Image / Placeholder */}
                                    <div className="w-full h-full bg-gray-200 relative">
                                         <img
                                            src={`/frames/${filterType}/${filterType}_${t.id}.png`}
                                            alt={t.name}
                                            className="w-full h-full object-cover"
                                            // Fallback color if image fails or for preview
                                            onError={(e) => {
                                                e.target.style.display = 'none';
                                                e.target.parentElement.style.backgroundColor = t.color;
                                            }}
                                        />
                                        
                                        {/* Fallback gradient if no image */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
                                    </div>

                                    {/* Label Badge */}
                                    <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                                        <div className={`
                                            px-4 py-1.5 rounded-full text-sm font-bold backdrop-blur-md transition-colors
                                            ${isSelected 
                                                ? 'bg-polaris-primary text-white shadow-lg' 
                                                : 'bg-white/20 text-white border border-white/20'}
                                        `}>
                                            {t.name}
                                        </div>
                                    </div>
                                    
                                    {/* Active Checkmark Overlay */}
                                    {isSelected && (
                                        <motion.div 
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            className="absolute top-3 right-3 bg-polaris-primary text-white rounded-full p-1 shadow-lg"
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </motion.div>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default TemplateSelector;