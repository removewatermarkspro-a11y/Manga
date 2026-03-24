'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowRight, Calendar } from 'lucide-react';
import Header from '../../components/Header'; // Assuming components are two levels up from app/blog/page.tsx
import Footer from '../../components/Footer';

export default function BlogPage() {
    const [isLoggedIn, setIsLoggedIn] = useState(false); // Default state
    const [isAuthPopupOpen, setIsAuthPopupOpen] = useState(false);
    const [availableCredits, setAvailableCredits] = useState(2880);

    const handleLogout = () => {
        setIsLoggedIn(false);
        localStorage.removeItem('isLoggedIn');
        window.location.href = '/';
    };

    // Dummy blog post data
    const blogPosts = [
        {
            id: 1,
            title: "How to craft the perfect villain for your Manga",
            excerpt: "Discover the psychological traits and design secrets that make an antagonist truly unforgettable in the eyes of your readers.",
            date: "March 15, 2026",
            image: "/images/feature-1-main.jpg",
            category: "Tutorials"
        },
        {
            id: 2,
            title: "Top 10 AI Prompts for Dynamic Action Scenes",
            excerpt: "Learn how to formulate your AI prompts to generate high-octane, dynamic combat poses with perfect perspective.",
            date: "March 12, 2026",
            image: "/images/feature-2-main.jpg",
            category: "Tips & Tricks"
        },
        {
            id: 3,
            title: "Webtoon vs Manga: Which format should you choose?",
            excerpt: "A deep dive into the scrolling vertical format versus the traditional page-by-page layout, and how our tool adapts to both.",
            date: "March 08, 2026",
            image: "/images/feature-3-main.jpg",
            category: "Industry Insights"
        },
        {
            id: 4,
            title: "Mastering light and shadow in Black & White comics",
            excerpt: "Screentones, hatching, and stark contrast: understand the fundamentals of lighting to make your B&W panels pop.",
            date: "March 02, 2026",
            image: "/images/form-example-3.jpg",
            category: "Art Fundamentals"
        },
        {
            id: 5,
            title: "Writing a compelling Chapter 1 that hooks readers",
            excerpt: "The first 20 pages are crucial. Here is a proven structure to introduce your world and characters without info-dumping.",
            date: "February 25, 2026",
            image: "/images/form-example-1.jpg",
            category: "Storytelling"
        },
        {
            id: 6,
            title: "Creating consistent characters with AI Generation",
            excerpt: "Our definitive guide on using character seeds and reference sheets to maintain perfect visual consistency across all your comic panels.",
            date: "February 18, 2026",
            image: "/images/form-example-2.jpg",
            category: "Tutorials"
        }
    ];

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

            <main className="max-w-7xl mx-auto px-4 py-12 md:py-20 flex flex-col items-center">

                {/* Hero Section of the Blog */}
                <div className="text-center max-w-3xl mx-auto mb-16 md:mb-24">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <span className="inline-block py-2 px-4 bg-white border-[3px] border-black rounded-full text-black font-black text-sm uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-6 transform -rotate-2">
                            Latest News & Guides
                        </span>
                        <h1 className="text-5xl md:text-7xl font-black font-display text-black uppercase tracking-wider mb-6 leading-tight drop-shadow-sm">
                            The Creator's <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#6366f1] to-[#8b5cf6]">Journal</span>
                        </h1>
                        <p className="text-xl md:text-2xl font-bold text-gray-800 leading-relaxed">
                            Tips, tutorials, and inspiration to help you build better stories and master AI comic generation.
                        </p>
                    </motion.div>
                </div>

                {/* Blog Posts Grid - 3 Columns */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10 w-full">
                    {blogPosts.map((post, index) => (
                        <motion.a
                            href={`/blog/${post.id}`}
                            key={post.id}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            whileHover={{ y: -8, scale: 1.01 }}
                            className="group block h-full"
                        >
                            <article className="h-full flex flex-col bg-white border-[4px] border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] rounded-3xl overflow-hidden transition-all duration-300">

                                {/* Thumbnail Image */}
                                <div className="relative w-full aspect-[16/10] overflow-hidden border-b-[4px] border-black bg-gray-100">
                                    <div className="absolute top-4 left-4 z-10 bg-[#facc15] border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-black font-black text-xs uppercase px-3 py-1 rounded-full">
                                        {post.category}
                                    </div>
                                    <Image
                                        src={post.image}
                                        alt={post.title}
                                        fill
                                        className="object-cover group-hover:scale-110 transition-transform duration-700"
                                    />
                                    {/* Subtle overlay */}
                                    <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors z-[1]" />
                                </div>

                                {/* Content Container */}
                                <div className="p-6 md:p-8 flex flex-col flex-1 bg-white relative z-10">
                                    <div className="flex items-center gap-2 text-sm font-bold text-gray-500 mb-4">
                                        <Calendar className="w-4 h-4" />
                                        <span>{post.date}</span>
                                    </div>

                                    <h2 className="text-2xl font-black font-display text-black leading-tight mb-4 group-hover:text-[#6366f1] transition-colors line-clamp-2">
                                        {post.title}
                                    </h2>

                                    <p className="text-gray-700 font-medium mb-6 line-clamp-3 flex-1 flex-grow">
                                        {post.excerpt}
                                    </p>

                                    {/* Read More button area */}
                                    <div className="pt-6 border-t-[3px] border-gray-100 mt-auto flex items-center justify-between">
                                        <span className="font-black text-black group-hover:text-[#6366f1] transition-colors">Read Article</span>
                                        <div className="w-10 h-10 rounded-full border-[3px] border-black flex items-center justify-center bg-gray-50 group-hover:bg-[#facc15] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] group-hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all group-hover:rotate-[-15deg]">
                                            <ArrowRight className="w-5 h-5 text-black" />
                                        </div>
                                    </div>
                                </div>
                            </article>
                        </motion.a>
                    ))}
                </div>

                {/* Load More Button */}
                <div className="mt-20 mb-20 text-center">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-8 py-4 bg-white text-black border-[4px] border-black rounded-xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:bg-[#facc15] font-black text-xl uppercase tracking-wider transition-all"
                    >
                        Load More Entries
                    </motion.button>
                </div>
            </main>

            <div className="w-full mt-auto">
                <Footer />
            </div>
        </div>
    );
}
