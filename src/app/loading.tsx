import LoadingScreen from "@/components/loading-screen";

export default function Loading() {
  return (
    <LoadingScreen
      fullScreen
      messages={[
        "Loading your favorite hits…",
        "Analyzing your connections…",
        "Creating the graph…",
        "Tuning the vibe…",
      ]}
      intervalMs={3600}
    />
  );
}

