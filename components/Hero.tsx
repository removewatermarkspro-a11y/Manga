'use client';

import { useState, useEffect, useRef } from 'react';
import { Upload, Sparkles, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import AuthPopup from './AuthPopup';
import AddCharacterPopup from './AddCharacterPopup';
import CreateCharacterPopup from './CreateCharacterPopup';
import LoadingPopup from './LoadingPopup';
import ResultReadyPopup from './ResultReadyPopup';

type StyleType = 'comic' | 'manga' | 'manhwa';

export default function Hero() {
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
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  // Check login status on mount
  useEffect(() => {
    const loggedIn = localStorage.getItem('isLoggedIn') === 'true';
    console.log('Checking login status:', loggedIn, 'localStorage value:', localStorage.getItem('isLoggedIn'));
    setIsLoggedIn(loggedIn);
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
    setIsLoggedIn(true);
    localStorage.setItem('isLoggedIn', 'true');
  };

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    window.location.href = '/';
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

  // Removed custom useEffect outside click logic here as it triggers before link clicks.

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
      setIsLoadingPopupOpen(true);
    }
  };

  const handleLoadingComplete = () => {
    setIsLoadingPopupOpen(false);

    // If user is already logged in, skip the ResultReadyPopup and go directly to results
    if (isLoggedIn) {
      window.location.href = '/pricing';
    } else {
      // Show ResultReadyPopup for non-logged in users
      setIsResultReadyPopupOpen(true);
    }
  };

  const handleResultReadyContinue = () => {
    setIsResultReadyPopupOpen(false);
    // Set user as logged in
    setIsLoggedIn(true);
    localStorage.setItem('isLoggedIn', 'true');
    // Redirect to results page
    window.location.href = '/pricing';
  };
  // Example placeholders - you can replace these with actual image paths later
  const examples = [
    { id: 1, name: 'Example 1' },
    { id: 2, name: 'Example 2' },
    { id: 3, name: 'Example 3' },
    { id: 4, name: 'Example 4' },
  ];

  // Auto-scroll carousel every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentExample((prev) => (prev + 1) % examples.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [examples.length]);

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
          radial-gradient(circle, rgba(150, 150, 150, 0.1) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(240, 235, 255, 0.3) 0%, rgba(240, 235, 255, 0.6) 25%, rgba(245, 242, 255, 0.4) 50%, rgba(252, 251, 255, 1) 100%)
        `,
        backgroundSize: '8px 8px, 100% 100%',
        backgroundPosition: '0 0, 0 0',
        width: '100%',
      }}
    >

      {/* Header */}
      <header className="relative z-10 px-6 py-6 flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <a href="/" className="cursor-pointer">
            <Image
              src="/images/logo.png"
              alt="AI Comic Generator"
              width={200}
              height={80}
              className="h-24 w-auto"
            />
          </a>
        </div>

        {/* Navigation Menu */}
        <div className="flex items-center gap-8">
          {/* Features Link */}
          <a
            href="#features"
            className="text-black font-bold text-base hover:text-[#6366f1] transition-colors cursor-pointer"
          >
            Features
          </a>

          {/* Testimonials Link */}
          <a
            href="#testimonials"
            className="text-black font-bold text-base hover:text-[#6366f1] transition-colors cursor-pointer"
          >
            Testimonials
          </a>

          {/* Language Selector */}
          <div className="flex items-center gap-2 cursor-pointer hover:opacity-70 transition-opacity">
            <svg width="24" height="18" viewBox="0 0 24 18" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="24" height="18" fill="#B22234" />
              <path d="M0 2.77H24M0 5.54H24M0 8.31H24M0 11.08H24M0 13.85H24M0 16.62H24" stroke="white" strokeWidth="1.38" />
              <rect width="9.6" height="7.71" fill="#3C3B6E" />
              <g fill="white">
                <circle cx="1.2" cy="1.15" r="0.46" />
                <circle cx="2.4" cy="1.15" r="0.46" />
                <circle cx="3.6" cy="1.15" r="0.46" />
                <circle cx="4.8" cy="1.15" r="0.46" />
                <circle cx="6" cy="1.15" r="0.46" />
                <circle cx="7.2" cy="1.15" r="0.46" />
                <circle cx="8.4" cy="1.15" r="0.46" />
                <circle cx="1.8" cy="2.31" r="0.46" />
                <circle cx="3" cy="2.31" r="0.46" />
                <circle cx="4.2" cy="2.31" r="0.46" />
                <circle cx="5.4" cy="2.31" r="0.46" />
                <circle cx="6.6" cy="2.31" r="0.46" />
                <circle cx="7.8" cy="2.31" r="0.46" />
                <circle cx="1.2" cy="3.46" r="0.46" />
                <circle cx="2.4" cy="3.46" r="0.46" />
                <circle cx="3.6" cy="3.46" r="0.46" />
                <circle cx="4.8" cy="3.46" r="0.46" />
                <circle cx="6" cy="3.46" r="0.46" />
                <circle cx="7.2" cy="3.46" r="0.46" />
                <circle cx="8.4" cy="3.46" r="0.46" />
                <circle cx="1.8" cy="4.62" r="0.46" />
                <circle cx="3" cy="4.62" r="0.46" />
                <circle cx="4.2" cy="4.62" r="0.46" />
                <circle cx="5.4" cy="4.62" r="0.46" />
                <circle cx="6.6" cy="4.62" r="0.46" />
                <circle cx="7.8" cy="4.62" r="0.46" />
                <circle cx="1.2" cy="5.77" r="0.46" />
                <circle cx="2.4" cy="5.77" r="0.46" />
                <circle cx="3.6" cy="5.77" r="0.46" />
                <circle cx="4.8" cy="5.77" r="0.46" />
                <circle cx="6" cy="5.77" r="0.46" />
                <circle cx="7.2" cy="5.77" r="0.46" />
                <circle cx="8.4" cy="5.77" r="0.46" />
                <circle cx="1.8" cy="6.92" r="0.46" />
                <circle cx="3" cy="6.92" r="0.46" />
                <circle cx="4.2" cy="6.92" r="0.46" />
                <circle cx="5.4" cy="6.92" r="0.46" />
                <circle cx="6.6" cy="6.92" r="0.46" />
                <circle cx="7.8" cy="6.92" r="0.46" />
              </g>
            </svg>
            <span className="text-black font-bold text-base">EN</span>
          </div>

          {/* Get Started / Profile + Get Pro Buttons */}
          {isLoggedIn ? (
            <div className="flex items-center gap-4">
              {/* Profile Button with Dropdown */}
              <div ref={profileDropdownRef} className="relative">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                  className="px-5 py-2 bg-white text-black font-bold text-base border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all"
                >
                  Profile
                </motion.button>

                {/* Dropdown Menu */}
                {isProfileDropdownOpen && (
                  <>
                    {/* Transparent overlay to close dropdown when clicking outside */}
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsProfileDropdownOpen(false)}
                    />
                    <div className="absolute top-full mt-2 left-0 bg-white rounded-lg shadow-lg min-w-[240px] z-50 overflow-hidden">
                      {/* Email Header */}
                      <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
                        <p className="text-sm font-bold text-gray-800 truncate">user@example.com</p>
                      </div>

                      {/* My Creations */}
                      <a
                        href="/my-creations"
                        className="w-full px-4 py-3 text-left text-sm font-bold hover:bg-gray-100 transition-all cursor-pointer block"
                      >
                        My Creations
                      </a>

                      {/* Logout */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleLogout();
                        }}
                        className="w-full px-4 py-3 text-left text-sm font-bold hover:bg-gray-100 transition-all cursor-pointer flex items-center gap-2 text-red-600"
                      >
                        <span>↪</span>
                        <span>Logout</span>
                      </button>
                    </div>
                  </>
                )}
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-5 py-2 bg-[#facc15] text-black font-bold text-base border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all"
              >
                Get Pro
              </motion.button>
            </div>
          ) : (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={openAuthPopup}
              className="px-5 py-2 bg-[#facc15] text-black font-bold text-base border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all"
            >
              Get Started
            </motion.button>
          )}
        </div>
      </header>

      {/* Main Hero Section */}
      <main className="relative z-10 px-6 py-8 max-w-7xl mx-auto">
        {/* Centered Top Content */}
        <div className="max-w-4xl mx-auto text-center space-y-6 mb-12">
          {/* Social Proof - Avatars */}
          <div className="flex items-center justify-center gap-2 mb-4">
            {/* Stacked Avatars */}
            <div className="flex -space-x-1.5">
              <div className="w-6 h-6 rounded-full border border-black overflow-hidden">
                <Image
                  src="/images/avatars/avatar-1.png"
                  alt="User"
                  width={24}
                  height={24}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="w-6 h-6 rounded-full border border-black overflow-hidden">
                <Image
                  src="/images/avatars/avatar-2.png"
                  alt="User"
                  width={24}
                  height={24}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="w-6 h-6 rounded-full border border-black overflow-hidden">
                <Image
                  src="/images/avatars/avatar-3.png"
                  alt="User"
                  width={24}
                  height={24}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="w-6 h-6 rounded-full border border-black overflow-hidden">
                <Image
                  src="/images/avatars/avatar-4.png"
                  alt="User"
                  width={24}
                  height={24}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="w-6 h-6 rounded-full border border-black bg-[#6366f1] flex items-center justify-center text-white font-bold text-[8px]">
                +20k
              </div>
            </div>
            {/* Text */}
            <p className="text-[10px] sm:text-xs font-medium text-gray-700">
              Trusted by <span className="font-bold">20,000+ users</span>
            </p>
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
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-black leading-tight tracking-wider font-display uppercase drop-shadow-sm mb-6">
              CREATE COMIC BOOKS AND MANGA ONLINE <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#6366f1] to-[#8b5cf6]">WITH AI</span>
            </h1>
          </motion.div>

          {/* Description */}
          <p className="text-base text-gray-700 leading-relaxed max-w-xl mx-auto">
            Create stunning comics, webtoons, and manga in minutes with our AI generator. Choose your style—from superhero to romantic manga—and bring your professional comic strips to life instantly. No drawing skills required!
          </p>

          {/* Mobile CTA and Marquee */}
          <div className="flex flex-col items-center lg:hidden w-full mt-8 overflow-hidden space-y-6">
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
                    <p className="text-base text-gray-700 leading-relaxed font-bold">
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


          {/* Right Column - Carousel (Hidden on mobile as we now have the marquee) */}
          <div className="hidden lg:block lg:order-2">
            {/* Example Carousel - Auto-scrolling */}
            <div className="relative bg-white border-[4px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-4 overflow-hidden rounded-xl">

              {/* Carousel Container */}
              <div className="relative h-[300px] lg:h-[450px]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentExample}
                    initial={{ opacity: 0, x: 100 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ duration: 0.5 }}
                    className="absolute inset-0"
                  >
                    {/* Example Content - Placeholder structure matching the uploaded image */}
                    <div className="grid grid-rows-4 gap-3 h-full">
                      {/* Row 1 - Large panel */}
                      <div className="relative h-full bg-gradient-to-br from-orange-200 to-orange-300 border-[3px] border-black overflow-hidden">
                        <div className="absolute inset-0 flex items-center justify-center text-6xl">
                          🎬
                        </div>
                        <div className="absolute top-2 right-2 bg-white/90 px-3 py-1 border-2 border-black text-sm font-bold">
                          Example {currentExample + 1}
                        </div>
                      </div>

                      {/* Row 2 - Three panels */}
                      <div className="grid grid-cols-3 gap-3 h-full">
                        {[1, 2, 3].map((i) => (
                          <div
                            key={i}
                            className="relative bg-gradient-to-br from-blue-200 to-blue-300 border-[3px] border-black overflow-hidden"
                          >
                            <div className="absolute inset-0 flex items-center justify-center text-3xl">
                              {i === 1 ? '´' : i === 2 ? 'ðŸ’‘' : '­'}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Row 3 - Medium panel */}
                      <div className="relative h-full bg-gradient-to-br from-purple-200 to-purple-300 border-[3px] border-black overflow-hidden">
                        <div className="absolute inset-0 flex items-center justify-center text-5xl">
                          🎆
                        </div>
                      </div>

                      {/* Row 4 - Medium panel */}
                      <div className="relative h-full bg-gradient-to-br from-pink-200 to-pink-300 border-[3px] border-black overflow-hidden">
                        <div className="absolute inset-0 flex items-center justify-center text-5xl">
                          🌅
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Navigation Dots */}
              <div className="flex items-center justify-center gap-2 mt-4">
                {examples.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentExample(index)}
                    className={`w-3 h-3 border-2 border-black transition-all ${currentExample === index ? 'bg-[#4ade80] scale-125' : 'bg-white hover:bg-gray-200'
                      }`}
                    aria-label={`Go to example ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Social Proof - Full Width */}
        <div className="mt-8 relative p-4 bg-white border-[4px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl">
          <div className="flex items-center justify-between gap-4">
            {/* Stats Bubble - Left */}
            <div className="relative flex-shrink-0">
              <div className="bg-white border-[3px] border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-lg">
                <div className="text-center">
                  <p className="text-sm font-bold mb-1">Fast. Easy. Custom</p>
                  <p className="text-2xl font-black font-display">+20,000</p>
                  <p className="text-base font-bold">Happy Users</p>
                </div>
              </div>
            </div>

            {/* Center Text */}
            <div className="flex-1 text-center px-4">
              <p className="text-lg font-medium text-gray-800">
                Over <span className="font-black">20,000 happy customers</span> who want to tell their stories.
              </p>
            </div>

            {/* #1 Badge - Right */}
            <div className="relative flex-shrink-0">
              <div className="bg-white border-[3px] border-black p-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-lg text-center">
                <div className="text-2xl font-black mb-1 text-[#eab308]">#1</div>
                <div className="text-sm font-bold text-[#eab308] mb-2">COMIC BOOK APP</div>
                <div className="flex gap-1 justify-center">
                  <span className="text-[#eab308] text-lg">★</span>
                  <span className="text-[#eab308] text-lg">★</span>
                  <span className="text-[#eab308] text-lg">★</span>
                  <span className="text-[#eab308] text-lg">★</span>
                  <span className="text-[#eab308] text-lg">★</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main >






      {/* Powerful Features Section */}
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
                  onClick={scrollToForm}
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
                      src="/images/character-photo-1.jpg"
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

            {/* Feature 2 - Image Left, Text Right */}
            <div className="grid md:grid-cols-2 gap-8 items-center mt-24">
              <div className="bg-white border-[4px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-8 aspect-square flex items-center justify-center order-2 md:order-1 relative">
                {/* Overlapping circular bubbles */}
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                  <div className="w-28 h-28 rounded-full border-[3px] border-black bg-white flex items-center justify-center">
                    <span className="text-xs text-gray-400">Photo 1</span>
                  </div>
                  <div className="w-28 h-28 rounded-full border-[3px] border-black bg-white flex items-center justify-center">
                    <span className="text-xs text-gray-400">Photo 2</span>
                  </div>
                  <div className="w-28 h-28 rounded-full border-[3px] border-black bg-white flex items-center justify-center">
                    <span className="text-xs text-gray-400">Photo 3</span>
                  </div>
                </div>
                <p className="text-gray-400 text-xl font-bold">Feature Image 2</p>
              </div>
              <div className="space-y-6 order-1 md:order-2">
                <h3 className="text-3xl md:text-4xl font-black font-display">
                  MULTIPLE STYLES
                </h3>
                <p className="text-base md:text-lg text-gray-700 leading-relaxed">
                  Choose from Comic, Manga, or Manhwa styles to perfectly match your creative vision. Each style brings its unique aesthetic to your stories.
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

        <div className="space-y-24">

          {/* Wrapper for Feature 3 + Feature 4 with background */}
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
              {/* Gradient fade at top and bottom - matches page gradient at ~40-60% */}
              <div className="absolute inset-0 bg-gradient-to-b from-[rgba(224,215,255,0.96)] via-transparent to-[rgba(224,215,255,0.94)]" />
            </div>

            <div className="relative z-10">
              {/* Feature 3 - Text Left, Image Right */}
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div className="space-y-6">
                  <h3 className="text-3xl md:text-4xl font-black font-display">
                    UNIVERSE THEMES
                  </h3>
                  <p className="text-base md:text-lg text-gray-700 leading-relaxed">
                    Bring your favorite universes to life! From Star Wars to Naruto, create stories in iconic worlds with authentic styling and atmosphere.
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
                <div className="bg-white border-[4px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-8 aspect-square flex items-center justify-center relative">
                  {/* Overlapping circular bubbles */}
                  {/* Top-left bubble */}
                  <div className="absolute -top-6 -left-6 z-10">
                    <div className="w-28 h-28 rounded-full border-[3px] border-black bg-white flex items-center justify-center">
                      <span className="text-xs text-gray-400">Photo 1</span>
                    </div>
                  </div>
                  {/* Bottom-right bubble */}
                  <div className="absolute -bottom-6 -right-6 z-10">
                    <div className="w-28 h-28 rounded-full border-[3px] border-black bg-white flex items-center justify-center">
                      <span className="text-xs text-gray-400">Photo 2</span>
                    </div>
                  </div>
                  <p className="text-gray-400 text-xl font-bold">Feature Image 3</p>
                </div>
              </div>

              {/* Feature 4 - Image Left, Text Right */}
              <div className="grid md:grid-cols-2 gap-8 items-center mt-24">
                <div className="bg-white border-[4px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-8 aspect-square flex items-center justify-center order-2 md:order-1 relative">
                  {/* Overlapping circular bubbles */}
                  {/* Top-left bubble */}
                  <div className="absolute -top-6 -left-6 z-10">
                    <div className="w-28 h-28 rounded-full border-[3px] border-black bg-white flex items-center justify-center">
                      <span className="text-xs text-gray-400">Photo 1</span>
                    </div>
                  </div>
                  {/* Bottom-right bubble */}
                  <div className="absolute -bottom-6 -right-6 z-10">
                    <div className="w-28 h-28 rounded-full border-[3px] border-black bg-white flex items-center justify-center">
                      <span className="text-xs text-gray-400">Photo 2</span>
                    </div>
                  </div>
                  <p className="text-gray-400 text-xl font-bold">Feature Image 4</p>
                </div>
                <div className="space-y-6 order-1 md:order-2">
                  <h3 className="text-3xl md:text-4xl font-black font-display">
                    INSTANT RESULTS
                  </h3>
                  <p className="text-base md:text-lg text-gray-700 leading-relaxed">
                    No waiting around! Get your comic strips generated in seconds. Fast processing means you can iterate and perfect your stories quickly.
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
            <div className="absolute inset-0 left-1/2 -translate-x-1/2 w-screen opacity-[0.08] pointer-events-none">
              <Image
                src="/images/comic-rays-bg.jpg"
                alt=""
                fill
                className="object-cover"
                priority
              />
              {/* Gradient fade at top and bottom - matches page gradient at ~60-80% */}
              <div className="absolute inset-0 bg-gradient-to-b from-[rgba(224,215,255,0.94)] via-transparent to-[rgba(248,247,255,0.99)]" />
            </div>

            <div className="relative z-10">
              {/* Feature 5 - Text Left, Image Right */}
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div className="space-y-6">
                  <h3 className="text-3xl md:text-4xl font-black font-display">
                    EASY CUSTOMIZATION
                  </h3>
                  <p className="text-base md:text-lg text-gray-700 leading-relaxed">
                    Fine-tune every detail with our intuitive interface. Adjust styles, characters, and scenes to create exactly what you envision.
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
                <div className="bg-white border-[4px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-8 aspect-square flex items-center justify-center relative">
                  {/* Overlapping circular bubbles */}
                  {/* Top-left bubble */}
                  <div className="absolute -top-6 -left-6 z-10">
                    <div className="w-28 h-28 rounded-full border-[3px] border-black bg-white flex items-center justify-center">
                      <span className="text-xs text-gray-400">Photo 1</span>
                    </div>
                  </div>
                  {/* Bottom-right bubble */}
                  <div className="absolute -bottom-6 -right-6 z-10">
                    <div className="w-28 h-28 rounded-full border-[3px] border-black bg-white flex items-center justify-center">
                      <span className="text-xs text-gray-400">Photo 2</span>
                    </div>
                  </div>
                  <p className="text-gray-400 text-xl font-bold">Feature Image 5</p>
                </div>
              </div>

              {/* Feature 6 - Image Left, Text Right */}
              <div className="grid md:grid-cols-2 gap-8 items-center mt-24">
                <div className="bg-white border-[4px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-8 aspect-square flex items-center justify-center order-2 md:order-1 relative">
                  {/* Overlapping circular bubbles */}
                  {/* Top-left bubble */}
                  <div className="absolute -top-6 -left-6 z-10">
                    <div className="w-28 h-28 rounded-full border-[3px] border-black bg-white flex items-center justify-center">
                      <span className="text-xs text-gray-400">Photo 1</span>
                    </div>
                  </div>
                  {/* Bottom-right bubble */}
                  <div className="absolute -bottom-6 -right-6 z-10">
                    <div className="w-28 h-28 rounded-full border-[3px] border-black bg-white flex items-center justify-center">
                      <span className="text-xs text-gray-400">Photo 2</span>
                    </div>
                  </div>
                  <p className="text-gray-400 text-xl font-bold">Feature Image 6</p>
                </div>
                <div className="space-y-6 order-1 md:order-2">
                  <h3 className="text-3xl md:text-4xl font-black font-display">
                    SHARE & EXPORT
                  </h3>
                  <p className="text-base md:text-lg text-gray-700 leading-relaxed">
                    Download your creations in high quality or share them directly to social media. Your stories deserve to be seen by the world!
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

              {/* Select Universe */}
              <div>
                <label className="text-sm font-bold text-[#ff0080] font-display tracking-wide">SELECT UNIVERSE <span className="text-[#eab308]">(OPTIONAL)</span></label>
                <div className="grid grid-cols-3 gap-1.5 mt-1">
                  <div className="bg-white border-[2px] border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] p-1.5 text-center">
                    <div className="font-black text-[11px] font-display tracking-wider">STAR WARS</div>
                  </div>
                  <div className="bg-white border-[2px] border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] p-1.5 text-center">
                    <div className="font-black text-[11px] font-display tracking-wider">DISNEY</div>
                  </div>
                  <div className="bg-white border-[2px] border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] p-1.5 text-center">
                    <div className="font-black text-[11px] font-display tracking-wider">NARUTO</div>
                  </div>
                  <div className="bg-white border-[2px] border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] p-1.5 text-center">
                    <div className="font-black text-[11px] font-display tracking-wider">DBZ</div>
                  </div>
                  <div className="bg-white border-[2px] border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] p-1.5 text-center">
                    <div className="font-black text-[11px] font-display tracking-wider">HARRY POTTER</div>
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

              {/* Placeholder for book image */}
              <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border-[3px] border-black p-4 aspect-square flex items-center justify-center">
                <div className="text-center">
                  <p className="text-6xl mb-2"></p>
                  <p className="text-xs font-bold text-gray-600">Physical Book<br />+ Digital Version</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

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
              { color: 'from-blue-100 to-blue-200', num: 1 },
              { color: 'from-purple-100 to-purple-200', num: 2 },
              { color: 'from-pink-100 to-pink-200', num: 3 },
              { color: 'from-green-100 to-green-200', num: 4 },
              { color: 'from-orange-100 to-orange-200', num: 5 },
            ].map((item, idx) => (
              <div key={`original-${idx}`} className="flex-shrink-0 w-80 h-96 bg-white border-[4px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
                <div className={`w-full h-full bg-gradient-to-br ${item.color} flex items-center justify-center`}>
                  <p className="text-gray-400 font-bold text-xl">Comic Example {item.num}</p>
                </div>
              </div>
            ))}

            {/* Duplicate 5 images for seamless loop */}
            {[
              { color: 'from-blue-100 to-blue-200', num: 1 },
              { color: 'from-purple-100 to-purple-200', num: 2 },
              { color: 'from-pink-100 to-pink-200', num: 3 },
              { color: 'from-green-100 to-green-200', num: 4 },
              { color: 'from-orange-100 to-orange-200', num: 5 },
            ].map((item, idx) => (
              <div key={`duplicate-${idx}`} className="flex-shrink-0 w-80 h-96 bg-white border-[4px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
                <div className={`w-full h-full bg-gradient-to-br ${item.color} flex items-center justify-center`}>
                  <p className="text-gray-400 font-bold text-xl">Comic Example {item.num}</p>
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
            <div className="bg-white border-[4px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-8 aspect-square flex items-center justify-center">
              <div className="text-center">
                <p className="text-6xl mb-4">📚</p>
                <p className="text-xl font-bold text-gray-600">Physical Book Image</p>
                <p className="text-sm text-gray-500 mt-2">Replace with actual book photo</p>
              </div>
            </div>
            {/* Floating Coming Soon ribbon on image */}
            <div className="absolute -top-4 -right-4 z-20">
              <div className="relative">
                <div className="px-6 py-3 bg-[#facc15] border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transform rotate-3">
                  <span className="font-black text-base font-display tracking-wider">COMING SOON</span>
                </div>
                {/* Small sparkle decoration */}
                <div className="absolute -top-3 -right-3 text-2xl animate-bounce">✨</div>
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

      {/* FAQ Section */}
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

      {/* Footer */}
      <footer className="relative z-10 bg-black mt-16">
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Main Footer Content */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-6">
            {/* Logo */}
            <div>
              <a href="/" className="inline-block cursor-pointer">
                <Image
                  src="/images/logo.png"
                  alt="AI Comic Generator"
                  width={200}
                  height={80}
                  className="h-20 w-auto"
                />
              </a>
            </div>

            {/* Navigation Links */}
            <nav className="flex gap-8">
              <a href="#features" className="text-white font-medium hover:text-gray-300 transition-colors">Features</a>
              <a href="#how-it-works" className="text-white font-medium hover:text-gray-300 transition-colors">How it work</a>
              <a href="#testimonials" className="text-white font-medium hover:text-gray-300 transition-colors">Testimonials</a>
              <a href="#pricing" className="text-white font-medium hover:text-gray-300 transition-colors">Pricing</a>
            </nav>

            {/* Social Icons */}
            <div className="flex gap-3">
              <a href="#" className="w-10 h-10 bg-[#facc15] border-[2px] border-black rounded-full flex items-center justify-center hover:scale-110 transition-transform">
                <span className="text-black font-bold text-lg">f</span>
              </a>
              <a href="#" className="w-10 h-10 bg-[#facc15] border-[2px] border-black rounded-full flex items-center justify-center hover:scale-110 transition-transform">
                <span className="text-black font-bold text-lg">𝕏</span>
              </a>
              <a href="#" className="w-10 h-10 bg-[#facc15] border-[2px] border-black rounded-full flex items-center justify-center hover:scale-110 transition-transform">
                <span className="text-black font-bold text-lg">in</span>
              </a>
            </div>
          </div>

          {/* Copyright & Legal */}
          <div className="text-center pt-6 border-t border-gray-700">
            <p className="text-sm text-gray-300 mb-3">
              © 2026 AI Comic Generator. All rights reserved.
            </p>
            <div className="flex justify-center gap-6 text-xs text-gray-400">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-white transition-colors">Legal Notice</a>
              <a href="#" className="hover:text-white transition-colors">Cookie Policy</a>
            </div>
          </div>
        </div>
      </footer>

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
