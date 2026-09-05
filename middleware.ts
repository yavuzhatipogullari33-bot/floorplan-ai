import { withAuth } from 'next-auth/middleware';

export default withAuth({
  secret: process.env.NEXTAUTH_SECRET || 'floorplan_ai_secret_key_super_secure_123',
  pages: {
    signIn: '/sign-in',
  },
});

export const config = {
  matcher: ['/dashboard/:path*', '/editor/:path*'],
};

