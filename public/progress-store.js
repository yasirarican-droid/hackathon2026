const key = "nasa-starboard-learning-v1";
export function loadProgress() {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "{}");
    return value && value.version === 1 ? value : {};
  } catch {
    return {};
  }
}
export function saveProgress(value) {
  try {
    localStorage.setItem(key, JSON.stringify({ ...value, version: 1 }));
    return true;
  } catch {
    return false;
  }
}
export function safeIds(value, allowed) {
  return Array.isArray(value)
    ? value
        .filter((id) => typeof id === "string" && allowed.includes(id))
        .slice(0, allowed.length)
    : [];
}
