'use client';

export default function CreatePage() {
    return (
        <div className="min-h-screen bg-[#F8F7FF] flex items-center justify-center p-6">
            <div className="max-w-4xl w-full">
                <div className="bg-white border-[4px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-12 text-center">
                    <h1 className="text-4xl md:text-5xl font-black mb-6 font-display">
                        WELCOME TO YOUR CREATION SPACE
                    </h1>
                    <p className="text-xl text-gray-700 mb-8">
                        This page will be designed later. You're now ready to start creating your comics!
                    </p>
                    <div className="inline-block px-8 py-4 bg-[#facc15] text-black font-bold text-lg border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                        Coming Soon...
                    </div>
                </div>
            </div>
        </div>
    );
}
