import { type NextAuthOptions } from 'next-auth';
import SpotifyProvider from 'next-auth/providers/spotify';

// Scopes needed by this app
const SPOTIFY_SCOPES = [
  'user-read-email',
  'user-read-private',
  'playlist-read-private',
  'playlist-read-collaborative',
  'user-top-read',
  'user-read-recently-played',
].join(' ');

async function refreshAccessToken(token: any): Promise<any> {
  try {
    const basicAuth = Buffer.from(
      `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`,
    ).toString('base64');

    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${basicAuth}`,
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: token.refreshToken,
      }),
    });

    const refreshed = await response.json();
    if (!response.ok) throw refreshed;

    return {
      ...token,
      accessToken: refreshed.access_token,
      accessTokenExpires: Date.now() + refreshed.expires_in * 1000, // ms
      // Spotify may not return a new refresh token, re-use the old one
      refreshToken: refreshed.refresh_token ?? token.refreshToken,
    };
  } catch (error) {
    console.error('Failed to refresh Spotify access token', error);
    return { ...token, error: 'RefreshAccessTokenError' };
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    SpotifyProvider({
      clientId: process.env.SPOTIFY_CLIENT_ID!,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET!,
      authorization: {
        params: { scope: SPOTIFY_SCOPES },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account, user }) {
      // Initial sign-in
      if (account && user) {
        return {
          ...token,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          accessTokenExpires: account.expires_at
            ? account.expires_at * 1000
            : Date.now() + 3600 * 1000,
        };
      }

      // Return previous token if the access token has not expired yet
      if (token.accessToken && token.accessTokenExpires && Date.now() < (token.accessTokenExpires as number) - 60_000) {
        return token;
      }

      // Access token has expired, try to refresh it
      return refreshAccessToken(token);
    },
    async session({ session, token }) {
      (session as any).accessToken = token.accessToken;
      (session as any).error = token.error;
      return session;
    },
  },
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
  },
};
