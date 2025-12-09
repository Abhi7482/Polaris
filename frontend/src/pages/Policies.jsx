import React from 'react';

const Policies = () => {
    return (
        <div className="min-h-screen bg-white text-gray-800 p-8 md:p-16 font-sans leading-relaxed">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-4xl font-bold mb-12 text-center text-gray-900">Legal Policies</h1>

                {/* Navigation */}
                <div className="flex flex-wrap gap-6 justify-center mb-16 border-b border-gray-200 pb-8 sticky top-0 bg-white/95 backdrop-blur py-4 z-10">
                    <a href="#terms" className="text-blue-600 hover:text-blue-800 hover:underline font-medium transition-colors">Terms & Conditions</a>
                    <a href="#privacy" className="text-blue-600 hover:text-blue-800 hover:underline font-medium transition-colors">Privacy Policy</a>
                    <a href="#refund" className="text-blue-600 hover:text-blue-800 hover:underline font-medium transition-colors">Refund & Cancellation</a>
                </div>

                {/* Terms and Conditions */}
                <section id="terms" className="mb-20 scroll-mt-24">
                    <h2 className="text-3xl font-bold mb-6 text-gray-900 border-b pb-2">Terms and Conditions</h2>
                    <div className="prose prose-lg text-gray-600 space-y-4">
                        <p>Welcome to Polaris. These Terms and Conditions govern your use of our instant photobooth services.</p>
                        <p>The Platform and Service is owned and operated by <strong>RAKSHITA R PATIL</strong> (hereinafter referred to as the "Merchant", "we", "us", or "our").</p>

                        <p>By accessing this website and using our kiosk services, you agree to be bound by these terms:</p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li><strong>Service Usage:</strong> You agree to use the photobooth service for lawful purposes only.</li>
                            <li><strong>Pricing:</strong> The service uses a tiered pricing model based on the number of prints selected: ₹200 for 2 strips, ₹300 for 3 strips, and ₹400 for 4 strips. Prices are subject to change without prior notice.</li>
                            <li><strong>Content:</strong> You acknowledge that the photos taken are for personal use. We are not responsible for the content of the photos captured by users.</li>
                            <li><strong>Liability:</strong> RAKSHITA R PATIL shall not be liable for any indirect, incidental, or consequential damages arising from the use of the service.</li>
                            <li><strong>Modifications:</strong> We reserve the right to modify these terms at any time.</li>
                            <li><strong>Governing Law:</strong> These terms are governed by the laws of India. Disputes are subject to the exclusive jurisdiction of the courts in Belgaum, Karnataka.</li>
                        </ul>

                        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 mt-6">
                            <h3 className="text-lg font-bold mb-2">Contact Information</h3>
                            <p><strong>Business Name:</strong> RAKSHITA R PATIL</p>
                            <p><strong>Address:</strong> Sanath Apt 402, Shivbasava Nagar, Belgaum, India</p>
                            <p><strong>Contact:</strong> +91 6361615410</p>
                            <p><strong>Email:</strong> support@polaris.co</p>
                        </div>
                    </div>
                </section>

                {/* Refund Policy */}
                <section id="refund" className="mb-20 scroll-mt-24">
                    <h2 className="text-3xl font-bold mb-6 text-gray-900 border-b pb-2">Refund and Cancellation Policy</h2>
                    <div className="prose prose-lg text-gray-600 space-y-4">
                        <p>Our service provides instant digital and physical photo prints. Due to the immediate nature of this service, the following policy applies:</p>

                        <h3 className="text-xl font-semibold text-gray-800 mt-4">Cancellations</h3>
                        <p>Once a payment is made and the photo session has commenced, the order cannot be cancelled. The service is considered consumed the moment the camera capture begins.</p>

                        <h3 className="text-xl font-semibold text-gray-800 mt-4">Refunds</h3>
                        <p>Refunds are <strong>only</strong> processed in the following technical failure scenarios:</p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>The kiosk failed to print the photos due to a printer error (jam/out of paper).</li>
                            <li>The kiosk crashed or froze after payment but before service completion.</li>
                        </ul>
                        <p>In such cases, please contact support with your Transaction ID. Approved refunds will be processed within <strong>5-7 working days</strong> and credited back to the original payment source.</p>

                        <p><strong>Exclusions:</strong> No refunds are granted for user errors (e.g., blinking, dissatisfaction with pose) or if the user chooses to abandon the session midway.</p>
                    </div>
                </section>

                {/* Shipping / Delivery Policy (Renamed for Kiosk Context) */}
                <section id="delivery" className="mb-20 scroll-mt-24">
                    <h2 className="text-3xl font-bold mb-6 text-gray-900 border-b pb-2">Delivery Policy</h2>
                    <div className="prose prose-lg text-gray-600 space-y-4">
                        <p><strong>Service Delivery Timeframe:</strong> This is an instant service. Photo capture and printing occur immediately at the kiosk location. The total time for service delivery (capture to print) is approximately 2-3 minutes.</p>
                        <p><strong>Shipping:</strong> Since this is a physical kiosk service, there is <strong>NO shipping</strong> of goods involved. You receive your physical prints instantly on-site.</p>
                        <p><strong>Replacements:</strong> In the rare event of a printing defect (e.g., ink smear, paper damage by printer), a replacement print will be generated <strong>immediately</strong> at the kiosk upon verification by the attendant or system.</p>
                    </div>
                </section>

                {/* Privacy Policy */}
                <section id="privacy" className="mb-20 scroll-mt-24">
                    <h2 className="text-3xl font-bold mb-6 text-gray-900 border-b pb-2">Privacy Policy</h2>
                    <div className="prose prose-lg text-gray-600 space-y-4">
                        <p><strong>Introduction:</strong> This Privacy Policy describes how RAKSHITA R PATIL ("we", "us") collects and handles your information when you use the Polaris Photobooth.</p>

                        <h3 className="text-xl font-semibold text-gray-800 mt-4">Data Collection</h3>
                        <p>We collect temporary image data (photographs) solely for the purpose of processing and printing your photostrip. We also collect transaction details (Transaction ID, Amount) for payment verification.</p>

                        <h3 className="text-xl font-semibold text-gray-800 mt-4">Data Usage</h3>
                        <ul className="list-disc pl-6 space-y-2">
                            <li><strong>Photos:</strong> Your photos are processed locally on the kiosk and are automatically deleted after the session or within 24 hours. We do not store your photos permanently on any server unless you explicitly opt-in for social sharing (if available).</li>
                            <li><strong>Payment Data:</strong> We do not store your card details. All payment processing is handled securely by PhonePe.</li>
                        </ul>

                        <h3 className="text-xl font-semibold text-gray-800 mt-4">Data Sharing</h3>
                        <p>We do not sell or share your personal data with third parties. Payment data is shared securely with PhonePe solely for transaction processing.</p>

                        <h3 className="text-xl font-semibold text-gray-800 mt-4">Grievance Officer</h3>
                        <p>For any privacy concerns, please contact:</p>
                        <p><strong>Name:</strong> RAKSHITA R PATIL</p>
                        <p><strong>Email:</strong> support@polaris.co</p>
                    </div>
                </section>

                <div className="text-center mt-20 text-sm text-gray-500 pb-10">
                    &copy; {new Date().getFullYear()} RAKSHITA R PATIL. All rights reserved.
                </div>
            </div>
        </div>
    );
};

export default Policies;
