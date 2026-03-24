import Image from 'next/image';

export default function Footer() {
    return (
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
                    </nav>
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
    );
}
