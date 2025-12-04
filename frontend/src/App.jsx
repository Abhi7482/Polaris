import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { SessionProvider } from './context/SessionContext';
import Welcome from './pages/Welcome';
import PaymentReminder from './pages/PaymentReminder';
import Options from './pages/Options';
import Capture from './pages/Capture';
import Review from './pages/Review';
import Printing from './pages/Printing';

function App() {
    return (
        <SessionProvider>
            <Router>
                <Routes>
                    <Route path="/" element={<Welcome />} />
                    <Route path="/payment" element={<PaymentReminder />} />
                    <Route path="/options" element={<Options />} />
                    <Route path="/capture" element={<Capture />} />
                    <Route path="/review" element={<Review />} />
                    <Route path="/printing" element={<Printing />} />
                </Routes>
            </Router>
        </SessionProvider>
    );
}

export default App;
