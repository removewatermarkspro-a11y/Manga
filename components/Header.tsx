'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';

interface HeaderProps {
    isLoggedIn?: boolean;
    onAuthClick: () => void;
    onLogout?: () => void;
    availableCredits?: number;
    logoContainerClassName?: string;
}

export default function Header({ onAuthClick, onLogout, availableCredits, logoContainerClassName = "" }: HeaderProps) {
    const { isLoggedIn, profile, credits, signOut } = useAuth();
    const displayCredits = availableCredits !== undefined ? availableCredits : credits;
    const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const profileDropdownRef = useRef<HTMLDivElement>(null);

    // Set mounted state for portal
    useEffect(() => {
        setIsMounted(true);
    }, []);

    // No more click-outside useEffect needed — using overlay approach instead

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

    const handleLogoutClick = async (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        if (onLogout) onLogout();
        await signOut();
    };

    const closeMobileMenu = () => {
        setIsMobileMenuOpen(false);
    };

    return (
        <header className="relative z-50 px-6 py-6 flex items-center justify-between max-w-7xl mx-auto">
            <a href="/" className={`flex items-center gap-3 cursor-pointer ${logoContainerClassName}`}>
                <Image
                    src="/images/logo.png"
                    alt="AI Comic Generator"
                    width={200}
                    height={80}
                    className="h-20 sm:h-24 md:h-32 w-auto drop-shadow-sm"
                />
            </a>

            {/* Desktop Navigation Menu */}
            <div className="hidden md:flex items-center gap-8">
                {/* Features Link */}
                <a
                    href="#features"
                    className="text-black font-bold text-base hover:text-[#6366f1] transition-colors cursor-pointer"
                >
                    Features
                </a>

                {/* Testimonials Link */}
                <a
                    href="#testimonials"
                    className="text-black font-bold text-base hover:text-[#6366f1] transition-colors cursor-pointer"
                >
                    Testimonials
                </a>

                {/* Blog Link */}
                <a
                    href="/blog"
                    className="text-black font-bold text-base hover:text-[#6366f1] transition-colors cursor-pointer"
                >
                    Blog
                </a>

                {/* Language Selector */}
                <div className="flex items-center gap-2 cursor-pointer hover:opacity-70 transition-opacity">
                    <svg width="24" height="18" viewBox="0 0 24 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect width="24" height="18" fill="#B22234" />
                        <path d="M0 2.77H24M0 5.54H24M0 8.31H24M0 11.08H24M0 13.85H24M0 16.62H24" stroke="white" strokeWidth="1.38" />
                        <rect width="9.6" height="7.71" fill="#3C3B6E" />
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

                {/* Get Started / Profile + Get Pro Buttons */}
                {isLoggedIn ? (
                    <div className="flex items-center gap-4">
                        {/* Credits Display */}
                        <div className="hidden md:flex items-center gap-2 bg-[#f8fafc] border-[2px] border-black px-3 py-1.5 rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                            <span className="text-[#fb923c] shrink-0">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M11 0.7H13L22.5 6V18L13 23.3H11L1.5 18V6L11 0.7Z" />
                                </svg>
                            </span>
                            <span className="font-black text-sm">{displayCredits} Credits</span>
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
                                <>
                                    {/* Transparent overlay to close dropdown when clicking outside */}
                                    <div
                                        className="fixed inset-0 z-40"
                                        onClick={() => setIsProfileDropdownOpen(false)}
                                    />
                                    <div className="absolute top-full mt-2 left-0 bg-white rounded-lg shadow-lg min-w-[240px] z-50 overflow-hidden border border-gray-200">
                                        {/* Email Header */}
                                        <div className="px-4 py-3 bg-gray-50">
                                            <p className="text-sm font-bold text-gray-800 truncate">{profile?.email || 'User'}</p>
                                        </div>

                                        {/* My Creations */}
                                        <a
                                            href="/my-creations"
                                            className="w-full px-4 py-3 text-left text-sm font-bold hover:bg-gray-100 transition-all cursor-pointer block"
                                        >
                                            My Creations
                                        </a>

                                        {/* Logout */}
                                        <button
                                            type="button"
                                            onClick={async (e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                if (onLogout) onLogout();
                                                await signOut();
                                            }}
                                            className="w-full px-4 py-3 text-left text-sm font-bold hover:bg-gray-100 transition-all cursor-pointer flex items-center gap-2 text-red-600"
                                        >
                                            <span>↪</span>
                                            <span>Logout</span>
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>

                        <motion.a
                            href="/pricing-pro"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="px-5 py-2 bg-[#facc15] text-black font-bold text-base border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all"
                        >
                            Get Pro
                        </motion.a>
                    </div>
                ) : (
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onAuthClick}
                        className="px-5 py-2 bg-[#facc15] text-black font-bold text-base border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all"
                    >
                        Get Started
                    </motion.button>
                )}
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
                                        href="#features"
                                        onClick={closeMobileMenu}
                                        className="text-black font-bold text-lg hover:text-[#6366f1] transition-colors py-2 border-b border-gray-200"
                                    >
                                        Features
                                    </a>

                                    <a
                                        href="#testimonials"
                                        onClick={closeMobileMenu}
                                        className="text-black font-bold text-lg hover:text-[#6366f1] transition-colors py-2 border-b border-gray-200"
                                    >
                                        Testimonials
                                    </a>

                                    <a
                                        href="/blog"
                                        onClick={closeMobileMenu}
                                        className="text-black font-bold text-lg hover:text-[#6366f1] transition-colors py-2 border-b border-gray-200"
                                    >
                                        Blog
                                    </a>

                                    {/* Language Selector */}
                                    <div className="flex items-center gap-2 py-2 border-b border-gray-200">
                                        <svg width="24" height="18" viewBox="0 0 24 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <rect width="24" height="18" fill="#B22234" />
                                            <path d="M0 2.77H24M0 5.54H24M0 8.31H24M0 11.08H24M0 13.85H24M0 16.62H24" stroke="white" strokeWidth="1.38" />
                                            <rect width="9.6" height="7.71" fill="#3C3B6E" />
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
                                        <span className="text-black font-bold text-lg">EN</span>
                                    </div>

                                    {/* Auth Buttons */}
                                    {isLoggedIn ? (
                                        <div className="flex flex-col gap-4 mt-4">
                                            {/* Mobile Credits Display */}
                                            <div className="flex items-center justify-center gap-2 bg-[#f8fafc] border-[3px] border-black px-4 py-3 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                                <span className="text-[#fb923c] shrink-0">
                                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                                        <path d="M11 0.7H13L22.5 6V18L13 23.3H11L1.5 18V6L11 0.7Z" />
                                                    </svg>
                                                </span>
                                                <span className="font-black text-lg">{displayCredits} Credits Available</span>
                                            </div>

                                            <button
                                                type="button"
                                                className="w-full px-5 py-3 bg-white text-black font-bold text-base border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-left"
                                            >
                                                Profile
                                            </button>
                                            <a
                                                href="/pricing-pro"
                                                onClick={closeMobileMenu}
                                                className="w-full px-5 py-3 bg-[#facc15] text-black font-bold text-base border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] block text-center"
                                            >
                                                Get Pro
                                            </a>
                                            <button
                                                type="button"
                                                onClick={async (e) => {
                                                    handleLogoutClick(e);
                                                    closeMobileMenu();
                                                }}
                                                className="w-full px-5 py-3 bg-white text-red-600 font-bold text-base border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-2 hover:bg-red-50 transition-colors"
                                            >
                                                <span>↪</span>
                                                <span>Logout</span>
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => {
                                                onAuthClick();
                                                closeMobileMenu();
                                            }}
                                            className="w-full px-5 py-3 bg-[#facc15] text-black font-bold text-base border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mt-4"
                                        >
                                            Get Started
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </header>
    );
}
