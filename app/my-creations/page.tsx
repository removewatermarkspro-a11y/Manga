'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, BookOpen, X, ChevronLeft, ChevronRight } from 'lucide-react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';

// TODO: Replace with API call to fetch user's creations
// NOTE: When API is connected, if this array is empty the "No Creations Yet" empty state will show automatically.
const myCreations = [
    {
        id: '1',
        title: 'THE TOWN HERO',
        style: 'Comic',
        issue: '#1',
        pages: ['/images/feature-4-main.jpg', '/images/example-scroll-3.jpg', '/images/example-scroll-4.jpg', '/images/example-scroll-5.jpg'],
        date: 'Oct 24, 2023',
        status: 'completed'
    },
    {
        id: '2',
        title: 'THE UNCHARTED',
        style: 'Manga',
        issue: '#1',
        pages: ['/images/feature-1-main.jpg', '/images/feature-2-main.jpg', '/images/feature-3-main.jpg'],
        date: 'Nov 02, 2023',
        status: 'completed'
    },
    {
        id: '3',
        title: 'CYBER CITY',
        style: 'Manhwa',
        issue: '#1',
        pages: ['/images/feature-5-main.jpg', '/images/feature-4-main.jpg', '/images/feature-6-main.jpg'],
        date: 'Dec 15, 2023',
        status: 'completed'
    },
    {
        id: '4',
        title: 'MAGIC KINGDOM',
        style: 'Manga',
        issue: '#2',
        pages: ['/images/feature-2-main.jpg', '/images/example-scroll-4.jpg', '/images/form-example-2.jpg'],
        date: 'Jan 10, 2024',
        status: 'completed'
    }
];

