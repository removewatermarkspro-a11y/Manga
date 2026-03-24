'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Zap, Star, Shield, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import Footer from '../../components/Footer';

export default function PricingProPage() {
    const [selectedPlan, setSelectedPlan] = useState<'yearly' | 'monthly' | 'onetime'>('yearly');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

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

    const closeMobileMenu = () => setIsMobileMenuOpen(false);

    type Plan = {
        id: 'monthly' | 'yearly' | 'onetime';
        name: string;
        price: string;
        period: string;
        badge: string | null;
        highlight: boolean;
        features: string[];
        cta: string;
        subPrice?: string;
    };

    const plans: Plan[] = [
        {
            id: 'monthly' as const,
            name: 'Monthly',
            price: '€24.99',
            period: '/month',
            badge: 'MOST POPULAR',
            highlight: true,
            features: ['Unlimited Credits', 'Unlimited Modifications', 'No Watermark', 'Commercial Use', 'Standard Access'],
            cta: 'Start Monthly',
        },
        {
            id: 'yearly' as const,
            name: 'Yearly',
            price: '€59.99',
            period: '/year',
            badge: null,
            highlight: false,
            features: ['Unlimited Credits', 'Unlimited Modifications', 'No Watermark', 'Commercial Use', 'Priority Access'],
            cta: 'Go Yearly — Best Value',
        },
        {
            id: 'onetime' as const,
            name: 'One Time',
            price: '€9.99',
            period: '/once',
            badge: null,
            highlight: false,
            features: ['130 Credits', '1 Full Manga/Comic/Manhwa', '3 Modifications', 'Commercial Use'],
            cta: 'Buy Once',
        },
    ];

    return (
        <div
            className="min-h-screen relative overflow-hidden flex flex-col"
            style={{
                background: `
          radial-gradient(circle, rgba(0, 0, 0, 0.11) 1px, transparent 1px),
          linear-gradient(to bottom, #e4e4e7 0%, #e4e4e7 25%, #d4d4d8 50%, #a1a1aa 100%)
        `,
                backgroundSize: '8px 8px, 100% 100%',
            }}
        >
            {/* Header */}
            <header className="relative z-50 px-6 py-6 flex items-center justify-between max-w-7xl mx-auto w-full">
                <a href="/" className="flex items-center gap-3 cursor-pointer">
                    <Image
                        src="/images/logo.png"
                        alt="AI Comic Generator"
                        width={200}
                        height={80}
                        className="h-20 sm:h-24 md:h-32 w-auto drop-shadow-sm"
                    />
                </a>

                {/* Desktop nav */}
                <div className="hidden md:flex items-center gap-6">
                    <a href="/blog" className="text-black font-bold text-base hover:opacity-70 transition-opacity">Blog</a>
                    <a href="/" className="px-5 py-2 bg-white text-black font-bold text-base border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all">
                        Back to App
                    </a>
                </div>

                {/* Mobile Hamburger */}
                <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="md:hidden flex flex-col gap-1.5 z-[60] relative"
                    aria-label="Toggle menu"
                >
                    <motion.span animate={isMobileMenuOpen ? { rotate: 45, y: 8 } : { rotate: 0, y: 0 }} className="w-7 h-0.5 bg-black block transition-all" />
                    <motion.span animate={isMobileMenuOpen ? { opacity: 0 } : { opacity: 1 }} className="w-7 h-0.5 bg-black block transition-all" />
                    <motion.span animate={isMobileMenuOpen ? { rotate: -45, y: -8 } : { rotate: 0, y: 0 }} className="w-7 h-0.5 bg-black block transition-all" />
                </button>

                {/* Mobile Menu Portal */}
                {isMounted && createPortal(
                    <AnimatePresence>
                        {isMobileMenuOpen && (
                            <>
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeMobileMenu} className="fixed inset-0 bg-black/50 z-[9998]" />
                                <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'tween', duration: 0.3 }} className="fixed top-0 right-0 h-full w-[280px] bg-white z-[9999] shadow-2xl overflow-y-auto">
                                    <div className="flex flex-col p-6 gap-6 pt-20">
                                        <a href="/blog" onClick={closeMobileMenu} className="text-black font-bold text-lg hover:text-[#6366f1] transition-colors py-2 border-b border-gray-200">Blog</a>
                                        <div className="pt-4">
                                            <a href="/" onClick={closeMobileMenu} className="w-full py-3 block text-center bg-[#facc15] text-black font-bold text-lg border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:shadow-none transition-all rounded-xl">
                                                Back to App
                                            </a>
                                        </div>
                                    </div>
                                </motion.div>
                            </>
                        )}
                    </AnimatePresence>,
                    document.body
                )}
            </header>

            {/* Hero Section */}
            <main className="flex-1 max-w-7xl mx-auto px-4 pb-16 w-full">
                {/* Title Block */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-12 mt-4"
                >
                    <span className="inline-block py-1.5 px-4 bg-white border-[2px] border-black rounded-full text-black font-black text-xs uppercase tracking-widest shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] mb-6 transform -rotate-1">
                        Unlock Your Full Creative Power
                    </span>
                    <h1 className="text-5xl md:text-6xl lg:text-7xl font-black font-display uppercase leading-tight tracking-wide drop-shadow-sm mb-6">
                        Choose Your{' '}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#6366f1] to-[#8b5cf6]">
                            Pro Plan
                        </span>
                    </h1>
                    <p className="text-xl md:text-2xl font-bold text-gray-700 max-w-2xl mx-auto">
                        Generate professional manga, comics & webtoons with AI — no watermark, commercial rights included, cancel anytime.
                    </p>
                </motion.div>

                {/* Trust badges */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.15 }}
                    className="flex flex-wrap justify-center gap-4 mb-12"
                >
                    {[
                        { icon: <Shield className="w-4 h-4" />, label: 'Secure Payment' },
                        { icon: <Zap className="w-4 h-4" />, label: 'Instant Access' },
                        { icon: <Star className="w-4 h-4" />, label: 'Cancel Anytime' },
                        { icon: <Check className="w-4 h-4" />, label: 'No Hidden Fees' },
                    ].map((badge) => (
                        <div key={badge.label} className="flex items-center gap-2 bg-white border-[2px] border-black px-4 py-2 rounded-full shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] text-sm font-bold">
                            {badge.icon}
                            {badge.label}
                        </div>
                    ))}
                </motion.div>

                {/* Pricing Cards */}
                <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto">
                    {plans.map((plan, i) => (
                        <motion.div
                            key={plan.id}
                            initial={{ opacity: 0, y: 40 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.2 + i * 0.1 }}
                            whileHover={{ scale: 1.02, y: -6 }}
                            onClick={() => setSelectedPlan(plan.id)}
                            className={`relative rounded-3xl border-[4px] border-black cursor-pointer flex flex-col h-full transition-all
                                ${plan.highlight
                                    ? 'bg-[#facc15] shadow-[10px_10px_0px_0px_rgba(0,0,0,1)]'
                                    : 'bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[10px_10px_0px_0px_rgba(0,0,0,1)]'}
                                p-8`}
                        >
                            {/* Most Popular Badge */}
                            {plan.badge && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-black text-white px-5 py-1.5 rounded-full text-xs font-black border-2 border-white tracking-wider">
                                    {plan.badge}
                                </div>
                            )}

                            <div className="flex flex-col h-full justify-between">
                                <div>
                                    <h2 className="text-2xl font-black mb-1">{plan.name}</h2>
                                    <div className="flex items-end gap-1 mb-1">
                                        <span className={`font-black leading-none ${plan.highlight ? 'text-5xl' : 'text-4xl'}`}>{plan.price}</span>
                                        <span className="text-sm font-bold opacity-60 mb-1">{plan.period}</span>
                                    </div>
                                    {plan.subPrice ? (
                                        <div className="inline-block bg-black text-white px-3 py-1 rounded-md text-sm font-bold mb-6">
                                            {plan.subPrice}
                                        </div>
                                    ) : (
                                        <div className="h-8 mb-2" />
                                    )}

                                    <ul className="space-y-3 mb-8">
                                        {plan.features.map((f) => (
                                            <li key={f} className="flex items-center gap-3 font-bold text-base">
                                                <span className={`w-6 h-6 rounded-full flex items-center justify-center border-2 border-black shrink-0 ${plan.highlight ? 'bg-black text-yellow-400' : 'bg-[#facc15]'}`}>
                                                    <Check className="w-3.5 h-3.5" />
                                                </span>
                                                {f}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <motion.button
                                    whileHover={{ scale: 1.03 }}
                                    whileTap={{ scale: 0.97 }}
                                    className={`w-full py-4 rounded-2xl border-[3px] border-black font-black text-lg flex items-center justify-center gap-2 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none
                                        ${plan.highlight ? 'bg-black text-white hover:bg-gray-900' : 'bg-white text-black hover:bg-gray-50'}`}
                                >
                                    {plan.cta}
                                    <ArrowRight className="w-5 h-5" />
                                </motion.button>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Bottom Guarantee Line */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.6 }}
                    className="text-center mt-10"
                >
                    <p className="text-sm font-bold text-gray-700 inline-flex items-center gap-2 bg-white/70 px-6 py-3 rounded-full border-2 border-black/10">
                        <Check className="w-4 h-4 text-green-600" />
                        Cancel anytime &nbsp;·&nbsp;
                        <Check className="w-4 h-4 text-green-600" />
                        No commitment required &nbsp;·&nbsp;
                        <Check className="w-4 h-4 text-green-600" />
                        Secure checkout
                    </p>
                </motion.div>
            </main>

            <Footer />
        </div>
    );
}
