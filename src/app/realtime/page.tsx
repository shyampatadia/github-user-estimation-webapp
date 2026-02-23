import { RealtimeDashboard } from "@/components/realtime-dashboard";

export const metadata = {
  title: "Realtime | GitHub User Estimation",
  description: "Live GitHub frontier tracking - watch new accounts being created in real-time",
};

export default function RealtimePage() {
  return (
    <div className="space-y-8">
      <div className="space-y-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)", paddingBottom: "1.5rem" }}>
        <div className="flex items-center gap-3">
          <h1
            className="font-bold tracking-tight"
            style={{ fontSize: "clamp(1.6rem, 3.5vw, 2.2rem)", color: "rgba(255,255,255,0.95)", letterSpacing: "-0.02em" }}
          >
            Realtime Monitor
          </h1>
          <span
            className="flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
            style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.22)", color: "rgba(248,113,113,0.9)" }}
          >
            <span className="data-pulse h-1.5 w-1.5 rounded-full bg-red-500" />
            LIVE
          </span>
        </div>
        <p className="text-base leading-relaxed" style={{ color: "rgba(255,255,255,0.45)", maxWidth: "62ch" }}>
          Watch GitHub&apos;s ID frontier advance in real-time. Each scan probes the GitHub API to
          find the latest account created, then recomputes the population estimate.
        </p>
      </div>
      <RealtimeDashboard />
    </div>
  );
}
