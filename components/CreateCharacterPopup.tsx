'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CreateCharacterPopupProps {
    isOpen: boolean;
    onClose: () => void;
    onBack: () => void;
    onCharacterCreate: (character: { id: string, name: string, image: string, gender?: string, age?: string, role?: string }) => void;
    editingCharacter?: { id: string, name: string, image: string, gender?: string, age?: string, role?: string } | null;
    existingCharacters?: Array<{ id: string, name: string, image: string, gender?: string, age?: string, role?: string }>;
}

export default function CreateCharacterPopup({ isOpen, onClose, onBack, onCharacterCreate, editingCharacter, existingCharacters = [] }: CreateCharacterPopupProps) {
    const [characterName, setCharacterName] = useState('');
    const [selectedRole, setSelectedRole] = useState<string>('');
    const [uploadedImage, setUploadedImage] = useState<string | null>(null);
    const [showPhotoSourceModal, setShowPhotoSourceModal] = useState(false);

    // Error states
    const [errors, setErrors] = useState({
        photo: false,
        name: false,
        role: false
    });

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setUploadedImage(reader.result as string);
                setErrors(prev => ({ ...prev, photo: false }));
            };
            reader.readAsDataURL(file);
        }
    };

    const resetForm = () => {
        setCharacterName('');
        setSelectedRole('');
        setUploadedImage(null);
        setShowPhotoSourceModal(false);
        setErrors({ photo: false, name: false, role: false });
    };

    const handleAddCharacter = () => {
        // Check all fields
        const newErrors = {
            photo: !uploadedImage,
            name: !characterName.trim(),
            role: !selectedRole
        };

        setErrors(newErrors);

        // Find first error and scroll to it
        const errorFields = [
            { key: 'photo', id: 'photo-upload-section' },
            { key: 'name', id: 'name-input-section' },
            { key: 'role', id: 'role-section' }
        ];

        for (const field of errorFields) {
            if (newErrors[field.key as keyof typeof newErrors]) {
                const element = document.getElementById(field.id);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
                return;
            }
        }

        // All fields valid - create character
        const newCharacter = {
            id: editingCharacter?.id || Date.now().toString(),
            name: characterName,
            image: uploadedImage!,
            role: selectedRole
        };
        onCharacterCreate(newCharacter);
        resetForm();
    };

    useEffect(() => {
        if (!isOpen) {
            resetForm();
        }
    }, [isOpen]);

    // Pre-fill form when editing
    useEffect(() => {
        if (editingCharacter) {
            setCharacterName(editingCharacter.name);
            setSelectedRole(editingCharacter.role || '');
            setUploadedImage(editingCharacter.image);
        }
    }, [editingCharacter]);

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
                        <div className="bg-white border-[4px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            {/* Header */}
                            <div className="bg-white border-b-[3px] border-black p-6 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={onBack}
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
                            <div className="p-6 space-y-6">
                                {/* Photo Upload Area */}
                                <div id="photo-upload-section" className="flex flex-col items-center">
                                    {errors.photo && <p className="text-red-500 font-bold text-sm mb-2">Please add a photo</p>}
                                    <div
                                        onClick={() => setShowPhotoSourceModal(true)}
                                        className={`w-64 h-64 border-[4px] ${errors.photo ? 'border-red-500' : 'border-black'} rounded-3xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white flex flex-col items-center justify-center hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all overflow-hidden cursor-pointer`}
                                    >
                                        {uploadedImage ? (
                                            <img src={uploadedImage} alt="Uploaded character" className="w-full h-full object-cover" />
                                        ) : (
                                            <>
                                                <div className="relative mb-4">
                                                    <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center">
                                                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                                                            <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                                            <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                                        </svg>
                                                    </div>
                                                    <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-green-500 flex items-center justify-center border-[2px] border-white">
                                                        <span className="text-white text-xl font-bold leading-none">+</span>
                                                    </div>
                                                </div>
                                                <p className="text-base font-bold text-black">Tap to add photo</p>
                                            </>
                                        )}
                                    </div>

                                    {/* Hidden file input */}
                                    <input
                                        id="photo-upload-input"
                                        type="file"
                                        onChange={handleImageUpload}
                                        className="hidden"
                                        accept="image/*"
                                    />
                                </div>

                                {/* Photo Source Modal */}
                                {showPhotoSourceModal && (
                                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center" onClick={() => setShowPhotoSourceModal(false)}>
                                        <div className="bg-white border-[4px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex items-center justify-between mb-6">
                                                <h3 className="text-xl font-black text-black">Add a Photo</h3>
                                                <button onClick={() => setShowPhotoSourceModal(false)} className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 transition-colors">
                                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                                        <path d="M18 6L6 18M6 6L18 18" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                    </svg>
                                                </button>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                {/* Take Picture */}
                                                <button
                                                    onClick={() => {
                                                        document.getElementById('photo-upload-input')?.setAttribute('capture', 'environment');
                                                        document.getElementById('photo-upload-input')?.click();
                                                        setShowPhotoSourceModal(false);
                                                    }}
                                                    className="flex flex-col items-center justify-center p-6 border-[3px] border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all bg-white"
                                                >
                                                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" className="mb-3">
                                                        <path d="M23 19C23 19.5304 22.7893 20.0391 22.4142 20.4142C22.0391 20.7893 21.5304 21 21 21H3C2.46957 21 1.96086 20.7893 1.58579 20.4142C1.21071 20.0391 1 19.5304 1 19V8C1 7.46957 1.21071 6.96086 1.58579 6.58579C1.96086 6.21071 2.46957 6 3 6H7L9 3H15L17 6H21C21.5304 6 22.0391 6.21071 22.4142 6.58579C22.7893 6.96086 23 7.46957 23 8V19Z" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                        <circle cx="12" cy="13" r="4" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                    </svg>
                                                    <span className="font-bold text-sm text-center">Take Picture</span>
                                                </button>

                                                {/* Choose from Library */}
                                                <button
                                                    onClick={() => {
                                                        document.getElementById('photo-upload-input')?.removeAttribute('capture');
                                                        document.getElementById('photo-upload-input')?.click();
                                                        setShowPhotoSourceModal(false);
                                                    }}
                                                    className="flex flex-col items-center justify-center p-6 border-[3px] border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all bg-white"
                                                >
                                                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" className="mb-3">
                                                        <rect x="3" y="3" width="18" height="18" rx="2" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                        <circle cx="8.5" cy="8.5" r="1.5" fill="black" />
                                                        <path d="M21 15L16 10L5 21" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                    </svg>
                                                    <span className="font-bold text-sm text-center">Choose from Library</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Character Name */}
                                <div id="name-input-section" className="space-y-3">
                                    <label className={`text-lg font-black ${errors.name ? 'text-red-500' : 'text-black'}`}>
                                        Character Name {errors.name && <span className="text-sm font-bold">(Required)</span>}
                                    </label>
                                    <input
                                        type="text"
                                        value={characterName}
                                        onChange={(e) => {
                                            setCharacterName(e.target.value);
                                            if (e.target.value.trim()) setErrors(prev => ({ ...prev, name: false }));
                                        }}
                                        placeholder="Enter character name"
                                        className={`w-full px-4 py-3 border-[3px] ${errors.name ? 'border-red-500' : 'border-black'} shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-base focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all rounded-xl`}
                                    />
                                </div>

                                {/* Character Role */}
                                <div id="role-section" className="space-y-3">
                                    <label className={`text-lg font-black ${errors.role ? 'text-red-500' : 'text-black'}`}>
                                        Character Role {errors.role && <span className="text-sm font-bold">(Required)</span>}
                                    </label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {['Main Character', 'Friend', 'Girlfriend', 'Boyfriend', 'Villain', 'Pet'].map((role) => {
                                            // Check if Main Character is already used by another character (not the one being edited)
                                            const isMainCharacterTaken = role === 'Main Character' &&
                                                existingCharacters.some(c => c.role === 'Main Character' && c.id !== editingCharacter?.id);
                                            const isDisabled = isMainCharacterTaken;

                                            // Show glow effect only for Main Character when not selected and not disabled
                                            const showGlow = role === 'Main Character' && !isDisabled && selectedRole !== role;

                                            return (
                                                <button
                                                    key={role}
                                                    onClick={() => {
                                                        if (!isDisabled) {
                                                            setSelectedRole(role);
                                                            setErrors(prev => ({ ...prev, role: false }));
                                                        }
                                                    }}
                                                    disabled={isDisabled}
                                                    className={`px-4 py-2 h-14 border-[3px] font-bold text-base transition-all rounded-xl flex flex-col items-center justify-center ${showGlow
                                                        ? 'shadow-[2px_2px_0px_0px_#facc15] hover:shadow-[4px_4px_0px_0px_#facc15]'
                                                        : 'shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                                                        } ${errors.role
                                                            ? 'border-red-500'
                                                            : showGlow
                                                                ? 'border-[#facc15] bg-white'
                                                                : 'border-black'
                                                        } ${isDisabled
                                                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed opacity-60'
                                                            : selectedRole === role
                                                                ? 'bg-[#facc15]'
                                                                : showGlow
                                                                    ? ''
                                                                    : 'bg-white hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                                                        }`}
                                                >
                                                    <span>{role}</span>
                                                    {isDisabled && <span className="text-[10px] leading-tight">(Already assigned)</span>}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Add Button */}
                                <div className="pt-4">
                                    <button
                                        onClick={handleAddCharacter}
                                        disabled={!uploadedImage || !characterName}
                                        className={`w-full px-6 py-4 border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-black text-lg transition-all hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] ${uploadedImage && characterName ? 'bg-[#6366f1] text-white cursor-pointer' : 'bg-gray-200 cursor-not-allowed opacity-50'
                                            }`}
                                    >
                                        Add Character
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
