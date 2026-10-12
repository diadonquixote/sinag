"use client";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="container-x py-24 text-center">
      <p className="eyebrow">Something went wrong</p>
      <h1 className="mt-2 text-4xl font-bold">Sorry, this page didn&apos;t load</h1>
      <p className="mt-3 text-slate-600">Please try again. If it keeps happening, tell the SK team.</p>
      <button onClick={reset} className="btn-primary mt-6">Try again</button>
    </div>
  );
}
