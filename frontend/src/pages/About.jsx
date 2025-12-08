import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const About = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-polaris-bg text-polaris-text font-sans selection:bg-polaris-accent selection:text-polaris-text relative">
            {/* Background Elements */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-polaris-accent/30 rounded-full blur-[120px] animate-pulse-slow"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-polaris-muted/20 rounded-full blur-[120px] animate-pulse-slow delay-1000"></div>
            </div>

            <div className="relative z-10 max-w-4xl mx-auto px-6 py-12">
                {/* Header */}
                <div className="flex items-center mb-12">
                    <button
                        onClick={() => navigate('/')}
                        className="p-2 rounded-full bg-white/40 hover:bg-white/60 backdrop-blur-md transition-all duration-300 group shadow-sm"
                    >
                        <ArrowLeft className="w-6 h-6 text-polaris-text group-hover:-translate-x-1 transition-transform" />
                    </button>
                    <h1 className="text-3xl font-bold ml-4 tracking-tight text-polaris-text">About Polaris</h1>
                </div>

                {/* Content */}
                <div className="space-y-8 animate-fade-in-up">
                    <div className="glass p-8 rounded-3xl border border-white/40 shadow-lg">
                        <h2 className="text-2xl font-bold mb-4 text-polaris-primary">
                            Reimagining the Photobooth
                        </h2>
                        <p className="text-lg text-polaris-text/90 leading-relaxed mb-6">
                            Polaris isn't just a photobooth; it's a cinematic experience. We believe that every selfie deserves to be a studio-quality portrait. Born from a passion for photography and technology, Polaris combines professional-grade lighting, high-resolution cameras, and instant printing to deliver memories that you can hold in your hand seconds after they're made.
                        </p>
                        <p className="text-lg text-polaris-text/90 leading-relaxed">
                            Our mission is simple: to turn fleeting moments into timeless keepsakes. Whether it's a wedding, a corporate event, or a casual night out, Polaris adds a touch of magic and luxury to every occasion.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="glass p-6 rounded-3xl border border-white/40 shadow-md">
                            <h3 className="text-xl font-bold mb-2 text-polaris-primary">Premium Quality</h3>
                            <p className="text-polaris-text/80">
                                We use DSLR cameras and dye-sublimation printers to ensure every photo strip is crisp, vibrant, and water-resistant.
                            </p>
                        </div>
                        <div className="glass p-6 rounded-3xl border border-white/40 shadow-md">
                            <h3 className="text-xl font-bold mb-2 text-polaris-primary">Instant Gratification</h3>
                            <p className="text-polaris-text/80">
                                From "Cheese" to print in under 15 seconds. No waiting, just instant joy.
                            </p>
                        </div>
                    </div>

                    <div className="glass p-8 rounded-3xl border border-white/40 text-center shadow-lg">
                        <h2 className="text-2xl font-bold mb-4 text-polaris-primary">Contact Us</h2>
                        <p className="text-polaris-text/80 mb-2">Have questions or want to book Polaris for your event?</p>
                        <p className="text-xl font-semibold text-polaris-primary">support@polaris.co</p>
                        <p className="text-xl font-semibold text-polaris-primary mt-2">+91 6361615410</p>
                        <p className="text-polaris-muted mt-4 text-sm">
                            Sanath Apt 402, Shivbasava Nagar, Belgaum, India
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default About;
