import React, { useState } from 'react';
import { motion } from 'framer-motion';

const CameraPreview = ({ isCapturing }) => {
    const [streamUrl, setStreamUrl] = useState("http://localhost:8000/camera/stream");
    const [error, setError] = useState(false);

    const handleError = () => {
        setError(true);
    };

    return (
        <div className="relative w-full h-full bg-black overflow-hidden">
            {!error ? (
                <img
                    src={streamUrl}
                    alt="Live Camera Feed"
                    className="w-full h-full object-cover transform scale-x-[-1]" // Mirror effect
                    onError={handleError}
                />
            ) : (
                <div className="flex items-center justify-center h-full text-polaris-muted">
                    <p>Camera Unavailable</p>
                </div>
            )}

            {/* Flash Effect - Soft White */}
            {isCapturing && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 0.8, 0] }}
                    transition={{ duration: 0.3 }}
                    className="absolute inset-0 bg-white z-50"
                />
            )}
        </div>
    );
};

export default CameraPreview;
