"use client";

import { useFormStatus } from "react-dom";

export default function SubmitButton({
  children,
  pending = "Working...",
  className = "btn-primary",
}: {
  children: React.ReactNode;
  pending?: string;
  className?: string;
}) {
  const { pending: busy } = useFormStatus();
  return (
    <button type="submit" disabled={busy} className={className}>
      {busy ? pending : children}
    </button>
  );
}
