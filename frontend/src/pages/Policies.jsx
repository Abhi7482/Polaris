import React from 'react';

const Policies = () => {
    return (
        <div className="min-h-screen bg-white text-gray-800 p-8 md:p-16">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-4xl font-bold mb-12 text-center">Legal Policies</h1>

                {/* Navigation */}
                <div className="flex flex-wrap gap-4 justify-center mb-16 border-b pb-8">
                    <a href="#terms" className="text-blue-600 hover:underline">Terms & Conditions</a>
                    <a href="#privacy" className="text-blue-600 hover:underline">Privacy Policy</a>
                    <a href="#refund" className="text-blue-600 hover:underline">Refund Policy</a>
                    <a href="#shipping" className="text-blue-600 hover:underline">Shipping Policy</a>
                </div>

                {/* Terms and Conditions */}
                <section id="terms" className="mb-16">
                    <h2 className="text-2xl font-bold mb-4">Terms and Conditions</h2>
                    <div className="prose">
                        <p className="italic text-gray-500">[Paste Terms and Conditions content here]</p>
                        <p>Welcome to Polaris. By using our services, you agree to the following terms...</p>
                    </div>
                </section>

                {/* Privacy Policy */}
                <section id="privacy" className="mb-16">
                    <h2 className="text-2xl font-bold mb-4">Privacy Policy</h2>
                    <div className="prose">
                        <p className="italic text-gray-500">[Paste Privacy Policy content here]</p>
                        <p>Your privacy is important to us. This policy explains how we handle your data...</p>
                    </div>
                </section>

                {/* Refund Policy */}
                <section id="refund" className="mb-16">
                    <h2 className="text-2xl font-bold mb-4">Refund Policy</h2>
                    <div className="prose">
                        <p className="italic text-gray-500">[Paste Refund Policy content here]</p>
                        <p>We strive for customer satisfaction. Our refund policy is as follows...</p>
                    </div>
                </section>

                {/* Shipping Policy */}
                <section id="shipping" className="mb-16">
                    <h2 className="text-2xl font-bold mb-4">Shipping Policy</h2>
                    <div className="prose">
                        <p className="italic text-gray-500">[Paste Shipping Policy content here]</p>
                        <p>Information regarding the delivery of our services/products...</p>
                    </div>
                </section>

                <div className="text-center mt-20 text-sm text-gray-500">
                    &copy; {new Date().getFullYear()} Polaris. All rights reserved.
                </div>
            </div>
        </div>
    );
};

export default Policies;
