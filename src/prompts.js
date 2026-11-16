import * as clack from "@clack/prompts";

export function isExit(value) {
  return clack.isCancel(value);
}

export async function abortIfCancelled(value, message = "Operación cancelada.") {
  if (clack.isCancel(value)) {
    clack.cancel(message);
    process.exit(0);
  }
  return value;
}

export async function askText(options) {
  const value = await clack.text(options);
  return abortIfCancelled(value);
}

export async function askPassword(options) {
  const value = await clack.password(options);
  return abortIfCancelled(value);
}

export async function askSelect(options) {
  const value = await clack.select(options);
  return abortIfCancelled(value);
}

export async function askConfirm(options) {
  const value = await clack.confirm(options);
  return abortIfCancelled(value);
}

export { clack };
