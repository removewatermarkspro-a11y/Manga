'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

interface LoadingPopupProps {
    isOpen: boolean;
    selectedStyle: string;
    onComplete?: () => void;
    autoClose?: boolean;
}

export default function LoadingPopup({ isOpen, selectedStyle, onComplete, autoClose = true }: LoadingPopupProps) {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        if (isOpen) {
            setProgress(0);
            const startTime = Date.now();
            const duration = 7000; // 7 seconds

            // Update progress based on elapsed time
            const progressInterval = setInterval(() => {
                const elapsed = Date.now() - startTime;
                let newProgress = (elapsed / duration) * 100;
                
                // If autoClose is false, cap progress at 99% until manually closed
                if (!autoClose) {
                    newProgress = Math.min(newProgress, 99);
                } else {
                    newProgress = Math.min(newProgress, 100);
                }
                
                setProgress(newProgress);

                if (newProgress >= 100 && autoClose) {
                    clearInterval(progressInterval);
                }
            }, 50); // Update every 50ms for smoother animation

            // Auto close after 7 seconds if enabled
            let timer: NodeJS.Timeout;
            if (autoClose) {
                timer = setTimeout(() => {
                    setProgress(100);
                    clearInterval(progressInterval);
                    if (onComplete) onComplete();
                }, duration);
            }

            return () => {
                clearInterval(progressInterval);
                if (timer) clearTimeout(timer);
            };
        }
    }, [isOpen]);

    if (!isOpen) return null;

    // Get style-specific message
    const getStyleMessage = () => {
        switch (selectedStyle) {
            case 'manga':
                return 'Your Manga is being created...';
            case 'comic':
                return 'Your Comic Book is being created...';
            case 'manhwa':
                return 'Your Manhwa is being created...';
            default:
                return 'Your story is being created...';
        }
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
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                    />

                    {/* Popup */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    >
                        <div className="bg-white border-[4px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-md w-full p-8">
                            {/* Loading Animation */}
                            <div className="flex flex-col items-center gap-6">
                                {/* Spinner */}
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                    className="w-20 h-20 border-[6px] border-black border-t-[#6366f1] rounded-full"
                                />

                                {/* Message */}
                                <div className="text-center space-y-2">
                                    <h2 className="text-2xl font-black text-[#ff0080] font-display">
                                        Creating Magic ✨
                                    </h2>
                                    <p className="text-lg font-bold text-black">
                                        {getStyleMessage()}
                                    </p>
                                </div>

                                {/* Progress Bar */}
                                <div className="w-full">
                                    <div className="w-full h-4 bg-gray-200 border-[2px] border-black overflow-hidden">
                                        <div
                                            style={{ width: `${progress}%` }}
                                            className="h-full bg-[#6366f1] transition-all duration-100"
                                        />
                                    </div>
                                    <p className="text-center text-sm font-bold text-gray-600 mt-2">
                                        {Math.round(progress)}%
                                    </p>
                                </div>

                                {/* Fun message */}
                                <p className="text-sm text-gray-600 text-center italic">
                                    Hang tight! Our AI is bringing your characters to life...
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
