/**
 * Daily Frontier Update Script
 *
 * Binary searches GitHub API to find the maximum valid user ID,
 * then recomputes the population estimate using the baseline
 * stratum validity rates.
 *
 * Usage: npx tsx scripts/update-frontier.ts
 */

import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const API_BASE = "https://api.github.com/user";
const DATA_DIR = join(__dirname, "..", "src", "data");
const BASELINE_PATH = join(DATA_DIR, "baseline.json");
const HISTORY_PATH = join(DATA_DIR, "history.json");
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const MAX_RUNTIME_MS = 8 * 60 * 1000; // 8-minute hard cap
const startTime = Date.now();

// Rate-limited fetch with retry
async function fetchUser(id: number): Promise<boolean> {
  if (Date.now() - startTime > MAX_RUNTIME_MS) {
    throw new Error("MAX_RUNTIME exceeded");
  }

  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "github-user-estimation-tracker",
  };
  if (GITHUB_TOKEN) {
    headers["Authorization"] = `token ${GITHUB_TOKEN}`;
  }

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(`${API_BASE}/${id}`, { headers });

      if (res.status === 200) return true;
      if (res.status === 404) return false;

      // Rate limited - wait and retry
      if (res.status === 403 || res.status === 429) {
        const retryAfter = parseInt(res.headers.get("retry-after") || "60", 10);
        console.log(`Rate limited, waiting ${retryAfter}s...`);
        await new Promise((r) => setTimeout(r, retryAfter * 1000));
        continue;
      }

      return false;
    } catch (err: unknown) {
      if (err instanceof Error && err.message === "MAX_RUNTIME exceeded") throw err;
      await new Promise((r) => setTimeout(r, 5000));
    }
  }
  return false;
}

// Binary search to find the frontier (max valid ID)
async function findFrontier(low: number, high: number): Promise<number> {
  console.log(`Searching for frontier between ${low} and ${high}...`);

  let bestFound = low;

  try {
    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      const exists = await fetchUser(mid);

      if (exists) {
        bestFound = mid;
        low = mid + 1;
        console.log(`  Found valid ID: ${mid}`);
      } else {
        // Check a couple of IDs around mid to handle gaps
        let foundNearby = false;
        for (let offset = 1; offset <= 2; offset++) {
          if (await fetchUser(mid + offset)) {
            bestFound = Math.max(bestFound, mid + offset);
            low = mid + offset + 1;
            foundNearby = true;
            console.log(`  Found valid ID: ${mid + offset} (nearby)`);
            break;
          }
        }
        if (!foundNearby) {
          high = mid - 1;
        }
      }
    }

    // Scan forward from best found to push frontier higher
    console.log(`Scanning forward from ${bestFound}...`);
    let scanId = bestFound + 1;
    let consecutiveMisses = 0;
    while (consecutiveMisses < 5) {
      const exists = await fetchUser(scanId);
      if (exists) {
        bestFound = scanId;
        consecutiveMisses = 0;
      } else {
        consecutiveMisses++;
      }
      scanId++;
    }
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "MAX_RUNTIME exceeded") {
      console.warn(`Runtime cap hit — returning best found so far: ${bestFound}`);
    } else {
      throw err;
    }
  }

  return bestFound;
}

// Recompute estimate with new frontier
function computeEstimate(
  newFrontier: number,
  baseline: {
    strata: Record<string, { start: number; end: number; size: number; p_hat: number; contribution: number }>;
  }
): number {
  let total = 0;
  const strata = baseline.strata;

  for (const [key, stratum] of Object.entries(strata)) {
    if (key === "F7") {
      // Extend F7 to new frontier
      const newSize = newFrontier - (stratum.start - 1);
      total += newSize * stratum.p_hat;
    } else {
      total += stratum.contribution;
    }
  }

  return Math.round(total);
}

async function main() {
  console.log("=== GitHub Frontier Update ===");
  console.log(`Time: ${new Date().toISOString()}`);
  console.log(`Auth: ${GITHUB_TOKEN ? "token present (5000 req/hr)" : "no token (60 req/hr — will be slow)"}`);

  // Load baseline
  const baseline = JSON.parse(readFileSync(BASELINE_PATH, "utf-8"));
  const history = JSON.parse(readFileSync(HISTORY_PATH, "utf-8"));
  const lastFrontier = history[history.length - 1]?.frontier_id || baseline.frontier_m;

  console.log(`Last known frontier: ${lastFrontier}`);

  // Search for new frontier
  // Start from last known frontier, search up to +5M
  const newFrontier = await findFrontier(lastFrontier, lastFrontier + 5_000_000);
  console.log(`New frontier: ${newFrontier}`);

  // Compute new estimate
  const newEstimate = computeEstimate(newFrontier, baseline);
  console.log(`New estimate: ${newEstimate.toLocaleString()}`);

  // Compute daily new IDs
  const dailyNewIds = newFrontier - lastFrontier;
  console.log(`Daily new IDs: ${dailyNewIds.toLocaleString()}`);

  // Append to history
  const today = new Date().toISOString().split("T")[0];

  // Don't add duplicate entries for same day
  if (history[history.length - 1]?.date === today) {
    history[history.length - 1] = {
      date: today,
      frontier_id: newFrontier,
      estimated_total: newEstimate,
      daily_new_ids: dailyNewIds,
    };
    console.log(`Updated existing entry for ${today}`);
  } else {
    history.push({
      date: today,
      frontier_id: newFrontier,
      estimated_total: newEstimate,
      daily_new_ids: dailyNewIds,
    });
    console.log(`Added new entry for ${today}`);
  }

  writeFileSync(HISTORY_PATH, JSON.stringify(history, null, 2) + "\n");
  console.log("History updated successfully!");
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
