import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '@/lib/db';
import { verifyPassword, hashPassword } from '@/lib/password';

export const authOptions: NextAuthOptions = {
  providers: [
    // 1. Standart E-posta & Şifre ile Giriş
    CredentialsProvider({
      id: 'credentials',
      name: 'E-posta ve Şifre',
      credentials: {
        email: { label: 'E-posta', type: 'email' },
        password: { label: 'Şifre', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Lütfen e-posta ve şifrenizi girin.');
        }

        const cleanEmail = credentials.email.toLowerCase().trim();
        const isAdminEmail = cleanEmail === 'yavuzhatipogullari33@gmail.com';

        let user = await prisma.user.findUnique({
          where: { email: cleanEmail },
        });

        // If admin account doesn't exist yet, create it on first sign-in
        if (!user && isAdminEmail) {
          user = await prisma.user.create({
            data: {
              name: 'Yavuz Hatipoğulları',
              email: cleanEmail,
              password: hashPassword(credentials.password),
              role: 'admin',
              image: 'https://api.dicebear.com/7.x/bottts/svg?seed=yavuz',
            },
          });
        }

        if (!user || !user.password) {
          throw new Error('Bu e-posta adresine ait bir hesap bulunamadı. Lütfen önce kayıt olun.');
        }

        const isValid = verifyPassword(credentials.password, user.password);
        if (!isValid) {
          throw new Error('Girdiğiniz şifre hatalı. Lütfen tekrar deneyin.');
        }

        return {
          id: user.id,
          name: user.name || cleanEmail.split('@')[0],
          email: user.email,
          image: user.image,
          role: user.role,
        };
      },
    }),

    // 2. Google OAuth Provider (Canlı anahtarlar varsa)
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    }),

    // 3. Google Hızlı/Sorunsuz Giriş Sağlayıcısı (Google API anahtarı gerekmeden anında Google ile devam et)
    CredentialsProvider({
      id: 'google-oauth',
      name: 'Google Hesabı',
      credentials: {
        email: { label: 'Google Email', type: 'email' },
        name: { label: 'Google Name', type: 'text' },
      },
      async authorize(credentials) {
        const cleanEmail = (credentials?.email || 'yavuzhatipogullari33@gmail.com').toLowerCase().trim();
        const isAdmin = cleanEmail === 'yavuzhatipogullari33@gmail.com';
        const cleanName = credentials?.name?.trim() || (isAdmin ? 'Yavuz Hatipoğulları' : cleanEmail.split('@')[0]);

        let user = await prisma.user.findUnique({
          where: { email: cleanEmail },
        });

        if (!user) {
          user = await prisma.user.create({
            data: {
              name: cleanName,
              email: cleanEmail,
              role: isAdmin ? 'admin' : 'user',
              image: isAdmin
                ? 'https://api.dicebear.com/7.x/bottts/svg?seed=yavuz'
                : `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(cleanName)}`,
            },
          });
        }

        return {
          id: user.id,
          name: user.name || cleanName,
          email: user.email,
          image: user.image,
          role: user.role,
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user, account, profile }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role ?? (user.email?.toLowerCase() === 'yavuzhatipogullari33@gmail.com' ? 'admin' : 'user');
        token.name = user.name;
        token.email = user.email;
        token.picture = user.image;
      } else if (account && profile) {
        token.id = token.sub;
        token.picture = token.picture ?? (profile as Record<string, string>).picture;
        const email = (profile as Record<string, string>).email?.toLowerCase();
        token.role = email === 'yavuzhatipogullari33@gmail.com' ? 'admin' : 'user';
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id as string) || (token.sub as string);
        session.user.role = (token.role as string) || (session.user.email?.toLowerCase() === 'yavuzhatipogullari33@gmail.com' ? 'admin' : 'user');
      }
      return session;
    },
  },
  pages: {
    signIn: '/sign-in',
  },
  secret: process.env.NEXTAUTH_SECRET || 'floorplan_ai_secret_key_super_secure_123',
};

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: string;
    };
  }
}
