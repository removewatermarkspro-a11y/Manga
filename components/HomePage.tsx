'use client';

import { useState, useEffect, useRef } from 'react';
import { Upload, Sparkles, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Header from './Header';
import HeroSection from './HeroSection';
import Footer from './Footer';
import TestimonialsSection from './TestimonialsSection';
import AuthPopup from './AuthPopup';
import AddCharacterPopup from './AddCharacterPopup';
import CreateCharacterPopup from './CreateCharacterPopup';
import LoadingPopup from './LoadingPopup';
import ResultReadyPopup from './ResultReadyPopup';
import { useAuth } from '@/contexts/AuthContext';

type StyleType = 'comic' | 'manga' | 'manhwa';

export default function HomePage() {
  const [selectedStyle, setSelectedStyle] = useState<StyleType | null>(null);
  const [currentExample, setCurrentExample] = useState<number>(0);
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);
  const [isAuthPopupOpen, setIsAuthPopupOpen] = useState(false);
  const [isAddCharacterPopupOpen, setIsAddCharacterPopupOpen] = useState(false);
  const [storyText, setStoryText] = useState('');
  const [selectedCharacters, setSelectedCharacters] = useState<Array<{ id: string, name: string, image: string, gender?: string, age?: string, role?: string }>>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('Category');
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isCreateCharacterPopupOpen, setIsCreateCharacterPopupOpen] = useState(false);
  const [clickedCharacterId, setClickedCharacterId] = useState<string | null>(null);
  const [editingCharacter, setEditingCharacter] = useState<{ id: string, name: string, image: string, gender?: string, age?: string, role?: string } | null>(null);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);
  const [showCharacterError, setShowCharacterError] = useState(false);
  const [showStyleError, setShowStyleError] = useState(false);
  const [showStoryError, setShowStoryError] = useState(false);
  const [isLoadingPopupOpen, setIsLoadingPopupOpen] = useState(false);
  const [isResultReadyPopupOpen, setIsResultReadyPopupOpen] = useState(false);

  const { isLoggedIn, signOut } = useAuth();

  // Open auth popup if redirected with ?auth=required
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('auth') === 'required') {
      setIsAuthPopupOpen(true);
      // Clean the URL
      window.history.replaceState({}, '', '/');
    }
  }, []);

  // Save selected style to localStorage whenever it changes
  useEffect(() => {
    if (selectedStyle) {
      localStorage.setItem('selectedStyle', selectedStyle);
    }
  }, [selectedStyle]);

  const openAuthPopup = () => setIsAuthPopupOpen(true);
  const closeAuthPopup = () => setIsAuthPopupOpen(false);
  const openAddCharacterPopup = () => setIsAddCharacterPopupOpen(true);
  const closeAddCharacterPopup = () => setIsAddCharacterPopupOpen(false);
  const openCreateCharacterPopup = () => {
    setIsAddCharacterPopupOpen(false);
    setIsCreateCharacterPopupOpen(true);
  };
  const closeCreateCharacterPopup = () => setIsCreateCharacterPopupOpen(false);

  const handleLogin = () => {
    // Auth is now handled by Supabase, this is called after successful login
    setIsAuthPopupOpen(false);
  };

  const handleLogout = async () => {
    await signOut();
  };

  const backToAddCharacter = () => {
    setIsCreateCharacterPopupOpen(false);
    setIsAddCharacterPopupOpen(true);
  };

  const scrollToForm = () => {
    const formElement = document.getElementById('add-characters-form');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleCharacterSelect = (character: { id: string, name: string, image: string }) => {
    if (selectedCharacters.length < 3) {
      setSelectedCharacters(prev => [...prev, character]);
      closeAddCharacterPopup();
    }
  };

  const handleCustomCharacterCreate = (character: { id: string, name: string, image: string, gender?: string, age?: string, role?: string }) => {
    if (editingCharacter) {
      // Update existing character
      setSelectedCharacters(prev => prev.map(char =>
        char.id === editingCharacter.id ? character : char
      ));
      setEditingCharacter(null);
    } else if (selectedCharacters.length < 3) {
      // Add new character
      setSelectedCharacters(prev => [...prev, character]);
    }
    closeCreateCharacterPopup();
  };

  const handleEditCharacter = (character: { id: string, name: string, image: string, gender?: string, age?: string, role?: string }) => {
    setEditingCharacter(character);
    setClickedCharacterId(null);
    setIsCreateCharacterPopupOpen(true);
  };

  const handleDeleteCharacter = (characterId: string) => {
    setSelectedCharacters(prev => prev.filter(char => char.id !== characterId));
  };

  const categories = ['Romance', 'Sport', 'Slice of Life', 'Action', 'Adventure', 'Drama', 'Fantasy'];

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    setIsCategoryDropdownOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target as Node)) {
        setIsCategoryDropdownOpen(false);
      }
    };

    if (isCategoryDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isCategoryDropdownOpen]);

  const handleGenerateClick = () => {
    // Reset errors
    setShowCharacterError(false);
    setShowStyleError(false);
    setShowStoryError(false);

    // Validate
    let hasError = false;
    let firstErrorElement: HTMLElement | null = null;

    if (selectedCharacters.length === 0) {
      setShowCharacterError(true);
      hasError = true;
      firstErrorElement = document.getElementById('add-characters-form');
    }

    if (!selectedStyle) {
      setShowStyleError(true);
      hasError = true;
      if (!firstErrorElement) {
        firstErrorElement = document.getElementById('style-selection-form');
      }
    }

    if (!storyText.trim()) {
      setShowStoryError(true);
      hasError = true;
      if (!firstErrorElement) {
        firstErrorElement = document.getElementById('story-form');
      }
    }

    if (hasError && firstErrorElement) {
      firstErrorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else if (!hasError) {
      // Check if user is logged in first
      if (!isLoggedIn) {
        // Save pending data then open auth popup
        const pendingData = {
          storyText,
          style: selectedStyle,
          characters: selectedCharacters.map(c => ({
            name: c.name,
            role: c.role || 'supporting character',
            gender: c.gender || 'unknown',
            age: c.age || 'unknown',
            image: c.image
          })),
          characterImage: selectedCharacters[0]?.image
        };
        localStorage.setItem('pendingGenerationData', JSON.stringify(pendingData));
        setIsAuthPopupOpen(true);
        return;
      }

      // Save generation data to localStorage for the pricing page
      const pendingData = {
        storyText,
        style: selectedStyle,
        characters: selectedCharacters.map(c => ({
          name: c.name,
          role: c.role || 'supporting character',
          gender: c.gender || 'unknown',
          age: c.age || 'unknown',
          image: c.image
        })),
        characterImage: selectedCharacters[0]?.image
      };
      localStorage.setItem('pendingGenerationData', JSON.stringify(pendingData));
      
      // Start fake loading sequence
      setIsLoadingPopupOpen(true);
    }
  };

  const handleLoadingComplete = () => {
    setIsLoadingPopupOpen(false);

    // Redirect to pricing page to show offers
    window.location.href = '/pricing';
  };

  const handleResultReadyContinue = () => {
    setIsResultReadyPopupOpen(false);
    // Redirect to pricing page
    window.location.href = '/pricing';
  };
  // Example placeholders - you can replace these with actual image paths later
  const examples = [
    { id: 1, name: 'Example 1' },
    { id: 2, name: 'Example 2' },
    { id: 3, name: 'Example 3' },
    { id: 4, name: 'Example 4' },
  ];

  // Auto-scroll carousel every 6 seconds, stop after 2 complete cycles
  const [cycleCount, setCycleCount] = useState(0);
  const [isAutoScrollActive, setIsAutoScrollActive] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Function to reset the auto-scroll timer
  const resetAutoScrollTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    if (isAutoScrollActive && cycleCount < 2) {
      intervalRef.current = setInterval(() => {
        setCurrentExample((prev) => {
          const nextIndex = (prev + 1) % examples.length;

          // If we're going back to the first image, increment cycle count
          if (nextIndex === 0) {
            setCycleCount((count) => {
              const newCount = count + 1;
              // Stop auto-scroll after 2 complete cycles
              if (newCount >= 2) {
                setIsAutoScrollActive(false);
                if (intervalRef.current) {
                  clearInterval(intervalRef.current);
                }
              }
              return newCount;
            });
          }

          return nextIndex;
        });
      }, 6000);
    }
  };

  useEffect(() => {
    resetAutoScrollTimer();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isAutoScrollActive, cycleCount]);

  // Handle manual navigation (clicking on dots)
  const handleDotClick = (index: number) => {
    setCurrentExample(index);
    resetAutoScrollTimer(); // Reset the timer when user clicks
  };

  const styles = [
    {
      id: 'comic' as StyleType,
      name: 'Comic',
      color: 'bg-white',
    },
    {
      id: 'manga' as StyleType,
      name: 'Manga',
      color: 'bg-white',
    },
    {
      id: 'manhwa' as StyleType,
      name: 'Manhwa',
      color: 'bg-white',
    },
  ];

  return (
    <div
      className="min-h-screen relative overflow-hidden"
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
        onAuthClick={openAuthPopup}
        onLogout={handleLogout}
      />



      {/* Main Hero Section */}
      <main className="relative z-10 px-6 py-8 max-w-7xl mx-auto">

        {/* Centered Top Content */}
        <div className="max-w-4xl mx-auto text-center space-y-3 md:space-y-6 mb-6 md:mb-12">
          {/* Social Proof - Avatars */}
          <div className="flex items-center justify-center gap-1.5 md:gap-2 mb-4 md:mb-6">
            <div className="flex items-center gap-0.5 md:gap-1">
              {[...Array(5)].map((_, i) => (
                <svg key={i} className="w-4 h-4 md:w-5 md:h-5 text-[#fb923c] fill-current" viewBox="0 0 24 24">
                  <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                </svg>
              ))}
            </div>
            <span className="text-[10px] md:text-xs font-semibold text-black">Trusted by 20,000+ users</span>
          </div>

          {/* Title - Stylized DA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-block py-1.5 px-3 bg-white border-[2px] border-black rounded-full text-black font-black text-xs uppercase tracking-widest shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] mb-4 transform -rotate-2">
              AI Comic Generator
            </span>
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-black leading-tight tracking-wider font-display uppercase drop-shadow-sm mb-2 md:mb-6">
              CREATE COMIC BOOKS AND MANGA ONLINE <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#6366f1] to-[#8b5cf6]">WITH AI</span>
            </h1>
          </motion.div>
        </div>

        {/* Background wrapper for form section - transparent to allow top-level bg through */}
        <div className="relative -mx-6 px-6 mb-12 md:mb-24">
          <div className="relative z-10">
            {/* Description */}
            <p className="text-sm md:text-base text-gray-700 leading-relaxed max-w-xl mx-auto mb-8 mt-4 md:mt-0">
              Create stunning comics, webtoons, and manga in minutes with our AI generator. Choose your style—from superhero to romantic manga—and bring your professional comic strips to life instantly. No drawing skills required!
            </p>

            {/* Mobile CTA and Marquee */}
            <div className="flex flex-col items-center md:hidden w-full mt-4 mb-8 overflow-hidden space-y-6">
              <button 
                onClick={scrollToForm}
                className="px-6 py-4 bg-[#facc15] text-black font-black text-xl border-[4px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center justify-center gap-2 rounded-xl"
              >
                👇 Create your comic book
              </button>

              <div className="w-[100vw] relative left-1/2 -translate-x-1/2 px-4 overflow-hidden py-4 -mb-4">
                <div className="flex w-full">
                  <motion.div
                    className="flex gap-4 pr-4 min-w-max"
                    animate={{ x: "-50%" }}
                    transition={{ repeat: Infinity, ease: "linear", duration: 15 }}
                  >
                    {[...examples, ...examples, ...examples, ...examples].map((ex, index) => {
                      const i = ex.id;
                      return (
                        <div 
                          key={`${index}-${ex.id}`} 
                          className="w-[140px] h-[100px] bg-white border-[3px] border-black flex-shrink-0 flex items-center justify-center relative overflow-hidden rounded-lg shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
                        >
                          <div className={`absolute inset-0 bg-gradient-to-br ${i === 1 ? 'from-orange-200 to-orange-300' : i === 2 ? 'from-blue-200 to-blue-300' : i === 3 ? 'from-purple-200 to-purple-300' : 'from-pink-200 to-pink-300'} opacity-50`}></div>
                          <span className="text-4xl z-10">{['🎬', '🦸‍♂️', '🎇', '🌅'][i-1]}</span>
                        </div>
                      );
                    })}
                  </motion.div>
                </div>
              </div>
            </div>

            {/* Form and Carousel Grid */}
            <div className="grid lg:grid-cols-2 gap-8 items-start">
              {/* Left Column - Form */}
              <div className="order-2 lg:order-1 space-y-10">

                {/* Upload Section */}
                <div id="add-characters-form" className="space-y-3">
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-black text-[#ff0080] font-display tracking-wider">ADD CHARACTERS</h2>
                    {showCharacterError && (
                      <span className="text-red-600 text-sm font-bold">(Required - Add at least 1 character)</span>
                    )}
                  </div>

                  <div className="flex items-start gap-6">
                    {/* Add Character Button - Only show if less than 3 characters */}
                    {selectedCharacters.length < 3 && (
                      <button onClick={openAddCharacterPopup} className="cursor-pointer group flex-shrink-0">
                        <div className="flex flex-col items-center gap-2">
                          {/* Yellow Circle with Plus */}
                          <motion.div
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="w-32 h-32 rounded-full bg-[#facc15] border-[4px] border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] group-hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center justify-center"
                          >
                            <span className="text-6xl font-black leading-none -mt-2">+</span>
                          </motion.div>
                          <p className="text-sm font-bold text-black">
                            Add {selectedCharacters.length === 0 ? '' : selectedCharacters.length === 1 ? '2nd' : '3rd'} Character
                          </p>
                        </div>
                      </button>
                    )}

                    {/* Selected Characters */}
                    {selectedCharacters.map((character) => (
                      <div key={character.id} className="flex flex-col items-center gap-2 group">
                        <div
                          className="relative w-32 h-32 cursor-pointer"
                          onClick={() => setClickedCharacterId(clickedCharacterId === character.id ? null : character.id)}
                        >
                          <div className="w-32 h-32 rounded-full border-[4px] border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
                            <Image
                              src={character.image}
                              alt={character.name}
                              width={128}
                              height={128}
                              className="w-full h-full object-cover"
                            />
                          </div>

                          {/* Edit and Delete buttons - appear on hover (desktop) or click (mobile) */}
                          <div className={`absolute inset-0 bg-black/60 rounded-full transition-opacity flex items-center justify-center gap-2 ${clickedCharacterId === character.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                            }`}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditCharacter(character);
                              }}
                              className="w-10 h-10 bg-blue-500 rounded-full border-[2px] border-white shadow-lg hover:bg-blue-600 transition-colors flex items-center justify-center"
                              title="Edit"
                            >
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M18.5 2.50023C18.8978 2.1024 19.4374 1.87891 20 1.87891C20.5626 1.87891 21.1022 2.1024 21.5 2.50023C21.8978 2.89805 22.1213 3.43762 22.1213 4.00023C22.1213 4.56284 21.8978 5.1024 21.5 5.50023L12 15.0002L8 16.0002L9 12.0002L18.5 2.50023Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteCharacter(character.id);
                                setClickedCharacterId(null);
                              }}
                              className="w-10 h-10 bg-red-500 rounded-full border-[2px] border-white shadow-lg hover:bg-red-600 transition-colors flex items-center justify-center"
                              title="Delete"
                            >
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                <path d="M3 6H5H21" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </button>
                          </div>
                        </div>
                        <p className="text-sm font-bold text-black">{character.name}</p>
                      </div>
                    ))}

                    {/* Description Text - Hide when 1 or more characters selected */}
                    {selectedCharacters.length === 0 && (
                      <div className="flex-1 pt-4">
                        <p className="text-base text-black leading-relaxed font-bold">
                          Bring Your Characters! We'll integrate them into Your Story. Then, kick back and watch the magic unfold!
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Style Selection */}
                <div id="style-selection-form" className="space-y-4">
                  <div className="flex items-center gap-2">
                    <label className="text-2xl font-bold text-[#ff0080] font-display tracking-wider">Select a Style</label>
                    {showStyleError && (
                      <span className="text-red-600 text-sm font-bold">(Required - Select a style)</span>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    {styles.map((style) => (
                      <motion.button
                        key={style.id}
                        whileHover={{ scale: 1.05, rotate: selectedStyle === style.id ? 0 : -2 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setSelectedStyle(style.id)}
                        className={`relative p-3 ${selectedStyle === style.id ? 'bg-[#facc15]' : style.color} border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all rounded-lg`}
                      >
                        <div className="font-bold text-xl font-display tracking-wider text-center">{style.name}</div>
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Write or Generate Story Section */}
                <div id="story-form" className="space-y-4">
                  <div className="flex items-center gap-2">
                    <label className="text-2xl font-bold text-[#ff0080] font-display tracking-wider">WRITE OR GENERATE STORY</label>
                    {showStoryError && (
                      <span className="text-red-600 text-sm font-bold">(Required - Write or generate a story)</span>
                    )}
                  </div>
                  <div className="relative">
                    <div className="relative bg-white border-[3px] border-black rounded-3xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-4 min-h-[120px]">
                      <textarea
                        value={storyText}
                        onChange={(e) => {
                          setStoryText(e.target.value);
                          if (e.target.value.trim()) setShowStoryError(false);
                        }}
                        spellCheck={false}
                        className="w-full h-full min-h-[88px] text-sm text-gray-700 leading-relaxed resize-none border-none outline-none bg-transparent"
                        placeholder="Write your story here or select a Category below and click 'Inspire Me' to generate themed story ideas..."
                      />

                      {/* Speech Bubble Tail */}
                      <div className="absolute -bottom-4 left-12 w-8 h-8 bg-white border-r-[3px] border-b-[3px] border-black transform rotate-45"></div>
                      {/* Category Dropdown */}
                      <div ref={categoryDropdownRef} className="absolute bottom-4 right-[120px]">
                        {/* Category Button */}
                        <button
                          onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                          className="w-[110px] px-3 py-1.5 bg-white border-[2px] border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-bold text-xs hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center gap-1 rounded-md"
                        >
                          {selectedCategory}
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="mt-0.5">
                            <path d="M6 9L12 15L18 9" stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </button>

                        {/* Dropdown Menu */}
                        {isCategoryDropdownOpen && (
                          <div className="absolute bottom-full mb-1 left-0 right-0 bg-white border-[2px] border-black z-10 rounded-md overflow-hidden">
                            {categories.map((category) => (
                              <button
                                key={category}
                                onClick={() => handleCategorySelect(category)}
                                className="w-full px-3 py-2 text-left text-xs font-bold hover:bg-[#facc15] transition-colors border-b border-black last:border-b-0"
                              >
                                {category}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      {/* Inspire Me Button */}
                      <button
                        onClick={() => {
                          const storiesByCategory: { [key: string]: string[] } = {
                            'Romance': [
                              "Two rival artists fall in love while competing for the same gallery exhibition...",
                              "A time traveler keeps meeting their soulmate in different eras, but can never stay...",
                              "A wedding planner falls for the bride's brother while organizing the perfect ceremony...",
                              "Star-crossed lovers from feuding families must choose between love and loyalty...",
                              "A chance encounter on a train leads to an unexpected romance across continents..."
                            ],
                            'Sport': [
                              "An underdog team fights their way to the championship against all odds...",
                              "A retired athlete returns to coach a struggling youth team to glory...",
                              "Rivals on the field become allies when their teams merge unexpectedly...",
                              "A young prodigy must overcome a career-threatening injury to compete again...",
                              "Two athletes from different sports fall in love during the Olympics..."
                            ],
                            'Slice of Life': [
                              "A small-town café becomes the heart of the community's daily stories...",
                              "Four roommates navigate the challenges of adulthood in the big city...",
                              "A family reunites for the holidays, revealing long-hidden secrets...",
                              "A student discovers the beauty in everyday moments during their final year...",
                              "Neighbors in an apartment building form unexpected friendships..."
                            ],
                            'Action': [
                              "A secret agent must stop a global conspiracy before time runs out...",
                              "Elite soldiers are trapped behind enemy lines and must fight their way home...",
                              "A vigilante takes on a corrupt corporation controlling the city...",
                              "An assassin seeks revenge against those who betrayed them...",
                              "A heist crew plans the impossible: stealing from the world's most secure vault..."
                            ],
                            'Adventure': [
                              "Explorers discover a hidden civilization deep in the Amazon rainforest...",
                              "A treasure hunter races against rivals to find a legendary lost city...",
                              "Shipwrecked survivors must navigate a mysterious island full of dangers...",
                              "A young adventurer inherits a map leading to their grandfather's greatest discovery...",
                              "Time travelers journey through history to prevent a catastrophic future..."
                            ],
                            'Drama': [
                              "A family's dark secrets unravel during a tense inheritance dispute...",
                              "A lawyer must defend their childhood friend accused of a terrible crime...",
                              "A journalist uncovers corruption that threatens their entire career...",
                              "Siblings reunite after years apart to care for their ailing parent...",
                              "A teacher's controversial methods divide a community..."
                            ],
                            'Fantasy': [
                              "A young mage discovers they're the last hope against an ancient evil...",
                              "In a world where magic is forbidden, a rebellion rises to restore it...",
                              "A portal opens between realms, forcing unlikely allies to unite...",
                              "An enchanted forest holds the key to breaking a centuries-old curse...",
                              "Dragons return to a world that thought them extinct, changing everything..."
                            ],
                            'Category': [
                              "Shadow-like entities from a parallel dimension begin absorbing the world energy, slowly plunging cities into darkness...",
                              "A young hero discovers they have the power to control time, but each use ages them by one year...",
                              "In a world where dreams become reality, a nightmare escapes and threatens to consume everything...",
                              "An ancient artifact grants wishes, but each wish comes with an unexpected twist...",
                              "Two rival kingdoms must unite when a greater threat emerges from the depths of the ocean..."
                            ]
                          };

                          const categoryStories = storiesByCategory[selectedCategory] || storiesByCategory['Category'];
                          const currentIndex = categoryStories.indexOf(storyText);
                          const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % categoryStories.length;
                          setStoryText(categoryStories[nextIndex]);
                        }}
                        className="absolute bottom-4 right-4 px-3 py-1.5 bg-[#facc15] border-[2px] border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-bold text-xs hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all rounded-md"
                      >
                        Inspire Me
                      </button>
                    </div>
                  </div>
                </div>

                {/* Generate Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleGenerateClick}
                  className="w-full py-4 bg-[#6366f1] text-white font-black text-xl border-[3px] border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center justify-center gap-3 rounded-xl"
                >
                  <Sparkles className="w-6 h-6" />
                  Generate
                </motion.button>
              </div>


              {/* Right Column - Carousel (Hidden on mobile) */}
              <div className="hidden md:block order-2 relative mt-4 md:mt-0">
                {/* Wrap Carousel and Bubbles to lock positioning together */}
                <div className="relative">
                  {/* Example Carousel - Auto-scrolling */}
                  <div className="relative bg-white border-[4px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden rounded-xl aspect-[2/3]">

                    {/* Carousel Container */}
                    <div className="relative w-full h-full">
                      <AnimatePresence>
                        <motion.div
                          key={currentExample}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.8, ease: "easeInOut" }}
                          className="absolute inset-0 w-full h-full"
                        >
                          {currentExample === 0 ? (
                            // Example 1 - New Image
                            <div className="relative w-full h-full">
                              <img
                                src="/images/form-example-1.jpg"
                                alt="Comic Example 1"
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : currentExample === 1 ? (
                            // Example 2 - New Image
                            <div className="relative w-full h-full">
                              <img
                                src="/images/form-example-2.jpg"
                                alt="Comic Example 2"
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : currentExample === 2 ? (
                            // Example 3 - New Image
                            <div className="relative w-full h-full">
                              <img
                                src="/images/form-example-3.jpg"
                                alt="Comic Example 3"
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            // Example 4 - New Image
                            <div className="relative w-full h-full">
                              <img
                                src="/images/form-example-4.jpg"
                                alt="Comic Example 4"
                                className="w-full h-full object-cover"
                              />
                              {/* To be continued badge */}
                              <div className="absolute bottom-4 right-4 bg-black/80 px-4 py-2 border-2 border-white rounded-lg">
                                <p className="text-white font-bold text-sm italic">To be continued...</p>
                              </div>
                            </div>
                          )}
                        </motion.div>
                      </AnimatePresence>
                    </div>

                    {/* Navigation Dots */}
                    <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-2 z-10">
                      {examples.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => handleDotClick(index)}
                          className={`w-2.5 h-2.5 rounded-full border-[1.5px] border-black transition-all shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] ${currentExample === index ? 'bg-[#4ade80] scale-125' : 'bg-white hover:bg-gray-200'
                            }`}
                          aria-label={`Go to example ${index + 1}`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Character Bubbles Grouped inside the Image Box Wrapper */}
                  <div className="absolute -top-4 -right-2 md:-top-8 md:-right-8 z-20 flex flex-col -space-y-4 md:-space-y-6 items-end pointer-events-none">
                    {/* Blonde Bubble */}
                    <div className="relative z-10 w-20 h-20 md:w-28 md:h-28 rounded-full border-[2px] md:border-[3px] border-black bg-white overflow-hidden shadow-lg pointer-events-auto">
                      <img src="/images/character-blonde-new.jpg" alt="Character" className="w-full h-full object-cover" />
                    </div>

                    {/* Brunette Bubble */}
                    <div className="relative z-20 w-20 h-20 md:w-28 md:h-28 rounded-full border-[2px] md:border-[3px] border-black bg-white overflow-hidden shadow-lg pointer-events-auto">
                      <img src="/images/character-brunette-new.jpg" alt="Character" className="w-full h-full object-cover scale-125" />
                    </div>
                  </div>
                </div>
              </div>
            </div>


            {/* Social Proof - Full Width (Hidden on Mobile) */}
            <div className="hidden md:block mt-6 md:mt-8 relative p-3 md:p-4 bg-white border-[3px] md:border-[4px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] md:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl">
              <div className="flex flex-col md:flex-row items-center justify-between gap-3 md:gap-4">
                {/* Stats Bubble - Left */}
                <div className="relative flex-shrink-0">
                  <div className="bg-white border-[2px] md:border-[3px] border-black p-2 md:p-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] md:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-lg">
                    <div className="text-center">
                      <p className="text-xs md:text-sm font-bold mb-0.5 md:mb-1">Fast. Easy. Custom</p>
                      <p className="text-lg md:text-2xl font-black font-display">+20,000</p>
                      <p className="text-sm md:text-base font-bold">Happy Users</p>
                    </div>
                  </div>
                </div>

                {/* Center Text */}
                <div className="flex-1 text-center px-2 md:px-4">
                  <p className="text-sm md:text-lg font-medium text-gray-800">
                    Over <span className="font-black">20,000 happy customers</span> who want to tell their stories.
                  </p>
                </div>

                {/* #1 Badge - Right */}
                <div className="relative flex-shrink-0">
                  <div className="bg-white border-[2px] md:border-[3px] border-black p-1.5 md:p-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] md:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-lg text-center">
                    <div className="text-xl md:text-2xl font-black mb-0.5 md:mb-1 text-[#eab308]">#1</div>
                    <div className="text-xs md:text-sm font-bold text-[#eab308] mb-1 md:mb-2">COMIC BOOK APP</div>
                    <div className="flex gap-0.5 md:gap-1 justify-center">
                      <span className="text-[#eab308] text-base md:text-lg">★</span>
                      <span className="text-[#eab308] text-base md:text-lg">★</span>
                      <span className="text-[#eab308] text-base md:text-lg">★</span>
                      <span className="text-[#eab308] text-base md:text-lg">★</span>
                      <span className="text-[#eab308] text-base md:text-lg">★</span>
                    </div>
                  </div>
                </div>
              </div>
            </div >
          </div >
        </div >
      </main >







      {/* ============================================ */}
      {/* POWERFUL FEATURES SECTION - START           */}
      {/* This section displays 6 features with the   */}
      {/* comic rays background. Keep inline due to   */}
      {/* complex layout and styling requirements.    */}
      {/* ============================================ */}
      <section id="features" className="relative z-10 px-6 py-16 max-w-7xl mx-auto">
        {/* Full width muted overlay for background dots - fades in at top and out at bottom */}
        <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-screen bg-[linear-gradient(to_bottom,transparent,rgba(228,228,231,0.6)_15%,rgba(228,228,231,0.6)_85%,transparent)] -z-10" />

        <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-center mb-12 md:mb-32 font-display">
          CREATE COMICS AND MANGA WITH THESE FEATURES
        </h2>

        {/* Wrapper for Feature 1 + Feature 2 with background */}
        <div className="relative -mx-6 px-6 mb-24">
          {/* Comic rays background - full width */}
          <div
            className="absolute inset-0 left-1/2 -translate-x-1/2 w-screen opacity-[0.08] pointer-events-none"
            style={{
              maskImage: 'linear-gradient(to bottom, transparent, black 15%, black 85%, transparent)',
              WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 15%, black 85%, transparent)'
            }}
          >
            <Image
              src="/images/comic-rays-bg.jpg"
              alt=""
              fill
              className="object-cover"
              priority
            />
          </div>

          <div className="relative z-10">
            {/* Feature 1 - Text Left, Image Right */}
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="space-y-6 mt-8 md:mt-0">
                <h3 className="text-3xl md:text-4xl font-black font-display">
                  AI MANGA MAKER & COMIC BOOK GENERATOR
                </h3>
                <p className="text-base md:text-lg text-gray-700 leading-relaxed">
                  Turn any story into a stunning manga or comic book with our AI manga maker. Upload your character photos and our AI comic generator creates professional manga panels, comic book pages, and dialogue bubbles automatically. Make your own manga or custom printed comic book in minutes — no drawing skills required.
                </p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={scrollToForm}
                  className="px-6 py-3 bg-[#facc15] text-black font-bold text-sm md:text-base border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all"
                >
                  Try This Now
                </motion.button>
              </div>
              <div className="border-[4px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] aspect-square flex items-center justify-center relative">
                {/* Main comic image - fills entire box as background */}
                <div className="absolute inset-0 -m-[1px] overflow-hidden">
                  <Image
                    src="/images/feature-4-main.jpg"
                    alt="AI-Generated Comic Example"
                    fill
                    className="object-cover"
                  />
                </div>

                {/* Overlapping circular bubbles */}
                {/* Top-right bubble on mobile, top-left on desktop */}
                <div className="absolute -top-[28px] -right-[28px] md:-top-[56px] md:-left-[56px] md:right-auto z-10">
                  <div className="w-16 h-16 md:w-28 md:h-28 rounded-full border-[2px] md:border-[3px] border-black bg-white overflow-hidden">
                    <Image
                      src="/images/feature-4-char-woman.jpg"
                      alt="Character"
                      width={144}
                      height={144}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                {/* Bottom-left bubble on mobile, bottom-right on desktop */}
                <div className="absolute -bottom-[28px] -left-[28px] md:-bottom-[56px] md:-right-[56px] md:left-auto z-10">
                  <div className="w-16 h-16 md:w-28 md:h-28 rounded-full border-[2px] md:border-[3px] border-black bg-white overflow-hidden">
                    <Image
                      src="/images/feature-4-char-man.png"
                      alt="Character 2"
                      width={144}
                      height={144}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Feature 2 - Image Left, Text Right */}
            <div className="grid md:grid-cols-2 gap-8 items-center mt-16 md:mt-24">
              <div className="bg-white border-[4px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] aspect-square flex items-center justify-center order-2 md:order-1 relative overflow-visible">
                {/* Main comic image - fills entire box as background */}
                <div className="absolute inset-0 -m-[1px] overflow-hidden">
                  <img
                    src="/images/feature-2-main.jpg"
                    alt="Multiple Art Styles Example"
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Character bubbles - positioned in corners, overlapping the border */}
                {/* Bottom-right corner on mobile, Top-left corner on desktop - Man */}
                <div className="absolute -bottom-[28px] -right-[28px] md:bottom-auto md:right-auto md:-top-[56px] md:-left-[56px] z-10">
                  <div className="w-16 h-16 md:w-28 md:h-28 rounded-full border-[2px] md:border-[3px] border-black bg-white overflow-hidden">
                    <img
                      src="/images/feature-2-char-man.jpg"
                      alt="Character"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                {/* Top-right corner - Dog */}
                <div className="absolute -top-[28px] -right-[28px] md:-top-[56px] md:-right-[56px] z-10">
                  <div className="w-16 h-16 md:w-28 md:h-28 rounded-full border-[2px] md:border-[3px] border-black bg-white overflow-hidden">
                    <img
                      src="/images/feature-2-char-dog.png"
                      alt="Character"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                {/* Top-center - Woman */}
                <div className="absolute -top-[28px] left-1/2 -translate-x-1/2 md:-top-[56px] z-10">
                  <div className="w-16 h-16 md:w-28 md:h-28 rounded-full border-[2px] md:border-[3px] border-black bg-white overflow-hidden">
                    <img
                      src="/images/feature-2-char-woman.jpg"
                      alt="Character"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-6 order-1 md:order-2 mt-8 md:mt-0">
                <h3 className="text-3xl md:text-4xl font-black font-display">
                  MANGA, ANIME, COMIC & WEBTOON STYLE GENERATOR
                </h3>
                <p className="text-base md:text-lg text-gray-700 leading-relaxed">
                  Choose your visual universe: manga style, anime art, American comic book, webtoon, or manhwa. Your characters, your story, your art style. Our AI adapts to any genre — shonen, shojo, superhero, slice of life — and keeps your character consistent across every panel. The most versatile AI manga creator online.
                </p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={scrollToForm}
                  className="px-6 py-3 bg-[#facc15] text-black font-bold text-sm md:text-base border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all"
                >
                  Try This Now
                </motion.button>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-24">

          {/* Wrapper for Feature 3 + Feature 4 with background */}
          <div className="relative -mx-6 px-6 mb-24">
            {/* Comic rays background - full width */}
            <div
              className="absolute inset-0 left-1/2 -translate-x-1/2 w-screen opacity-[0.08] pointer-events-none"
              style={{
                maskImage: 'linear-gradient(to bottom, transparent, black 15%, black 85%, transparent)',
                WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 15%, black 85%, transparent)'
              }}
            >
              <Image
                src="/images/comic-rays-bg.jpg"
                alt=""
                fill
                className="object-cover"
                priority
              />
            </div>

            <div className="relative z-10">
              {/* Feature 3 - Text Left, Image Right */}
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div className="space-y-6 mt-8 md:mt-0">
                  <h3 className="text-3xl md:text-4xl font-black font-display">
                    CREATE MANGA FROM YOUR PHOTO — BE THE HERO
                  </h3>
                  <p className="text-base md:text-lg text-gray-700 leading-relaxed">
                    Put yourself — or anyone — inside a manga or comic book. Our AI manga creator transforms real photos into manga characters that star in your own story. Perfect to create a personalized comic book as a gift, celebrate a fan, or build an original story from any universe: Star Wars, Naruto, Dragon Ball, Harry Potter, and more.
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={scrollToForm}
                    className="px-6 py-3 bg-[#facc15] text-black font-bold text-base border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all"
                  >
                    Try This Now
                  </motion.button>
                </div>
                <div className="border-[4px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] aspect-square flex items-center justify-center relative bg-white overflow-visible">
                  {/* Main manga boxing image */}
                  <div className="absolute inset-0 -m-[1px] overflow-hidden">
                    <img
                      src="/images/feature-3-main.jpg"
                      alt="Universe Themes Example"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Overlapping circular bubbles - positioned in corners */}
                  {/* Top-right corner - Man */}
                  <div className="absolute -top-[28px] -right-[28px] md:-top-[56px] md:-right-[56px] z-10">
                    <div className="w-16 h-16 md:w-28 md:h-28 rounded-full border-[2px] md:border-[3px] border-black bg-white overflow-hidden">
                      <img
                        src="/images/feature-3-char-man.png"
                        alt="Character"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>

                  {/* Bottom-left corner - Woman */}
                  <div className="absolute -bottom-[28px] -left-[28px] md:-bottom-[56px] md:-left-[56px] z-10">
                    <div className="w-16 h-16 md:w-28 md:h-28 rounded-full border-[2px] md:border-[3px] border-black bg-white overflow-hidden">
                      <img
                        src="/images/feature-3-char-woman.jpg"
                        alt="Character"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Feature 4 - Image Left, Text Right */}
              <div className="grid md:grid-cols-2 gap-8 items-center mt-16 md:mt-24">
                <div className="bg-white border-[4px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] aspect-square flex items-center justify-center order-2 md:order-1 relative overflow-visible">
                  {/* Main action/spy comic image */}
                  <div className="absolute inset-0 -m-[1px] overflow-hidden">
                    <img
                      src="/images/feature-1-main.jpg"
                      alt="Instant Results Example"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Overlapping circular bubbles */}
                  {/* Top-right bubble on mobile, Top-left on desktop - Woman */}
                  <div className="absolute -top-[28px] -right-[28px] md:-top-[56px] md:-left-[56px] md:right-auto z-10">
                    <div className="w-16 h-16 md:w-28 md:h-28 rounded-full border-[2px] md:border-[3px] border-black bg-white overflow-hidden">
                      <img
                        src="/images/character-photo-1.jpg"
                        alt="Character"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>

                  {/* Bottom-left bubble on mobile, Bottom-right on desktop - Man */}
                  <div className="absolute -bottom-[28px] -left-[28px] md:-bottom-[56px] md:-right-[56px] md:left-auto z-10">
                    <div className="w-16 h-16 md:w-28 md:h-28 rounded-full border-[2px] md:border-[3px] border-black bg-white overflow-hidden">
                      <img
                        src="/images/character-photo-2.jpg"
                        alt="Character"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-6 order-1 md:order-2 mt-8 md:mt-0">
                  <h3 className="text-3xl md:text-4xl font-black font-display">
                    INSTANT AI COMIC BOOK — RESULTS IN SECONDS
                  </h3>
                  <p className="text-base md:text-lg text-gray-700 leading-relaxed">
                    No more waiting days for a comic artist. Our AI comic book maker generates a full 10-panel manga or comic story in under 60 seconds. Fast, high-resolution output ready to download, share, or print as a physical book. The fastest digital comic creator online — try it free.
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={scrollToForm}
                    className="px-6 py-3 bg-[#facc15] text-black font-bold text-base border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all"
                  >
                    Try This Now
                  </motion.button>
                </div>
              </div>
            </div>
          </div>

          {/* Wrapper for Feature 5 + Feature 6 with background */}
          <div className="relative -mx-6 px-6">
            {/* Comic rays background - full width */}
            {/* Comic rays background - full width */}
            <div
              className="absolute inset-0 left-1/2 -translate-x-1/2 w-screen opacity-[0.08] pointer-events-none"
              style={{
                maskImage: 'linear-gradient(to bottom, transparent, black 15%, black 85%, transparent)',
                WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 15%, black 85%, transparent)'
              }}
            >
              <Image
                src="/images/comic-rays-bg.jpg"
                alt=""
                fill
                className="object-cover"
                priority
              />
            </div>

            <div className="relative z-10">
              {/* Feature 5 - Text Left, Image Right */}
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div className="space-y-6 mt-8 md:mt-0">
                  <h3 className="text-3xl md:text-4xl font-black font-display">
                    MANGA CREATOR ONLINE — FULLY CUSTOMIZABLE
                  </h3>
                  <p className="text-base md:text-lg text-gray-700 leading-relaxed">
                    Your story, your characters, your visual identity. Fine-tune every detail: character appearance, art style, dialogue, panel layout, and story tone. Whether you want a dark shonen action saga or a lighthearted romance manga, our online manga creator gives you full creative control — with no watermark and commercial rights included.
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={scrollToForm}
                    className="px-6 py-3 bg-[#facc15] text-black font-bold text-sm md:text-base border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all"
                  >
                    Try This Now
                  </motion.button>
                </div>
                <div className="bg-white border-[4px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-2 md:p-3 relative overflow-visible">
                  <img
                    src="/images/feature-5-comic.jpg"
                    alt="Manga Comic Strip Example"
                    className="w-full h-auto object-cover border-[3px] border-black"
                  />
                  
                  {/* Overlapping circular bubble - Bottom Right */}
                  <div className="absolute -bottom-[28px] -right-[28px] md:-bottom-[56px] md:-right-[56px] z-10">
                    <div className="w-16 h-16 md:w-28 md:h-28 rounded-full border-[2px] md:border-[3px] border-black bg-white overflow-hidden">
                      <img
                        src="/images/feature-5-portrait.jpg"
                        alt="Character"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Feature 6 - Image Left, Text Right */}
              <div className="grid md:grid-cols-2 gap-8 items-center mt-16 md:mt-24">
                <div className="bg-white border-[4px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-2 md:p-3 order-2 md:order-1 relative overflow-visible">
                  <img
                    src="/images/feature-6-comic.jpg"
                    alt="Comic Strip Example"
                    className="w-full h-auto object-cover border-[3px] border-black"
                  />
                  
                  {/* Overlapping circular bubble - Top Left */}
                  <div className="absolute -top-[28px] -left-[28px] md:-top-[56px] md:-left-[56px] z-10">
                    <div className="w-16 h-16 md:w-28 md:h-28 rounded-full border-[2px] md:border-[3px] border-black bg-white overflow-hidden">
                      <img
                        src="/images/feature-6-portrait.jpg"
                        alt="Character"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-6 order-1 md:order-2 mt-8 md:mt-0">
                  <h3 className="text-3xl md:text-4xl font-black font-display">
                    DOWNLOAD, PRINT & SHARE YOUR COMIC BOOK
                  </h3>
                  <p className="text-base md:text-lg text-gray-700 leading-relaxed">
                    Once your manga or comic is generated, download it in high-resolution for digital use or order it as a custom printed physical comic book. Share your unique story on social media, offer it as a gift, or publish it as part of your personal comic book collection. The best way to make your own comic book — from AI to print.
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={scrollToForm}
                    className="px-6 py-3 bg-[#facc15] text-black font-bold text-sm md:text-base border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all"
                  >
                    Try This Now
                  </motion.button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section >

      {/* How It Works Section */}
      <section id="how-it-works" className="relative z-10 px-6 py-16 max-w-7xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-black text-center mb-16 font-display">
          HOW TO CREATE YOUR COMIC BOOK AND MANGA WITH AI
        </h2>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Step 1 - Add Characters & Choose Style */}
          <div className="relative bg-white border-[4px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6">
            {/* Number Badge */}
            <div className="absolute -top-4 -left-4 w-12 h-12 bg-[#facc15] border-[3px] border-black flex items-center justify-center">
              <span className="text-2xl font-black">1</span>
            </div>

            <h3 className="text-2xl md:text-3xl font-black mb-4 mt-4 font-display">ADD CHARACTERS AND CHOOSE STYLE</h3>

            {/* Mini Form Preview */}
            <div className="space-y-4">
              {/* Add Characters */}
              <div>
                <label className="text-sm font-bold text-[#ff0080] font-display tracking-wide">ADD CHARACTERS</label>
                <div className="flex items-center gap-4 mt-2">
                  {/* Yellow Circle with Plus */}
                  <div className="w-16 h-16 rounded-full bg-[#facc15] border-[3px] border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center">
                    <span className="text-3xl font-black leading-none">+</span>
                  </div>
                  <p className="text-sm font-bold text-gray-700">Add Character</p>
                </div>
              </div>

              {/* Select Style */}
              <div>
                <label className="text-sm font-bold text-[#ff0080] font-display tracking-wide">SELECT A STYLE</label>
                <div className="grid grid-cols-3 gap-1.5 mt-1">
                  <div className="bg-[#fbbf24] border-[2px] border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] p-1.5 text-center">
                    <div className="font-black text-sm font-display tracking-wide">COMIC</div>
                  </div>
                  <div className="bg-white border-[2px] border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] p-1.5 text-center">
                    <div className="font-black text-sm font-display tracking-wide">MANGA</div>
                  </div>
                  <div className="bg-white border-[2px] border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] p-1.5 text-center">
                    <div className="font-black text-sm font-display tracking-wide">MANHWA</div>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Step 2 - Write Your Story */}
          <div className="relative bg-white border-[4px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6">
            {/* Number Badge */}
            <div className="absolute -top-4 -left-4 w-12 h-12 bg-[#facc15] border-[3px] border-black flex items-center justify-center">
              <span className="text-2xl font-black">2</span>
            </div>

            <h3 className="text-2xl md:text-3xl font-black mb-2 mt-4 font-display">WRITE YOUR COMIC OR MANGA STORY WITH AI</h3>

            {/* Explanation Text */}
            <p className="text-base text-gray-700 mb-4 leading-relaxed">
              Write your comic book story or use our AI story generator for instant manga plot ideas. Click "Inspire Me" to generate stories. Complete creative control over your comic narrative!
            </p>

            {/* Story Input */}
            <div className="space-y-3">
              <div className="relative bg-white border-[3px] border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] p-4 pb-12 min-h-[120px]">
                <p className="text-sm text-gray-700 leading-relaxed" id="story-text-box2">
                  Shadow-like entities from a parallel dimension begin absorbing the world energy, slowly plunging cities into darkness...
                </p>
                {/* Category & Inspire Me Buttons - Static/Visual Only */}
                <div className="absolute bottom-2 right-2 flex items-center gap-2">
                  {/* Category Button */}
                  <div className="px-3 py-1.5 bg-white border-[2px] border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-bold text-xs flex items-center gap-1">
                    Category
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                      <path d="M6 9L12 15L18 9" stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  {/* Inspire Me Button */}
                  <div className="px-3 py-1.5 bg-[#facc15] border-[2px] border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-bold text-xs">
                    Inspire Me
                  </div>
                </div>
              </div>

              {/* Generate Button - Purple with Sparkle - Static/Visual Only */}
              <div className="w-full py-3 bg-[#6366f1] border-[3px] border-black font-bold text-base shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-center flex items-center justify-center gap-2">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M12 3L13.5 8.5L19 10L13.5 11.5L12 17L10.5 11.5L5 10L10.5 8.5L12 3Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M19 15L19.5 17L21.5 17.5L19.5 18L19 20L18.5 18L16.5 17.5L18.5 17L19 15Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="text-white">Generate</span>
              </div>
            </div>
          </div>

          {/* Step 3 - Read & Buy */}
          <div className="relative bg-white border-[4px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6">
            {/* Number Badge */}
            <div className="absolute -top-4 -left-4 w-12 h-12 bg-[#facc15] border-[3px] border-black flex items-center justify-center">
              <span className="text-2xl font-black">3</span>
            </div>

            <h3 className="text-2xl md:text-3xl font-black mb-4 mt-4 font-display">DOWNLOAD COMIC OR ORDER BOOK</h3>

            <div className="space-y-4">
              <p className="text-base text-gray-700 leading-relaxed text-left">
                Download your comic book in high-resolution digital format or order a custom printed physical book. Digital version included with every book order!
              </p>

              {/* Box for book image */}
              <div className="border-[3px] border-black overflow-hidden bg-white">
                <img
                  src="/images/physical-book.jpg"
                  alt="Physical Book and Digital Version"
                  className="w-full h-auto object-cover block"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* ============================================ */}
      {/* POWERFUL FEATURES SECTION - END             */}
      {/* ============================================ */}

      {/* Your Imagination is the Limit Section */}
      <section className="relative z-10 px-6 py-16 max-w-7xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-black text-center mb-4 font-display">
          CREATE UNLIMITED COMICS AND MANGA WITH AI GENERATOR
        </h2>

        {/* Scrolling Image Container */}
        <div className="relative overflow-hidden mt-12">
          {/* Gradient overlays for fade effect */}
          <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-[#fef3c7] to-transparent z-10 pointer-events-none"></div>
          <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-[#fef3c7] to-transparent z-10 pointer-events-none"></div>

          {/* Scrolling images */}
          <div className="flex gap-6 animate-scroll">
            {/* Original 5 images */}
            {[
              { image: '/images/example-scroll-3.jpg', num: 1 }, // Superman
              { image: '/images/example-scroll-4.jpg', num: 2 }, // Robbers
              { image: '/images/feature-5-main.jpg', num: 3 }, // School Romance
              { image: '/images/example-scroll-5.jpg', num: 4 }, // Harry Potter
              { image: '/images/feature-6-main.jpg', num: 5 },
            ].map((item, idx) => (
              <div key={`original-${idx}`} className="flex-shrink-0 w-96 h-96 bg-white border-[4px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
                <div className="relative w-full h-full">
                  <Image
                    src={item.image}
                    alt={`Comic Example ${item.num}`}
                    width={384}
                    height={384}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            ))}

            {/* Duplicate 5 images for seamless loop */}
            {[
              { image: '/images/example-scroll-3.jpg', num: 1 }, // Superman
              { image: '/images/example-scroll-4.jpg', num: 2 }, // Robbers
              { image: '/images/feature-5-main.jpg', num: 3 }, // School Romance
              { image: '/images/example-scroll-5.jpg', num: 4 }, // Harry Potter
              { image: '/images/feature-6-main.jpg', num: 5 },
            ].map((item, idx) => (
              <div key={`duplicate-${idx}`} className="flex-shrink-0 w-96 h-96 bg-white border-[4px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
                <div className="relative w-full h-full">
                  <Image
                    src={item.image}
                    alt={`Comic Example ${item.num}`}
                    width={384}
                    height={384}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Physical Book Section */}
      <section className="relative z-10 px-6 py-16 max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Text Content - Left */}
          <div className="space-y-6 relative">
            <h2 className="text-4xl md:text-5xl font-black font-display">
              ORDER YOUR CUSTOM PRINTED COMIC BOOK
            </h2>
            <p className="text-base text-gray-700 leading-relaxed">
              Download your comic book in high-resolution digital format or order a custom printed physical book. Create a personalized comic book gift for yourself or someone special. Your custom manga or comic book becomes a unique keepsake. Professional printing quality guaranteed!
            </p>
          </div>

          {/* Image - Right */}
          <div className="relative">
            <div className="bg-white border-[4px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
              <img
                src="/images/physical-book.jpg"
                alt="Custom printed comic book — Les Chroniques d'Astrea"
                className="w-full h-auto object-cover block"
              />
            </div>
            {/* Floating Coming Soon ribbon on image */}
            <div className="absolute -top-4 -right-4 z-20">
              <div className="relative">
                <div className="px-6 py-3 bg-[#facc15] border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transform rotate-3">
                  <span className="font-black text-base font-display tracking-wider">COMING SOON</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="relative z-10 px-6 py-16 max-w-7xl mx-auto">
        {/* Title */}
        <h2 className="text-4xl md:text-5xl font-black text-center mb-12 font-display">
          COMIC BOOK CREATOR REVIEWS AND TESTIMONIALS
        </h2>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Testimonial 1 - Speech Bubble Style */}
          <div className="relative">
            {/* Speech Bubble */}
            <div className="relative bg-white border-[3px] border-black rounded-3xl p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              {/* Stars */}
              <div className="flex gap-1 mb-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <span key={i} className="text-yellow-400 text-lg">★</span>
                ))}
              </div>

              {/* Review Text */}
              <p className="text-sm leading-relaxed font-medium">
                This AI comic generator helped me create my own manga where I'm the hero! The AI understood my story perfectly and the comic book quality is amazing. Best manga creator tool I've used!
              </p>

              {/* Speech Bubble Tail */}
              <div className="absolute -bottom-4 left-12 w-8 h-8 bg-white border-r-[3px] border-b-[3px] border-black transform rotate-45"></div>
            </div>

            {/* User Info - Below Bubble */}
            <div className="flex items-center gap-3 mt-6 ml-4">
              <Image
                src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop"
                alt="Testimonial"
                width={48}
                height={48}
                className="rounded-full border-[3px] border-black object-cover"
              />
              <div>
                <p className="font-black text-sm">Maya Patel</p>
                <p className="text-xs text-gray-600">Graphic Designer</p>
              </div>
            </div>
          </div>

          {/* Testimonial 2 - Speech Bubble Style */}
          <div className="relative pb-4">
            {/* Speech Bubble */}
            <div className="relative bg-white border-[3px] border-black rounded-3xl p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              {/* Stars */}
              <div className="flex gap-1 mb-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <span key={i} className="text-yellow-400 text-lg">★</span>
                ))}
              </div>

              {/* Review Text */}
              <p className="text-sm leading-relaxed font-medium">
                I used this comic book maker to create a superhero comic for my son's birthday. The AI comic generator made it so easy! High-quality printed book and he absolutely loves it.
              </p>

              {/* Speech Bubble Tail */}
              <div className="absolute -bottom-3 left-10 w-6 h-6 bg-white border-r-[3px] border-b-[3px] border-black transform rotate-45"></div>
            </div>

            {/* User Info - Below Bubble */}
            <div className="flex items-center gap-3 mt-5 ml-3">
              <Image
                src="https://images.unsplash.com/photo-1506277886164-e25aa3f4ef7f?w=100&h=100&fit=crop"
                alt="Testimonial"
                width={48}
                height={48}
                className="rounded-full border-[3px] border-black object-cover"
              />
              <div>
                <p className="font-black text-sm">Thomas Bergman</p>
                <p className="text-xs text-gray-600">Software Engineer</p>
              </div>
            </div>
          </div>

          {/* Testimonial 3 - Speech Bubble Style */}
          <div className="relative pb-4">
            <div className="relative bg-white border-[3px] border-black rounded-3xl p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="flex gap-1 mb-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <span key={i} className="text-yellow-400 text-lg">★</span>
                ))}
              </div>
              <p className="text-sm leading-relaxed font-medium">
                As a teacher, I use this AI comic creator to make educational comics for my students. They love seeing themselves as manga characters in our lessons. Perfect comic book generator for education!
              </p>
              <div className="absolute -bottom-3 left-10 w-6 h-6 bg-white border-r-[3px] border-b-[3px] border-black transform rotate-45"></div>
            </div>
            <div className="flex items-center gap-3 mt-5 ml-3">
              <Image
                src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop"
                alt="Testimonial"
                width={48}
                height={48}
                className="rounded-full border-[3px] border-black object-cover"
              />
              <div>
                <p className="font-black text-sm">Léa Dubois</p>
                <p className="text-xs text-gray-600">Middle School Teacher</p>
              </div>
            </div>
          </div>

          {/* Testimonial 4 - Speech Bubble Style */}
          <div className="relative pb-4">
            <div className="relative bg-white border-[3px] border-black rounded-3xl p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="flex gap-1 mb-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <span key={i} className="text-yellow-400 text-lg">★</span>
                ))}
              </div>
              <p className="text-sm leading-relaxed font-medium">
                This AI comic generator is incredibly smart! It captured my personality perfectly. I've created three different comic books already using this manga creator and each one is unique and special.
              </p>
              <div className="absolute -bottom-3 left-10 w-6 h-6 bg-white border-r-[3px] border-b-[3px] border-black transform rotate-45"></div>
            </div>
            <div className="flex items-center gap-3 mt-5 ml-3">
              <Image
                src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop"
                alt="Testimonial"
                width={48}
                height={48}
                className="rounded-full border-[3px] border-black object-cover"
              />
              <div>
                <p className="font-black text-sm">Jordan Mitchell</p>
                <p className="text-xs text-gray-600">Freelance Illustrator</p>
              </div>
            </div>
          </div>

          {/* Testimonial 5 - Speech Bubble Style */}
          <div className="relative pb-4">
            <div className="relative bg-white border-[3px] border-black rounded-3xl p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="flex gap-1 mb-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <span key={i} className="text-yellow-400 text-lg">★</span>
                ))}
              </div>
              <p className="text-sm leading-relaxed font-medium">
                I've always wanted to be in a Star Wars-style adventure. This comic book maker made it happen! The AI-generated artwork is stunning and the story integration is seamless.
              </p>
              <div className="absolute -bottom-3 left-10 w-6 h-6 bg-white border-r-[3px] border-b-[3px] border-black transform rotate-45"></div>
            </div>
            <div className="flex items-center gap-3 mt-5 ml-3">
              <Image
                src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop"
                alt="Testimonial"
                width={48}
                height={48}
                className="rounded-full border-[3px] border-black object-cover"
              />
              <div>
                <p className="font-black text-sm">Marcus Chen</p>
                <p className="text-xs text-gray-600">Product Manager</p>
              </div>
            </div>
          </div>

          {/* Testimonial 6 - Speech Bubble Style */}
          <div className="relative pb-4">
            <div className="relative bg-white border-[3px] border-black rounded-3xl p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="flex gap-1 mb-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <span key={i} className="text-yellow-400 text-lg">★</span>
                ))}
              </div>
              <p className="text-sm leading-relaxed font-medium">
                Best anniversary gift ever! I used this manga creator to make a romantic manga featuring me and my wife. She cried tears of joy when she saw the custom comic book. Absolutely magical experience!
              </p>
              <div className="absolute -bottom-3 left-10 w-6 h-6 bg-white border-r-[3px] border-b-[3px] border-black transform rotate-45"></div>
            </div>
            <div className="flex items-center gap-3 mt-5 ml-3">
              <Image
                src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop"
                alt="Testimonial"
                width={48}
                height={48}
                className="rounded-full border-[3px] border-black object-cover"
              />
              <div>
                <p className="font-black text-sm">Karim Benali</p>
                <p className="text-xs text-gray-600">Architect</p>
              </div>
            </div>
          </div>

          {/* Testimonial 7 - Speech Bubble Style */}
          <div className="relative pb-4">
            <div className="relative bg-white border-[3px] border-black rounded-3xl p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="flex gap-1 mb-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <span key={i} className="text-yellow-400 text-lg">★</span>
                ))}
              </div>
              <p className="text-sm leading-relaxed font-medium">
                The AI story generator "Inspire Me" feature is genius! When I'm stuck, this comic maker generates amazing plot ideas. I've discovered twists I never would have thought of myself.
              </p>
              <div className="absolute -bottom-3 left-10 w-6 h-6 bg-white border-r-[3px] border-b-[3px] border-black transform rotate-45"></div>
            </div>
            <div className="flex items-center gap-3 mt-5 ml-3">
              <Image
                src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop"
                alt="Testimonial"
                width={48}
                height={48}
                className="rounded-full border-[3px] border-black object-cover"
              />
              <div>
                <p className="font-black text-sm">Nina Kowalski</p>
                <p className="text-xs text-gray-600">Content Writer</p>
              </div>
            </div>
          </div>

          {/* Testimonial 8 - Speech Bubble Style */}
          <div className="relative pb-4">
            <div className="relative bg-white border-[3px] border-black rounded-3xl p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="flex gap-1 mb-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <span key={i} className="text-yellow-400 text-lg">★</span>
                ))}
              </div>
              <p className="text-sm leading-relaxed font-medium">
                I created a DBZ-style manga using this AI comic creator where I'm a Saiyan warrior. The attention to detail and art style matching is incredible. Living my childhood dream with this comic book generator!
              </p>
              <div className="absolute -bottom-3 left-10 w-6 h-6 bg-white border-r-[3px] border-b-[3px] border-black transform rotate-45"></div>
            </div>
            <div className="flex items-center gap-3 mt-5 ml-3">
              <Image
                src="https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&h=100&fit=crop"
                alt="Testimonial"
                width={48}
                height={48}
                className="rounded-full border-[3px] border-black object-cover"
              />
              <div>
                <p className="font-black text-sm">Yuki Tanaka</p>
                <p className="text-xs text-gray-600">UX Designer</p>
              </div>
            </div>
          </div>

          {/* Testimonial 9 - Speech Bubble Style */}
          <div className="relative pb-4">
            <div className="relative bg-white border-[3px] border-black rounded-3xl p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="flex gap-1 mb-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <span key={i} className="text-yellow-400 text-lg">★</span>
                ))}
              </div>
              <p className="text-sm leading-relaxed font-medium">
                The high-resolution output from this comic book maker is perfect for printing. I ordered the physical book and it looks professional. My friends can't believe I created my own comic book!
              </p>
              <div className="absolute -bottom-3 left-10 w-6 h-6 bg-white border-r-[3px] border-b-[3px] border-black transform rotate-45"></div>
            </div>
            <div className="flex items-center gap-3 mt-5 ml-3">
              <Image
                src="https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=100&h=100&fit=crop"
                alt="Testimonial"
                width={48}
                height={48}
                className="rounded-full border-[3px] border-black object-cover"
              />
              <div>
                <p className="font-black text-sm">Sofia Andersson</p>
                <p className="text-xs text-gray-600">Marketing Specialist</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* FAQ SECTION - START                         */}
      {/* Frequently Asked Questions with accordion   */}
      {/* ============================================ */}
      <section className="relative z-10 px-6 py-16 max-w-4xl mx-auto">
        {/* Title */}
        <h2 className="text-4xl md:text-5xl font-black text-center mb-12 font-display">
          FREQUENTLY ASKED QUESTIONS
        </h2>

        {/* FAQ Accordion */}
        <div className="space-y-4">
          {[
            {
              q: "HOW DOES THE AI COMIC GENERATOR WORK?",
              a: "Our AI analyzes your story input and selected style (Comic, Manga, or Manhwa) to generate unique, high-quality comic panels. You can write your own story or use our 'Inspire Me' feature to get AI-generated plot ideas. The AI then creates artwork that matches your chosen universe (Star Wars, Disney, Naruto, DBZ, or Harry Potter) while making you the hero of the story."
            },
            {
              q: "CAN I REALLY BE THE HERO IN MY OWN COMIC?",
              a: "Absolutely! That's the core feature of our platform. You become the main character in your personalized comic book. Whether you want to be a Jedi in Star Wars, a wizard in Harry Potter, or a Saiyan in DBZ, our AI creates a story where you're the protagonist."
            },
            {
              q: "WHAT STYLES ARE AVAILABLE?",
              a: "We offer three distinct artistic styles: Comic (Western superhero style), Manga (Japanese anime style), and Manhwa (Korean webtoon style). Each style has its own unique visual characteristics and storytelling approach."
            },
            {
              q: "WHICH UNIVERSES CAN I CHOOSE FROM?",
              a: "Currently, we support five popular universes: Star Wars, Disney, Naruto, Dragon Ball Z, and Harry Potter. Each universe comes with its own themed fonts, color schemes, and storytelling elements to create an authentic experience."
            },
            {
              q: "DO I NEED WRITING SKILLS TO CREATE A COMIC BOOK?",
              a: "No! Our AI comic generator makes it easy for anyone to create comics. You can write your own story or use our AI story generator 'Inspire Me' feature to generate compelling manga and comic book plots. No writing experience needed!"
            },
            {
              q: "HOW FAST CAN I CREATE MY COMIC BOOK WITH AI?",
              a: "Our AI comic generator creates your personalized comic book in just a few minutes! The generation time depends on story length and complexity. Simply submit your story and preferences, and our AI quickly transforms it into a professional comic."
            },
            {
              q: "CAN I ORDER A PRINTED COMIC BOOK?",
              a: "Yes! We provide high-resolution digital comics perfect for printing. Order a custom printed comic book version to create an amazing personalized gift or keepsake. The physical book printing service is available after you create your comic."
            },
            {
              q: "WHAT RESOLUTION ARE THE COMIC BOOK FILES?",
              a: "All comic books are generated in high-resolution format, perfect for both digital reading and professional printing. The output quality ensures crisp, clear comic panels whether you're viewing on screen or ordering a physical printed book."
            },
            {
              q: "WHAT COMIC STYLES AND ART FORMATS ARE AVAILABLE?",
              a: "We offer multiple art styles including manga, webtoon, superhero comics, and more. You can choose from various universes like Star Wars, Disney, Naruto, DBZ, and Harry Potter, or create your own unique style. Each style is optimized for both digital and print formats."
            },
            {
              q: "HOW MANY COMIC BOOKS CAN I CREATE WITH MY PLAN?",
              a: "With our Monthly and Yearly plans, you enjoy unlimited credits to create as many comic books and manga as you want! Our One-Time plan includes a set number of credits for a specific project. Check our pricing section for detailed plan comparisons."
            },
            {
              q: "CAN I USE THIS AI COMIC MAKER FOR EDUCATION?",
              a: "Absolutely! Many teachers use our AI comic maker to create educational comics and manga for students. It's a fantastic way to make learning engaging by turning students into comic book characters in historical events, scientific discoveries, or literary adventures."
            },
            {
              q: "CAN I CREATE PERSONALIZED COMIC BOOK GIFTS?",
              a: "Yes! Our AI comic generator makes incredibly unique personalized comic book gifts. Many users create custom manga and comics for birthdays, anniversaries, graduations, or special occasions. The printed book option makes it even more special!"
            },
            {
              q: "WHO OWNS THE RIGHTS TO MY COMIC BOOK CREATIONS?",
              a: "You retain full ownership of your original stories and the comic books generated from them. However, please note that universes like Star Wars, Disney, Naruto, etc., are trademarked properties, so commercial use of those themed comics may be restricted."
            },
            {
              q: "CAN I SHARE MY COMIC BOOK ON SOCIAL MEDIA?",
              a: "Yes! You're free to share your digital comic books and manga on social media platforms. Many comic creators love sharing their AI-generated creations with friends and family online to showcase their unique stories."
            },
            {
              q: "CAN I GENERATE DIFFERENT COMIC BOOK VERSIONS?",
              a: "Yes! You can create multiple versions of your comic book with different art styles, settings, or story variations. Each new generation is a separate comic creation, allowing you to explore different artistic directions and manga styles for your story."
            },
            {
              q: "IS MY COMIC BOOK STORY DATA KEPT PRIVATE?",
              a: "Yes, we take privacy seriously. Your comic book stories and personal data are kept confidential and secure. We never share your creative content or AI-generated comics with third parties."
            },
            {
              q: "HOW DOES THE AI COMIC BOOK GENERATOR WORK?",
              a: "Our AI comic book generator uses advanced technology to transform your story and photo into professional comic art. Simply upload your photo, choose your preferred manga or comic style, write or generate your story with AI, and our generator creates stunning comic book panels in minutes."
            },
            {
              q: "WHAT ARE YOUR COMIC BOOK CREATION PRICING PLANS?",
              a: "We offer flexible pricing plans: a Monthly and Yearly plan with unlimited credits, and a One-Time plan with a set amount of credits. Check our pricing section for detailed plan comparisons and features."
            },
            {
              q: "WHAT PAYMENT METHODS FOR COMIC BOOK ORDERS?",
              a: "We accept all major credit cards, PayPal, and other popular payment methods for your comic book and manga orders. All transactions are secured and encrypted for your safety."
            },
            {
              q: "HOW DO I START CREATING MY COMIC BOOK?",
              a: "Simply click 'Get Started' to begin creating your comic book! Choose your manga or comic style and universe, upload your photo, write or AI-generate your story, and let our comic generator create your personalized comic book. The process is intuitive and takes just minutes!"
            }
          ].map((faq, index) => (
            <div key={index} className="bg-white border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <button
                onClick={() => {
                  const answer = document.getElementById(`faq-${index}`);
                  const icon = document.getElementById(`icon-${index}`);
                  if (answer && icon) {
                    answer.classList.toggle('hidden');
                    icon.classList.toggle('rotate-90');
                  }
                }}
                className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
              >
                <span className="font-black text-sm md:text-base pr-4">{faq.q}</span>
                <div
                  id={`icon-${index}`}
                  className="flex-shrink-0 w-10 h-10 bg-[#facc15] border-[2px] border-black rounded-full flex items-center justify-center transition-transform duration-300"
                >
                  <ChevronRight className="w-5 h-5 text-black" strokeWidth={3} />
                </div>
              </button>
              <div id={`faq-${index}`} className="hidden px-6 pb-4">
                <p className="text-sm text-gray-700 leading-relaxed">{faq.a}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
      {/* ============================================ */}
      {/* FAQ SECTION - END                           */}
      {/* ============================================ */}


      {/* Footer */}
      <Footer />

      {/* Loading Popup */}
      <LoadingPopup
        isOpen={isLoadingPopupOpen}
        selectedStyle={selectedStyle || 'manga'}
        onComplete={handleLoadingComplete}
      />

      {/* Result Ready Popup */}
      <ResultReadyPopup
        isOpen={isResultReadyPopupOpen}
        selectedStyle={selectedStyle || 'manga'}
        onContinue={handleResultReadyContinue}
      />

      {/* Authentication Popup */}
      <AuthPopup isOpen={isAuthPopupOpen} onClose={closeAuthPopup} onLogin={handleLogin} />

      {/* Add Character Popup */}
      <AddCharacterPopup
        isOpen={isAddCharacterPopupOpen}
        onClose={closeAddCharacterPopup}
        onCharacterSelect={handleCharacterSelect}
        onCreateCustom={openCreateCharacterPopup}
      />

      {/* Create Character Popup */}
      <CreateCharacterPopup
        isOpen={isCreateCharacterPopupOpen}
        onClose={closeCreateCharacterPopup}
        onBack={backToAddCharacter}
        onCharacterCreate={handleCustomCharacterCreate}
        editingCharacter={editingCharacter}
        existingCharacters={selectedCharacters}
      />
    </div >
  );
}

