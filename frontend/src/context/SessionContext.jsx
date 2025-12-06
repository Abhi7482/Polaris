import React, { createContext, useState, useContext } from 'react';
import axios from 'axios';
import API_URL from '../config';

const SessionContext = createContext();

export const SessionProvider = ({ children }) => {
    const [sessionId, setSessionId] = useState(null);
    const [photos, setPhotos] = useState([]);
    const [options, setOptions] = useState({ filter: 'color', frame: 'default' });

    const startSession = async () => {
        try {
            const res = await axios.post(`${API_URL}/session/start`);
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
            await axios.post(`${API_URL}/session/reset`);
            setSessionId(null);
            setPhotos([]);
            setOptions({ filter: 'color', frame: 'default' });
        } catch (err) {
            console.error("Failed to reset session", err);
        }
    };

    const updateOptions = async (newOptions) => {
        setOptions(prev => ({ ...prev, ...newOptions }));
        try {
            await axios.post(`${API_URL}/session/options`, {
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
            sessionId, photos, options,
            startSession, resetSession, updateOptions, addPhoto
        }}>
            {children}
        </SessionContext.Provider>
    );
};

export const useSession = () => useContext(SessionContext);
