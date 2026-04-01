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

            if (!res.ok || !res.body) {
                const text = await res.text();
                throw new Error(`Server error (${res.status}): ${text.substring(0, 300)}`);
            }

            const contentType = res.headers.get('content-type') || '';

            // --- SSE streaming path ---
            if (contentType.includes('text/event-stream')) {
                const reader = res.body.getReader();
                const decoder = new TextDecoder();
                const collectedImages: string[] = [];
                let buffer = '';
                let creationId: string | null = null;

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    buffer += decoder.decode(value, { stream: true });

                    const lines = buffer.split('\n');
                    buffer = lines.pop() || '';

                    for (const line of lines) {
                        if (!line.startsWith('data: ')) continue;
                        const payload = line.slice(6).trim();
                        if (!payload) continue;

                        try {
                            const event = JSON.parse(payload);
                            if (event.type === 'image') {
                                collectedImages.push(event.url);
                            } else if (event.type === 'done') {
                                creationId = event.creationId || null;
                            } else if (event.type === 'error') {
                                throw new Error(event.message);
                            }
                        } catch (parseErr) {
                            // ignore malformed SSE lines
                        }
                    }
                }

                if (collectedImages.length === 0) {
                    throw new Error('No images were generated');
                }

                localStorage.setItem('generatedImages', JSON.stringify(collectedImages));
                localStorage.removeItem('pendingGenerationData');
                window.location.href = creationId ? `/results?id=${creationId}` : '/results';

            // --- Legacy JSON path (fallback) ---
            } else {
                const data = await res.json();
                if (data.images) {
                    localStorage.setItem('generatedImages', JSON.stringify(data.images));
                    localStorage.removeItem('pendingGenerationData');
                    window.location.href = data.creationId ? `/results?id=${data.creationId}` : '/results';
                } else {
                    throw new Error(data.error || 'Unknown error');
                }
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
            <header className="relative z-10 px-6 py-2 flex items-center justify-between max-w-7xl mx-auto">
                <a href="/" className="flex items-center gap-3 cursor-pointer">
                    <Image
                        src="/images/logo.png"
                        alt="AI Comic Generator"
                        width={200}
                        height={80}
                        className="h-16 w-auto"
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
            <main className="max-w-7xl mx-auto px-4 py-2 md:py-4 flex flex-col" style={{ minHeight: 'calc(100vh - 90px)' }}>

                {/* Top Title — full width */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-4 md:mb-5"
                >
                    <span className="inline-block py-1 px-2 bg-white border-[2px] border-black rounded-full text-black font-black text-[10px] md:text-xs uppercase tracking-widest shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] mb-2 transform -rotate-2">
                        Download Your Generation
                    </span>
                    <h1 className="text-2xl md:text-4xl xl:text-5xl font-black leading-tight tracking-wider font-display uppercase drop-shadow-sm">
                        {getStyleTitlePrefix()} <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#6366f1] to-[#8b5cf6]">READY!</span>
                    </h1>
                    <p className="text-xs md:text-sm font-bold text-gray-600 mt-1">
                        Your creation is complete. Choose a plan to download it.
                    </p>
                </motion.div>

                {/* Two-column layout: preview left, pricing right */}
                <div className="flex flex-col xl:flex-row gap-4 xl:gap-6 items-stretch flex-1">

                    {/* Left: Blurred Preview */}
                    <div className="w-full xl:w-[38%] flex flex-col">
                        <div className="flex-1 relative bg-white border-[4px] border-black rounded-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-hidden" style={{ minHeight: '280px' }}>
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
                            <div className="relative z-10 flex items-center justify-center h-full p-4">
                                <div className={`${getAspectRatio()} w-[140px] sm:w-[180px] md:w-[220px] xl:w-[200px] bg-gray-100 border-[3px] border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden flex items-center justify-center`}>
                                    {/* Blurred Background Image */}
                                    <div className="absolute inset-0">
                                        <Image
                                            src="/images/feature-1-main.jpg"
                                            alt="Blurred Preview"
                                            fill
                                            className="object-cover blur-3xl scale-110"
                                        />
                                        <div className="absolute inset-0 bg-white/40" />
                                    </div>

                                    {/* Lock Icon and Text */}
                                    <div
                                        onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
                                        className="relative z-10 text-center p-4 bg-white rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] cursor-pointer hover:scale-105 transition-transform max-w-[80%] mx-auto"
                                    >
                                        <Lock className="w-8 h-8 md:w-10 md:h-10 mx-auto mb-2 text-black" />
                                        <p className="text-sm md:text-base font-black text-black mb-0.5">Locked</p>
                                        <p className="text-[10px] sm:text-xs font-bold text-gray-700 leading-tight">Upgrade to Pro to view</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Pricing Section */}
                    <div id="pricing" className="w-full xl:w-[62%] flex flex-col">
                        <div className="text-center mb-3">
                            <h3 className="text-xl md:text-2xl font-black text-black font-display">
                                Choose your package <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#6366f1] to-[#8b5cf6]">now:</span>
                            </h3>
                        </div>

                        {/* Pricing Grid */}
                        <div className="grid md:grid-cols-2 gap-3 lg:gap-4 flex-1">
                            {/* Monthly Plan */}
                            <motion.div
                                whileHover={{ scale: 1.02, y: -3 }}
                                onClick={() => setSelectedPlan('monthly')}
                                className={`relative border-[4px] border-black rounded-2xl p-4 lg:p-5 cursor-pointer transition-all ${selectedPlan === 'monthly' ? 'bg-[#facc15] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]' : 'bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]'} z-10 flex flex-col`}
                            >
                                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-black text-white px-3 py-0.5 rounded-full text-[10px] font-bold border-2 border-white">
                                    PREFERRED
                                </div>
                                <div className="text-center flex flex-col h-full justify-between">
                                    <div>
                                        <h4 className="text-lg font-black mb-1">Formule Abonnement</h4>
                                        <div className="mb-3">
                                            <span className="text-3xl font-black">€9.90</span>
                                            <span className="text-xs font-bold opacity-70">/month</span>
                                        </div>
                                        <ul className="text-left space-y-2 mb-4 text-sm">
                                            {['10 generated comics / month', 'Commercial Use', 'No Watermark'].map(f => (
                                                <li key={f} className="flex items-center gap-2 font-bold">
                                                    <span className={`w-5 h-5 rounded-full flex items-center justify-center border-2 border-black shrink-0 ${selectedPlan === 'monthly' ? 'bg-black text-yellow-400' : 'bg-[#facc15] text-black'}`}>
                                                        <Check className="w-3 h-3" />
                                                    </span>
                                                    {f}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handlePlanSelect(); }}
                                        className="w-full py-2.5 rounded-xl border-[3px] border-black font-black text-base shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-transform active:translate-y-1 active:shadow-none bg-white mt-2"
                                    >
                                        Get Started
                                    </button>
                                </div>
                            </motion.div>

                            {/* One Time Payment */}
                            <motion.div
                                whileHover={{ scale: 1.02, y: -3 }}
                                onClick={() => setSelectedPlan('onetime')}
                                className={`relative border-[4px] border-black rounded-2xl p-4 lg:p-5 cursor-pointer transition-all ${selectedPlan === 'onetime' ? 'bg-[#facc15] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]' : 'bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]'} flex flex-col`}
                            >
                                <div className="text-center flex flex-col h-full justify-between">
                                    <div>
                                        <h4 className="text-lg font-black mb-1">One Time Payment</h4>
                                        <div className="mb-3">
                                            <span className="text-3xl font-black">€14.90</span>
                                            <span className="text-xs font-bold opacity-70">/once</span>
                                        </div>
                                        <ul className="text-left space-y-2 mb-4 text-sm">
                                            {['1 generated comic', 'Commercial Use', 'No Watermark'].map(f => (
                                                <li key={f} className="flex items-center gap-2 font-bold">
                                                    <span className={`w-5 h-5 rounded-full flex items-center justify-center border-2 border-black shrink-0 ${selectedPlan === 'onetime' ? 'bg-black text-yellow-400' : 'bg-[#facc15] text-black'}`}>
                                                        <Check className="w-3 h-3" />
                                                    </span>
                                                    {f}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handlePlanSelect(); }}
                                        className="w-full py-2.5 rounded-xl border-[3px] border-black font-black text-base shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-transform active:translate-y-1 active:shadow-none bg-white mt-2"
                                    >
                                        Get Started
                                    </button>
                                </div>
                            </motion.div>
                        </div>

                        {/* Cancel Anytime */}
                        <div className="mt-3 text-center">
                            <div className="inline-flex items-center gap-2 bg-white/90 px-4 py-2 rounded-full border-[2px] border-black/10 shadow-sm text-xs text-black font-bold">
                                <Check className="w-3.5 h-3.5 text-green-600" />
                                Cancel anytime <span className="text-gray-400 mx-1">•</span>
                                <Check className="w-3.5 h-3.5 text-green-600" />
                                No commitment <span className="text-gray-400 mx-1">•</span>
                                <Check className="w-3.5 h-3.5 text-green-600" />
                                Secure checkout
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Loading Popup for Real Generation */}
            <LoadingPopup
                isOpen={isLoadingPopupOpen}
                selectedStyle={selectedStyle}
                autoClose={false}
            />
        </div>
    );
}
