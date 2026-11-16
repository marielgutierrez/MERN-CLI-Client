import fs from "node:fs";
import { HISTORY_FILE, MAX_HISTORY } from "./paths.js";

export function loadHistory() {
  if (!fs.existsSync(HISTORY_FILE)) return [];

  try {
    const parsed = JSON.parse(fs.readFileSync(HISTORY_FILE, "utf8"));
    return Array.isArray(parsed) ? parsed.slice(0, MAX_HISTORY) : [];
  } catch {
    return [];
  }
}

export function saveHistory(entries) {
  fs.writeFileSync(
    HISTORY_FILE,
    `${JSON.stringify(entries.slice(0, MAX_HISTORY), null, 2)}\n`,
    "utf8",
  );
}

export function pushHistory(entry) {
  const history = loadHistory();
  const next = [
    {
      method: entry.method,
      path: entry.path,
      status: entry.status,
      date: entry.date ?? new Date().toISOString(),
      durationMs: entry.durationMs ?? null,
      body: entry.body ?? null,
    },
    ...history,
  ].slice(0, MAX_HISTORY);

  saveHistory(next);
  return next;
}
