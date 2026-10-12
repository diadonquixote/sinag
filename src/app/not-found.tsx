import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-x py-24 text-center">
      <p className="eyebrow">404</p>
      <h1 className="mt-2 text-4xl font-bold">We couldn&apos;t find that page</h1>
      <p className="mt-3 text-slate-600">It may have been moved, or the link is wrong.</p>
      <Link href="/" className="btn-primary mt-6">Back to Sinag</Link>
    </div>
  );
}
