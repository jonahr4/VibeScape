"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";

type LoadingScreenProps = {
  messages?: string[];
  // Time each message stays visible before switching
  intervalMs?: number;
  fullScreen?: boolean;
};

export default function LoadingScreen({
  messages = [
    "Loading your favorite hits…",
    "Analyzing your connections…",
    "Creating the graph…",
    "Tuning the vibe…",
  ],
  // Twice as long as before: 3600ms default
  intervalMs = 3600,
  fullScreen = false,
}: LoadingScreenProps) {
  const safeMessages = useMemo(() => (messages.length ? messages : ["Loading…"]), [messages]);

  // Double-buffered crossfade
  const [showA, setShowA] = useState(true);
  const [msgA, setMsgA] = useState(safeMessages[0]);
  const [msgB, setMsgB] = useState(safeMessages[1 % safeMessages.length] ?? safeMessages[0]);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      const next = (idx + 1) % safeMessages.length;
      if (showA) {
        setMsgB(safeMessages[next]);
      } else {
        setMsgA(safeMessages[next]);
      }
      setIdx(next);
      setShowA((s) => !s);
    }, intervalMs);
    return () => clearInterval(id);
  }, [idx, safeMessages, intervalMs, showA]);

  return (
    <div className={(fullScreen ? "min-h-screen" : "min-h-[60vh]") + " flex items-center justify-center"}>
      <div className="flex flex-col items-center gap-4 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Please wait a moment…</p>
          <div className="relative h-6">{/* reserve height to avoid layout shift */}
            <p
              className={
                "absolute inset-0 transition-opacity duration-700 " +
                (showA ? "opacity-100 animate-[pulse_6s_ease-in-out_infinite]" : "opacity-0")
              }
            >
              {msgA}
            </p>
            <p
              className={
                "absolute inset-0 transition-opacity duration-700 " +
                (!showA ? "opacity-100 animate-[pulse_6s_ease-in-out_infinite]" : "opacity-0")
              }
            >
              {msgB}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
