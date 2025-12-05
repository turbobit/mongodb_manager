import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

// 허용된 이메일/도메인 체크 함수
function isEmailAllowed(email: string): boolean {
  if (!email) return false;

  // 허용된 특정 이메일들 (쉼표로 구분)
  const allowedEmails = process.env.ALLOWED_EMAILS?.split(',').map(e => e.trim()) || [];
  if (allowedEmails.includes(email)) {
    return true;
  }

  // 허용된 도메인들 (쉼표로 구분)
  const allowedDomains = process.env.ALLOWED_DOMAINS?.split(',').map(d => d.trim()) || ['2weeks.co'];
  
  return allowedDomains.some(domain => email.endsWith(`@${domain}`));
}

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      // 환경변수로 설정된 도메인/이메일만 허용
      if (user.email && isEmailAllowed(user.email)) {
        return true;
      }
      return false; // 허용되지 않은 이메일은 거절
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  debug: process.env.NODE_ENV === 'development',
});

export { handler as GET, handler as POST }; 