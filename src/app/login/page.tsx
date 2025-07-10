import SpotifyLoginButton from '@/components/spotify-login-button';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Connect to VibeScape
          </h1>
          <p className="text-sm text-muted-foreground">
            Sign in with your Spotify account to continue
          </p>
        </div>
        <SpotifyLoginButton />
        <p className="px-8 text-center text-sm text-muted-foreground">
          By clicking continue, you agree to connect your Spotify account.
        </p>
      </div>
    </div>
  );
}
