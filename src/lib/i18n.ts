import { cookies, headers } from "next/headers";
import { pickLang, translate, type Lang, type MessageKey } from "./messages";

export type { Lang, MessageKey } from "./messages";
export const LANG_COOKIE = "lang";

/** The visitor's language: their saved choice, else their browser's first preference, else English. */
export async function getLang(): Promise<Lang> {
  const [jar, h] = await Promise.all([cookies(), headers()]);
  return pickLang(jar.get(LANG_COOKIE)?.value, h.get("accept-language"));
}

export type T = (key: MessageKey, vars?: Record<string, string | number>) => string;

/** For server components: `const { t, lang } = await getT();` */
export async function getT(): Promise<{ t: T; lang: Lang }> {
  const lang = await getLang();
  return { lang, t: (key, vars) => translate(lang, key, vars) };
}
