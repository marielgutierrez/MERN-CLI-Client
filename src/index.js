#!/usr/bin/env node
import ora from "ora";
import pc from "picocolors";
import { collectJsonBody } from "./bodyEditor.js";
import {
  loadConfig,
  saveConfig,
  setBaseUrl,
  setToken,
  normalizeBaseUrl,
} from "./config.js";
import { sendRequest } from "./httpClient.js";
import { loadHistory, pushHistory } from "./history.js";
import { decodeToken } from "./jwt.js";
import { clack, askConfirm, askPassword, askSelect, askText } from "./prompts.js";
import {
  banner,
  printHistoryTable,
  printResponse,
  printTokenStatus,
  colorMethod,
  colorStatus,
} from "./ui.js";

async function main() {
  console.log(banner());
  clack.intro(pc.dim("Cliente REST interactivo para tu API Node.js/Express"));

  const loaded = loadConfig();
  let config = await ensureBaseUrl(loaded, !loaded.exists);

  while (true) {
    const action = await askSelect({
      message: "Menú principal",
      options: [
        { value: "auth", label: "Iniciar sesión / Registrar usuario" },
        { value: "request", label: "Ejecutar petición personalizada (GET, POST, PUT, DELETE)" },
        { value: "history", label: "Ver historial de peticiones recientes" },
        { value: "token", label: "Ver estado del Token JWT actual" },
        { value: "config", label: "Cambiar URL base de la API" },
        { value: "exit", label: "Salir" },
      ],
    });

    if (action === "exit") {
      clack.outro(pc.cyan("Hasta luego."));
      break;
    }

    if (action === "auth") {
      config = await handleAuth(config);
      continue;
    }

    if (action === "request") {
      config = await handleCustomRequest(config);
      continue;
    }

    if (action === "history") {
      await handleHistory(config);
      continue;
    }

    if (action === "token") {
      printTokenStatus(decodeToken(config.token), config.token);
      continue;
    }

    if (action === "config") {
      config = await ensureBaseUrl(config, true);
    }
  }
}

async function ensureBaseUrl(config, force = false) {
  if (!force && config.exists && config.baseUrl) {
    clack.log.info(`API base: ${pc.bold(config.baseUrl)}`);
    return config;
  }

  const value = await askText({
    message: "URL base de la API",
    placeholder: "http://localhost:4000/api",
    initialValue: config.baseUrl || "http://localhost:4000/api",
    validate: (input) => {
      try {
        const parsed = new URL(input);
        if (!["http:", "https:"].includes(parsed.protocol)) {
          return "Usá http o https.";
        }
        return undefined;
      } catch {
        return "URL inválida.";
      }
    },
  });

  const next = setBaseUrl(config, value);
  clack.log.success(`Configuración guardada en .mern-cli.json`);
  return next;
}

async function handleAuth(config) {
  const mode = await askSelect({
    message: "Autenticación",
    options: [
      { value: "login", label: "Iniciar sesión (POST /auth/login)" },
      { value: "register", label: "Registrar usuario (POST /auth/register)" },
      { value: "logout", label: "Cerrar sesión (borrar token local)" },
      { value: "back", label: "Volver" },
    ],
  });

  if (mode === "back") return config;

  if (mode === "logout") {
    const next = setToken(config, null);
    clack.log.success("Token eliminado de .mern-cli.json");
    return next;
  }

  const name =
    mode === "register"
      ? await askText({
          message: "Nombre",
          placeholder: "Ada Lovelace",
          validate: (v) => (v?.trim() ? undefined : "El nombre es obligatorio."),
        })
      : null;

  const email = await askText({
    message: "Email",
    placeholder: "dev@ejemplo.com",
    validate: (v) =>
      /.+@.+\..+/.test(String(v || "").trim()) ? undefined : "Email inválido.",
  });

  const password = await askPassword({
    message: "Password",
    validate: (v) => (v ? undefined : "La contraseña es obligatoria."),
  });

  const path = mode === "login" ? "/auth/login" : "/auth/register";
  const body =
    mode === "login" ? { email, password } : { name, email, password };

  const result = await runWithSpinner(`Enviando POST ${path}...`, () =>
    sendRequest({
      baseUrl: config.baseUrl,
      method: "POST",
      path,
      body,
      token: config.token,
    }),
  );

  printResponse(result);
  remember(result, "POST", path, body);

  if (!result.networkError && result.status >= 200 && result.status < 300) {
    const token = extractToken(result.data);
    if (token) {
      const next = setToken(config, token);
      clack.log.success("JWT capturado y guardado. Se adjuntará como Authorization: Bearer <token>.");
      return next;
    }
    clack.log.warn("La respuesta fue exitosa pero no se encontró un JWT (token / accessToken / jwt).");
  }

  return config;
}

