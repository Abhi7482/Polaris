import React, { createContext, useState, useContext, useCallback } from 'react';
import axios from 'axios';
import API_URL from '../config';

const SessionContext = createContext();

export const SessionProvider = ({ children }) => {
    const [sessionId, setSessionId] = useState(null);
    const [photos, setPhotos] = useState([]);
    const [options, setOptions] = useState({ filter: 'color', frame: 'default' });
    const [copies, setCopiesState] = useState(() => {
        try {
            return parseInt(sessionStorage.getItem('polaris_copies') || '2', 10);
        } catch (e) {
            return 2;
        }
    });

    const setCopies = (val) => {
        setCopiesState(val);
        sessionStorage.setItem('polaris_copies', val.toString());
    };
    const [retakeCount, setRetakeCount] = useState(0);
    // Initialize from sessionStorage to survive refreshes
    const [paymentFailureCount, setPaymentFailureCount] = useState(() => {
        try {
            return parseInt(sessionStorage.getItem('polaris_payment_failures') || '0', 10);
        } catch (e) {
            return 0;
        }
    });

    // Helper for API calls (supports both Web and Electron)
    const callApi = async (path, method = 'POST', body = null) => {
        if (window.polarisLocal && window.polarisLocal.api) {
            console.log(`[Electron] Calling ${method} ${path}`);
            const res = await window.polarisLocal.api(path, method, body);
            if (!res.success) throw new Error(res.error || 'Electron API Error');
            return { data: res.data };
        } else {
            console.log(`[Web] Calling ${method} ${path}`);
            if (method === 'GET') return axios.get(`${API_URL}${path}`);
            return axios.post(`${API_URL}${path}`, body);
        }
    };

    const startSession = async () => {
        try {
            const res = await callApi('/session/start', 'POST');
            setSessionId(res.data.session_id);
            setPhotos([]);
            setOptions({ filter: 'color', frame: 'default' }); // RESET OPTIONS FOR NEW SESSION
            // Do NOT reset retakeCount here
            setPaymentFailureCount(0);
            sessionStorage.setItem('polaris_payment_failures', '0');
            return true;
        } catch (err) {
            console.error("Failed to start session", err);
            return false;
        }
    };

    const resetSession = async () => {
        // 1. Reset LOCAL state immediately (Critical for UI consistency)
        setSessionId(null);
        setPhotos([]);
        setOptions({ filter: 'color', frame: 'default' });
        setCopies(2);
        setRetakeCount(0);
        setPaymentFailureCount(0);
        sessionStorage.setItem('polaris_payment_failures', '0');

        // 2. Sync with Backend (Best effort)
        try {
            await callApi('/session/reset', 'POST');
        } catch (err) {
            console.error("Failed to reset session on backend (ignoring for UI)", err);
        }
    };

    const lastIncrementTime = React.useRef(0);

    const incrementRetake = () => {
        setRetakeCount(prev => prev + 1);
    };

    const incrementPaymentFailure = useCallback(() => {
        const now = Date.now();
        console.log(`[SessionContext] Incrementing failure. Current Time: ${now}, Last: ${lastIncrementTime.current}`);

        if (now - lastIncrementTime.current < 2000) {
            console.log("Ignored double increment (throttled)");
            return;
        }
        lastIncrementTime.current = now;

        setPaymentFailureCount(prev => {
            const newVal = prev + 1;
            console.log(`[SessionContext] New Failure Count: ${newVal}`);
            sessionStorage.setItem('polaris_payment_failures', newVal.toString());
            return newVal;
        });
    }, []);

    const updateOptions = async (newOptions) => {
        // ROBUST FIX: Merge current state with new options to ensure we ALWAYS send both fields.
        // This prevents the backend from receiving partial updates (e.g. only frame) 
        // which might cause it to default the missing field (filter) to "color".
        const nextOptions = { ...options, ...newOptions };

        setOptions(nextOptions);

        try {
            await callApi('/session/options', 'POST', {
                filter_type: nextOptions.filter,
                frame_id: nextOptions.frame
            });
        } catch (err) {
            console.error("Failed to update options", err);
        }
    };

    const addPhoto = (photoPath) => {
        setPhotos(prev => [...prev, photoPath]);
    };

    return (
        <SessionContext.Provider value={{
            sessionId, photos, options, copies, retakeCount, paymentFailureCount,
            startSession, resetSession, updateOptions, addPhoto, setCopies, incrementRetake, incrementPaymentFailure, callApi, setOptions
        }}>
            {children}
        </SessionContext.Provider>
    ); // Exposed setOptions
};

export const useSession = () => useContext(SessionContext);
