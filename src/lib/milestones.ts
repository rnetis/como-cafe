/**
 * Visit milestones — the pure half of customer care.
 *
 * Kept in its own dependency-free module so both the care rules (`care.ts`)
 * and the storage migration (`migrate.ts`) can read it: `care.ts` imports the
 * store, and the migration runs *inside* the store's own boot, so importing
 * `care.ts` from either side would close a cycle. This file imports nothing.
 */

/** Visit counts that earn a thank-you. */
export const MILESTONES = [10, 25, 50, 100];

/** The milestone a guest has reached, or null when they are short of the first. */
export function nextMilestone(visits: number): number | null {
  let hit: number | null = null;
  for (const step of MILESTONES) if (visits >= step) hit = step;
  return hit;
}
