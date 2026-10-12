"use client";

import { useRef, useState } from "react";

const SAMPLE = `Regular session, nagsimula 2:05 PM sa barangay hall.
Present: Maria Reyes (Chair), Jose Cruz (Sec), Ana Santos (Treas), Paolo Dela Cruz, Bea Bautista. Absent: wala.
Agenda: 1. Linis-Ilog drive 2. Basketball league budget 3. Mga updates
Linis-Ilog: ok na ang date, Sat Nov 8. Si Paolo ang point person. Kailangan ng gloves at sako, mga 6,500 pesos. Approved lahat.
Basketball league: gusto ni Bea mag-start sa Dec. Budget daw 18,000 for trophies at referee. Pag-uusapan ulit next meeting kasi kulang pa quotation.
Action: Ana mag-check ng available fund bago Friday. Jose mag-post ng minutes.
Adjourned 3:10 PM.`;

export default function NotesInput({ canScan, defaultValue = "" }: { canScan: boolean; defaultValue?: string }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  async function onPhoto(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setStatus("Reading the photo...");
    try {
      const dataUrl = await compress(file);
      const res = await fetch("/api/transcribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: dataUrl }),
      });
      const json = await res.json();
      if (!res.ok || !json.text) throw new Error(json.error || "Could not read the photo.");
      if (ref.current) ref.current.value = (ref.current.value ? ref.current.value + "\n" : "") + json.text;
      setStatus("Photo added. Please check the text for mistakes.");
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Could not read the photo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <label className="label" htmlFor="raw_notes">Raw notes</label>
      <textarea
        id="raw_notes"
        name="raw_notes"
        ref={ref}
        defaultValue={defaultValue}
        rows={12}
        required
        minLength={30}
        className="input font-mono"
        placeholder="Type or paste your notes exactly as you wrote them. Taglish is fine, no need to organize."
      />
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button type="button" className="btn-outline btn-sm" onClick={() => { if (ref.current) ref.current.value = SAMPLE; }}>
          Use sample notes
        </button>
        {canScan && (
          <label className={`btn-outline btn-sm cursor-pointer ${busy ? "opacity-60" : ""}`}>
            Add a photo of handwritten notes
            <input type="file" accept="image/*" capture="environment" className="sr-only" disabled={busy} onChange={(e) => onPhoto(e.target.files?.[0])} />
          </label>
        )}
        <span className="text-xs text-slate-500" aria-live="polite">{status}</span>
      </div>
    </div>
  );
}

/** Shrinks the photo in the browser so it fits under the hosting upload limit. */
async function compress(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.8);
}
