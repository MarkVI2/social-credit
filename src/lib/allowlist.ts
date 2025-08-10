import { promises as fs } from "fs";
import path from "path";

let cached: Set<string> | null = null;

async function loadAllowedEmails(): Promise<Set<string>> {
  if (cached) return cached;
  const filePath = path.join(process.cwd(), "allowedEmails.json");
  const data = await fs.readFile(filePath, "utf-8");
  const json: unknown = JSON.parse(data);
  let list: unknown;
  if (Array.isArray(json)) {
    list = json;
  } else if (
    json &&
    typeof json === "object" &&
    Array.isArray((json as { allowedEmails?: unknown }).allowedEmails)
  ) {
    list = (json as { allowedEmails: unknown[] }).allowedEmails;
  } else {
    list = undefined;
  }
  if (!Array.isArray(list)) {
    throw new Error(
      "allowedEmails.json must be an array or an object with allowedEmails array"
    );
  }
  cached = new Set(
    list.map((e) => String(e).trim().toLowerCase()).filter(Boolean)
  );
  return cached;
}

export async function isEmailAllowed(email: string): Promise<boolean> {
  try {
    const allow = await loadAllowedEmails();
    return allow.has(email.trim().toLowerCase());
  } catch (e) {
    console.error("Allowlist load/validate error:", e);
    // Fail-closed: if allowlist fails to load, do not allow signup
    return false;
  }
}
