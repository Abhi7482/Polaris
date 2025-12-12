import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CameraPreview from '../components/CameraPreview';
import PhotoStrip from '../components/PhotoStrip';
import Countdown from '../components/Countdown';
import { useSession } from '../context/SessionContext';
import axios from 'axios';
import API_URL from '../config';

const Capture = () => {
    const navigate = useNavigate();
    const { photos, addPhoto, callApi, options } = useSession(); // Get options
    const [isCapturing, setIsCapturing] = useState(false);
    const [showCountdown, setShowCountdown] = useState(false);
    const [shotCount, setShotCount] = useState(0);

    // Frame Overlay Logic
    const { filter, frame } = options || { filter: 'color', frame: 'default' };
    const frameUrl = (frame && frame !== 'default') ? `/frames/${filter}/${filter}_${frame}.png` : null;

    useEffect(() => {
        startShotSequence();
    }, []);

    useEffect(() => {
        if (shotCount > 0 && shotCount < 4) {
            const timer = setTimeout(() => {
                startShotSequence();
            }, 2000);
            return () => clearTimeout(timer);
        } else if (shotCount === 4) {
            setTimeout(() => {
                navigate('/review');
            }, 1000);
        }
    }, [shotCount, navigate]);

    const startShotSequence = () => {
        setShowCountdown(true);
    };

    const handleCountdownComplete = async () => {
        setShowCountdown(false);
        setIsCapturing(true);

        try {
            const res = await callApi('/capture', 'POST');
            if (res.data.status === 'captured') {
                addPhoto(res.data.path);
                setShotCount(prev => prev + 1);
            }
        } catch (err) {
            console.error("Capture failed", err);
        } finally {
            setIsCapturing(false);
        }
    };

    return (
        <div className="h-screen w-screen flex bg-polaris-bg p-8 gap-12 overflow-hidden relative">
            {/* Background Blur */}
            <div className="absolute inset-0 bg-polaris-bg/80 backdrop-blur-3xl -z-10" />

            {/* Left: Camera Feed */}
            <div className="flex-1 relative rounded-[2.5rem] overflow-hidden shadow-2xl border-8 border-white/20 glass-intense">
                {/* 1. Camera Feed */}
                <CameraPreview isCapturing={isCapturing} />

                {/* 2. Live Frame Overlay */}
                {/* Live Frame Overlay Removed as per user request */}

                {showCountdown && (
                    <Countdown onComplete={handleCountdownComplete} />
                )}

                <div className="absolute bottom-10 left-0 right-0 flex justify-center z-20">
                    <div className="glass-button px-8 py-3 rounded-full text-2xl font-bold tracking-widest">
                        {shotCount < 4 ? `POSE ${shotCount + 1} / 4` : "GREAT JOB!"}
                    </div>
                </div>
            </div>

            {/* Right: Live Strip */}
            <div className="w-[400px] flex items-center justify-center glass-subtle rounded-[2.5rem] shadow-xl">
                <div className="scale-90 origin-center">
                    <PhotoStrip photos={photos} />
                </div>
            </div>
        </div>
    );
};

export default Capture;
