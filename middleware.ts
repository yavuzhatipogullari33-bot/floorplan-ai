import { withAuth } from 'next-auth/middleware';

if (!process.env.NEXTAUTH_URL || !process.env.NEXTAUTH_URL.startsWith('http')) {
  if (process.env.VERCEL_URL) {
    process.env.NEXTAUTH_URL = `https://${process.env.VERCEL_URL}`;
  } else {
    process.env.NEXTAUTH_URL = 'https://floorplan-ai.vercel.app';
  }
}

export default withAuth({
  pages: {
    signIn: '/sign-in',
  },
});

export const config = {
  matcher: ['/dashboard/:path*', '/editor/:path*', '/api/projects/:path*'],
};
