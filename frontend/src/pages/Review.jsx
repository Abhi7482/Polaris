import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PhotoStrip from '../components/PhotoStrip';
import Button from '../components/Button';
import { useSession } from '../context/SessionContext';
import axios from 'axios';
import API_URL from '../config';

const Review = () => {
    const navigate = useNavigate();
    const { photos, options, startSession, copies, callApi, retakeCount, incrementRetake } = useSession();
    const [isPrinting, setIsPrinting] = useState(false);
    const [processedPath, setProcessedPath] = useState(null);

    useEffect(() => {
        const processStrip = async () => {
            try {
                const res = await callApi('/process', 'POST');
                setProcessedPath(res.data.path);
            } catch (err) {
                console.error("Processing failed", err);
            }
        };
        processStrip();
    }, []);

    const handlePrint = async () => {
        if (isPrinting) return;
        setIsPrinting(true);
        try {
            await callApi('/print', 'POST', { copies });
            navigate('/printing');
        } catch (err) {
            console.error("Print failed", err);
            setIsPrinting(false);
        }
    };

    const handleRetake = async () => {
        if (retakeCount >= 1) return;
        incrementRetake();
        // restart capture flow explicitly
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
                    <Button
                        onClick={handlePrint}
                        className="w-72 text-lg shadow-xl"
                        disabled={isPrinting}
                    >
                        {isPrinting ? "Sending..." : "Print Now"}
                    </Button>
                    <Button
                        onClick={handleRetake}
                        variant="secondary"
                        className="w-72 text-lg"
                        disabled={retakeCount >= 1}
                    >
                        {retakeCount >= 1 ? "Retake Used" : "Retake"}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default Review;
