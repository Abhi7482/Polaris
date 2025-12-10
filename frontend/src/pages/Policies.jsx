import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const Policies = () => {
    const { hash } = useLocation();

    useEffect(() => {
        if (hash) {
            // Find element by ID (e.g. "refund")
            const element = document.getElementById(hash.replace('#', ''));
            if (element) {
                // slightly longer timeout to ensure full page render
                setTimeout(() => {
                    element.scrollIntoView({ behavior: 'auto', block: 'start' });
                }, 300);
            }
        } else {
            window.scrollTo(0, 0);
        }
    }, [hash]);

    return (
        <div className="min-h-screen bg-white text-gray-800 p-8 md:p-16 font-sans leading-relaxed">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-4xl font-bold mb-12 text-center text-gray-900">Legal Policies</h1>

                {/* Navigation */}
                <div className="flex flex-wrap gap-6 justify-center mb-16 border-b border-gray-200 pb-8 sticky top-0 bg-white/95 backdrop-blur py-4 z-10">
                    <a href="#terms" className="text-blue-600 hover:text-blue-800 hover:underline font-medium transition-colors">Terms & Conditions</a>
                    <a href="#refund" className="text-blue-600 hover:text-blue-800 hover:underline font-medium transition-colors">Refund & Cancellation</a>
                    <a href="#delivery" className="text-blue-600 hover:text-blue-800 hover:underline font-medium transition-colors">Delivery Policy</a>
                    <a href="#privacy" className="text-blue-600 hover:text-blue-800 hover:underline font-medium transition-colors">Privacy Policy</a>
                </div>

                {/* Terms and Conditions */}
                <section id="terms" className="mb-20 scroll-mt-24">
                    <h2 className="text-3xl font-bold mb-6 text-gray-900 border-b pb-2">Terms & Conditions</h2>
                    <div className="prose prose-lg text-gray-600 space-y-4">
                        <p>Welcome to Polaris, an instant photobooth service.</p>
                        <p>This Platform is owned and operated by <strong>RAKSHITA R PATIL</strong> (“Merchant”, “we”, “us”, “our”). By accessing this website or using our kiosk, you agree to these terms.</p>

                        <h3 className="text-xl font-bold mt-6 text-gray-800">1. Service Usage</h3>
                        <p>The photobooth service must be used for lawful purposes only.</p>

                        <h3 className="text-xl font-bold mt-6 text-gray-800">2. Pricing</h3>
                        <p>₹200 for 2 strips, ₹300 for 3 strips, ₹400 for 4 strips. Prices may change without prior notice.</p>

                        <h3 className="text-xl font-bold mt-6 text-gray-800">3. Content Responsibility</h3>
                        <p>Photos captured are for personal use. We are not responsible for user-generated content.</p>

                        <h3 className="text-xl font-bold mt-6 text-gray-800">4. Liability</h3>
                        <p>We are not liable for indirect, incidental, or consequential damages arising from use of the kiosk.</p>

                        <h3 className="text-xl font-bold mt-6 text-gray-800">5. Modifications</h3>
                        <p>We may modify these terms at any time.</p>

                        <h3 className="text-xl font-bold mt-6 text-gray-800">6. Governing Law</h3>
                        <p>These terms are governed by Indian law. Disputes fall under Belgaum, Karnataka jurisdiction.</p>

                        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 mt-8">
                            <h3 className="text-lg font-bold mb-4 border-b pb-2">Contact Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm font-semibold uppercase text-gray-500">Business Name</p>
                                    <p className="font-medium">RAKSHITA R PATIL</p>
                                </div>
                                <div>
                                    <p className="text-sm font-semibold uppercase text-gray-500">Phone</p>
                                    <p className="font-medium">+91 6361615410</p>
                                </div>
                                <div>
                                    <p className="text-sm font-semibold uppercase text-gray-500">Email</p>
                                    <p className="font-medium">support@polaris.co</p>
                                </div>
                                <div>
                                    <p className="text-sm font-semibold uppercase text-gray-500">Address</p>
                                    <p className="font-medium">Sanath Apt 402, Shivbasava Nagar, Belgaum, Karnataka, India</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Refund Policy */}
                <section id="refund" className="mb-20 scroll-mt-24">
                    <h2 className="text-3xl font-bold mb-6 text-gray-900 border-b pb-2">Refund & Cancellation Policy</h2>
                    <div className="prose prose-lg text-gray-600 space-y-4">
                        <p>Our service provides instant digital processing and on-site physical photo prints. Because of the immediate nature of this service:</p>

                        <h3 className="text-xl font-bold mt-6 text-gray-800">Cancellations</h3>
                        <p>Once payment is completed and the photo session starts, the order cannot be cancelled.</p>

                        <h3 className="text-xl font-bold mt-6 text-gray-800">Refunds</h3>
                        <p>Refunds are only provided if:</p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>The kiosk fails to print due to a technical/printer error</li>
                            <li>The kiosk crashes or freezes after payment but before printing</li>
                        </ul>
                        <p>After verification, refunds are credited to the original payment source within 5–7 working days.</p>

                        <h3 className="text-xl font-bold mt-6 text-gray-800">Exclusions</h3>
                        <p>No refunds for:</p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Blinking / pose dissatisfaction</li>
                            <li>User mistakes</li>
                            <li>Abandoning the session midway</li>
                        </ul>
                    </div>
                </section>

                {/* Delivery Policy */}
                <section id="delivery" className="mb-20 scroll-mt-24">
                    <h2 className="text-3xl font-bold mb-6 text-gray-900 border-b pb-2">Delivery Policy</h2>
                    <div className="prose prose-lg text-gray-600 space-y-4">
                        <h3 className="text-xl font-bold mt-6 text-gray-800">1. Shipping Policy</h3>
                        <p>There is <strong>NO shipping</strong> involved. This is an on-site kiosk service and all prints are delivered instantly.</p>

                        <h3 className="text-xl font-bold mt-6 text-gray-800">2. Service Delivery Timeframe</h3>
                        <p>Photo capture + printing time: 2–3 minutes total.</p>

                        <h3 className="text-xl font-bold mt-6 text-gray-800">3. Replacement Delivery Timeframe</h3>
                        <p>In case of defective prints (paper tear, ink smear), a new print is issued immediately after verification.</p>
                    </div>
                </section>

                {/* Privacy Policy */}
                <section id="privacy" className="mb-20 scroll-mt-24">
                    <h2 className="text-3xl font-bold mb-6 text-gray-900 border-b pb-2">Privacy Policy</h2>
                    <div className="prose prose-lg text-gray-600 space-y-4">

                        <h3 className="text-xl font-bold mt-6 text-gray-800">Data Collected</h3>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Temporary photo data (deleted within 24 hours)</li>
                            <li>Transaction details (Transaction ID, amount)</li>
                        </ul>

                        <h3 className="text-xl font-bold mt-6 text-gray-800">Photo Data Usage</h3>
                        <p>Photos are processed locally and not stored permanently unless user opts for sharing.</p>

                        <h3 className="text-xl font-bold mt-6 text-gray-800">Payment Data</h3>
                        <p>We do not store card or UPI details. PhonePe handles all payment processing securely.</p>

                        <h3 className="text-xl font-bold mt-6 text-gray-800">Data Sharing</h3>
                        <p>No selling or sharing of personal data. Only necessary payment information is exchanged with PhonePe.</p>

                        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 mt-8">
                            <h3 className="text-lg font-bold mb-2">Grievance Officer</h3>
                            <p><strong>Name:</strong> RAKSHITA R PATIL</p>
                            <p><strong>Email:</strong> support@polaris.co</p>
                        </div>
                    </div>
                </section>

                <div className="text-center mt-20 text-sm text-gray-500 pb-10 border-t pt-8">
                    &copy; 2025 RAKSHITA R PATIL. All rights reserved.
                </div>
            </div>
        </div>
    );
};

export default Policies;
