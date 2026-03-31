'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Share2, ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';
import Header from '../../components/Header';

export default function ResultsPage() {
    const [isLoggedIn, setIsLoggedIn] = useState(true);
    const [isAuthPopupOpen, setIsAuthPopupOpen] = useState(false);
    const [availableCredits, setAvailableCredits] = useState(0);
    const [panelImages, setPanelImages] = useState<string[]>([]);
    const [currentPage, setCurrentPage] = useState(0);
    const [isBookOpen, setIsBookOpen] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [direction, setDirection] = useState(0);

    useEffect(() => {
        const storedImages = localStorage.getItem('generatedImages');
        if (storedImages) {
            try {
                const parsed = JSON.parse(storedImages);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    setPanelImages(parsed);
                }
            } catch (e) {
                console.error("Failed to parse generatedImages from localStorage", e);
            }
        }
        setTimeout(() => setIsBookOpen(true), 500);
    }, []);

    const handleLogout = () => {
        setIsLoggedIn(false);
        localStorage.removeItem('isLoggedIn');
        window.location.href = '/';
    };

    const totalPages = panelImages.length;

    const goToPage = (newPage: number) => {
        if (newPage < 0 || newPage >= totalPages) return;
        setDirection(newPage > currentPage ? 1 : -1);
        setCurrentPage(newPage);
    };

    const nextPage = () => goToPage(currentPage + 1);
    const prevPage = () => goToPage(currentPage - 1);

    // Download as PDF
    const handleDownload = async () => {
        if (panelImages.length === 0) return;
        setIsDownloading(true);

        try {
            const { jsPDF } = await import('jspdf');
            const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();

            for (let i = 0; i < panelImages.length; i++) {
                if (i > 0) pdf.addPage();
                try {
                    const response = await fetch(panelImages[i]);
                    const blob = await response.blob();
                    const base64 = await new Promise<string>((resolve) => {
                        const reader = new FileReader();
                        reader.onloadend = () => resolve(reader.result as string);
                        reader.readAsDataURL(blob);
                    });

                    const margin = 5;
                    const maxWidth = pageWidth - (margin * 2);
                    const maxHeight = pageHeight - (margin * 2);
                    const imgRatio = 3 / 4;
                    let imgWidth = maxWidth;
                    let imgHeight = imgWidth / imgRatio;
                    if (imgHeight > maxHeight) {
                        imgHeight = maxHeight;
                        imgWidth = imgHeight * imgRatio;
                    }
                    const x = (pageWidth - imgWidth) / 2;
                    const y = (pageHeight - imgHeight) / 2;
                    pdf.addImage(base64, 'JPEG', x, y, imgWidth, imgHeight);
                    pdf.setFontSize(10);
                    pdf.setTextColor(150);
                    const label = i === 0 ? 'Cover' : `Page ${i} / ${panelImages.length - 1}`;
                    pdf.text(label, pageWidth / 2, pageHeight - 3, { align: 'center' });
                } catch (imgError) {
                    console.error(`Failed to add image ${i + 1} to PDF:`, imgError);
                    pdf.setFontSize(16);
                    pdf.text(`Page ${i + 1} - Image could not be loaded`, pageWidth / 2, pageHeight / 2, { align: 'center' });
                }
            }
            pdf.save('my-comic-book.pdf');
        } catch (error) {
            console.error('PDF generation error:', error);
            alert('Failed to generate PDF. Please try again.');
        } finally {
            setIsDownloading(false);
        }
    };

    const pageVariants = {
        enter: (direction: number) => ({
            x: direction > 0 ? 300 : -300,
            opacity: 0,
            scale: 0.9,
        }),
        center: {
            x: 0,
            opacity: 1,
            scale: 1,
        },
        exit: (direction: number) => ({
            x: direction < 0 ? 300 : -300,
            opacity: 0,
            scale: 0.9,
        }),
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

            <main className="flex-1 flex flex-col items-center px-4 py-4 md:py-6 relative">
                {/* Title */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-4 md:mb-6"
                >
                    <span className="inline-block py-1.5 px-3 bg-white border-[2px] border-black rounded-full text-black font-black text-xs uppercase tracking-widest shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] mb-3 transform -rotate-2">
                        <BookOpen className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
                        Your Comic Book
                    </span>
                    <h1 className="text-3xl md:text-5xl font-black leading-tight tracking-wider font-display uppercase drop-shadow-sm">
                        Your Creation is <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#6366f1] to-[#8b5cf6]">Ready!</span>
                    </h1>
                </motion.div>

                {/* Book Container */}
                <motion.div
                    initial={{ scale: 0.7, rotateX: 30, opacity: 0 }}
                    animate={isBookOpen ? { scale: 1, rotateX: 0, opacity: 1 } : {}}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="relative w-full max-w-md mx-auto flex-1 flex flex-col"
                    style={{ perspective: '1200px' }}
                >
                    {/* Book Frame */}
                    <div className="relative bg-white border-[4px] border-black rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden flex-1 flex flex-col">
                        {/* Book Spine */}
                        <div className="absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-r from-gray-300 to-transparent z-10" />

                        {/* Page Content */}
                        <div className="relative flex-1 overflow-hidden" style={{ perspective: '800px' }}>
                            <AnimatePresence mode="wait" custom={direction}>
                                <motion.div
                                    key={currentPage}
                                    custom={direction}
                                    variants={pageVariants}
                                    initial="enter"
                                    animate="center"
                                    exit="exit"
                                    transition={{
                                        x: { duration: 0.35, ease: "easeInOut" },
                                        opacity: { duration: 0.25 },
                                        scale: { duration: 0.25 },
                                    }}
                                    className="absolute inset-0 flex items-center justify-center bg-gray-50"
                                >
                                    {panelImages[currentPage] ? (
                                        <img
                                            src={panelImages[currentPage]}
                                            alt={currentPage === 0 ? 'Cover' : `Page ${currentPage}`}
                                            className="w-full h-full object-contain"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold text-lg">
                                            Loading...
                                        </div>
                                    )}
                                </motion.div>
                            </AnimatePresence>
                        </div>

                        {/* Page indicator bar */}
                        <div className="relative z-20 bg-white border-t-[3px] border-black px-4 py-2.5 flex items-center justify-between shrink-0">
                            <span className="text-xs font-black text-gray-500 uppercase">
                                {currentPage === 0 ? 'Cover' : `Page ${currentPage} / ${totalPages - 1}`}
                            </span>
                            <div className="flex items-center gap-1">
                                {Array.from({ length: totalPages }).map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => goToPage(i)}
                                        className={`transition-all duration-300 rounded-full ${
                                            i === currentPage
                                                ? 'w-5 h-2 bg-[#6366f1]'
                                                : 'w-2 h-2 bg-gray-300 hover:bg-gray-400'
                                        }`}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Navigation + Actions */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="flex items-center gap-3 mt-5 mb-4"
                >
                    {/* Prev Button */}
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={prevPage}
                        disabled={currentPage === 0}
                        className="bg-white border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] w-12 h-12 rounded-xl font-black flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </motion.button>

                    {/* Share Button */}
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="bg-white border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] px-5 py-3 rounded-xl font-black text-sm flex items-center gap-2 hover:bg-gray-100 transition-colors"
                    >
                        <Share2 className="w-4 h-4" />
                        <span className="hidden md:inline">Share</span>
                    </motion.button>

                    {/* Download PDF Button */}
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleDownload}
                        disabled={isDownloading || panelImages.length === 0}
                        className="bg-[#facc15] text-black border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] px-6 py-3 rounded-xl font-black text-sm flex items-center gap-2 hover:bg-[#ffe033] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Download className="w-4 h-4" />
                        {isDownloading ? 'Generating...' : 'Download PDF'}
                    </motion.button>

                    {/* Next Button */}
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={nextPage}
                        disabled={currentPage >= totalPages - 1}
                        className="bg-white border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] w-12 h-12 rounded-xl font-black flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
                    >
                        <ChevronRight className="w-6 h-6" />
                    </motion.button>
                </motion.div>
            </main>
        </div>
    );
}
