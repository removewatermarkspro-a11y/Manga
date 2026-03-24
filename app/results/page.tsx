'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Pencil, Download, Share2, X, Sparkles } from 'lucide-react';
import Header from '../../components/Header'; // Assuming components are two levels up from app/results/page.tsx

export default function ResultsPage() {
    const [isLoggedIn, setIsLoggedIn] = useState(true); // Assuming they just paid and are logged in
    const [isAuthPopupOpen, setIsAuthPopupOpen] = useState(false);
    const [availableCredits, setAvailableCredits] = useState(0); // Will be populated from API

    // Modal state
    const [isModifyModalOpen, setIsModifyModalOpen] = useState(false);
    const [selectedPanelIndex, setSelectedPanelIndex] = useState<number | null>(null);
    const [modifyPrompt, setModifyPrompt] = useState("");

    // Placeholder images to simulate 10 panels
    const panelImages = [
        '/images/form-example-1.jpg',
        '/images/form-example-2.jpg',
        '/images/form-example-3.jpg',
        '/images/form-example-4.jpg',
        '/images/form-example-1.jpg',
        '/images/form-example-2.jpg',
        '/images/form-example-3.jpg',
        '/images/form-example-4.jpg',
        '/images/form-example-1.jpg',
        '/images/form-example-2.jpg',
    ];

    const handleLogout = () => {
        setIsLoggedIn(false);
        localStorage.removeItem('isLoggedIn');
        window.location.href = '/';
    };

    const handleModifyClick = (index: number) => {
        setSelectedPanelIndex(index);
        setModifyPrompt(""); // Reset prompt
        setIsModifyModalOpen(true);
    };

    const handleConfirmModify = () => {
        if (!modifyPrompt.trim()) return;

        // TODO: Connect to API to regenerate this panel
        alert(`Generating new image for panel ${selectedPanelIndex !== null ? selectedPanelIndex + 1 : ''} with prompt: "${modifyPrompt}"`);
        setIsModifyModalOpen(false);
    };

    return (
        <div
            className="min-h-screen relative overflow-hidden flex flex-col"
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
            <Header
                isLoggedIn={isLoggedIn}
                onAuthClick={() => setIsAuthPopupOpen(true)}
                onLogout={handleLogout}
                availableCredits={availableCredits}
            />
            <main className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full flex flex-col h-[calc(100vh-100px)]">
                {/* Stylized Title Section */}
                <div className="text-center mb-10 w-full flex flex-col items-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <span className="inline-block py-1.5 px-3 bg-white border-[2px] border-black rounded-full text-black font-black text-xs uppercase tracking-widest shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] mb-4 transform -rotate-2">
                            Download Your Creation
                        </span>
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-black leading-tight tracking-wider font-display uppercase drop-shadow-sm mb-4">
                            Your Creation is <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#6366f1] to-[#8b5cf6]">READY!</span>
                        </h1>
                        <p className="text-lg md:text-xl font-bold text-gray-700">
                            Scroll down to read your generated story. Don't like a panel? Modify it!
                        </p>
                    </motion.div>
                </div>

                {/* Big Stylish Box containing the images */}
                <div className="relative bg-white border-[4px] border-black rounded-3xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex-1 flex flex-col overflow-hidden max-w-5xl mx-auto w-full">

                    {/* Comic Rays Background inside the box */}
                    <div className="absolute inset-0 pointer-events-none opacity-[0.05]">
                        <Image
                            src="/images/comic-rays-bg.jpg"
                            alt=""
                            fill
                            className="object-cover"
                        />
                    </div>

                    {/* Scrollable Images Container */}
                    <div className="relative z-10 flex-1 overflow-y-auto p-4 md:p-8 flex flex-col gap-6 md:gap-10 scroll-smooth">
                        {panelImages.map((imgSrc, index) => (
                            <div key={index} className="relative group w-full bg-gray-100 border-[3px] border-black rounded-xl overflow-hidden flex flex-col cursor-pointer transition-transform hover:-translate-y-1">

                                {/* Image Number Badge */}
                                <div className="absolute top-4 left-4 z-20 bg-black text-white font-black text-xl px-4 py-1 rounded-full border-[3px] border-white shadow-md">
                                    {index + 1}
                                </div>

                                {/* Modify Button - Appears on Hover on Desktop */}
                                <div className="absolute top-4 right-4 z-20 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleModifyClick(index);
                                        }}
                                        className="bg-[#facc15] text-black border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] px-4 py-2 font-black text-sm uppercase flex items-center gap-2 rounded-xl transition-all hover:bg-[#ffe033] hover:scale-105 active:scale-95"
                                    >
                                        <Pencil className="w-4 h-4" />
                                        Modify panel
                                    </button>
                                </div>

                                {/* The Comic Image */}
                                <div className="w-full aspect-[2/3] md:aspect-auto">
                                    <Image
                                        src={imgSrc}
                                        alt={`Comic Panel ${index + 1}`}
                                        width={800}
                                        height={1200}
                                        className="w-full h-full object-cover md:object-contain"
                                        priority={index < 2} // load first 2 panels faster
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Bottom Actions Bar */}
                    <div className="relative z-20 bg-white border-t-[4px] border-black p-4 flex justify-between items-center shrink-0">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="bg-white border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] px-4 py-3 md:px-6 rounded-xl font-black text-sm md:text-base flex items-center gap-2 hover:bg-gray-100 transition-colors"
                        >
                            <Share2 className="w-5 h-5" />
                            <span className="hidden md:inline">Share</span>
                        </motion.button>

                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => alert("Downloading the full comic...")}
                            className="bg-[#6366f1] text-white border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] px-6 py-3 md:px-10 rounded-xl font-black text-sm md:text-base flex items-center gap-2 hover:bg-[#5558e6] transition-colors"
                        >
                            <Download className="w-5 h-5" />
                            Download Project
                        </motion.button>
                    </div>
                </div>
            </main>

            {/* Modify Panel Modal */}
            <AnimatePresence>
                {isModifyModalOpen && selectedPanelIndex !== null && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsModifyModalOpen(false)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
                        >
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                onClick={(e) => e.stopPropagation()}
                                className="relative w-full max-w-lg bg-white border-[4px] border-black rounded-3xl p-6 md:p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] z-[101]"
                            >
                                <button
                                    onClick={() => setIsModifyModalOpen(false)}
                                    className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
                                >
                                    <X className="w-6 h-6" />
                                </button>

                                <div className="mb-6">
                                    <h3 className="text-3xl font-black font-display mb-2">Modify Panel {selectedPanelIndex + 1}</h3>
                                    <p className="text-gray-600 font-bold">Describe how you want to change this specific scene.</p>
                                </div>

                                {/* Panel Preview (Miniature) */}
                                <div className="flex gap-4 mb-6">
                                    <div className="w-24 h-36 shrink-0 border-[3px] border-black rounded-lg overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                        <Image
                                            src={panelImages[selectedPanelIndex]}
                                            alt={`Panel ${selectedPanelIndex + 1} preview`}
                                            width={150}
                                            height={225}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <textarea
                                            value={modifyPrompt}
                                            onChange={(e) => setModifyPrompt(e.target.value)}
                                            placeholder="E.g., Make the character's hair blue, add more rain in the background..."
                                            className="w-full h-full p-4 border-[3px] border-black rounded-xl resize-none font-bold text-sm focus:outline-none focus:ring-4 focus:ring-black/5"
                                        />
                                    </div>
                                </div>

                                {/* Action Area */}
                                <div className="flex flex-col gap-4">
                                    <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-4 flex items-start gap-3">
                                        <div className="text-orange-500 mt-1">
                                            <Sparkles className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm text-orange-900">Cost: 10 Credits</p>
                                            <p className="text-xs font-bold text-orange-700/80 mt-1">
                                                Generating a new image for this panel will consume 10 credits from your balance.
                                            </p>
                                        </div>
                                    </div>
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={handleConfirmModify}
                                        disabled={!modifyPrompt.trim()}
                                        className="w-full py-4 bg-[#facc15] text-black font-black text-lg border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-xl uppercase flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#ffe033] transition-colors"
                                    >
                                        <Pencil className="w-5 h-5" />
                                        Generate New Panel
                                    </motion.button>
                                </div>
                            </motion.div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
