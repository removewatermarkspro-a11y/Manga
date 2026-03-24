import Image from 'next/image';

export default function HeroSection() {
    return (
        <div className="max-w-4xl mx-auto text-center space-y-6 mb-12">
            {/* Social Proof - Avatars */}
            <div className="flex items-center justify-center gap-2">
                {/* Stacked Avatars */}
                <div className="flex -space-x-2">
                    <div className="w-8 h-8 rounded-full border-2 border-black overflow-hidden">
                        <Image
                            src="/images/avatars/avatar-1.png"
                            alt="User"
                            width={32}
                            height={32}
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <div className="w-8 h-8 rounded-full border-2 border-black overflow-hidden">
                        <Image
                            src="/images/avatars/avatar-2.png"
                            alt="User"
                            width={32}
                            height={32}
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <div className="w-8 h-8 rounded-full border-2 border-black overflow-hidden">
                        <Image
                            src="/images/avatars/avatar-3.png"
                            alt="User"
                            width={32}
                            height={32}
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <div className="w-8 h-8 rounded-full border-2 border-black overflow-hidden">
                        <Image
                            src="/images/avatars/avatar-4.png"
                            alt="User"
                            width={32}
                            height={32}
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <div className="w-8 h-8 rounded-full border-2 border-black bg-[#6366f1] flex items-center justify-center text-white font-bold text-[10px]">
                        +20k
                    </div>
                </div>
                {/* Text */}
                <p className="text-xs font-medium text-gray-700">
                    Trusted by <span className="font-bold">20,000+ users</span>
                </p>
            </div>

            {/* Title */}
            {/* Title */}
            <h1 className="text-4xl lg:text-5xl font-black leading-tight tracking-wider font-display">
                #1 AI MANGA MAKER & COMIC BOOK GENERATOR
            </h1>

            {/* Description */}
            <p className="text-base text-gray-700 leading-relaxed max-w-xl mx-auto">
                Create your own manga and comics instantly with the best AI manga generator. Our manga maker transforms your stories into professional comic book panels requiring no drawing skills. Use our AI comic factory to generate anime, webtoons, and manga pages in seconds. The ultimate manga creator for every storyteller.
            </p>
        </div>
    );
}
