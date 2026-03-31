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
    const [currentPage, setCurrentPage] = useState(0); // 0 = cover, 1-10 = panels
    const [isBookOpen, setIsBookOpen] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [direction, setDirection] = useState(0); // -1 = prev, 1 = next

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

        // Trigger book opening animation after a short delay
        setTimeout(() => setIsBookOpen(true), 500);
    }, []);

    const handleLogout = () => {
        setIsLoggedIn(false);
        localStorage.removeItem('isLoggedIn');
        window.location.href = '/';
    };

    const totalPages = panelImages.length + 1; // +1 for cover

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

            // Create A4 portrait PDF
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4',
            });

            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();

            for (let i = 0; i < panelImages.length; i++) {
                if (i > 0) pdf.addPage();

                // Fetch image as blob and convert to base64
                try {
                    const response = await fetch(panelImages[i]);
                    const blob = await response.blob();
                    const base64 = await new Promise<string>((resolve) => {
                        const reader = new FileReader();
                        reader.onloadend = () => resolve(reader.result as string);
                        reader.readAsDataURL(blob);
                    });

                    // Calculate dimensions to fit the page with margins
                    const margin = 5;
                    const maxWidth = pageWidth - (margin * 2);
                    const maxHeight = pageHeight - (margin * 2);

                    // Assume 3:4 aspect ratio
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

                    // Add page number
                    pdf.setFontSize(10);
                    pdf.setTextColor(150);
                    pdf.text(`${i + 1} / ${panelImages.length}`, pageWidth / 2, pageHeight - 3, { align: 'center' });
                } catch (imgError) {
                    console.error(`Failed to add image ${i + 1} to PDF:`, imgError);
                    pdf.setFontSize(16);
                    pdf.text(`Panel ${i + 1} - Image could not be loaded`, pageWidth / 2, pageHeight / 2, { align: 'center' });
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

    // Page flip animation variants
    const pageVariants = {
        enter: (direction: number) => ({
            rotateY: direction > 0 ? 90 : -90,
            opacity: 0,
            scale: 0.95,
        }),
        center: {
            rotateY: 0,
            opacity: 1,
            scale: 1,
        },
        exit: (direction: number) => ({
            rotateY: direction < 0 ? 90 : -90,
            opacity: 0,
            scale: 0.95,
        }),
    };

    return (
        <div
            className="min-h-screen relative overflow-hidden flex flex-col"
            style={{
                background: `
                  radial-gradient(circle, rgba(0, 0, 0, 0.11) 1px, transparent 1px),
                  linear-gradient(to bottom, #1a1a2e 0%, #16213e 50%, #0f3460 100%)
                `,
                backgroundSize: '8px 8px, 100% 100%',
            }}
        >
            <Header
                isLoggedIn={isLoggedIn}
                onAuthClick={() => setIsAuthPopupOpen(true)}
                onLogout={handleLogout}
                availableCredits={availableCredits}
            />

            <main className="flex-1 flex flex-col items-center justify-center px-4 py-4 md:py-6 relative">
                {/* Title */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-4 md:mb-6"
                >
                    <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 mb-3">
                        <BookOpen className="w-4 h-4 text-[#facc15]" />
                        <span className="text-white/90 text-sm font-bold">Your Comic Book</span>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-black text-white font-display uppercase tracking-wider">
                        Your Creation is <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#facc15] to-[#f59e0b]">Ready!</span>
                    </h1>
                </motion.div>

                {/* Book Container */}
                <motion.div
                    initial={{ scale: 0.8, rotateX: 45, opacity: 0 }}
                    animate={isBookOpen ? { scale: 1, rotateX: 0, opacity: 1 } : {}}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="relative w-full max-w-lg mx-auto"
                    style={{ perspective: '1200px' }}
                >
                    {/* Book Shadow */}
                    <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-[90%] h-8 bg-black/30 rounded-[50%] blur-xl" />

                    {/* Book Frame */}
                    <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-[3px] border-gray-600 rounded-xl shadow-2xl overflow-hidden"
                        style={{
                            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.1)',
                        }}
                    >
                        {/* Book Spine Effect */}
                        <div className="absolute left-0 top-0 bottom-0 w-3 bg-gradient-to-r from-gray-700 via-gray-600 to-transparent z-10" />

                        {/* Page Content with Flip Animation */}
                        <div className="relative aspect-[3/4] overflow-hidden" style={{ perspective: '800px' }}>
                            <AnimatePresence mode="wait" custom={direction}>
                                <motion.div
                                    key={currentPage}
                                    custom={direction}
                                    variants={pageVariants}
                                    initial="enter"
                                    animate="center"
                                    exit="exit"
                                    transition={{
                                        rotateY: { duration: 0.4, ease: "easeInOut" },
                                        opacity: { duration: 0.3 },
                                        scale: { duration: 0.3 },
                                    }}
                                    className="absolute inset-0"
                                    style={{ transformStyle: 'preserve-3d', backfaceVisibility: 'hidden' }}
                                >
                                    {currentPage === 0 ? (
                                        /* Cover Page */
                                        <div className="w-full h-full bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-950 flex flex-col items-center justify-center p-8 relative overflow-hidden">
                                            {/* Decorative elements */}
                                            <div className="absolute inset-0 opacity-10">
                                                <div className="absolute top-0 left-0 w-full h-full" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(255,255,255,0.03) 35px, rgba(255,255,255,0.03) 70px)' }} />
                                            </div>
                                            <div className="absolute top-4 left-4 right-4 bottom-4 border-2 border-white/10 rounded-lg" />

                                            <motion.div
                                                initial={{ scale: 0.8, opacity: 0 }}
                                                animate={{ scale: 1, opacity: 1 }}
                                                transition={{ delay: 0.3, duration: 0.5 }}
                                                className="text-center z-10"
                                            >
                                                <div className="text-6xl mb-4">📖</div>
                                                <h2 className="text-3xl md:text-4xl font-black text-white mb-3 font-display uppercase tracking-wider">
                                                    My Comic
                                                </h2>
                                                <div className="w-16 h-1 bg-gradient-to-r from-[#facc15] to-[#f59e0b] mx-auto mb-3 rounded-full" />
                                                <p className="text-white/60 text-sm font-bold">
                                                    AI Generated · {panelImages.length} Pages
                                                </p>
                                                <motion.p
                                                    animate={{ opacity: [0.5, 1, 0.5] }}
                                                    transition={{ duration: 2, repeat: Infinity }}
                                                    className="text-white/40 text-xs mt-6 font-semibold"
                                                >
                                                    Tap the arrow to start reading →
                                                </motion.p>
                                            </motion.div>
                                        </div>
                                    ) : (
                                        /* Comic Panel Page */
                                        <div className="w-full h-full bg-white relative">
                                            {panelImages[currentPage - 1] ? (
                                                <img
                                                    src={panelImages[currentPage - 1]}
                                                    alt={`Page ${currentPage}`}
                                                    className="w-full h-full object-contain bg-gray-50"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400 font-bold">
                                                    Image not available
                                                </div>
                                            )}
                                            {/* Page number */}
                                            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/70 text-white text-xs font-bold px-3 py-1 rounded-full backdrop-blur-sm">
                                                {currentPage} / {panelImages.length}
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    </div>
                </motion.div>

                {/* Navigation Controls */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="flex items-center gap-4 mt-5"
                >
                    <button
                        onClick={prevPage}
                        disabled={currentPage === 0}
                        className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/20 transition-all active:scale-90"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>

                    {/* Page Dots */}
                    <div className="flex items-center gap-1.5">
                        {Array.from({ length: totalPages }).map((_, i) => (
                            <button
                                key={i}
                                onClick={() => goToPage(i)}
                                className={`transition-all duration-300 rounded-full ${
                                    i === currentPage
                                        ? 'w-6 h-2.5 bg-[#facc15]'
                                        : 'w-2.5 h-2.5 bg-white/30 hover:bg-white/50'
                                }`}
                            />
                        ))}
                    </div>

                    <button
                        onClick={nextPage}
                        disabled={currentPage >= totalPages - 1}
                        className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/20 transition-all active:scale-90"
                    >
                        <ChevronRight className="w-6 h-6" />
                    </button>
                </motion.div>

                {/* Action Buttons */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1 }}
                    className="flex items-center gap-3 mt-5"
                >
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="bg-white/10 backdrop-blur-sm border border-white/20 text-white px-5 py-3 rounded-xl font-black text-sm flex items-center gap-2 hover:bg-white/20 transition-all"
                    >
                        <Share2 className="w-4 h-4" />
                        Share
                    </motion.button>

                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleDownload}
                        disabled={isDownloading || panelImages.length === 0}
                        className="bg-gradient-to-r from-[#facc15] to-[#f59e0b] text-black px-6 py-3 rounded-xl font-black text-sm flex items-center gap-2 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.3)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Download className="w-4 h-4" />
                        {isDownloading ? 'Generating PDF...' : 'Download PDF'}
                    </motion.button>
                </motion.div>
            </main>
        </div>
    );
}
