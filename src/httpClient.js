import axios from "axios";
import { normalizeBaseUrl } from "./config.js";

export async function sendRequest({
  baseUrl,
  method,
  path,
  body = null,
  token = null,
}) {
  const startedAt = Date.now();
  const url = joinUrl(baseUrl, path);
  const headers = {};

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (body !== null && body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  try {
    const response = await axios.request({
      method,
      url,
      data: body,
      headers,
      timeout: 30_000,
      validateStatus: () => true,
    });

    return {
      ok: true,
      url,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      data: response.data,
      durationMs: Date.now() - startedAt,
    };
  } catch (error) {
    return {
      ok: false,
      url,
      status: error.response?.status ?? null,
      statusText: error.response?.statusText ?? "NETWORK_ERROR",
      headers: error.response?.headers ?? {},
      data: error.response?.data ?? {
        message: error.message,
        code: error.code ?? "ERR_NETWORK",
      },
      durationMs: Date.now() - startedAt,
      networkError: true,
    };
  }
}

export function joinUrl(baseUrl, relativePath) {
  const base = normalizeBaseUrl(baseUrl);
  const rel = String(relativePath || "").trim();

  if (/^https?:\/\//i.test(rel)) return rel;
  if (!rel || rel === "/") return base;
  return `${base}/${rel.replace(/^\/+/, "")}`;
}
