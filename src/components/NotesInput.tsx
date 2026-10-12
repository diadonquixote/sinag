"use client";

import { useEffect, useRef, useState } from "react";

const SAMPLE = `Regular session, nagsimula 2:05 PM sa barangay hall.
Present: Maria Reyes (Chair), Jose Cruz (Sec), Ana Santos (Treas), Paolo Dela Cruz, Bea Bautista. Absent: wala.
Agenda: 1. Linis-Ilog drive 2. Basketball league budget 3. Mga updates
Linis-Ilog: ok na ang date, Sat Nov 8. Si Paolo ang point person. Kailangan ng gloves at sako, mga 6,500 pesos. Approved lahat.
Basketball league: gusto ni Bea mag-start sa Dec. Budget daw 18,000 for trophies at referee. Pag-uusapan ulit next meeting kasi kulang pa quotation.
Action: Ana mag-check ng available fund bago Friday. Jose mag-post ng minutes.
Adjourned 3:10 PM.`;

const MAX_PHOTOS = 6;
const MAX_TOTAL_CHARS = 3_400_000; // keeps the whole form under the hosting upload limit

type Photo = { key: number; url: string; state: "ready" | "reading" | "read" | "failed"; note?: string };

/**
 * Raw notes box with optional photos of handwritten notes.
 * Photos are shrunk in the browser, shown beside the notes so they are easy to copy from,
 * read automatically when photo reading is set up, and saved with the minutes as the original record.
 */
