import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        domains:['img.freepik.com','lh3.googleusercontent.com','cdn-icons-png.flaticon.com','oqaqnjpovruuqpuohjbp.supabase.co']
    },
    webpack: (config) => {
        config.resolve.alias = {
            ...config.resolve.alias,
            '@': path.resolve(__dirname),
        };
        return config;
    },
};

export default nextConfig;
