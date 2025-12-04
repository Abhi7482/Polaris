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
                    bg: "#F6F2EB",       // Sunlit Veil (Base)
                    text: "#5B4A3E",     // Urban Espresso
                    muted: "#8A8077",    // Pavement Shadow
                    accent: "#CBBFAF",   // Luxe Oat
                    primary: "#5B4A3E",  // Urban Espresso
                }
            },
            fontFamily: {
                sans: ['Outfit', 'Inter', 'sans-serif'],
            },
            backdropBlur: {
                'xs': '2px',
                '3xl': '64px', // iOS style heavy blur
            }
        },
    },
    plugins: [
        plugin(function ({ addUtilities, theme }) {
            const glassUtilities = {
                // Base Glass
                '.glass': {
                    backgroundColor: 'rgba(255, 255, 255, 0.65)', // Light mode base
                    backdropFilter: 'blur(24px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(24px) saturate(180%)',
                    border: '1px solid rgba(255, 255, 255, 0.4)',
                    boxShadow: '0 8px 32px 0 rgba(91, 74, 62, 0.1)', // Soft brown shadow
                },
                // Intense Glass (for modals/overlays)
                '.glass-intense': {
                    backgroundColor: 'rgba(255, 255, 255, 0.85)',
                    backdropFilter: 'blur(48px) saturate(200%)',
                    WebkitBackdropFilter: 'blur(48px) saturate(200%)',
                    border: '1px solid rgba(255, 255, 255, 0.5)',
                    boxShadow: '0 20px 60px -10px rgba(91, 74, 62, 0.15)',
                },
                // Subtle Glass (for cards/panels)
                '.glass-subtle': {
                    backgroundColor: 'rgba(255, 255, 255, 0.45)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                },
                // Glass Button
                '.glass-button': {
                    backgroundColor: 'rgba(91, 74, 62, 0.85)', // Primary color glass
                    color: 'white',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    boxShadow: '0 4px 12px rgba(91, 74, 62, 0.2)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                },
                '.glass-button:active': {
                    transform: 'scale(0.96)',
                    backgroundColor: 'rgba(91, 74, 62, 0.95)',
                }
            }
            addUtilities(glassUtilities)
        })
    ],
}
