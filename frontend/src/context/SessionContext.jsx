import React, { createContext, useState, useContext } from 'react';
import axios from 'axios';
import API_URL from '../config';

const SessionContext = createContext();

export const SessionProvider = ({ children }) => {
    const [sessionId, setSessionId] = useState(null);
    const [photos, setPhotos] = useState([]);
    const [options, setOptions] = useState({ filter: 'color', frame: 'default' });
    const [copies, setCopies] = useState(2);

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
            return true;
        } catch (err) {
            console.error("Failed to start session", err);
            return false;
        }
    };

    const resetSession = async () => {
        try {
            await callApi('/session/reset', 'POST');
            setSessionId(null);
            setPhotos([]);
            setOptions({ filter: 'color', frame: 'default' });
            setCopies(2);
        } catch (err) {
            console.error("Failed to reset session", err);
        }
    };

    const updateOptions = async (newOptions) => {
        setOptions(prev => ({ ...prev, ...newOptions }));
        try {
            await callApi('/session/options', 'POST', {
                filter_type: newOptions.filter,
                frame_id: newOptions.frame
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
            sessionId, photos, options, copies,
            startSession, resetSession, updateOptions, addPhoto, setCopies, callApi
        }}>
            {children}
        </SessionContext.Provider>
    );
};

export const useSession = () => useContext(SessionContext);
