import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const Countdown = ({ onComplete }) => {
    const [count, setCount] = useState(3);

    useEffect(() => {
        if (count > 0) {
            const timer = setTimeout(() => setCount(count - 1), 1000);
            return () => clearTimeout(timer);
        } else {
            onComplete();
        }
    }, [count, onComplete]);

    return (
        <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
            <AnimatePresence mode='wait'>
                {count > 0 && (
                    <motion.div
                        key={count}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1.2, opacity: 1 }}
                        exit={{ scale: 1.5, opacity: 0 }}
                        transition={{ duration: 0.5 }}
                        className="text-9xl font-bold text-white drop-shadow-lg"
                    >
                        {count}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Countdown;
