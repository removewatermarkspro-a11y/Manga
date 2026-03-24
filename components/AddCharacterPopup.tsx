'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

interface AddCharacterPopupProps {
    isOpen: boolean;
    onClose: () => void;
    onCharacterSelect: (character: { id: string, name: string, image: string }) => void;
    onCreateCustom: () => void;
}

export default function AddCharacterPopup({ isOpen, onClose, onCharacterSelect, onCreateCustom }: AddCharacterPopupProps) {
    const [selectedCharacter, setSelectedCharacter] = useState<string>('');

    const characters = [
        { id: '1', name: 'Hubert', age: 'Adult', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop' },
        { id: '2', name: 'Genevieve', age: 'Adult', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop' },
        { id: '3', name: 'Darren', age: 'Adult', image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop' },
    ];

    const toggleCharacter = (id: string) => {
        setSelectedCharacter(selectedCharacter === id ? '' : id);
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
                        onClick={onClose}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                    />

                    {/* Popup */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    >
                        <div className="bg-white border-[4px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-3xl w-full">
                            {/* Header */}
                            <div className="bg-white border-b-[3px] border-black p-6 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={onClose}
                                        className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 transition-colors"
                                    >
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                            <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </button>
                                    <h2 className="text-2xl font-black text-[#ff0080] font-display">Add a Character</h2>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 transition-colors"
                                >
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                        <path d="M18 6L6 18M6 6L18 18" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </button>
                            </div>

                            {/* Content */}
                            <div className="p-6">
                                {/* Create New Section - EMPHASIZED */}
                                <div className="mb-8">
                                    <div
                                        onClick={onCreateCustom}
                                        className="border-[4px] border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-8 cursor-pointer hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all bg-gradient-to-br from-[#facc15] to-[#f59e0b]"
                                    >
                                        <div className="flex items-center gap-8">
                                            {/* Icon */}
                                            <div className="relative flex-shrink-0">
                                                <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center border-[3px] border-black">
                                                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                                                        <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                                        <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                                    </svg>
                                                </div>
                                                <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-green-500 flex items-center justify-center border-[3px] border-black">
                                                    <span className="text-white text-2xl font-bold leading-none -mt-0.5">+</span>
                                                </div>
                                            </div>

                                            {/* Text Content */}
                                            <div className="flex-1">
                                                <h3 className="text-2xl font-black mb-2 font-display">Create Your Character</h3>
                                                <p className="text-base leading-relaxed">
                                                    Upload your photo and become the hero of your own comic book story! Our AI will transform you into an amazing character.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
