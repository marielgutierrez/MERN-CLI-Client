import path from "node:path";

export const CONFIG_FILE = path.resolve(process.cwd(), ".mern-cli.json");
export const HISTORY_FILE = path.resolve(process.cwd(), ".mern-cli-history.json");
export const MAX_HISTORY = 10;
