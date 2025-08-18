import SignInButton from "@/components/auth/SignInButton";

export default function LoginPage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-4">
        <h1 className="text-2xl font-bold">Sign in to VibeScape</h1>
        <p className="text-muted-foreground">Connect your Spotify account to visualize playlists and get mood-based recommendations.</p>
        <div className="flex justify-center">
          <SignInButton />
        </div>
      </div>
    </div>
  );
}
