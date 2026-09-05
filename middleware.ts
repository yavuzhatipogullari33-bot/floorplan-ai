import { withAuth } from 'next-auth/middleware';

export default withAuth({
  pages: {
    signIn: '/sign-in',
  },
});

export const config = {
  matcher: ['/dashboard/:path*', '/editor/:path*', '/api/projects/:path*'],
};
