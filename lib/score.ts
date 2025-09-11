// lib/score.ts
export function toPctNumber(v: unknown): number | undefined {
  if (v == null) return;
  const s = typeof v === 'string' ? v.trim().replace('%','') : v;
  const n = Number(s);
  if (!Number.isFinite(n)) return;
  const pct = n <= 1 ? n * 100 : n;
  return Math.max(0, Math.min(100, pct));
}

export function getMatchScore(c: any): number | undefined {
  return toPctNumber(c?.match_score) ??
         toPctNumber(c?.final_score) ??
         toPctNumber(c?.prompt_matching_score) ??
         toPctNumber(c?.score);
}