async function handleCustomRequest(config, preset = null) {
  const method =
    preset?.method ||
    (await askSelect({
      message: "Método HTTP",
      options: [
        { value: "GET", label: "GET" },
        { value: "POST", label: "POST" },
        { value: "PUT", label: "PUT" },
        { value: "DELETE", label: "DELETE" },
      ],
    }));

  const path =
    preset?.path ||
    (await askText({
      message: "Ruta relativa",
      placeholder: "/productos",
      initialValue: "/",
      validate: (v) => (String(v || "").trim() ? undefined : "La ruta es obligatoria."),
    }));

  let body = preset?.body ?? null;
  if (!preset && (method === "POST" || method === "PUT")) {
    body = await collectJsonBody();
  }

  const result = await runWithSpinner(
    `${colorMethod(method)} ${path}`,
    () =>
      sendRequest({
        baseUrl: config.baseUrl,
        method,
        path,
        body,
        token: config.token,
      }),
  );

  printResponse(result);
  remember(result, method, path, body);
  return config;
}

async function handleHistory(config) {
  const history = loadHistory();
  printHistoryTable(history);

  if (!history.length) return config;

  const choice = await askSelect({
    message: "Historial (re-ejecutar con Enter)",
    options: [
      ...history.map((entry, index) => ({
        value: String(index),
        label: `${colorMethod(entry.method)} ${entry.path}  ${colorStatus(entry.status)}  ${pc.dim(
          new Date(entry.date).toLocaleString(),
        )}`,
      })),
      { value: "back", label: "Volver al menú" },
    ],
  });

  if (choice === "back") return config;

  const entry = history[Number(choice)];
  const proceed = await askConfirm({
    message: `¿Re-ejecutar ${entry.method} ${entry.path}?`,
    initialValue: true,
  });

  if (!proceed) return config;
  return handleCustomRequest(config, entry);
}

async function runWithSpinner(text, task) {
  const spinner = ora({ text: pc.dim(String(text).replace(/\u001b\[[0-9;]*m/g, "")), color: "cyan" }).start();
  try {
    const result = await task();
    if (result.networkError) {
      spinner.fail(`Error de red en ${result.durationMs} ms`);
    } else if (result.status >= 200 && result.status < 300) {
      spinner.succeed(`Completado en ${result.durationMs} ms`);
    } else {
      spinner.warn(`Respondió ${result.status} en ${result.durationMs} ms`);
    }
    return result;
  } catch (error) {
    spinner.fail(error.message);
    throw error;
  }
}

function remember(result, method, path, body) {
  pushHistory({
    method,
    path,
    status: result.status,
    date: new Date().toISOString(),
    durationMs: result.durationMs,
    body: method === "GET" || method === "DELETE" ? null : body,
  });
}

function extractToken(data) {
  if (!data) return null;
  if (typeof data === "string" && data.split(".").length === 3) return data;

  const candidates = [
    data.token,
    data.accessToken,
    data.access_token,
    data.jwt,
    data.idToken,
    data.data?.token,
    data.data?.accessToken,
    data.user?.token,
  ];

  return candidates.find((value) => typeof value === "string" && value.length > 0) ?? null;
}

main().catch((error) => {
  clack.cancel(error.message || "Error inesperado");
  process.exit(1);
});
