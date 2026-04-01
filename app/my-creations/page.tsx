'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, BookOpen, X, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import AuthPopup from '../../components/AuthPopup';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';

interface CreationPage {
    id: string;
    page_number: number;
    image_url: string;
}

interface Creation {
    id: string;
    title: string;
    style: string;
    story_text: string;
    status: string;
    characters: any;
    created_at: string;
    creation_pages: CreationPage[];
}

export default function MyCreationsPage() {
    const { isLoggedIn, credits, signOut } = useAuth();
    const [isAuthPopupOpen, setIsAuthPopupOpen] = useState(false);

    const [myCreations, setMyCreations] = useState<Creation[]>([]);
    const [isLoadingCreations, setIsLoadingCreations] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // Reading Modal State
    const [selectedCreation, setSelectedCreation] = useState<Creation | null>(null);
    const [currentPageIndex, setCurrentPageIndex] = useState(0);

    const supabase = createClient();

    // Fetch user creations from Supabase
    useEffect(() => {
        const fetchCreations = async () => {
            setIsLoadingCreations(true);
            try {
                const { data, error } = await supabase
                    .from('creations')
                    .select(`
                        *,
                        creation_pages (
                            id,
                            page_number,
                            image_url
                        )
                    `)
                    .eq('status', 'completed')
                    .order('created_at', { ascending: false });

                if (error) {
                    console.error('Error fetching creations:', error);
                } else {
                    // Sort pages by page_number within each creation
                    const sortedCreations = (data || []).map((creation: any) => ({
                        ...creation,
                        creation_pages: (creation.creation_pages || []).sort(
                            (a: CreationPage, b: CreationPage) => a.page_number - b.page_number
                        ),
                    }));
                    setMyCreations(sortedCreations);
                }
            } catch (err) {
                console.error('Error fetching creations:', err);
            } finally {
                setIsLoadingCreations(false);
            }
        };

        if (isLoggedIn) {
            fetchCreations();
        } else {
            setIsLoadingCreations(false);
        }
    }, [isLoggedIn, supabase]);

    const handleLogout = async () => {
        await signOut();
    };

    // Filter creations based on search query
    const filteredCreations = myCreations.filter(creation =>
        creation.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        creation.style.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const openReadingModal = (creation: Creation) => {
        setSelectedCreation(creation);
        setCurrentPageIndex(0);
        document.body.style.overflow = 'hidden';
    };

    const closeReadingModal = () => {
        setSelectedCreation(null);
        document.body.style.overflow = 'unset';
    };

    const goNextPage = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (selectedCreation && currentPageIndex < selectedCreation.creation_pages.length - 1) {
            setCurrentPageIndex(prev => prev + 1);
        }
    };

    const goPrevPage = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (currentPageIndex > 0) {
            setCurrentPageIndex(prev => prev - 1);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
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
                onAuthClick={() => setIsAuthPopupOpen(true)}
                onLogout={handleLogout}
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

                    {/* Search / Filter */}
                    <div className="flex items-center gap-2">
                        <div className="relative group">
                            <input
                                type="text"
                                placeholder="Search..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full md:w-64 pl-10 pr-4 py-3 bg-white border-[3px] border-black rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-bold text-sm focus:outline-none focus:ring-4 focus:ring-black/5 transition-all"
                            />
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                        </div>
                    </div>
                </div>

                {/* Loading State */}
                {isLoadingCreations ? (
                    <div className="flex flex-col items-center justify-center p-12">
                        <Loader2 className="w-12 h-12 text-[#6366f1] animate-spin mb-4" />
                        <p className="text-lg font-bold text-gray-600">Loading your creations...</p>
                    </div>
                ) : filteredCreations.length === 0 ? (
                    /* Empty State */
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
                    /* Creation Grid */
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        {/* Create New Card */}
                        <motion.a
                            href="/#character"
                            whileHover={{ scale: 1.02, y: -5 }}
                            whileTap={{ scale: 0.98 }}
                            className="group flex flex-col items-center justify-center p-8 min-h-[400px] bg-[#facc15] border-[4px] border-black rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer relative overflow-hidden"
                        >
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
                        {filteredCreations.map((creation, index) => (
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
                                    {creation.creation_pages.length > 0 ? (
                                        <img
                                            src={creation.creation_pages[0].image_url}
                                            alt={creation.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                            <BookOpen className="w-16 h-16 text-gray-400" />
                                        </div>
                                    )}
                                    {/* Top Badges */}
                                    <div className="absolute top-4 left-4 flex gap-2 z-10">
                                        <span className="bg-white px-3 py-1 font-black text-xs uppercase border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                            {creation.style}
                                        </span>
                                    </div>

                                    {/* Date Badge */}
                                    <div className="absolute top-4 right-4 z-10">
                                        <span className="bg-black/70 text-white px-2 py-1 font-bold text-xs rounded">
                                            {formatDate(creation.created_at)}
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
                            PAGE {currentPageIndex + 1} / {selectedCreation.creation_pages.length}
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
                                        <img
                                            src={selectedCreation.creation_pages[currentPageIndex]?.image_url}
                                            alt={`Page ${currentPageIndex + 1}`}
                                            className="w-full h-full object-contain"
                                        />
                                    </motion.div>
                                </AnimatePresence>
                            </div>

                            {/* Navigation Arrow Right */}
                            <button
                                onClick={goNextPage}
                                disabled={currentPageIndex === selectedCreation.creation_pages.length - 1}
                                className={`absolute right-0 z-20 md:-right-16 p-4 rounded-full border-[3px] border-black text-white hover:scale-110 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${
                                    currentPageIndex === selectedCreation.creation_pages.length - 1 
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

            <AuthPopup
                isOpen={isAuthPopupOpen}
                onClose={() => setIsAuthPopupOpen(false)}
            />

            <Footer />
        </div>
    );
}
