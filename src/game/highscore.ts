import type { HighScoreEntry } from "./types";

const KEY = "arrowstorm.highscores.v1";

export function loadHighScores(): HighScoreEntry[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return seedDefaults();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return seedDefaults();
    return parsed.slice(0, 10) as HighScoreEntry[];
  } catch {
    return seedDefaults();
  }
}

export function saveHighScores(entries: HighScoreEntry[]): HighScoreEntry[] {
  const sorted = [...entries].sort((a, b) => b.score - a.score).slice(0, 10);
  try {
    localStorage.setItem(KEY, JSON.stringify(sorted));
  } catch {
    /* ignore */
  }
  return sorted;
}

export function submitScore(entry: HighScoreEntry): {
  entries: HighScoreEntry[];
  rank: number; // -1 if not in top 10
  isNewBest: boolean;
} {
  const current = loadHighScores();
  const isNewBest =
    current.length === 0 || entry.score > current[0].score;
  const next = saveHighScores([entry, ...current]);
  const rank = next.findIndex(
    (e) =>
      e.score === entry.score &&
      e.date === entry.date &&
      e.arrows === entry.arrows,
  );
  return { entries: next, rank, isNewBest };
}

export function clearHighScores() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

function seedDefaults(): HighScoreEntry[] {
  return [
    {
      score: 1200,
      wave: 3,
      arrows: 18,
      accuracy: 72,
      date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    },
    {
      score: 850,
      wave: 2,
      arrows: 14,
      accuracy: 64,
      date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    },
    {
      score: 420,
      wave: 1,
      arrows: 9,
      accuracy: 58,
      date: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    },
  ];
}