export default function MyCreationsPage() {
    const [isLoggedIn, setIsLoggedIn] = useState(true);
    const [availableCredits, setAvailableCredits] = useState(0); // TODO: Fetch from API

    // Reading Modal State
    const [selectedCreation, setSelectedCreation] = useState<typeof myCreations[0] | null>(null);
    const [currentPageIndex, setCurrentPageIndex] = useState(0);

    const handleLogout = () => {
        setIsLoggedIn(false);
        localStorage.removeItem('isLoggedIn');
        window.location.href = '/';
    };

    const openReadingModal = (creation: typeof myCreations[0]) => {
        setSelectedCreation(creation);
        setCurrentPageIndex(0);
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
    };

    const closeReadingModal = () => {
        setSelectedCreation(null);
        document.body.style.overflow = 'unset';
    };

    const goNextPage = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (selectedCreation && currentPageIndex < selectedCreation.pages.length - 1) {
            setCurrentPageIndex(prev => prev + 1);
        }
    };

    const goPrevPage = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (currentPageIndex > 0) {
            setCurrentPageIndex(prev => prev - 1);
        }
    };

    return (
        <div
            className="min-h-screen relative flex flex-col"
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
                onAuthClick={() => { }}
                onLogout={handleLogout}
                availableCredits={availableCredits}
            />

            <main className="flex-1 max-w-7xl mx-auto px-6 py-12 w-full">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                    <div>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                        >
                            <span className="inline-block py-1.5 px-3 bg-white border-[2px] border-black rounded-full text-black font-black text-xs uppercase tracking-widest shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] mb-4 transform -rotate-2">
                                Your Library
                            </span>
                            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black font-display text-black uppercase drop-shadow-sm mb-2">
                                MY <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#6366f1] to-[#8b5cf6]">CREATIONS</span>
                            </h1>
                            <p className="text-lg font-bold text-gray-800 border-l-4 border-[#facc15] pl-4">
                                Browse all your creations here — click <strong>Create New Story</strong> to start a brand new one!
                            </p>
                        </motion.div>
                    </div>

                    {/* Search / Filter (Decorative for now) */}
                    <div className="flex items-center gap-2">
                        <div className="relative group">
                            <input
                                type="text"
                                placeholder="Search..."
                                className="w-full md:w-64 pl-10 pr-4 py-3 bg-white border-[3px] border-black rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-bold text-sm focus:outline-none focus:ring-4 focus:ring-black/5 transition-all"
                            />
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                        </div>
                    </div>
                </div>

                {/* Library Grid or Empty State */}
                {myCreations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 bg-white border-[4px] border-black rounded-3xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-2xl mx-auto text-center mt-12">
                        <div className="w-24 h-24 bg-gray-100 border-[4px] border-black rounded-full flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-6">
                            <BookOpen className="w-10 h-10 text-gray-400" />
                        </div>
                        <h2 className="text-3xl font-black font-display mb-4 uppercase">
                            No Creations Yet
                        </h2>
                        <p className="text-lg text-gray-600 font-bold mb-8">
                            Looks like your library is empty. Start your first comic adventure now!
                        </p>
                        <motion.a
                            href="/#character"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="bg-[#facc15] text-black border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] px-8 py-4 rounded-xl font-black text-lg uppercase flex items-center gap-2 hover:bg-[#ffe033] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all"
                        >
                            <Plus className="w-6 h-6" />
                            Create First Story
                        </motion.a>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        {/* Create New Card */}
                        <motion.a
                            href="/#character"
                            whileHover={{ scale: 1.02, y: -5 }}
                            whileTap={{ scale: 0.98 }}
                            className="group flex flex-col items-center justify-center p-8 min-h-[400px] bg-[#facc15] border-[4px] border-black rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer relative overflow-hidden"
                        >
                            {/* Background comic dot pattern overlay */}
                            <div className="absolute inset-0 opacity-10" style={{
                                backgroundImage: 'radial-gradient(black 15%, transparent 16%)',
                                backgroundSize: '12px 12px',
                            }}></div>
                            
                            <div className="relative z-10 w-24 h-24 bg-white border-[4px] border-black rounded-full flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] group-hover:scale-110 group-hover:bg-[#6366f1] group-hover:text-white transition-all mb-6">
                                <Plus className="w-12 h-12" />
                            </div>
                            <h3 className="relative z-10 text-2xl font-black font-display text-center uppercase tracking-wide">
                                Create New<br/>Story
                            </h3>
                        </motion.a>

                    {/* Creation Cards */}
                    {myCreations.map((creation, index) => (
                        <motion.div
                            key={creation.id}
                            onClick={() => openReadingModal(creation)}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            whileHover={{ y: -8 }}
                            className="group relative flex flex-col bg-white border-[4px] border-black rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all overflow-hidden cursor-pointer aspect-[2/3]"
                        >
                            {/* Image Container */}
                            <div className="relative w-full h-full overflow-hidden">
                                <Image
                                    src={creation.pages[0]} // Use first page as cover
                                    alt={creation.title}
                                    fill
                                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                                {/* Top Badges (Only style now) */}
                                <div className="absolute top-4 left-4 flex z-10">
                                    <span className="bg-white px-3 py-1 font-black text-xs uppercase border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                        {creation.style}
                                    </span>
                                </div>

                                {/* Dark Gradient Overlay at Bottom for Buttons */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                
                                {/* Bottom Action Area */}
                                <div className="absolute bottom-4 left-4 right-4 z-10 flex flex-col gap-3 translate-y-8 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                                    <div className="w-full py-2 bg-[#facc15] text-black font-black text-sm uppercase border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-2">
                                        <BookOpen className="w-4 h-4" />
                                        Read Now
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
                )}
            </main>

            {/* Immersive Reading Modal */}
            <AnimatePresence>
                {selectedCreation && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={closeReadingModal}
                        className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 md:p-12"
                    >
                        {/* Close Button */}
                        <button 
                            onClick={closeReadingModal}
                            className="absolute top-6 right-6 z-[110] bg-white text-black p-3 rounded-full border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:scale-110 hover:-translate-y-1 hover:bg-[#facc15] transition-all"
                        >
                            <X className="w-6 h-6" />
                        </button>

                        {/* Page Counter */}
                        <div className="absolute top-6 left-6 z-[110] bg-white text-black px-4 py-2 rounded-full border-[3px] border-black font-black text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                            PAGE {currentPageIndex + 1} / {selectedCreation.pages.length}
                        </div>

                        {/* Comic Reader Container */}
                        <div 
                            onClick={(e) => e.stopPropagation()} 
                            className="relative w-full max-w-4xl max-h-full flex items-center justify-center"
                        >
                            {/* Navigation Arrow Left */}
                            <button
                                onClick={goPrevPage}
                                disabled={currentPageIndex === 0}
                                className={`absolute left-0 z-20 md:-left-16 p-4 rounded-full border-[3px] border-black text-white hover:scale-110 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${
                                    currentPageIndex === 0 
                                        ? 'bg-gray-400 cursor-not-allowed opacity-50' 
                                        : 'bg-black hover:bg-gray-800'
                                }`}
                                style={{ transform: 'translateY(-50%)', top: '50%' }}
                            >
                                <ChevronLeft className="w-8 h-8" />
                            </button>

                            {/* The Comic Image Container */}
                            <div className="relative w-full max-w-[90vw] md:max-w-2xl h-[70vh] md:h-[85vh] bg-white border-[6px] border-black rounded-xl shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center p-2 z-10 transition-all duration-300">
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={currentPageIndex}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        transition={{ duration: 0.2 }}
                                        className="relative w-full h-full rounded-lg overflow-hidden"
                                    >
                                        <Image
                                            src={selectedCreation.pages[currentPageIndex]}
                                            alt={`Page ${currentPageIndex + 1}`}
                                            fill
                                            className="object-contain"
                                        />
                                    </motion.div>
                                </AnimatePresence>
                            </div>

                            {/* Navigation Arrow Right */}
                            <button
                                onClick={goNextPage}
                                disabled={currentPageIndex === selectedCreation.pages.length - 1}
                                className={`absolute right-0 z-20 md:-right-16 p-4 rounded-full border-[3px] border-black text-white hover:scale-110 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${
                                    currentPageIndex === selectedCreation.pages.length - 1 
                                        ? 'bg-gray-400 cursor-not-allowed opacity-50' 
                                        : 'bg-black hover:bg-gray-800'
                                }`}
                                style={{ transform: 'translateY(-50%)', top: '50%' }}
                            >
                                <ChevronRight className="w-8 h-8" />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <Footer />
        </div>
    );
}
