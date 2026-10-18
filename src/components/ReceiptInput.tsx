/*
 * Sinag - Copyright (c) 2026 Kristina Diane Aviles, PDYN Technologies. All rights reserved.
 * Proprietary software: only the copyright holder may edit, copy or distribute this code. See LICENSE.
 */
"use client";

import { useRef, useState } from "react";
import { shrinkImage } from "@/lib/client-image";

const MAX = 3;
type Fill = { amount: string; date: string; reference: string; description: string };

/**
 * Receipt photos for a ledger entry. Photos are shrunk in the browser and sent with the form.
 * When receipt reading is set up, the first photo is read and empty fields are filled in as suggestions.
 */
export default function ReceiptInput({ canRead, fill, idPrefix = "rc" }: { canRead: boolean; fill?: Fill; idPrefix?: string }) {
  const [photos, setPhotos] = useState<{ key: number; url: string }[]>([]);
  const [status, setStatus] = useState<{ tone: "info" | "ok" | "err"; text: string } | null>(null);
  const picker = useRef<HTMLInputElement>(null);
  const camera = useRef<HTMLInputElement>(null);
  const key = useRef(1);

  async function add(list: FileList | null) {
    const files = Array.from(list ?? []).filter((f) => f.type.startsWith("image/")).slice(0, MAX - photos.length);
    if (files.length === 0) return;
    const added: { key: number; url: string }[] = [];
    for (const f of files) {
      try {
        added.push({ key: key.current++, url: await shrinkImage(f, 1600, 0.8) });
      } catch {
        setStatus({ tone: "err", text: "One photo could not be opened. Try a JPG or PNG." });
      }
    }
    if (added.length === 0) return;
    const first = photos.length === 0;
    setPhotos((prev) => [...prev, ...added]);
    if (canRead && fill && first) await read(added[0].url);
  }

  async function read(url: string) {
    setStatus({ tone: "info", text: "Reading the receipt…" });
    try {
      const res = await fetch("/api/read-receipt", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ image: url }) });
      const r = await res.json();
      if (!res.ok) throw new Error(r.error || "Could not read the receipt.");
      const filled: string[] = [];
      const set = (id: string, value: string | number | undefined, label: string, always = false) => {
        const el = document.getElementById(id) as HTMLInputElement | null;
        if (!el || value === undefined || value === "") return;
        if (!always && el.value.trim()) return;
        el.value = String(value);
        filled.push(label);
      };
      if (fill) {
        set(fill.amount, r.amount, "amount");
        set(fill.date, r.date, "date", true);
        set(fill.reference, r.reference, "OR no.");
        const desc = [r.description, r.vendor ? `(${r.vendor})` : ""].filter(Boolean).join(" ");
        set(fill.description, desc, "description");
      }
      setStatus(filled.length
        ? { tone: "ok", text: `Filled in from the receipt: ${filled.join(", ")}. Check them before saving.` }
        : { tone: "info", text: "Receipt attached. Nothing new to fill in." });
    } catch (e) {
      setStatus({ tone: "err", text: `${e instanceof Error ? e.message : "Could not read the receipt."} The photo is still attached.` });
    }
  }

  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <p className="label mb-0">Receipt photo <span className="font-normal text-slate-400">(recommended)</span></p>
        <span className="text-xs text-slate-400">{photos.length}/{MAX}</span>
      </div>
      <div className="mt-2 flex flex-wrap gap-3">
        {photos.map((p, i) => (
          <div key={p.key} className="relative">
            <a href={p.url} target="_blank" rel="noreferrer" className="block h-20 w-16 overflow-hidden rounded-lg bg-slate-100 ring-1 ring-slate-200" title="Open full size">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.url} alt={`Receipt photo ${i + 1}`} className="h-full w-full object-cover" />
            </a>
            <button type="button" onClick={() => setPhotos((prev) => prev.filter((x) => x.key !== p.key))} aria-label={`Remove receipt photo ${i + 1}`} className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-white text-sm text-slate-500 shadow ring-1 ring-slate-200 hover:text-flag-red">×</button>
            <input type="hidden" name="receipts" value={p.url} />
          </div>
        ))}
        {photos.length < MAX && (
          <div className="flex h-20 flex-1 items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 px-3 sm:flex-none">
            <span className="sm:hidden"><button type="button" onClick={() => camera.current?.click()} className="btn-outline btn-sm">Take a photo</button></span>
            <button type="button" onClick={() => picker.current?.click()} className="btn-outline btn-sm">{photos.length ? "Add another" : "Upload"}</button>
          </div>
        )}
        <input ref={picker} type="file" accept="image/*" multiple className="hidden" tabIndex={-1} aria-hidden="true" onChange={(e) => { void add(e.target.files); e.target.value = ""; }} />
        <input ref={camera} type="file" accept="image/*" capture="environment" className="hidden" tabIndex={-1} aria-hidden="true" onChange={(e) => { void add(e.target.files); e.target.value = ""; }} />
      </div>
      {status && (
        <p aria-live="polite" className={`mt-2 text-xs font-medium ${status.tone === "err" ? "text-flag-red" : status.tone === "ok" ? "text-emerald-700" : "text-flag-blue"}`}>{status.text}</p>
      )}
      {photos.length > 0 && (
        <label className="mt-3 flex items-start gap-2 text-xs text-slate-600">
          <input type="checkbox" name="receipts_public" value="1" defaultChecked className="mt-0.5 h-4 w-4 accent-flag-blue" id={`${idPrefix}-public`} />
          <span>Show on the public ledger. Untick if the receipt shows someone&apos;s personal details.</span>
        </label>
      )}
    </div>
  );
}
