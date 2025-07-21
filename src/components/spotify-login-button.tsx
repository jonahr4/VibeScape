'use client';

import { Button } from '@/components/ui/button';

const SpotifyIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    role="img"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <title>Spotify</title>
    <path
      d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.903 17.553c-.15.242-.44.317-.683.166-1.928-1.18-4.373-1.45-7.243-.793-.28.066-.56-.11-.625-.39-.066-.28.11-.56.39-.626 3.11-.716 5.793-.41 7.893 1.28.243.15.317.44.166.683zm1.403-2.914c-.182.293-.55.388-.843.205-2.228-1.353-5.583-1.76-8.313-.96-.328.098-.663-.11-.76-.438-.1-.328.11-.663.438-.76 3.018-.87 6.723-.418 9.245 1.132.293.182.388.55.205.843zm.134-3.142C15.22 9.42 8.805 9.172 5.165 10.25c-.39.113-.793-.112-.905-.503s.113-.793.503-.905c3.992-1.157 10.938-.876 13.593 1.543.32.29.373.76.12 1.08-.25.32-.72.373-1.04.12z"
      fill="currentColor"
    />
  </svg>
);

export default function SpotifyLoginButton() {
  const handleLogin = () => {
    window.location.href = '/api/auth/spotify';
  };

  return (
    <Button
      variant="outline"
      size="sm"
      type="button"
      onClick={handleLogin}
      className="flex items-center gap-2"
    >
      <SpotifyIcon className="h-4 w-4" />
      Login with Spotify
    </Button>
  );
}
