'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';
import { useState } from 'react';

interface ResultReadyPopupProps {
    isOpen: boolean;
    selectedStyle: string;
    onContinue: () => void;
}

export default function ResultReadyPopup({ isOpen, selectedStyle, onContinue }: ResultReadyPopupProps) {
    const [email, setEmail] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (email) {
            // TODO: Send email and authenticate
            console.log('Email:', email);
            onContinue();
        }
    };

    // Get style-specific message
    const getStyleMessage = () => {
        switch (selectedStyle) {
            case 'manga':
                return 'Your Manga is ready!';
            case 'comic':
                return 'Your Comic Book is ready!';
            case 'manhwa':
                return 'Your Manhwa is ready!';
            default:
                return 'Your creation is ready!';
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                    />

                    {/* Popup */}
                    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ type: 'spring', duration: 0.5 }}
                            className="relative bg-white border-[4px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] w-full max-w-md p-8"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Success Icon */}
                            <div className="flex justify-center mb-6">
                                <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                    <Check className="w-12 h-12 text-white stroke-[3]" />
                                </div>
                            </div>

                            {/* Title */}
                            <h2 className="text-2xl md:text-3xl font-black text-center mb-4 font-display text-black">
                                {getStyleMessage()}
                            </h2>

                            {/* Subtitle */}
                            <p className="text-center text-gray-700 mb-6">
                                Where should we send your creation?
                            </p>

                            {/* Google Login */}
                            <button
                                onClick={onContinue}
                                className="w-full px-6 py-4 bg-white border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all flex items-center justify-center gap-3"
                            >
                                <svg className="w-6 h-6" viewBox="0 0 24 24">
                                    <path
                                        fill="#4285F4"
                                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    />
                                    <path
                                        fill="#34A853"
                                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    />
                                    <path
                                        fill="#FBBC05"
                                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                    />
                                    <path
                                        fill="#EA4335"
                                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                    />
                                </svg>
                                <span className="font-bold text-gray-600">Continue with Google</span>
                            </button>

                            {/* Divider */}
                            <div className="flex items-center gap-4 my-6">
                                <div className="flex-1 h-[2px] bg-gray-300" />
                                <span className="text-gray-500 font-bold">or</span>
                                <div className="flex-1 h-[2px] bg-gray-300" />
                            </div>

                            {/* Email Form */}
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Email"
                                    className="w-full px-6 py-4 border-[3px] border-black bg-white text-lg placeholder:text-gray-400 focus:outline-none focus:ring-4 focus:ring-[#6366f1]/50"
                                    required
                                />

                                <button
                                    type="submit"
                                    className="w-full px-6 py-4 bg-[#ff4081] text-white font-bold text-lg border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all rounded-full"
                                >
                                    Send
                                </button>
                            </form>

                            {/* Privacy Notice */}
                            <div className="mt-6 bg-green-50 border-[2px] border-green-500 rounded-lg p-3 flex items-start gap-2">
                                <div className="flex-shrink-0 mt-0.5">
                                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                                        <Check className="w-3 h-3 text-white stroke-[3]" />
                                    </div>
                                </div>
                                <p className="text-xs text-gray-700 leading-relaxed">
                                    We respect your privacy and we commit to protecting your personal data
                                </p>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}
