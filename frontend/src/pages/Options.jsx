import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Button from '../components/Button';
import TemplateSelector from '../components/TemplateSelector';
import { useSession } from '../context/SessionContext';

// Animation variants
const pageVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { duration: 0.8, ease: [0.6, -0.05, 0.01, 0.99] } },
    exit: { opacity: 0 }
};

const fadeUp = {
    initial: { y: 30, opacity: 0 },
    animate: { y: 0, opacity: 1, transition: { duration: 0.6, ease: "easeOut" } }
};

const Options = () => {
    const navigate = useNavigate();
    const { options, updateOptions } = useSession();

    const handleContinue = () => {
        navigate('/capture');
    };

    return (
        <motion.div
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="relative w-full h-screen overflow-hidden flex flex-col items-center justify-center p-6 lg:p-12"
            style={{ backgroundColor: 'var(--sunlit-veil)' }}
        >
            {/* Background Texture & Decor */}
            <div className="bg-noise" />

            {/* Ambient Gradient Orbs */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#CBBFAF] opacity-20 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-[#E8DED4] opacity-30 blur-[100px] rounded-full pointer-events-none" />

            {/* MAIN CONTENT CONTAINER */}
            <div className="relative z-10 w-full max-w-7xl h-full max-h-[90vh] flex flex-col">

                {/* Header Section */}
                <motion.div variants={fadeUp} className="text-center mb-8 lg:mb-10">
                    <h2 className="text-5xl lg:text-6xl font-light tracking-tight text-espresso mb-3">
                        Design Your Memory
                    </h2>
                    <p className="text-lg lg:text-xl text-shadow font-light tracking-wide">
                        Select a filter tone and choose your frame style.
                    </p>
                </motion.div>

                {/* Split Layout: Filters (Left) & Templates (Right) */}
                <div className="flex-1 flex flex-col lg:flex-row gap-8 min-h-0">

                    {/* LEFT: Filter Selection */}
                    <motion.div
                        variants={fadeUp}
                        className="lg:w-1/3 flex flex-col gap-5"
                    >
                        <div className="glass-panel rounded-3xl p-1 flex-1 flex flex-col justify-center gap-4 px-6 py-8">
                            <span className="text-xs font-bold tracking-[0.2em] uppercase text-shadow mb-2 block">
                                01. Color Grade
                            </span>

                            {/* Option: Color */}
                            <button
                                onClick={() => updateOptions({ filter: 'color' })}
                                className={`
                                    group relative w-full p-6 rounded-2xl text-left transition-all duration-500 border
                                    ${options.filter === 'color'
                                        ? 'bg-[#5B4A3E] border-[#5B4A3E] shadow-xl'
                                        : 'bg-white/40 border-transparent hover:bg-white/60'}
                                `}
                            >
                                <div className="flex items-center justify-between relative z-10">
                                    <span className={`text-2xl font-light ${options.filter === 'color' ? 'text-[#F6F2EB]' : 'text-[#5B4A3E]'}`}>
                                        Chromatic
                                    </span>
                                    {options.filter === 'color' && (
                                        <motion.div layoutId="check" className="w-2 h-2 rounded-full bg-[#CBBFAF]" />
                                    )}
                                </div>
                                <span className={`text-sm mt-1 block font-light ${options.filter === 'color' ? 'text-[#CBBFAF]' : 'text-[#8A8077]'}`}>
                                    Vibrant, true-to-life colors
                                </span>
                            </button>

                            {/* Option: B&W */}
                            <button
                                onClick={() => updateOptions({ filter: 'bw' })}
                                className={`
                                    group relative w-full p-6 rounded-2xl text-left transition-all duration-500 border
                                    ${options.filter === 'bw'
                                        ? 'bg-[#5B4A3E] border-[#5B4A3E] shadow-xl'
                                        : 'bg-white/40 border-transparent hover:bg-white/60'}
                                `}
                            >
                                <div className="flex items-center justify-between relative z-10">
                                    <span className={`text-2xl font-light ${options.filter === 'bw' ? 'text-[#F6F2EB]' : 'text-[#5B4A3E]'}`}>
                                        Monochrome
                                    </span>
                                    {options.filter === 'bw' && (
                                        <motion.div layoutId="check" className="w-2 h-2 rounded-full bg-[#CBBFAF]" />
                                    )}
                                </div>
                                <span className={`text-sm mt-1 block font-light ${options.filter === 'bw' ? 'text-[#CBBFAF]' : 'text-[#8A8077]'}`}>
                                    Timeless black & white tones
                                </span>
                            </button>
                        </div>
                    </motion.div>

                    {/* RIGHT: Template Selection */}
                    <motion.div
                        variants={fadeUp}
                        className="lg:w-2/3 h-full min-h-0"
                    >
                        <div className="glass-panel rounded-3xl w-full h-full flex flex-col p-6 lg:p-8 relative overflow-hidden">
                            <div className="flex justify-between items-end mb-6 z-10">
                                <span className="text-xs font-bold tracking-[0.2em] uppercase text-shadow block">
                                    02. Frame Layout
                                </span>
                                <div className="flex gap-2">
                                    {/* Decorative dots */}
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#CBBFAF]"></div>
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#E8DED4]"></div>
                                </div>
                            </div>

                            {/* The Selector Component */}
                            <div className="flex-1 w-full relative min-h-0">
                                <TemplateSelector
                                    selected={options.frame}
                                    onSelect={(id) => updateOptions({ frame: id })}
                                    filterType={options.filter}
                                />
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Footer / CTA */}
                <motion.div variants={fadeUp} className="mt-8 flex justify-center w-full">
                    <Button
                        onClick={handleContinue}
                        className="btn-espresso rounded-full px-12 py-5 text-lg font-medium tracking-wide shadow-2xl min-w-[280px]"
                    >
                        Begin Experience
                    </Button>
                </motion.div>
            </div>
        </motion.div>
    );
};

export default Options;