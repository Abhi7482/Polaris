/** @type {import('tailwindcss').Config} */
import plugin from 'tailwindcss/plugin';

export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                polaris: {
                    bg: "#F6F2EB",       // Sunlit Veil
                    text: "#5B4A3E",     // Urban Espresso
                    muted: "#8A8077",    // Pavement Shadow
                    accent: "#CBBFAF",   // Luxe Oat
                    primary: "#5B4A3E",  // Urban Espresso
                    white: "#FFFFFF",
                }
            },
            fontFamily: {
                sans: ['Outfit', 'Inter', 'sans-serif'],
                display: ['Outfit', 'sans-serif'], // Added for headings
            },
            animation: {
                'blob': 'blob 10s infinite',
                'shimmer': 'shimmer 2.5s linear infinite',
            },
            keyframes: {
                blob: {
                    '0%': { transform: 'translate(0px, 0px) scale(1)' },
                    '33%': { transform: 'translate(30px, -50px) scale(1.1)' },
                    '66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
                    '100%': { transform: 'translate(0px, 0px) scale(1)' },
                },
                shimmer: {
                    '0%': { backgroundPosition: '200% 0' },
                    '100%': { backgroundPosition: '-200% 0' }
                }
            }
        },
    },
    plugins: [
        plugin(function ({ addUtilities }) {
            addUtilities({
                '.glass-panel': {
                    backgroundColor: 'rgba(255, 255, 255, 0.3)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.4)',
                    boxShadow: '0 8px 32px 0 rgba(91, 74, 62, 0.05)',
                },
                '.text-balance': {
                    textWrap: 'balance',
                }
            })
        })
    ],
}