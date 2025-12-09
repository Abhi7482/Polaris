import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Button from '../components/Button';
import TemplateSelector from '../components/TemplateSelector';
import { useSession } from '../context/SessionContext';

// Animation variants for staggered entrance
const containerVariants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.15,
            delayChildren: 0.2
        }
    }
};

const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 50 } }
};

const Options = () => {
    const navigate = useNavigate();
    const { options, updateOptions } = useSession();

    const handleContinue = () => {
        navigate('/capture');
    };

    return (
        <div className="h-screen w-screen flex flex-col bg-polaris-bg relative overflow-hidden font-sans">
            {/* Animated Background Orbs */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <motion.div 
                    animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute -top-20 -left-20 w-[500px] h-[500px] bg-polaris-primary/20 rounded-full blur-[100px]" 
                />
                <motion.div 
                    animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.4, 0.2] }}
                    transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                    className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-polaris-text/10 rounded-full blur-[120px]" 
                />
            </div>

            {/* Main Content */}
            <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="relative z-10 flex-1 flex flex-col items-center justify-center max-w-6xl mx-auto w-full px-8 py-12"
            >
                {/* Header */}
                <motion.div variants={itemVariants} className="text-center mb-12">
                    <h2 className="text-5xl font-bold text-polaris-text mb-2 tracking-tight">
                        Customize Your Look
                    </h2>
                    <p className="text-polaris-muted text-lg font-medium tracking-wide opacity-80">
                        Choose a vibe and pick your frame
                    </p>
                </motion.div>

                <div className="w-full flex flex-col lg:flex-row gap-12 items-stretch justify-center h-full max-h-[600px]">
                    
                    {/* Left Panel: Filter Selection */}
                    <motion.div variants={itemVariants} className="flex-1 flex flex-col gap-6">
                        <h3 className="text-xl text-polaris-text/80 font-bold uppercase tracking-widest pl-1">
                            1. Select Filter
                        </h3>
                        
                        <div className="flex flex-col gap-4 flex-1">
                            {/* Color Option */}
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => updateOptions({ filter: 'color' })}
                                className={`
                                    relative flex-1 rounded-3xl p-6 text-left transition-all duration-300 border-2 overflow-hidden group
                                    ${options.filter === 'color' 
                                        ? 'border-polaris-primary bg-white/10 shadow-[0_0_30px_rgba(0,0,0,0.1)]' 
                                        : 'border-transparent bg-white/5 hover:bg-white/10'}
                                `}
                            >
                                <div className={`absolute inset-0 opacity-20 transition-opacity duration-500 bg-gradient-to-br from-orange-400 via-pink-500 to-purple-500 ${options.filter === 'color' ? 'opacity-30' : 'group-hover:opacity-30'}`} />
                                <div className="relative z-10 flex flex-col h-full justify-between">
                                    <span className={`text-3xl font-bold ${options.filter === 'color' ? 'text-polaris-text' : 'text-polaris-muted'}`}>Color</span>
                                    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${options.filter === 'color' ? 'border-polaris-primary bg-polaris-primary text-white' : 'border-polaris-muted/50'}`}>
                                        {options.filter === 'color' && <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                    </div>
                                </div>
                            </motion.button>

                            {/* B&W Option */}
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => updateOptions({ filter: 'bw' })}
                                className={`
                                    relative flex-1 rounded-3xl p-6 text-left transition-all duration-300 border-2 overflow-hidden group
                                    ${options.filter === 'bw' 
                                        ? 'border-polaris-text bg-white/10 shadow-[0_0_30px_rgba(0,0,0,0.1)]' 
                                        : 'border-transparent bg-white/5 hover:bg-white/10'}
                                `}
                            >
                                <div className={`absolute inset-0 opacity-20 transition-opacity duration-500 bg-gradient-to-br from-gray-700 via-gray-900 to-black ${options.filter === 'bw' ? 'opacity-40' : 'group-hover:opacity-30'}`} />
                                <div className="relative z-10 flex flex-col h-full justify-between">
                                    <span className={`text-3xl font-bold ${options.filter === 'bw' ? 'text-polaris-text' : 'text-polaris-muted'}`}>B&W</span>
                                    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${options.filter === 'bw' ? 'border-polaris-text bg-polaris-text text-white' : 'border-polaris-muted/50'}`}>
                                        {options.filter === 'bw' && <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                    </div>
                                </div>
                            </motion.button>
                        </div>
                    </motion.div>

                    {/* Right Panel: Template Selection */}
                    <motion.div variants={itemVariants} className="flex-[2] flex flex-col gap-6">
                        <h3 className="text-xl text-polaris-text/80 font-bold uppercase tracking-widest pl-1">
                            2. Select Frame
                        </h3>
                        <div className="flex-1 bg-white/5 backdrop-blur-xl border border-white/10 rounded-[32px] p-6 shadow-xl flex items-center">
                            <TemplateSelector
                                selected={options.frame}
                                onSelect={(id) => updateOptions({ frame: id })}
                                filterType={options.filter}
                            />
                        </div>
                    </motion.div>
                </div>

                {/* Footer Action */}
                <motion.div variants={itemVariants} className="mt-12 w-full flex justify-center">
                    <div className="w-full max-w-md">
                        <Button onClick={handleContinue} className="w-full py-6 text-xl shadow-2xl hover:shadow-polaris-primary/40 transition-shadow">
                            Start Photobooth
                        </Button>
                    </div>
                </motion.div>

            </motion.div>
        </div>
    );
};

export default Options;