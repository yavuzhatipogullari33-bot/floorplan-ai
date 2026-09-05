// Ensure NEXTAUTH_URL is valid before next-auth imports
if (!process.env.NEXTAUTH_URL || !process.env.NEXTAUTH_URL.startsWith('http')) {
  process.env.NEXTAUTH_URL = 'https://floorplan-ai.vercel.app';
}

import { withAuth } from 'next-auth/middleware';

export default withAuth({
  pages: {
    signIn: '/sign-in',
  },
});

export const config = {
  matcher: ['/dashboard/:path*', '/editor/:path*', '/api/projects/:path*'],
};
