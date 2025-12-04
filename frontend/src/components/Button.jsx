import React from 'react';
import { motion } from 'framer-motion';

const Button = ({ children, onClick, variant = 'primary', className = '' }) => {
    // Base styles are now handled by @layer components in index.css
    const variantClass = variant === 'secondary' ? 'btn-secondary' : '';
    const dangerClass = variant === 'danger' ? 'bg-red-500/80 hover:bg-red-600 border-none' : '';

    return (
        <motion.button
            whileHover={{ scale: 1.05, brightness: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClick}
            className={`${variantClass} ${dangerClass} ${className}`}
        >
            {children}
        </motion.button>
    );
};

export default Button;
