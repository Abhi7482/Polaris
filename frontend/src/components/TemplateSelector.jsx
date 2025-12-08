import React from 'react';
import { motion } from 'framer-motion';

const templates = {
    color: [
        { id: 'regular', name: 'Regular', color: '#FFD700' }, // Gold/Yellow for Color
        { id: 'vintage', name: 'Vintage', color: '#FF6347' }, // Tomato for Vintage Color
    ],
    bw: [
        { id: 'regular', name: 'Regular', color: '#808080' }, // Grey for BW
        { id: 'vintage', name: 'Vintage', color: '#000000' }, // Black for Vintage BW
    ]
};

const TemplateSelector = ({ selected, onSelect, filterType = 'color' }) => {
    const currentTemplates = templates[filterType] || templates.color;

    return (
        <div className="flex gap-6 overflow-x-auto p-4 no-scrollbar">
            {currentTemplates.map((t) => (
                <motion.div
                    key={t.id}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onSelect(t.id)}
                    className={`
            relative w-32 h-48 rounded-xl cursor-pointer flex-shrink-0 shadow-md transition-all
            ${selected === t.id ? 'ring-4 ring-polaris-primary ring-offset-2' : 'hover:shadow-xl'}
          `}
                    style={{ backgroundColor: t.color }}
                >
                    <div className="absolute bottom-3 left-0 right-0 text-center text-xs font-bold text-polaris-text bg-white/90 mx-3 py-1 rounded-full shadow-sm">
                        {t.name}
                    </div>
                </motion.div>
            ))}
        </div>
    );
};

export default TemplateSelector;
