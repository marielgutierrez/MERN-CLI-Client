import boxen from "boxen";
import { highlight } from "cli-highlight";
import Table from "cli-table3";
import pc from "picocolors";
import { formatDate, formatRemaining } from "./jwt.js";

export function banner() {
  return boxen(
    `${pc.bold(pc.cyan("MERN-CLI-Client"))}\n${pc.dim(
      "Cliente REST en terminal · JWT · CRUD",
    )}`,
    {
      padding: 1,
      margin: { top: 1, bottom: 0, left: 0, right: 0 },
      borderColor: "cyan",
      borderStyle: "round",
    },
  );
}

export function colorStatus(status) {
  const code = Number(status);
  const label = status == null ? "ERR" : String(status);

  if (Number.isNaN(code)) return pc.red(label);
  if (code >= 200 && code < 300) return pc.green(label);
  if (code >= 400 && code < 500) return pc.yellow(label);
  if (code >= 500) return pc.red(label);
  return pc.cyan(label);
}

export function printResponse(result) {
  const statusLine = `${colorStatus(result.status)} ${pc.dim(
    result.statusText || "",
  )}  ${pc.dim(`${result.durationMs} ms`)}`;

  console.log(
    boxen(
      `${pc.bold("Respuesta HTTP")}\n${statusLine}\n${pc.dim(result.url)}`,
      {
        padding: 1,
        borderColor: statusBorder(result.status),
        borderStyle: "round",
      },
    ),
  );

  renderBody(result.data);
}

export function renderBody(data) {
  if (data === undefined || data === null) {
    console.log(pc.dim("(sin cuerpo de respuesta)"));
    return;
  }

  if (Array.isArray(data) && data.length > 0 && data.every(isPlainObject)) {
    console.log(renderTable(data));
    return;
  }

  const json = typeof data === "string" ? data : JSON.stringify(data, null, 2);

  try {
    console.log(highlight(json, { language: "json", ignoreIllegals: true }));
  } catch {
    console.log(json);
  }
}

export function renderTable(rows) {
  const keys = [...new Set(rows.flatMap((row) => Object.keys(row)))];
  const table = new Table({
    head: keys.map((key) => pc.cyan(key)),
    wordWrap: true,
    style: { head: [], border: ["gray"] },
    colWidths: keys.map(() => Math.max(12, Math.floor(80 / keys.length))),
  });

  for (const row of rows) {
    table.push(keys.map((key) => formatCell(row[key])));
  }

  return table.toString();
}

export function printTokenStatus(decoded, rawToken) {
  if (!rawToken) {
    console.log(
      boxen(pc.yellow("No hay un JWT almacenado. Inicia sesión primero."), {
        padding: 1,
        borderColor: "yellow",
        borderStyle: "round",
      }),
    );
    return;
  }

  if (!decoded) {
    console.log(
      boxen(pc.red("El token almacenado no es un JWT válido."), {
        padding: 1,
        borderColor: "red",
        borderStyle: "round",
      }),
    );
    return;
  }

  const { payload, header, expired } = decoded;
  const state = expired ? pc.red("EXPIRADO") : pc.green("VIGENTE");

  const lines = [
    `${pc.bold("Estado")}        ${state}`,
    `${pc.bold("Tiempo restante")} ${formatRemaining(payload)}`,
    `${pc.bold("Emitido (iat)")}  ${formatDate(payload.iat)}`,
    `${pc.bold("Expira (exp)")}   ${formatDate(payload.exp)}`,
    `${pc.bold("Algoritmo")}      ${header?.alg ?? "—"}`,
    `${pc.bold("Subject")}        ${payload.sub ?? payload.id ?? payload._id ?? "—"}`,
    `${pc.bold("Email")}          ${payload.email ?? "—"}`,
  ];

  console.log(
    boxen(`${pc.bold("Token JWT actual")}\n\n${lines.join("\n")}`, {
      padding: 1,
      borderColor: expired ? "red" : "green",
      borderStyle: "round",
    }),
  );

  console.log(pc.dim("\nPayload decodificado:\n"));
  renderBody(payload);
}

export function printHistoryTable(history) {
  if (!history.length) {
    console.log(pc.dim("Aún no hay peticiones en el historial."));
    return;
  }

  const table = new Table({
    head: [
      pc.cyan("#"),
      pc.cyan("Método"),
      pc.cyan("Ruta"),
      pc.cyan("Estado"),
      pc.cyan("Fecha"),
      pc.cyan("ms"),
    ],
    style: { head: [], border: ["gray"] },
  });

  history.forEach((entry, index) => {
    table.push([
      String(index + 1),
      colorMethod(entry.method),
      entry.path,
      colorStatus(entry.status),
      new Date(entry.date).toLocaleString(),
      entry.durationMs ?? "—",
    ]);
  });

  console.log(table.toString());
}

export function colorMethod(method) {
  const value = String(method || "").toUpperCase();
  if (value === "GET") return pc.green(value);
  if (value === "POST") return pc.cyan(value);
  if (value === "PUT") return pc.yellow(value);
  if (value === "DELETE") return pc.red(value);
  return value;
}

function statusBorder(status) {
  const code = Number(status);
  if (code >= 200 && code < 300) return "green";
  if (code >= 400 && code < 500) return "yellow";
  if (code >= 500 || status == null) return "red";
  return "cyan";
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function formatCell(value) {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") {
    const text = JSON.stringify(value);
    return text.length > 40 ? `${text.slice(0, 37)}...` : text;
  }
  const text = String(value);
  return text.length > 48 ? `${text.slice(0, 45)}...` : text;
}
