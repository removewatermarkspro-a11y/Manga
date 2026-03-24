'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';

interface FeaturesSectionProps {
    onScrollToForm: () => void;
}

export default function FeaturesSection({ onScrollToForm }: FeaturesSectionProps) {
    return (
        <section id="features" className="relative z-10 px-6 py-16 max-w-7xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-black text-center mb-16 font-display">
                CREATE COMICS AND MANGA WITH THESE FEATURES
            </h2>

            {/* Wrapper for Feature 1 + Feature 2 with background */}
            <div className="relative -mx-6 px-6 mb-24">
                {/* Comic rays background - full width */}
                <div className="absolute inset-0 left-1/2 -translate-x-1/2 w-screen opacity-[0.08] pointer-events-none">
                    <Image
                        src="/images/comic-rays-bg.jpg"
                        alt=""
                        fill
                        className="object-cover"
                        priority
                    />
                    {/* Gradient fade at top and bottom - matches page gradient at ~20-40% */}
                    <div className="absolute inset-0 bg-gradient-to-b from-[rgba(224,215,255,0.98)] via-transparent to-[rgba(224,215,255,0.96)]"
                    />
                </div>

                <div className="relative z-10">
                    {/* Feature 1 - Text Left, Image Right */}
                    <div className="grid md:grid-cols-2 gap-8 items-center">
                        <div className="space-y-6">
                            <h3 className="text-3xl md:text-4xl font-black font-display">
                                AI-POWERED GENERATION
                            </h3>
                            <p className="text-base md:text-lg text-gray-700 leading-relaxed">
                                Transform your ideas into stunning comic strips with our advanced AI technology. Simply describe your vision, and watch it come to life in seconds.
                            </p>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={onScrollToForm}
                                className="px-6 py-3 bg-[#facc15] text-black font-bold text-base border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all"
                            >
                                Try This Now
                            </motion.button>
                        </div>
                        <div className="border-[4px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] aspect-square flex items-center justify-center relative">
                            {/* Main comic image - fills entire box as background */}
                            <div className="absolute inset-0 -m-[1px] overflow-hidden">
                                <Image
                                    src="/images/feature-1-main.jpg"
                                    alt="AI-Generated Comic Example"
                                    fill
                                    className="object-cover"
                                />
                            </div>

                            {/* Overlapping circular bubbles */}
                            {/* Top-left bubble */}
                            <div className="absolute -top-8 -left-8 z-10">
                                <div className="w-36 h-36 rounded-full border-[3px] border-black bg-white overflow-hidden">
                                    <Image
                                        src="/images/character-blonde-new.jpg"
                                        alt="Character"
                                        width={144}
                                        height={144}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            </div>
                            {/* Bottom-right bubble */}
                            <div className="absolute -bottom-8 -right-8 z-10">
                                <div className="w-36 h-36 rounded-full border-[3px] border-black bg-white overflow-hidden">
                                    <Image
                                        src="/images/character-photo-2.jpg"
                                        alt="Character 2"
                                        width={144}
                                        height={144}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Spacer */}
                    <div className="h-24"></div>

                    {/* Feature 2 - Image Left, Text Right */}
                    <div className="grid md:grid-cols-2 gap-8 items-center">
                        <div className="order-2 md:order-1 border-[4px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] aspect-square flex items-center justify-center relative">
                            {/* Main comic image - fills entire box as background */}
                            <div className="absolute inset-0 -m-[1px] overflow-hidden">
                                <Image
                                    src="/images/feature-2-main.jpg"
                                    alt="Multiple Art Styles Example"
                                    fill
                                    className="object-cover"
                                />
                            </div>

                            {/* Overlapping circular bubbles */}
                            {/* Top-left bubble - Man */}
                            <div className="absolute -top-8 -left-8 z-10">
                                <div className="w-36 h-36 rounded-full border-[3px] border-black bg-white overflow-hidden">
                                    <Image
                                        src="/images/feature-2-char-man.jpg"
                                        alt="Character"
                                        width={144}
                                        height={144}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            </div>
                            {/* Top-right bubble - Dog */}
                            <div className="absolute -top-8 -right-8 z-10">
                                <div className="w-36 h-36 rounded-full border-[3px] border-black bg-white overflow-hidden">
                                    <Image
                                        src="/images/feature-2-char-dog.png"
                                        alt="Character"
                                        width={144}
                                        height={144}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            </div>
                            {/* Bottom-right bubble - Woman */}
                            <div className="absolute -bottom-8 -right-8 z-10">
                                <div className="w-36 h-36 rounded-full border-[3px] border-black bg-white overflow-hidden">
                                    <Image
                                        src="/images/feature-2-char-woman.jpg"
                                        alt="Character"
                                        width={144}
                                        height={144}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="order-1 md:order-2 space-y-6">
                            <h3 className="text-3xl md:text-4xl font-black font-display">
                                MULTIPLE ART STYLES
                            </h3>
                            <p className="text-base md:text-lg text-gray-700 leading-relaxed">
                                Choose from Comic, Manga, or Manhwa styles. Each style brings its own unique visual flair and storytelling approach to your creations.
                            </p>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={onScrollToForm}
                                className="px-6 py-3 bg-[#facc15] text-black font-bold text-base border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all"
                            >
                                Try This Now
                            </motion.button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Features 3-6 Grid */}
            <div className="grid md:grid-cols-2 gap-12">
                {/* Feature 3 */}
                <div className="space-y-6">
                    <div className="border-[4px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] aspect-square flex items-center justify-center bg-gradient-to-br from-purple-100 to-violet-200">
                        {/* Image removed - feature-3.jpg not available */}
                        <span className="text-6xl">🌟</span>
                    </div>
                    <h3 className="text-2xl md:text-3xl font-black font-display">
                        ICONIC UNIVERSES
                    </h3>
                    <p className="text-base text-gray-700 leading-relaxed">
                        Immerse yourself in beloved worlds like Star Wars, Disney, Naruto, DBZ, and Harry Potter. Become the hero in your favorite universe!
                    </p>
                </div>

                {/* Feature 4 */}
                <div className="space-y-6">
                    <div className="border-[4px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] aspect-square flex items-center justify-center bg-white overflow-hidden">
                        <Image
                            src="/images/feature-4.jpg"
                            alt="AI Story Generator"
                            fill
                            className="object-cover"
                        />
                    </div>
                    <h3 className="text-2xl md:text-3xl font-black font-display">
                        AI STORY GENERATOR
                    </h3>
                    <p className="text-base text-gray-700 leading-relaxed">
                        Stuck for ideas? Use our AI story generator to create compelling plots instantly. Get inspired with themed story suggestions across multiple genres.
                    </p>
                </div>

                {/* Feature 5 */}
                <div className="space-y-6">
                    <div className="border-[4px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] aspect-square flex items-center justify-center bg-white overflow-hidden">
                        <Image
                            src="/images/feature-5.jpg"
                            alt="High-Resolution Output"
                            fill
                            className="object-cover"
                        />
                    </div>
                    <h3 className="text-2xl md:text-3xl font-black font-display">
                        HIGH-RESOLUTION OUTPUT
                    </h3>
                    <p className="text-base text-gray-700 leading-relaxed">
                        Get professional-quality comics perfect for both digital sharing and physical printing. Your creations look amazing everywhere!
                    </p>
                </div>

                {/* Feature 6 */}
                <div className="space-y-6">
                    <div className="border-[4px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] aspect-square flex items-center justify-center bg-white overflow-hidden">
                        <Image
                            src="/images/feature-6.jpg"
                            alt="Easy to Use"
                            fill
                            className="object-cover"
                        />
                    </div>
                    <h3 className="text-2xl md:text-3xl font-black font-display">
                        EASY TO USE
                    </h3>
                    <p className="text-base text-gray-700 leading-relaxed">
                        No drawing skills required! Our intuitive interface makes comic creation accessible to everyone. Create professional comics in minutes.
                    </p>
                </div>
            </div>
        </section>
    );
}
