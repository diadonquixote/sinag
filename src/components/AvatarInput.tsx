/*
 * Sinag - Copyright (c) 2026 Kristina Diane Aviles, PDYN Technologies. All rights reserved.
 * Proprietary software: only the copyright holder may edit, copy or distribute this code. See LICENSE.
 */
"use client";

import { useRef, useState } from "react";
import SubmitButton from "./SubmitButton";

const OUT = 320; // stored photos are 320×320 px

/**
 * Pick a photo, crop it to a centred square and shrink it in the browser,
 * then send it with the surrounding form as a small JPEG data URL.
 */
export default function AvatarInput({ current, initials }: { current: string | null; initials: string }) {
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState("");
  const file = useRef<HTMLInputElement>(null);

  async function pick(e: React.ChangeEvent<HTMLInputElement>) {
    setError("");
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) return setError("Please choose an image file.");
    try {
      const bitmap = await createImageBitmap(f);
      const side = Math.min(bitmap.width, bitmap.height);
      const canvas = document.createElement("canvas");
      canvas.width = OUT;
      canvas.height = OUT;
      const ctx = canvas.getContext("2d")!;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, OUT, OUT);
      setPreview(canvas.toDataURL("image/jpeg", 0.86));
    } catch {
      setError("This photo could not be opened. Try a JPG or PNG.");
    }
  }

  function cancel() {
    setPreview(null);
    setError("");
    if (file.current) file.current.value = "";
  }

  const shown = preview ?? current;
  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
      <div className="relative">
        {shown ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={shown} alt="Your profile photo" className="h-24 w-24 rounded-full object-cover ring-4 ring-white shadow-md" />
        ) : (
          <span aria-hidden="true" className="flex h-24 w-24 items-center justify-center rounded-full bg-flag-blue text-2xl font-bold text-white ring-4 ring-white shadow-md">{initials}</span>
        )}
        {preview && <span className="absolute -right-1 -top-1 rounded-full bg-flag-yellow px-2 py-0.5 text-[10px] font-bold text-ink shadow">New</span>}
      </div>
      <div className="flex flex-col items-center gap-2 sm:items-start">
        <input type="hidden" name="photo" value={preview ?? ""} />
        <input ref={file} type="file" accept="image/jpeg,image/png,image/webp,image/*" onChange={pick} className="hidden" tabIndex={-1} aria-hidden="true" />
        {preview ? (
          <div className="flex flex-wrap gap-2">
            <SubmitButton className="btn-primary btn-sm" pending="Uploading...">Save photo</SubmitButton>
            <button type="button" onClick={cancel} className="btn-outline btn-sm">Cancel</button>
          </div>
        ) : (
          <button type="button" onClick={() => file.current?.click()} className="btn-outline btn-sm">{current ? "Change photo" : "Upload a photo"}</button>
        )}
        <p className="text-center text-xs text-slate-500 sm:text-left">A clear photo of your face. It is cropped to a circle.</p>
        {error && <p role="alert" className="text-xs font-semibold text-flag-red">{error}</p>}
      </div>
    </div>
  );
}
