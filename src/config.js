import fs from "node:fs";
import { CONFIG_FILE } from "./paths.js";

const DEFAULT_CONFIG = {
  baseUrl: "http://localhost:4000/api",
  token: null,
};

export function loadConfig() {
  if (!fs.existsSync(CONFIG_FILE)) {
    return { ...DEFAULT_CONFIG, exists: false };
  }

  try {
    const raw = fs.readFileSync(CONFIG_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_CONFIG,
      ...parsed,
      exists: true,
    };
  } catch {
    return { ...DEFAULT_CONFIG, exists: false };
  }
}

export function saveConfig(config) {
  const payload = {
    baseUrl: config.baseUrl,
    token: config.token ?? null,
  };
  fs.writeFileSync(CONFIG_FILE, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

export function setToken(config, token) {
  const next = { ...config, token };
  saveConfig(next);
  return next;
}

export function setBaseUrl(config, baseUrl) {
  const next = { ...config, baseUrl: normalizeBaseUrl(baseUrl) };
  saveConfig(next);
  return next;
}

export function normalizeBaseUrl(url) {
  return String(url || "").trim().replace(/\/+$/, "");
}
