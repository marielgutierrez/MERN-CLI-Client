import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { askSelect, askText } from "./prompts.js";

const EMPTY_JSON = "{\n}\n";

export async function collectJsonBody(initial = EMPTY_JSON) {
  const mode = await askSelect({
    message: "¿Cómo querés ingresar el body JSON?",
    options: [
      { value: "paste", label: "Pegar / escribir JSON aquí" },
      { value: "editor", label: "Abrir editor de texto del sistema" },
    ],
  });

  const raw =
    mode === "editor"
      ? openSystemEditor(initial)
      : await askText({
          message: "Body JSON",
          placeholder: '{ "nombre": "demo" }',
          initialValue: "{}",
          validate: validateJson,
        });

  return parseJsonOrThrow(raw);
}

export function validateJson(value) {
  try {
    JSON.parse(value);
    return undefined;
  } catch (error) {
    return `JSON inválido: ${error.message}`;
  }
}

export function parseJsonOrThrow(raw) {
  const text = String(raw ?? "").trim();
  if (!text) {
    throw new Error("El body está vacío.");
  }
  return JSON.parse(text);
}

function openSystemEditor(initial) {
  const tmp = path.join(os.tmpdir(), `mern-cli-body-${Date.now()}.json`);
  fs.writeFileSync(tmp, initial, "utf8");

  const editor =
    process.env.EDITOR ||
    process.env.VISUAL ||
    (process.platform === "win32" ? "notepad" : "nano");

  const result = spawnSync(editor, [tmp], { stdio: "inherit" });
  const content = fs.readFileSync(tmp, "utf8");

  try {
    fs.unlinkSync(tmp);
  } catch {
    // ignore
  }

  if (result.error) {
    throw new Error(`No se pudo abrir el editor (${editor}): ${result.error.message}`);
  }

  const check = validateJson(content);
  if (check) throw new Error(check);
  return content;
}
