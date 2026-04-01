'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Check } from 'lucide-react';
import Footer from '../../components/Footer';
import LoadingPopup from '../../components/LoadingPopup';
import { useAuth } from '@/contexts/AuthContext';

export default function PricingPage() {
    const { isLoggedIn, profile, signOut } = useAuth();
    const [selectedStyle, setSelectedStyle] = useState<string>('manga');
    const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'onetime'>('monthly');
    const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const [isLoadingPopupOpen, setIsLoadingPopupOpen] = useState(false);
    const profileDropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Prevent body scroll when mobile menu is open
    useEffect(() => {
        if (isMobileMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isMobileMenuOpen]);

    const closeMobileMenu = () => {
        setIsMobileMenuOpen(false);
    };

    // Get selected style from localStorage on mount
    useEffect(() => {
        const storedStyle = localStorage.getItem('selectedStyle');
        if (storedStyle) {
            setSelectedStyle(storedStyle.toLowerCase());
        }
    }, []);

    // Get style-specific title prefix
    const getStyleTitlePrefix = () => {
        switch (selectedStyle) {
            case 'manga':
                return 'YOUR MANGA IS';
            case 'comic':
                return 'YOUR COMIC IS';
            case 'manhwa':
                return 'YOUR MANHWA IS';
            default:
                return 'YOUR MANGA IS';
        }
    };

    // Get aspect ratio based on style with realistic dimensions
    const getAspectRatio = () => {
        switch (selectedStyle) {
            case 'manga':
                // Manga: 12 x 18 cm → ratio 2:3
                return 'aspect-[2/3]';
            case 'manhwa':
                // Manhwa: similar to manga → 2:3
                return 'aspect-[2/3]';
            case 'comic':
                // Comic: 17 x 26 cm → ratio 2:3
                return 'aspect-[2/3]';
            default:
                return 'aspect-[2/3]';
        }
    };

    // Close profile dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
                setIsProfileDropdownOpen(false);
            }
        };

        if (isProfileDropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isProfileDropdownOpen]);

    const handleLogout = async () => {
        setIsProfileDropdownOpen(false);
        await signOut();
    };

    const handlePlanSelect = async () => {
        const storedDataString = localStorage.getItem('pendingGenerationData');
        if (!storedDataString) {
            alert('No pending story found. Please go back to the home page and create one.');
            return;
        }

        const pendingData = JSON.parse(storedDataString);
        setIsLoadingPopupOpen(true);

        try {
            const res = await fetch('/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(pendingData)
            });

            // Handle non-JSON responses (e.g. Vercel timeout, body too large)
            const contentType = res.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const text = await res.text();
                throw new Error(`Server error (${res.status}): ${text.substring(0, 200)}`);
            }

            const data = await res.json();
            
            if (data.images) {
                localStorage.setItem('generatedImages', JSON.stringify(data.images));
                localStorage.removeItem('pendingGenerationData');
                // Redirect with creation ID if available
                const creationId = data.creationId;
                if (creationId) {
                    window.location.href = `/results?id=${creationId}`;
                } else {
                    window.location.href = '/results';
                }
            } else {
                throw new Error(data.error || 'Unknown error');
            }
        } catch (error: any) {
            console.error('Generation Error:', error);
            alert(`Failed to generate comic: ${error.message}`);
            setIsLoadingPopupOpen(false);
        }
    };

    return (
        <div
            className="min-h-screen relative overflow-hidden"
            style={{
                background: `
          radial-gradient(circle, rgba(0, 0, 0, 0.11) 1px, transparent 1px),
          linear-gradient(to bottom, #e4e4e7 0%, #e4e4e7 25%, #d4d4d8 50%, #a1a1aa 100%)
        `,
                backgroundSize: '8px 8px, 100% 100%',
                backgroundPosition: '0 0, 0 0',
                width: '100%',
            }}
        >
            {/* Header */}
            <header className="relative z-10 px-6 py-6 flex items-center justify-between max-w-7xl mx-auto">
                <a href="/" className="flex items-center gap-3 cursor-pointer">
                    <Image
                        src="/images/logo.png"
                        alt="AI Comic Generator"
                        width={200}
                        height={80}
                        className="h-24 w-auto"
                    />
                </a>

                {/* Desktop Navigation Menu */}
                <div className="hidden md:flex items-center gap-6">
                    {/* Navigation Links */}
                    <a
                        href="/blog"
                        className="text-black font-bold text-base hover:opacity-70 transition-opacity cursor-pointer"
                    >
                        Blog
                    </a>

                    <button
                        onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
                        className="text-black font-bold text-base hover:opacity-70 transition-opacity cursor-pointer"
                    >
                        Pricing
                    </button>

                    {/* Language Selector */}
                    <div className="flex items-center gap-2 cursor-pointer hover:opacity-70 transition-opacity">
                        <svg width="24" height="18" viewBox="0 0 24 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect width="24" height="18" fill="#B22234" />
                            <path d="M0 2.31H24M0 4.62H24M0 6.92H24M0 9.23H24M0 11.54H24M0 13.85H24M0 16.15H24" stroke="white" strokeWidth="1.38" />
                            <rect width="9.6" height="7.85" fill="#3C3B6E" />
                            <g fill="white">
                                <circle cx="1.2" cy="1.15" r="0.46" />
                                <circle cx="2.4" cy="1.15" r="0.46" />
                                <circle cx="3.6" cy="1.15" r="0.46" />
                                <circle cx="4.8" cy="1.15" r="0.46" />
                                <circle cx="6" cy="1.15" r="0.46" />
                                <circle cx="7.2" cy="1.15" r="0.46" />
                                <circle cx="8.4" cy="1.15" r="0.46" />
                                <circle cx="1.8" cy="2.31" r="0.46" />
                                <circle cx="3" cy="2.31" r="0.46" />
                                <circle cx="4.2" cy="2.31" r="0.46" />
                                <circle cx="5.4" cy="2.31" r="0.46" />
                                <circle cx="6.6" cy="2.31" r="0.46" />
                                <circle cx="7.8" cy="2.31" r="0.46" />
                                <circle cx="1.2" cy="3.46" r="0.46" />
                                <circle cx="2.4" cy="3.46" r="0.46" />
                                <circle cx="3.6" cy="3.46" r="0.46" />
                                <circle cx="4.8" cy="3.46" r="0.46" />
                                <circle cx="6" cy="3.46" r="0.46" />
                                <circle cx="7.2" cy="3.46" r="0.46" />
                                <circle cx="8.4" cy="3.46" r="0.46" />
                                <circle cx="1.8" cy="4.62" r="0.46" />
                                <circle cx="3" cy="4.62" r="0.46" />
                                <circle cx="4.2" cy="4.62" r="0.46" />
                                <circle cx="5.4" cy="4.62" r="0.46" />
                                <circle cx="6.6" cy="4.62" r="0.46" />
                                <circle cx="7.8" cy="4.62" r="0.46" />
                                <circle cx="1.2" cy="5.77" r="0.46" />
                                <circle cx="2.4" cy="5.77" r="0.46" />
                                <circle cx="3.6" cy="5.77" r="0.46" />
                                <circle cx="4.8" cy="5.77" r="0.46" />
                                <circle cx="6" cy="5.77" r="0.46" />
                                <circle cx="7.2" cy="5.77" r="0.46" />
                                <circle cx="8.4" cy="5.77" r="0.46" />
                                <circle cx="1.8" cy="6.92" r="0.46" />
                                <circle cx="3" cy="6.92" r="0.46" />
                                <circle cx="4.2" cy="6.92" r="0.46" />
                                <circle cx="5.4" cy="6.92" r="0.46" />
                                <circle cx="6.6" cy="6.92" r="0.46" />
                                <circle cx="7.8" cy="6.92" r="0.46" />
                            </g>
                        </svg>
                        <span className="text-black font-bold text-base">EN</span>
                    </div>

                    {/* Profile Button with Dropdown */}
                    <div ref={profileDropdownRef} className="relative">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                            className="px-5 py-2 bg-white text-black font-bold text-base border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all"
                        >
                            Profile
                        </motion.button>

                        {/* Dropdown Menu */}
                        {isProfileDropdownOpen && (
                            <div className="absolute top-full mt-2 left-0 bg-white rounded-lg shadow-lg min-w-[240px] z-50 overflow-hidden">
                                {/* Email Header */}
                                <div className="px-4 py-3 bg-gray-50">
                                    <p className="text-sm font-bold text-gray-800 truncate">{profile?.email || 'User'}</p>
                                </div>

                                {/* My Creations */}
                                <a
                                    href="/my-creations"
                                    className="w-full px-4 py-3 text-left text-sm font-bold hover:bg-gray-50 transition-all flex items-center gap-2 block"
                                >
                                    <span>My Creations</span>
                                </a>

                                {/* Logout */}
                                <button
                                    onClick={handleLogout}
                                    className="w-full px-4 py-3 text-left text-sm font-bold hover:bg-red-50 transition-all flex items-center gap-2 text-red-600"
                                >
                                    <span>↪</span>
                                    <span>Logout</span>
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Get Pro Button */}
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
                        className="px-5 py-2 bg-[#facc15] text-black font-bold text-base border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all"
                    >
                        Get Pro
                    </motion.button>
                </div>

                {/* Mobile Hamburger Button */}
                <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="md:hidden flex flex-col gap-1.5 z-[60] relative"
                    aria-label="Toggle menu"
                >
                    <motion.span
                        animate={isMobileMenuOpen ? { rotate: 45, y: 8 } : { rotate: 0, y: 0 }}
                        className="w-7 h-0.5 bg-black block transition-all"
                    />
                    <motion.span
                        animate={isMobileMenuOpen ? { opacity: 0 } : { opacity: 1 }}
                        className="w-7 h-0.5 bg-black block transition-all"
                    />
                    <motion.span
                        animate={isMobileMenuOpen ? { rotate: -45, y: -8 } : { rotate: 0, y: 0 }}
                        className="w-7 h-0.5 bg-black block transition-all"
                    />
                </button>

                {/* Mobile Menu Overlay - Rendered via Portal */}
                {isMounted && createPortal(
                    <AnimatePresence>
                        {isMobileMenuOpen && (
                            <>
                                {/* Backdrop */}
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    onClick={closeMobileMenu}
                                    className="md:hidden fixed inset-0 bg-black/50 z-[9998]"
                                />

                                {/* Menu Panel */}
                                <motion.div
                                    initial={{ x: '100%' }}
                                    animate={{ x: 0 }}
                                    exit={{ x: '100%' }}
                                    transition={{ type: 'tween', duration: 0.3 }}
                                    className="md:hidden fixed top-0 right-0 h-full w-[280px] bg-white z-[9999] shadow-2xl overflow-y-auto"
                                >
                                    <div className="flex flex-col p-6 gap-6 pt-20">
                                        {/* Navigation Links */}
                                        <a
                                            href="/blog"
                                            onClick={closeMobileMenu}
                                            className="text-black font-bold text-lg hover:text-[#6366f1] transition-colors py-2 border-b border-gray-200"
                                        >
                                            Blog
                                        </a>

                                        <button
                                            onClick={() => {
                                                document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
                                                closeMobileMenu();
                                            }}
                                            className="text-left text-black font-bold text-lg hover:text-[#6366f1] transition-colors py-2 border-b border-gray-200"
                                        >
                                            Pricing
                                        </button>

                                        {/* Language Selector */}
                                        <div className="flex items-center gap-2 py-2 border-b border-gray-200">
                                            <svg width="24" height="18" viewBox="0 0 24 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <rect width="24" height="18" fill="#B22234" />
                                                <path d="M0 2.31H24M0 4.62H24M0 6.92H24M0 9.23H24M0 11.54H24M0 13.85H24M0 16.15H24" stroke="white" strokeWidth="1.38" />
                                                <rect width="9.6" height="7.85" fill="#3C3B6E" />
                                                <g fill="white">
                                                    <circle cx="1.2" cy="1.15" r="0.46" />
                                                    <circle cx="2.4" cy="1.15" r="0.46" />
                                                    <circle cx="3.6" cy="1.15" r="0.46" />
                                                    <circle cx="4.8" cy="1.15" r="0.46" />
                                                    <circle cx="6" cy="1.15" r="0.46" />
                                                    <circle cx="7.2" cy="1.15" r="0.46" />
                                                    <circle cx="8.4" cy="1.15" r="0.46" />
                                                    <circle cx="1.8" cy="2.31" r="0.46" />
                                                    <circle cx="3" cy="2.31" r="0.46" />
                                                    <circle cx="4.2" cy="2.31" r="0.46" />
                                                    <circle cx="5.4" cy="2.31" r="0.46" />
                                                    <circle cx="6.6" cy="2.31" r="0.46" />
                                                    <circle cx="7.8" cy="2.31" r="0.46" />
                                                    <circle cx="1.2" cy="3.46" r="0.46" />
                                                    <circle cx="2.4" cy="3.46" r="0.46" />
                                                    <circle cx="3.6" cy="3.46" r="0.46" />
                                                    <circle cx="4.8" cy="3.46" r="0.46" />
                                                    <circle cx="6" cy="3.46" r="0.46" />
                                                    <circle cx="7.2" cy="3.46" r="0.46" />
                                                    <circle cx="8.4" cy="3.46" r="0.46" />
                                                    <circle cx="1.8" cy="4.62" r="0.46" />
                                                    <circle cx="3" cy="4.62" r="0.46" />
                                                    <circle cx="4.2" cy="4.62" r="0.46" />
                                                    <circle cx="5.4" cy="4.62" r="0.46" />
                                                    <circle cx="6.6" cy="4.62" r="0.46" />
                                                    <circle cx="7.8" cy="4.62" r="0.46" />
                                                    <circle cx="1.2" cy="5.77" r="0.46" />
                                                    <circle cx="2.4" cy="5.77" r="0.46" />
                                                    <circle cx="3.6" cy="5.77" r="0.46" />
                                                    <circle cx="4.8" cy="5.77" r="0.46" />
                                                    <circle cx="6" cy="5.77" r="0.46" />
                                                    <circle cx="7.2" cy="5.77" r="0.46" />
                                                    <circle cx="8.4" cy="5.77" r="0.46" />
                                                    <circle cx="1.8" cy="6.92" r="0.46" />
                                                    <circle cx="3" cy="6.92" r="0.46" />
                                                    <circle cx="4.2" cy="6.92" r="0.46" />
                                                    <circle cx="5.4" cy="6.92" r="0.46" />
                                                    <circle cx="6.6" cy="6.92" r="0.46" />
                                                    <circle cx="7.8" cy="6.92" r="0.46" />
                                                </g>
                                            </svg>
                                            <span className="text-black font-bold text-base">EN</span>
                                        </div>

                                        {/* Get Pro Button */}
                                        <div className="pt-4">
                                            <button
                                                onClick={() => {
                                                    document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
                                                    closeMobileMenu();
                                                }}
                                                className="w-full py-3 bg-[#facc15] text-black font-bold text-lg border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:shadow-none transition-all rounded-xl"
                                            >
                                                Get Pro
                                            </button>
                                        </div>

                                        {/* Mobile Profile Actions */}
                                        <div className="mt-auto border-t border-gray-200 pt-6">
                                            <p className="text-sm font-bold text-gray-500 mb-4 px-2">ACCOUNT</p>
                                            <a
                                                href="/my-creations"
                                                onClick={closeMobileMenu}
                                                className="w-full px-4 py-3 text-left text-sm font-bold hover:bg-gray-50 transition-all cursor-pointer block rounded-lg text-gray-800"
                                            >
                                                My Creations
                                            </a>
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    handleLogout();
                                                    closeMobileMenu();
                                                }}
                                                className="w-full px-4 py-3 text-left text-sm font-bold hover:bg-red-50 transition-all cursor-pointer flex items-center gap-2 text-red-600 rounded-lg mt-2"
                                            >
                                                <span>↪</span>
                                                <span>Logout</span>
                                            </button>
                                        </div>

                                    </div>
                                </motion.div>
                            </>
                        )}
                    </AnimatePresence>,
                    document.body
                )}
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 py-4 md:py-12 flex flex-col min-h-[calc(100vh-140px)]">
                <div className="flex flex-col xl:flex-row gap-6 xl:gap-8 xl:items-stretch w-full flex-1">

                {/* Left Column: Title & Preview */}
                <div className="w-full xl:w-[35%] flex flex-col items-center xl:items-start max-w-2xl mx-auto xl:mx-0 h-full">
                    {/* Stylized Title Section */}
                    <div className="text-center xl:text-left mb-6 md:mb-10 w-full flex flex-col items-center xl:items-start xl:h-[240px] justify-end">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <span className="inline-block py-1 md:py-1.5 px-2 md:px-3 bg-white border-[2px] border-black rounded-full text-black font-black text-[10px] md:text-xs uppercase tracking-widest shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] md:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] mb-3 md:mb-4 transform -rotate-2">
                            Download Your Generation
                        </span>
                        <h1 className="text-3xl md:text-5xl lg:text-5xl xl:text-6xl font-black leading-tight tracking-wider font-display uppercase drop-shadow-sm mb-2 md:mb-4">
                            {getStyleTitlePrefix()} <br className="hidden xl:block" /><span className="text-transparent bg-clip-text bg-gradient-to-r from-[#6366f1] to-[#8b5cf6]">READY!</span>
                        </h1>
                        <p className="text-sm md:text-xl font-bold text-gray-700">
                            Your creation is complete and waiting for you. Get Pro to download.
                        </p>
                    </motion.div>
                </div>

                {/* Results Section */}
                <div className="w-full flex-1 flex flex-col justify-center relative bg-white border-[3px] md:border-[4px] border-black rounded-2xl md:rounded-3xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] md:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] py-4 px-2 md:p-8 overflow-hidden h-full">
                    {/* Background Image */}
                    <div className="absolute inset-0 pointer-events-none">
                        <Image
                            src="/images/comic-rays-bg.jpg"
                            alt=""
                            fill
                            className="object-cover opacity-[0.1]"
                        />
                    </div>

                    {/* Preview Box */}
                    <div className="relative z-10 mb-2 md:mb-8">
                        <div className={`${getAspectRatio()} w-[140px] sm:w-[220px] md:w-full md:max-w-md mx-auto bg-gray-100 border-[3px] md:border-[4px] border-black rounded-xl md:rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden flex items-center justify-center`}>
                            {/* Blurred Background Image */}
                            <div className="absolute inset-0">
                                <Image
                                    src="/images/feature-1-main.jpg"
                                    alt="Blurred Preview"
                                    fill
                                    className="object-cover blur-3xl scale-110"
                                />
                                {/* Optional overlay to improve text contrast if needed */}
                                <div className="absolute inset-0 bg-white/40" />
                            </div>

                            {/* Lock Icon and Text */}
                            <div
                                onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
                                className="relative z-10 text-center p-4 md:p-6 bg-white rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] cursor-pointer hover:scale-105 transition-transform max-w-[80%] mx-auto"
                            >
                                <Lock className="w-10 h-10 md:w-16 md:h-16 mx-auto mb-2 md:mb-4 text-black" />
                                <p className="text-lg md:text-xl font-black text-black mb-1 md:mb-2">Locked</p>
                                <p className="text-[10px] sm:text-xs md:text-sm font-bold text-gray-900 leading-tight">Upgrade to Pro<br className="sm:hidden" /> to view</p>
                            </div>
                        </div>
                    </div>
                </div>
                </div>

                {/* Right Column: Pricing Section */}
                <div id="pricing" className="w-full xl:w-[65%] flex flex-col max-w-5xl mx-auto xl:mx-0 mt-8 xl:mt-0 relative h-full">
                    <div className="text-center mb-6 md:mb-10 flex flex-col xl:h-[240px] justify-end mt-4 md:mt-0">
                        <h3 className="text-2xl md:text-3xl font-black text-black font-display mb-2 md:mb-4">
                            Choose your package <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#6366f1] to-[#8b5cf6]">now:</span>
                        </h3>
                    </div>

                    {/* Pricing Grid */}
                    <div className="grid md:grid-cols-2 gap-4 lg:gap-8 max-w-4xl mx-auto w-full xl:px-0 flex-1">
                        {/* Monthly Plan - 10 Comics */}
                        <motion.div
                            whileHover={{ scale: 1.02, y: -5 }}
                            onClick={() => setSelectedPlan('monthly')}
                            className={`relative border-[4px] border-black rounded-3xl p-6 lg:p-8 cursor-pointer transition-all ${selectedPlan === 'monthly' ? 'bg-[#facc15] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]' : 'bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]'} hover:scale-[1.02] hover:-translate-y-1 z-10 flex flex-col h-full`}
                        >
                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-black text-white px-4 py-1 rounded-full text-xs font-bold border-2 border-white">
                                PREFERRED
                            </div>
                            <div className="text-center flex flex-col h-full justify-between">
                                <div>
                                    <h4 className="text-xl font-black mb-2">Formule Abonnement</h4>
                                    <div className="mb-4">
                                        <span className="text-3xl font-black">€9.90</span>
                                        <span className="text-xs font-bold opacity-70">/month</span>
                                    </div>
                                    <div className="inline-block bg-transparent text-transparent px-2 py-1 rounded-md text-xs font-bold mb-6 border border-transparent">
                                        &nbsp;
                                    </div>
                                    <ul className="text-left space-y-3 mb-6 text-sm">
                                        <li className="flex items-center gap-3 font-bold">
                                            <span className={`w-6 h-6 rounded-full flex items-center justify-center border-2 border-black shrink-0 ${selectedPlan === 'monthly' ? 'bg-black text-yellow-400' : 'bg-[#facc15] text-black'}`}>
                                                <Check className="w-3.5 h-3.5" />
                                            </span>
                                            10 generated comics / month
                                        </li>
                                        <li className="flex items-center gap-3 font-bold">
                                            <span className={`w-6 h-6 rounded-full flex items-center justify-center border-2 border-black shrink-0 ${selectedPlan === 'monthly' ? 'bg-black text-yellow-400' : 'bg-[#facc15] text-black'}`}>
                                                <Check className="w-3.5 h-3.5" />
                                            </span>
                                            Commercial Use
                                        </li>
                                        <li className="flex items-center gap-3 font-bold">
                                            <span className={`w-6 h-6 rounded-full flex items-center justify-center border-2 border-black shrink-0 ${selectedPlan === 'monthly' ? 'bg-black text-yellow-400' : 'bg-[#facc15] text-black'}`}>
                                                <Check className="w-3.5 h-3.5" />
                                            </span>
                                            No Watermark
                                        </li>
                                    </ul>
                                </div>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); handlePlanSelect(); }}
                                    className="w-full py-3 rounded-xl border-[3px] border-black font-black text-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-transform active:translate-y-1 active:shadow-none bg-white mt-auto"
                                >
                                    Get Started
                                </button>
                            </div>
                        </motion.div>

                        {/* One Time Payment - 1 Comic */}
                        <motion.div
                            whileHover={{ scale: 1.02, y: -5 }}
                            onClick={() => setSelectedPlan('onetime')}
                            className={`relative border-[4px] border-black rounded-3xl p-6 lg:p-8 cursor-pointer transition-all ${selectedPlan === 'onetime' ? 'bg-[#facc15] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]' : 'bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]'} hover:scale-[1.02] hover:-translate-y-1 flex flex-col h-full`}
                        >
                            <div className="text-center flex flex-col h-full justify-between">
                                <div>
                                    <h4 className="text-xl font-black mb-2">One Time Payment</h4>
                                    <div className="mb-4">
                                        <span className="text-3xl font-black">€14.90</span>
                                        <span className="text-xs font-bold opacity-70">/once</span>
                                    </div>
                                    <div className="inline-block bg-transparent text-transparent px-2 py-1 rounded-md text-xs font-bold mb-6 border border-transparent">
                                        &nbsp;
                                    </div>
                                    <ul className="text-left space-y-3 mb-6 text-sm">
                                        <li className="flex items-center gap-3 font-bold">
                                            <span className={`w-6 h-6 rounded-full flex items-center justify-center border-2 border-black shrink-0 ${selectedPlan === 'onetime' ? 'bg-black text-yellow-400' : 'bg-[#facc15] text-black'}`}>
                                                <Check className="w-3.5 h-3.5" />
                                            </span>
                                            1 generated comic
                                        </li>
                                        <li className="flex items-center gap-3 font-bold">
                                            <span className={`w-6 h-6 rounded-full flex items-center justify-center border-2 border-black shrink-0 ${selectedPlan === 'onetime' ? 'bg-black text-yellow-400' : 'bg-[#facc15] text-black'}`}>
                                                <Check className="w-3.5 h-3.5" />
                                            </span>
                                            Commercial Use
                                        </li>
                                        <li className="flex items-center gap-3 font-bold">
                                            <span className={`w-6 h-6 rounded-full flex items-center justify-center border-2 border-black shrink-0 ${selectedPlan === 'onetime' ? 'bg-black text-yellow-400' : 'bg-[#facc15] text-black'}`}>
                                                <Check className="w-3.5 h-3.5" />
                                            </span>
                                            No Watermark
                                        </li>
                                    </ul>
                                </div>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); handlePlanSelect(); }}
                                    className="w-full py-3 rounded-xl border-[3px] border-black font-black text-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-transform active:translate-y-1 active:shadow-none bg-white mt-auto"
                                >
                                    Get Started
                                </button>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* Cancel Anytime (Below Columns) */}
            <div className="mt-8 md:mt-12 mb-4 text-center w-full">
                <div className="hidden md:inline-flex items-center gap-2 bg-white/90 px-6 py-3 rounded-full border-[2px] border-black/10 shadow-sm mx-auto text-sm text-black font-bold whitespace-nowrap">
                    <Check className="w-4 h-4 text-green-600" />
                    Cancel anytime <span className="text-gray-400 mx-1">•</span>
                    <Check className="w-4 h-4 text-green-600" />
                    No commitment required <span className="text-gray-400 mx-1">•</span>
                    <Check className="w-4 h-4 text-green-600" />
                    Secure checkout
                </div>
                {/* Mobile variant */}
                <div className="md:hidden inline-flex items-center justify-center flex-wrap gap-1.5 bg-white/90 px-4 py-2.5 rounded-full border-[2px] border-black/10 shadow-sm mx-auto text-xs text-black font-bold">
                    <Check className="w-3.5 h-3.5 text-green-600 shrink-0" />
                    <span>Cancel anytime</span>
                    <span className="text-gray-400 mx-0.5">•</span>
                    <Check className="w-3.5 h-3.5 text-green-600 shrink-0" />
                    <span>Secure checkout</span>
                </div>
            </div>
        </main>

            <Footer />

            {/* Loading Popup for Real Generation */}
            <LoadingPopup
                isOpen={isLoadingPopupOpen}
                selectedStyle={selectedStyle}
                autoClose={false}
            />
        </div>
    );
}
