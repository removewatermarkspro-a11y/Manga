/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    images: {
        remotePatterns: [
            { protocol: 'https', hostname: 'images.unsplash.com' },
            { protocol: 'https', hostname: 'replicate.delivery' },
            { protocol: 'https', hostname: '*.replicate.delivery' },
            { protocol: 'https', hostname: 'replicate.com' },
            { protocol: 'https', hostname: '*.replicate.com' },
            { protocol: 'https', hostname: 'static.aiquickdraw.com' }
        ],
    },
    eslint: {
        ignoreDuringBuilds: true,
    },
    typescript: {
        ignoreBuildErrors: true,
    },
    serverActions: {
        bodySizeLimit: '10mb',
    },
}

module.exports = nextConfig
