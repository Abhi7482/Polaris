import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PhotoStrip from '../components/PhotoStrip';
import Button from '../components/Button';
import { useSession } from '../context/SessionContext';
import axios from 'axios';

const Review = () => {
    const navigate = useNavigate();
    const { photos, options, resetSession, startSession } = useSession();
    const [processedPath, setProcessedPath] = useState(null);

    useEffect(() => {
        const processStrip = async () => {
            try {
                const res = await axios.post('http://localhost:8000/process');
                setProcessedPath(res.data.path);
            } catch (err) {
                console.error("Processing failed", err);
            }
        };
        processStrip();
    }, []);

    const handlePrint = async () => {
        try {
            await axios.post('http://localhost:8000/print');
            navigate('/printing');
        } catch (err) {
            console.error("Print failed", err);
        }
    };

    const handleRetake = async () => {
        await resetSession();
        await startSession();
        navigate('/options');
    };

    return (
        <div className="h-screen w-screen flex flex-col items-center justify-center bg-polaris-bg p-8 gap-12 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-polaris-bg via-white/50 to-polaris-bg -z-10" />

            <h2 className="text-5xl font-bold text-polaris-text mb-4 tracking-tight z-10">Review Your Strip</h2>

            <div className="flex gap-20 items-center z-10">
                <div className="glass-intense p-4 rounded-xl shadow-2xl rotate-[-2deg] hover:rotate-0 transition-transform duration-500">
                    <PhotoStrip photos={photos} />
                </div>

                <div className="flex flex-col gap-8 glass-subtle p-8 rounded-3xl">
                    <Button onClick={handlePrint} className="w-72 text-lg shadow-xl">
                        Print Now
                    </Button>
                    <Button onClick={handleRetake} variant="secondary" className="w-72 text-lg">
                        Retake
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default Review;
