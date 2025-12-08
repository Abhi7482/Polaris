import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import TemplateSelector from '../components/TemplateSelector';
import { useSession } from '../context/SessionContext';

const Options = () => {
    const navigate = useNavigate();
    const { options, updateOptions } = useSession();

    const handleContinue = () => {
        navigate('/capture');
    };

    return (
        <div className="h-screen w-screen flex flex-col bg-polaris-bg p-12 relative overflow-hidden">
            {/* Background Orbs */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-10 left-10 w-96 h-96 bg-polaris-accent/10 rounded-full blur-3xl" />
                <div className="absolute bottom-10 right-10 w-96 h-96 bg-polaris-muted/10 rounded-full blur-3xl" />
            </div>

            <h2 className="text-4xl font-bold text-polaris-text mb-12 text-center tracking-wide z-10">Customize Your Experience</h2>

            <div className="flex-1 flex flex-col justify-center gap-16 max-w-5xl mx-auto w-full z-10">
                {/* Filter Selection */}
                <div className="space-y-6">
                    <h3 className="text-2xl text-polaris-muted font-bold uppercase tracking-wider pl-4">Select Filter</h3>
                    <div className="flex gap-8">
                        <button
                            onClick={() => updateOptions({ filter: 'color' })}
                            className={`flex-1 h-40 rounded-3xl text-3xl font-bold transition-all duration-300
                ${options.filter === 'color' ? 'glass-intense border-polaris-primary text-polaris-primary shadow-lg scale-[1.02]' : 'glass-subtle text-gray-400 hover:bg-white/40'}
              `}
                        >
                            Color
                        </button>
                        <button
                            onClick={() => updateOptions({ filter: 'bw' })}
                            className={`flex-1 h-40 rounded-3xl text-3xl font-bold transition-all duration-300
                ${options.filter === 'bw' ? 'glass-intense bg-polaris-text/90 text-white shadow-lg scale-[1.02]' : 'glass-subtle text-gray-400 hover:bg-white/40'}
              `}
                        >
                            Black & White
                        </button>
                    </div>
                </div>

                {/* Template Selection */}
                <div className="space-y-6">
                    <h3 className="text-2xl text-polaris-muted font-bold uppercase tracking-wider pl-4">Select Frame</h3>
                    <div className="glass-subtle rounded-3xl p-4">
                        <TemplateSelector
                            selected={options.frame}
                            onSelect={(id) => updateOptions({ frame: id })}
                            filterType={options.filter}
                        />
                    </div>
                </div>
            </div>

            <div className="mt-12 flex justify-center z-10">
                <Button onClick={handleContinue} className="w-full max-w-md text-lg">
                    Continue to Camera
                </Button>
            </div>
        </div>
    );
};

export default Options;
