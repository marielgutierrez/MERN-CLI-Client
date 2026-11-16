import { jwtDecode } from "jwt-decode";

export function decodeToken(token) {
  if (!token) return null;

  try {
    const payload = jwtDecode(token);
    const header = jwtDecode(token, { header: true });
    return { header, payload, expired: isExpired(payload) };
  } catch {
    return null;
  }
}

export function isExpired(payload) {
  if (!payload?.exp) return false;
  return remainingSeconds(payload) <= 0;
}

export function remainingSeconds(payload) {
  if (!payload?.exp) return null;
  return payload.exp - Math.floor(Date.now() / 1000);
}

export function formatRemaining(payload) {
  const seconds = remainingSeconds(payload);
  if (seconds === null) return "Sin fecha de expiración (exp)";
  if (seconds <= 0) return "Expirado";

  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h}h ${m}m ${s}s`;
}

export function formatDate(unixSeconds) {
  if (!unixSeconds) return "—";
  return new Date(unixSeconds * 1000).toLocaleString();
}
