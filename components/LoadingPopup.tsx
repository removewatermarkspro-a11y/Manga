'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

interface LoadingPopupProps {
    isOpen: boolean;
    selectedStyle: string;
    onComplete?: () => void;
    autoClose?: boolean;
}

const funMessages = [
    "Writing your epic storyline with AI... ✍️",
    "Our AI scriptwriter is crafting each scene... 📖",
    "Building the narrative arc for your 10 panels... 🎬",
    "Adding dramatic twists and turns... 🌪️",
    "Sketching the first panels... ✏️",
    "Drawing your characters in action... 🎨",
    "Adding dynamic poses and expressions... 💪",
    "Rendering detailed backgrounds... 🏙️",
    "Applying ink lines and shading... 🖊️",
    "Polishing the art style... ✨",
    "Adding final touches to each scene... 🎭",
    "Almost there! Just a few more panels... 🔥",
    "Your masterpiece is nearly complete... 💎",
];

export default function LoadingPopup({ isOpen, selectedStyle, onComplete, autoClose = true }: LoadingPopupProps) {
    const [progress, setProgress] = useState(0);
    const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
    const [elapsedSeconds, setElapsedSeconds] = useState(0);

    useEffect(() => {
        if (isOpen) {
            setProgress(0);
            setCurrentMessageIndex(0);
            setElapsedSeconds(0);

            const startTime = Date.now();

            if (autoClose) {
                // Fake loading: 7 seconds for the landing page redirect
                const duration = 7000;
                const progressInterval = setInterval(() => {
                    const elapsed = Date.now() - startTime;
                    const newProgress = Math.min((elapsed / duration) * 100, 100);
                    setProgress(newProgress);
                    if (newProgress >= 100) {
                        clearInterval(progressInterval);
                    }
                }, 50);

                const timer = setTimeout(() => {
                    setProgress(100);
                    clearInterval(progressInterval);
                    if (onComplete) onComplete();
                }, duration);

                return () => {
                    clearInterval(progressInterval);
                    clearTimeout(timer);
                };
            } else {
                // Real generation loading: ~2-4 minutes
                // Progress slowly climbs to 95% over 3 minutes, then stays there
                const expectedDuration = 180000; // 3 minutes in ms

                const progressInterval = setInterval(() => {
                    const elapsed = Date.now() - startTime;
                    // Ease-out curve that approaches 95% over expectedDuration
                    const rawProgress = (elapsed / expectedDuration) * 95;
                    const easedProgress = Math.min(rawProgress, 95);
                    setProgress(easedProgress);
                    setElapsedSeconds(Math.floor(elapsed / 1000));
                }, 200);

                // Rotate fun messages every 12 seconds
                const messageInterval = setInterval(() => {
                    setCurrentMessageIndex(prev => (prev + 1) % funMessages.length);
                }, 12000);

                return () => {
                    clearInterval(progressInterval);
                    clearInterval(messageInterval);
                };
            }
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

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
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
                        className="fixed inset-0 bg-black/70 backdrop-blur-md z-50"
                    />

                    {/* Popup */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    >
                        <div className="bg-white border-[4px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-2xl max-w-md w-full p-8">
                            {/* Loading Animation */}
                            <div className="flex flex-col items-center gap-6">
                                {/* Animated Book/Pen Icon */}
                                <div className="relative">
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                        className="w-20 h-20 border-[6px] border-gray-200 border-t-[#6366f1] border-r-[#8b5cf6] rounded-full"
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center text-3xl">
                                        {autoClose ? '⚡' : '🎨'}
                                    </div>
                                </div>

                                {/* Message */}
                                <div className="text-center space-y-2">
                                    <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] font-display">
                                        Creating Magic ✨
                                    </h2>
                                    <p className="text-lg font-bold text-black">
                                        {getStyleMessage()}
                                    </p>
                                </div>

                                {/* Time estimate - only for real generation */}
                                {!autoClose && (
                                    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-xl px-4 py-3 w-full text-center">
                                        <p className="text-sm font-bold text-indigo-800">
                                            ⏱️ Estimated time: <span className="text-indigo-600">2 to 4 minutes</span>
                                        </p>
                                        <p className="text-xs font-semibold text-indigo-500 mt-1">
                                            Elapsed: {formatTime(elapsedSeconds)}
                                        </p>
                                    </div>
                                )}

                                {/* Progress Bar */}
                                <div className="w-full">
                                    <div className="w-full h-4 bg-gray-200 border-[2px] border-black rounded-full overflow-hidden">
                                        <motion.div
                                            style={{ width: `${progress}%` }}
                                            className="h-full bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] rounded-full"
                                            transition={{ duration: 0.3 }}
                                        />
                                    </div>
                                    <p className="text-center text-sm font-bold text-gray-600 mt-2">
                                        {Math.round(progress)}%
                                    </p>
                                </div>

                                {/* Dynamic fun message */}
                                <motion.p
                                    key={currentMessageIndex}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="text-sm text-gray-500 text-center italic font-medium min-h-[20px]"
                                >
                                    {!autoClose ? funMessages[currentMessageIndex] : 'Hang tight! Our AI is bringing your characters to life...'}
                                </motion.p>

                                {/* Warning not to close */}
                                {!autoClose && (
                                    <p className="text-xs text-red-400 font-bold text-center">
                                        ⚠️ Please do not close or refresh this page
                                    </p>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
