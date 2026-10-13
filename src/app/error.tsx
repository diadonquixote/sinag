"use client";

import { useEffect, useState } from "react";
import { MESSAGES, type Lang } from "@/lib/messages";

/** Error boundaries run in the browser, so the language comes from the page's own lang attribute. */
export default function Error({ reset }: { error: Error; reset: () => void }) {
  const [lang, setLang] = useState<Lang>("en");
  useEffect(() => {
    if (document.documentElement.lang === "fil") setLang("fil");
  }, []);
  const m = MESSAGES[lang];
  return (
    <div className="container-x py-24 text-center">
      <p className="eyebrow">{m["error.eyebrow"]}</p>
      <h1 className="mt-2 text-4xl font-bold">{m["error.title"]}</h1>
      <p className="mt-3 text-slate-600">{m["error.lead"]}</p>
      <button onClick={reset} className="btn-primary mt-6">{m["error.retry"]}</button>
    </div>
  );
}
