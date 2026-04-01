'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface AuthPopupProps {
    isOpen: boolean;
    onClose: () => void;
    onLogin?: () => void;
}

export default function AuthPopup({ isOpen, onClose, onLogin }: AuthPopupProps) {
    const [email, setEmail] = useState('');
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const supabase = createClient();

    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setErrorMessage('');

        try {
            const { error } = await supabase.auth.signInWithOtp({
                email,
                options: {
                    emailRedirectTo: `${window.location.origin}/auth/callback`,
                },
            });

            if (error) {
                setErrorMessage(error.message);
                console.error('Email login error:', error);
            } else {
                setShowConfirmation(true);
            }
        } catch (err) {
            console.error('Email login error:', err);
            setErrorMessage('An error occurred. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleGoogleLogin = async () => {
        setErrorMessage('');

        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/auth/callback`,
                },
            });

            if (error) {
                setErrorMessage(error.message);
                console.error('Google login error:', error);
            }
            // User will be redirected to Google, then back to our callback
        } catch (err) {
            console.error('Google login error:', err);
            setErrorMessage('An error occurred. Please try again.');
        }
    };

    const handleCloseConfirmation = () => {
        setShowConfirmation(false);
        setEmail('');
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                    />

                    {/* Popup */}
                    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ type: 'spring', duration: 0.5 }}
                            className="relative bg-[#fef7ed] border-[4px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] w-full max-w-md p-8"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Close Button */}
                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 p-2 hover:bg-black/5 transition-colors"
                                aria-label="Close"
                            >
                                <X className="w-6 h-6" />
                            </button>

                            {/* Title */}
                            <h2 className="text-3xl md:text-4xl font-black text-center mb-8 font-display text-black">
                                Login with e-mail
                            </h2>

                            {/* Error Message */}
                            {errorMessage && (
                                <div className="mb-4 p-3 bg-red-100 border-2 border-red-500 text-red-700 text-sm font-bold rounded">
                                    {errorMessage}
                                </div>
                            )}

                            {/* Google Login */}
                            <button
                                onClick={handleGoogleLogin}
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
                            <div className="flex items-center gap-4 my-8">
                                <div className="flex-1 h-[2px] bg-gray-300" />
                                <span className="text-gray-500 font-bold">or</span>
                                <div className="flex-1 h-[2px] bg-gray-300" />
                            </div>

                            {/* Email Form */}
                            <form onSubmit={handleEmailLogin} className="space-y-6">
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Enter your e-mail here"
                                    className="w-full px-6 py-4 border-[3px] border-black bg-white text-lg placeholder:text-gray-400 focus:outline-none focus:ring-4 focus:ring-[#facc15]/50"
                                    required
                                    disabled={isSubmitting}
                                />

                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full px-6 py-4 bg-[#facc15] text-black font-bold text-lg border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? 'Sending...' : 'Continue with Email'}
                                </button>
                            </form>

                            {/* Legal Notice */}
                            <p className="text-xs text-gray-600 text-center mt-6 leading-relaxed">
                                By continuing, you agree to our{' '}
                                <a href="#" className="underline hover:text-black">Terms of Service</a>
                                {' '}and{' '}
                                <a href="#" className="underline hover:text-black">Privacy Policy</a>.
                            </p>
                        </motion.div>
                    </div>
                </>
            )}

            {/* Email Confirmation Popup */}
            {showConfirmation && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleCloseConfirmation}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                    />

                    {/* Confirmation Popup */}
                    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ type: 'spring', duration: 0.5 }}
                            className="relative bg-[#fef7ed] border-[4px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] w-full max-w-md p-8"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Close Button */}
                            <button
                                onClick={handleCloseConfirmation}
                                className="absolute top-4 right-4 p-2 hover:bg-black/5 transition-colors"
                                aria-label="Close"
                            >
                                <X className="w-6 h-6" />
                            </button>

                            {/* Success Icon */}
                            <div className="flex justify-center mb-6">
                                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center border-[3px] border-black">
                                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                            </div>

                            {/* Message */}
                            <h2 className="text-2xl md:text-3xl font-black text-center mb-4 font-display text-black">
                                CHECK YOUR EMAIL
                            </h2>
                            <p className="text-center text-gray-700 mb-6">
                                A confirmation email has been sent to <strong>{email}</strong>. Please check your inbox and click the link to continue.
                            </p>

                            {/* Close Button */}
                            <button
                                onClick={handleCloseConfirmation}
                                className="w-full px-6 py-4 bg-[#facc15] text-black font-bold text-lg border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all"
                            >
                                Got it!
                            </button>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}
