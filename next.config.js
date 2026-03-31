/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    images: {
        remotePatterns: [
            { protocol: 'https', hostname: 'images.unsplash.com' },
            { protocol: 'https', hostname: 'replicate.delivery' },
            { protocol: 'https', hostname: '*.replicate.delivery' },
            { protocol: 'https', hostname: 'replicate.com' },
            { protocol: 'https', hostname: '*.replicate.com' }
        ],
    },
    eslint: {
        ignoreDuringBuilds: true,
    },
    typescript: {
        ignoreBuildErrors: true,
    },
    experimental: {
        serverActions: {
            bodySizeLimit: '10mb',
        },
    },
}

module.exports = nextConfig