export default function NotesInput({
  canScan,
  defaultValue = "",
  firstPage = 1,
  showSample = true,
}: {
  canScan: boolean;
  defaultValue?: string;
  /** page number of the first new photo (when adding to minutes that already have photos) */
  firstPage?: number;
  showSample?: boolean;
}) {
  const text = useRef<HTMLTextAreaElement>(null);
  const picker = useRef<HTMLInputElement>(null);
  const camera = useRef<HTMLInputElement>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [active, setActive] = useState(0);
  const [message, setMessage] = useState("");
  const [dragging, setDragging] = useState(false);
  const nextKey = useRef(1);

  useEffect(() => {
    if (active >= photos.length) setActive(Math.max(0, photos.length - 1));
  }, [photos.length, active]);

  async function addFiles(list: FileList | File[] | null) {
    setMessage("");
    const files = Array.from(list ?? []).filter((f) => f.type.startsWith("image/"));
    if (files.length === 0) return setMessage("Choose photo files (JPG or PNG).");
    const room = MAX_PHOTOS - photos.length;
    if (room <= 0) return setMessage(`You can add up to ${MAX_PHOTOS} photos at a time.`);
    if (files.length > room) setMessage(`Only the first ${room} photo${room === 1 ? "" : "s"} were added (limit ${MAX_PHOTOS}).`);

    const added: Photo[] = [];
    let total = photos.reduce((n, p) => n + p.url.length, 0);
    for (const file of files.slice(0, room)) {
      try {
        const url = await shrink(file);
        if (total + url.length > MAX_TOTAL_CHARS) {
          setMessage("These photos are too big to send together. Try fewer photos.");
          break;
        }
        total += url.length;
        added.push({ key: nextKey.current++, url, state: canScan ? "reading" : "ready" });
      } catch {
        setMessage("One photo could not be opened. Try a JPG or PNG.");
      }
    }
    if (added.length === 0) return;
    setActive(photos.length);
    setPhotos((prev) => [...prev, ...added]);
    if (canScan) for (const p of added) await read(p);
  }

  async function read(p: Photo) {
    try {
      const res = await fetch("/api/transcribe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ image: p.url }) });
      const json = await res.json();
      if (!res.ok || !json.text) throw new Error(json.error || "Could not read this photo.");
      const page = pageOf(p.key);
      if (text.current) {
        const before = text.current.value.trimEnd();
        text.current.value = `${before ? before + "\n\n" : ""}[Page ${page}]\n${String(json.text).trim()}`;
      }
      update(p.key, { state: "read" });
    } catch (e) {
      update(p.key, { state: "failed", note: e instanceof Error ? e.message : "Could not read this photo." });
    }
  }

  // Page numbers follow the order of the thumbnails.
  const keysRef = useRef<number[]>([]);
  keysRef.current = photos.map((p) => p.key);
  const pageOf = (key: number) => firstPage + Math.max(0, keysRef.current.indexOf(key));

  function update(key: number, patch: Partial<Photo>) {
    setPhotos((prev) => prev.map((p) => (p.key === key ? { ...p, ...patch } : p)));
  }
  function remove(key: number) {
    setPhotos((prev) => prev.filter((p) => p.key !== key));
  }

  const current = photos[active];
  const reading = photos.some((p) => p.state === "reading");

  return (
    <div className="space-y-4">
      {/* ------------------------------------------------ photos */}
      <div>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="label mb-0">Photos of your notes <span className="font-normal text-slate-400">(optional)</span></p>
          <p className="text-xs text-slate-500">{photos.length}/{MAX_PHOTOS} photos</p>
        </div>
        <p className="hint mb-3 mt-0.5">
          {canScan
            ? "Take a clear photo of each page. Sinag reads the handwriting into the box below. Check it before turning it into minutes."
            : "Take a clear photo of each page. They are saved with the minutes as the original record. Type what they say into the box below."}
        </p>

        <div className="flex flex-wrap gap-3">
          {photos.map((p, i) => (
            <div key={p.key} className="relative">
              <button
                type="button"
                onClick={() => setActive(i)}
                aria-label={`Show page ${firstPage + i}`}
                aria-pressed={i === active}
                className={`relative block h-24 w-20 overflow-hidden rounded-xl bg-slate-100 ring-2 transition ${i === active ? "ring-flag-blue" : "ring-transparent hover:ring-slate-300"}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.url} alt="" className="h-full w-full object-cover" />
                <span className="absolute left-1 top-1 rounded-md bg-ink/80 px-1.5 py-0.5 text-[10px] font-bold text-white">{firstPage + i}</span>
                {p.state === "reading" && <span className="absolute inset-x-0 bottom-0 bg-flag-blue/90 py-0.5 text-center text-[10px] font-semibold text-white">Reading…</span>}
                {p.state === "read" && <span className="absolute inset-x-0 bottom-0 bg-emerald-600/90 py-0.5 text-center text-[10px] font-semibold text-white">Read ✓</span>}
                {p.state === "failed" && <span className="absolute inset-x-0 bottom-0 bg-flag-red/90 py-0.5 text-center text-[10px] font-semibold text-white">Not read</span>}
              </button>
              <button
                type="button"
                onClick={() => remove(p.key)}
                aria-label={`Remove page ${firstPage + i}`}
                className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-white text-sm text-slate-500 shadow ring-1 ring-slate-200 hover:text-flag-red"
              >
                ×
              </button>
              <input type="hidden" name="photos" value={p.url} />
            </div>
          ))}

          {photos.length < MAX_PHOTOS && (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => { e.preventDefault(); setDragging(false); void addFiles(e.dataTransfer.files); }}
              className={`flex h-24 min-w-[10rem] flex-1 flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed px-3 text-center transition sm:flex-none ${dragging ? "border-flag-blue bg-mist" : "border-slate-300 bg-white"}`}
            >
              <div className="flex flex-wrap justify-center gap-1.5">
                <span className="sm:hidden"><button type="button" onClick={() => camera.current?.click()} className="btn-outline btn-sm">Take a photo</button></span>
                <button type="button" onClick={() => picker.current?.click()} className="btn-outline btn-sm">{photos.length ? "Add more" : "Upload photos"}</button>
              </div>
              <span className="hidden text-[11px] text-slate-400 sm:block">or drag them here</span>
            </div>
          )}
          <input ref={picker} type="file" accept="image/*" multiple className="hidden" tabIndex={-1} aria-hidden="true" onChange={(e) => { void addFiles(e.target.files); e.target.value = ""; }} />
          <input ref={camera} type="file" accept="image/*" capture="environment" className="hidden" tabIndex={-1} aria-hidden="true" onChange={(e) => { void addFiles(e.target.files); e.target.value = ""; }} />
        </div>
        <p className="mt-2 min-h-[1rem] text-xs font-medium text-flag-red" aria-live="polite">{message}</p>
      </div>

      {/* ------------------------------------------------ viewer + notes */}
      <div className={current ? "grid grid-cols-1 gap-4 lg:grid-cols-2" : ""}>
        {current && (
          <figure className="min-w-0">
            <div className="flex items-center justify-between pb-1.5">
              <figcaption className="label mb-0">Page {firstPage + active}</figcaption>
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => setActive((a) => Math.max(0, a - 1))} disabled={active === 0} aria-label="Previous page" className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-600 disabled:opacity-40">←</button>
                <button type="button" onClick={() => setActive((a) => Math.min(photos.length - 1, a + 1))} disabled={active === photos.length - 1} aria-label="Next page" className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-600 disabled:opacity-40">→</button>
              </div>
            </div>
            <a href={current.url} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-xl bg-slate-900" title="Open full size">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={current.url} alt={`Photo of page ${firstPage + active} of the notes`} className="mx-auto max-h-[28rem] w-full object-contain" />
            </a>
            {current.state === "failed" && <p className="mt-1.5 text-xs text-flag-red">{current.note} Type this page in yourself.</p>}
          </figure>
        )}
        <div className="min-w-0">
          <label className="label" htmlFor="raw_notes">Raw notes</label>
          <textarea
            id="raw_notes"
            name="raw_notes"
            ref={text}
            defaultValue={defaultValue}
            rows={current ? 16 : 12}
            required
            minLength={30}
            className="input font-mono text-[13px] leading-relaxed"
            placeholder={photos.length && !canScan ? "Type what the photos say. Taglish is fine, no need to organize." : "Type or paste your notes exactly as you wrote them. Taglish is fine, no need to organize."}
          />
          <div className="mt-2 flex flex-wrap items-center gap-3">
            {showSample && (
              <button type="button" className="btn-outline btn-sm" onClick={() => { if (text.current) text.current.value = SAMPLE; }}>
                Use sample notes
              </button>
            )}
            {reading && <span className="text-xs font-medium text-flag-blue" aria-live="polite">Reading the photos… you can keep typing.</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Shrinks a photo in the browser (longest side 1600 px) so several fit under the upload limit. */
async function shrink(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.78);
}
