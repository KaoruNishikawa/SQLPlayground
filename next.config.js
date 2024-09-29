/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'export',
    webpack: (config) => {
        config.resolve.fallback = { fs: false }
        return config
    },
    webpack5: true
}

module.exports = nextConfig
