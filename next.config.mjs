/*
 * Sinag - Copyright (c) 2026 Kristina Diane Aviles, PDYN Technologies. All rights reserved.
 * Proprietary software: only the copyright holder may edit, copy or distribute this code. See LICENSE.
 */
import { PHASE_PRODUCTION_BUILD } from "next/constants.js";

/**
 * Security headers sent with every page.
 *
 * - frame-ancestors 'none' and X-Frame-Options: DENY stop another site from loading Sinag in
 *   a hidden frame and tricking an official into clicking "Approve" (clickjacking).
 * - The Content-Security-Policy only lets the page load scripts, styles, images and fonts from
 *   Sinag itself. Nothing is loaded from other sites, so nothing else is allowed.
 *   'unsafe-inline' is needed for the small inline scripts Next.js writes into each page.
 * - nosniff stops browsers guessing file types; Referrer-Policy keeps full addresses private;
 *   Permissions-Policy allows the camera (for receipt photos) and nothing else;
 *   Strict-Transport-Security keeps browsers on HTTPS.
 */
export const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "connect-src 'self'",
  "media-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

export const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

/** The development server needs eval and a live-reload socket, so the policy is only applied to real builds. */
const withCsp = process.env.NODE_ENV === "production"
  ? [...securityHeaders, { key: "Content-Security-Policy", value: csp }]
  : securityHeaders;

/**
 * Settings that must exist before the site can work. A missing one used to build fine and
 * then fail on the first visitor; now the build stops with a message saying what is missing.
 * Set SKIP_ENV_CHECK=1 only for a build that deliberately has no database.
 */
function checkEnvironment() {
  if (process.env.SKIP_ENV_CHECK === "1") return;
  const problems = [];
  const url = process.env.DATABASE_URL || "";
  if (!url) problems.push("DATABASE_URL is not set. It is the Postgres connection string (Neon: the pooled one).");
  else if (!/^postgres(ql)?:\/\//.test(url)) problems.push("DATABASE_URL does not start with postgres:// or postgresql://.");

  const secret = process.env.AUTH_SECRET || "";
  if (!secret) problems.push("AUTH_SECRET is not set. Make one with: openssl rand -base64 32");
  else if (secret.length < 16) problems.push("AUTH_SECRET is too short. Use 32 or more random characters: openssl rand -base64 32");
  else if (secret.length < 32) console.warn("\n  Warning: AUTH_SECRET is shorter than 32 characters. Consider a longer one: openssl rand -base64 32\n");

  const photoKey = (process.env.PHOTO_ENCRYPTION_KEY || "").trim();
  const photoKeyBytes = /^[0-9a-fA-F]{64}$/.test(photoKey) ? 32 : Buffer.from(photoKey, "base64").length;
  if (!photoKey) problems.push("PHOTO_ENCRYPTION_KEY is not set. Photos are encrypted before they are stored. Make a key with: openssl rand -base64 32 (and keep a copy somewhere safe: without it the photos cannot be read).");
  else if (photoKeyBytes !== 32) problems.push("PHOTO_ENCRYPTION_KEY must be 32 random bytes. Make one with: openssl rand -base64 32");

  if (!(process.env.NEXT_PUBLIC_ORG_NAME || "").trim()) {
    console.warn("\n  Warning: NEXT_PUBLIC_ORG_NAME is not set, so the site will just say \"Sangguniang Kabataan\".\n");
  }

  if (problems.length) {
    throw new Error(
      "\n\nSinag cannot be built because of missing settings:\n" +
        problems.map((p) => `  - ${p}`).join("\n") +
        "\n\nAdd them in Vercel -> Project -> Settings -> Environment Variables (or .env.local), then build again.\n",
    );
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Lint runs in CI (npm run lint), where it can fail the check without blocking an urgent deploy.
  eslint: { ignoreDuringBuilds: true },
  experimental: {
    // Photos of handwritten notes are resized in the browser first, so this stays small.
    serverActions: { bodySizeLimit: "4mb" },
  },
  async headers() {
    // Stored photos get an even stricter policy (the same one the routes set themselves):
    // they are pictures, so they may not run or load anything at all.
    const photoPolicy = [{ key: "Content-Security-Policy", value: "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; sandbox" }];
    return [
      { source: "/:path*", headers: withCsp },
      { source: "/api/avatar/:path*", headers: photoPolicy },
      { source: "/api/receipt/:path*", headers: photoPolicy },
      { source: "/api/minutes-photo/:path*", headers: photoPolicy },
    ];
  },
};

export default function config(phase) {
  if (phase === PHASE_PRODUCTION_BUILD) checkEnvironment();
  return nextConfig;
}
