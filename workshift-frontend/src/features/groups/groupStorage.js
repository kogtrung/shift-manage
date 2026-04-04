const STORAGE_KEY = "workshift.groups.recent";

function safeParse(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function getRecentGroups() {
  const parsed = safeParse(localStorage.getItem(STORAGE_KEY) || "");
  if (!Array.isArray(parsed)) return [];
  return parsed
    .filter((x) => x && typeof x === "object" && typeof x.id === "number")
    .slice(0, 20);
}

export function addRecentGroup(group) {
  if (!group || typeof group.id !== "number") return;
  const current = getRecentGroups();
  const next = [group, ...current.filter((g) => g.id !== group.id)].slice(0, 20);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

