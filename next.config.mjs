// Fix NextAuth Vercel URL issue
if (process.env.VERCEL_URL && !process.env.VERCEL_URL.startsWith('http')) {
  process.env.VERCEL_URL = `https://${process.env.VERCEL_URL}`;
}
if (!process.env.NEXTAUTH_URL || !process.env.NEXTAUTH_URL.startsWith('http')) {
  process.env.NEXTAUTH_URL = process.env.VERCEL_URL || 'https://floorplan-ai.vercel.app';
}
if (!process.env.NEXTAUTH_SECRET) {
  process.env.NEXTAUTH_SECRET = 'floorplan_ai_secret_key_super_secure_123';
}
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'file:./dev.db';
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
      },
    ],
  },
};

export default nextConfig;
