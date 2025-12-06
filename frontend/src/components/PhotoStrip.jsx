import React from 'react';
import { motion } from 'framer-motion';
import API_URL from '../config';

const PhotoStrip = ({ photos = [], template = null }) => {
    // 4 slots for photos
    const slots = [0, 1, 2, 3];

    return (
        <div className="relative w-[300px] h-[900px] bg-white p-6 shadow-2xl flex flex-col items-center gap-6 overflow-hidden border border-gray-100">

            {slots.map((index) => (
                <div key={index} className="w-[260px] h-[195px] bg-polaris-bg relative overflow-hidden shadow-inner">
                    {photos[index] ? (
                        <motion.img
                            initial={{ opacity: 0, scale: 1.1 }}
                            animate={{ opacity: 1, scale: 1 }}
                            src={`${API_URL}/${photos[index]}`}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-polaris-muted text-2xl font-light">
                            {index + 1}
                        </div>
                    )}
                </div>
            ))}

            <div className="mt-auto mb-6">
                <h2 className="text-polaris-text font-bold text-xl tracking-[0.3em] uppercase">Polaris</h2>
            </div>
        </div>
    );
};

export default PhotoStrip;
