/*
 * Sinag - Copyright (c) 2026 Kristina Diane Aviles, PDYN Technologies. All rights reserved.
 * Proprietary software: only the copyright holder may edit, copy or distribute this code. See LICENSE.
 */
/**
 * The council's own name, shown wherever a visitor needs to know whose records these are.
 *
 * Set NEXT_PUBLIC_ORG_NAME (e.g. "SK ng Barangay San Isidro") in .env.local and in Vercel.
 * NEXT_PUBLIC_ values are baked in at build time, so changing it needs a redeploy.
 */
export const ORG_NAME = (process.env.NEXT_PUBLIC_ORG_NAME || "").trim() || "Sangguniang Kabataan";
