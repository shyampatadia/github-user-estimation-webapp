import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";
export const dynamic = "force-dynamic";

// Stratum validity rates from our baseline study
const F7_P_HAT = 0.864525;
const F7_START = 250_000_001;

// Pre-computed sum for F1-F6 (fixed strata)
const F1_F6_TOTAL =
  10_000_000 * 0.772504 +   // F1
  40_000_000 * 0.800000 +   // F2
  50_000_000 * 0.900556 +   // F3
  50_000_000 * 0.837749 +   // F4
  50_000_000 * 0.756297 +   // F5
  50_000_000 * 0.790972;    // F6

function computeEstimate(frontier: number): number {
  const f7Size = frontier - F7_START + 1;
  return Math.round(F1_F6_TOTAL + f7Size * F7_P_HAT);
}

interface UserData {
  id: number;
  login: string;
  type: string;
  created_at: string;
}

async function probeId(id: number): Promise<UserData | null> {
  try {
    const res = await fetch(`https://api.github.com/user/${id}`, {
      headers: {
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "github-user-estimation-webapp",
      },
      signal: AbortSignal.timeout(8000),
    });
    if (res.status === 200) {
      const data = await res.json();
      return {
        id: data.id,
        login: data.login,
        type: data.type,
        created_at: data.created_at,
      };
    }
    return null;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const lastKnown = parseInt(searchParams.get("last") || "262206000", 10);
  const mode = searchParams.get("mode") || "scan";

  const startTime = Date.now();

  if (mode === "verify") {
    const targetId = parseInt(searchParams.get("id") || String(lastKnown), 10);
    const result = await probeId(targetId);
    return NextResponse.json({
      mode: "verify",
      id: targetId,
      exists: result !== null,
      user: result,
      estimated_total: computeEstimate(targetId),
      probe_ms: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    });
  }

  // Scan mode: find the current frontier from lastKnown
  // Strategy: exponential forward scan then binary search back
  // This handles any gap size efficiently in ~12 API calls
  const probes: Array<{ id: number; exists: boolean; user: UserData | null }> = [];
  let highestFound = lastKnown;
  let highestUser: UserData | null = null;

  // First check: verify the lastKnown ID itself exists
  const seedCheck = await probeId(lastKnown);
  probes.push({ id: lastKnown, exists: seedCheck !== null, user: seedCheck });
  if (seedCheck) {
    highestFound = lastKnown;
    highestUser = seedCheck;
  }

  // Phase 1: Exponential forward scan
  // Steps: +1K, +2K, +4K, +8K, +16K, +32K, ...
  // Finds the boundary in O(log(gap)) probes
  let step = 1000;
  let overshootId = lastKnown;
  let foundOvershoot = false;

  for (let i = 0; i < 6; i++) {
    const probeTarget = lastKnown + step;
    const result = await probeId(probeTarget);
    probes.push({ id: probeTarget, exists: result !== null, user: result });

    if (result) {
      // Still valid - frontier is further out
      highestFound = probeTarget;
      highestUser = result;
      step *= 2; // Double the step
    } else {
      // Overshot the frontier
      overshootId = probeTarget;
      foundOvershoot = true;
      break;
    }
  }

  // Phase 2: Binary search between highestFound and overshoot
  if (foundOvershoot && overshootId - highestFound > 200) {
    let lo = highestFound;
    let hi = overshootId;

    // ~4 iterations of binary search to narrow to ~500 ID precision
    for (let i = 0; i < 4 && hi - lo > 200; i++) {
      const mid = Math.floor((lo + hi) / 2);
      const result = await probeId(mid);
      probes.push({ id: mid, exists: result !== null, user: result });

      if (result) {
        lo = mid;
        highestFound = mid;
        highestUser = result;
      } else {
        hi = mid;
      }
    }
  }

  // Phase 3: Fine forward scan from highest found (+100 steps)
  // Push the frontier as far forward as we can
  let fineId = highestFound;
  let consecutiveMisses = 0;

  for (let i = 0; i < 3 && consecutiveMisses < 2; i++) {
    fineId += 100;
    const result = await probeId(fineId);
    probes.push({ id: fineId, exists: result !== null, user: result });

    if (result) {
      highestFound = fineId;
      highestUser = result;
      consecutiveMisses = 0;
    } else {
      consecutiveMisses++;
    }
  }

  const estimatedTotal = computeEstimate(highestFound);
  const elapsed = Date.now() - startTime;

  return NextResponse.json({
    mode: "scan",
    frontier_id: highestFound,
    frontier_user: highestUser,
    estimated_total: estimatedTotal,
    probes_count: probes.length,
    probes,
    probe_ms: elapsed,
    timestamp: new Date().toISOString(),
  });
}
