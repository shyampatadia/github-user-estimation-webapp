import { RealtimeDashboard } from "@/components/realtime-dashboard";

export const metadata = {
  title: "Realtime | GitHub User Estimation",
  description: "Live GitHub frontier tracking - watch new accounts being created in real-time",
};

export default function RealtimePage() {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-foreground">Realtime Monitor</h1>
          <span className="flex items-center gap-1.5 rounded-full bg-red-500/10 border border-red-500/20 px-2.5 py-0.5 text-xs font-medium text-red-400">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
            LIVE
          </span>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Watch GitHub&apos;s ID frontier advance in real-time. Each scan probes the GitHub API
          to find the latest account created, then recomputes the population estimate.
        </p>
      </div>
      <RealtimeDashboard />
    </div>
  );
}
