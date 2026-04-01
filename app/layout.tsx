import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import StructuredData from "@/components/StructuredData";
import { AuthProvider } from "@/contexts/AuthContext";

const inter = Inter({
    subsets: ["latin"],
    weight: ["400", "700", "900"],
    variable: "--font-inter",
});

export const metadata: Metadata = {
    title: "AI Comic Generator - Create Your Own Personalized Comics & Manga | Be the Hero",
    description: "Create personalized comics and manga where YOU are the hero! Choose from Star Wars, Disney, Naruto, DBZ, or Harry Potter universes. AI-powered comic generation with high-resolution output. Perfect for gifts, education, or personal enjoyment.",
    keywords: [
        "AI comic generator",
        "create your own comic",
        "personalized manga",
        "AI manga generator",
        "custom comic book",
        "Star Wars comic creator",
        "Disney comic maker",
        "Naruto style comic",
        "Dragon Ball Z comic",
        "Harry Potter comic",
        "AI comic book maker",
        "digital comic creator",
        "manga creator online",
        "comic book gift",
        "educational comics",
        "AI storytelling",
        "comic book printing",
        "manhwa creator",
    ],
    authors: [{ name: "AI Comic Generator" }],
    creator: "AI Comic Generator",
    publisher: "AI Comic Generator",
    formatDetection: {
        email: false,
        address: false,
        telephone: false,
    },
    metadataBase: new URL('https://aicomicgenerator.com'),
    alternates: {
        canonical: '/',
    },
    openGraph: {
        title: "AI Comic Generator - Create Your Own Personalized Comics & Manga",
        description: "Become the hero of your own comic book! AI-powered generation with Star Wars, Disney, Naruto, DBZ, and Harry Potter universes. High-resolution output for digital or print.",
        url: 'https://aicomicgenerator.com',
        siteName: 'AI Comic Generator',
        images: [
            {
                url: '/images/og-image.jpg',
                width: 1200,
                height: 630,
                alt: 'AI Comic Generator - Create Your Own Comics',
            },
        ],
        locale: 'en_US',
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: "AI Comic Generator - Be the Hero of Your Own Story",
        description: "Create personalized comics & manga with AI. Choose your universe, write your story, become the hero!",
        images: ['/images/twitter-image.jpg'],
        creator: '@aicomicgen',
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
        },
    },
    verification: {
        google: 'your-google-verification-code',
        // yandex: 'your-yandex-verification-code',
        // bing: 'your-bing-verification-code',
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <head>
                <StructuredData />
            </head>
            <body className={`${inter.variable} font-sans antialiased`}>
                <AuthProvider>
                    {children}
                </AuthProvider>
            </body>
        </html>
    );
}
