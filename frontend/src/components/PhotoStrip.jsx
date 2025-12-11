import React from 'react';
import { motion } from 'framer-motion';
import API_URL from '../config';
import { useSession } from '../context/SessionContext';

const PhotoStrip = ({ photos = [] }) => {
    // Get options from context to determine the frame
    const { options } = useSession();
    const { filter, frame } = options || { filter: 'color', frame: 'default' };

    // Coordinate definitions
    const COORDINATES = {
        regular: [
            { top: '1.86%', left: '5.54%', width: '88.9%', height: '20.28%' },
            { top: '24.01%', left: '5.54%', width: '88.9%', height: '20.28%' },
            { top: '46.20%', left: '5.54%', width: '88.9%', height: '20.28%' },
            { top: '68.37%', left: '5.54%', width: '88.9%', height: '20.28%' }
        ],
        vintage: [
            { top: '1.58%', left: '4.75%', width: '90.72%', height: '20.57%' },
            { top: '24.01%', left: '5.28%', width: '90.72%', height: '20.30%' },
            { top: '46.20%', left: '5.28%', width: '90.72%', height: '20.30%' },
            { top: '68.37%', left: '5.28%', width: '90.72%', height: '20.30%' }
        ]
    };

    // Determine which set of coordinates to use
    // If frame is 'vintage' OR 'drunken_monkey', use vintage coords.
    const isVintage = frame === 'vintage' || frame === 'drunken_monkey';
    const slots = isVintage ? COORDINATES.vintage : COORDINATES.regular;

    // Construct Frame URL
    // Public Folder: /frames/color/color_drunken_monkey.png
    // If frame is 'default' or null, we don't show an overlay, unless 'regular' is explicit.
    // Actually, 'default' usually maps to 'regular' in backend logic if frame_id is missing, 
    // but here we might just show a white background if "default".
    // However, user specifically added "Drunken Monkey".

    // Note: TemplateSelector sets frame to "drunken_monkey" etc.
    const frameUrl = (frame && frame !== 'default')
        ? `/frames/${filter}/${filter}_${frame}.png`
        : null;

    return (
        <div
            className="relative bg-white shadow-2xl overflow-hidden"
            style={{
                width: '300px',
                height: '900px', // 1:3 AR
            }}
        >
            {/* 1. Photos Layer (Underneath Frame) */}
            {slots.map((slot, index) => (
                <div
                    key={index}
                    className="absolute bg-polaris-bg/20 overflow-hidden flex items-center justify-center"
                    style={{
                        top: slot.top,
                        left: slot.left,
                        width: slot.width,
                        height: slot.height
                    }}
                >
                    {photos[index] ? (
                        <motion.img
                            initial={{ opacity: 0, scale: 1.1 }}
                            animate={{ opacity: 1, scale: 1 }}
                            src={`${API_URL}/${photos[index]}`}
                            className="w-full h-full object-cover"
                            style={{
                                filter: filter === 'bw' ? 'grayscale(100%)' : 'none'
                            }}
                        />
                    ) : (
                        <span className="text-polaris-muted/50 text-4xl font-light">
                            {index + 1}
                        </span>
                    )}
                </div>
            ))}

            {/* 2. Frame Overlay (On Top) */}
            {frameUrl && (
                <img
                    src={frameUrl}
                    alt="Frame"
                    className="absolute inset-0 w-full h-full object-contain pointer-events-none z-10"
                    onError={(e) => e.target.style.display = 'none'} // Hide if missing
                />
            )}

            {/* 3. Fallback Header if no frame */}
            {!frameUrl && (
                <div className="absolute bottom-6 w-full text-center z-20">
                    <h2 className="text-polaris-text font-bold text-xl tracking-[0.3em] uppercase">Polaris</h2>
                </div>
            )}
        </div>
    );
};

export default PhotoStrip;
