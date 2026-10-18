/*
 * Sinag - Copyright (c) 2026 Kristina Diane Aviles, PDYN Technologies. All rights reserved.
 * Proprietary software: only the copyright holder may edit, copy or distribute this code. See LICENSE.
 */
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

/**
 * Encryption of stored photos.
 *
 * Photos of receipts, handwritten notes and profiles live in the database. Without this, anyone
 * who got a copy of the database (a leaked connection string, a stolen backup) could read every
 * photo. Each photo is encrypted with AES-256-GCM before it is stored and decrypted when it is
 * served, using a key kept outside the database (PHOTO_ENCRYPTION_KEY).
 *
 * Layout of a stored photo:  "SNG1" (4 bytes) | iv (12) | auth tag (16) | ciphertext
 *   - A fresh random iv for every photo, so two identical photos never look alike.
 *   - GCM also authenticates: a photo that was altered in the database fails to decrypt
 *     instead of being served.
 *   - Photos stored before encryption existed have no "SNG1" header (a JPEG starts ff d8, a PNG
 *     89 50, a WebP "RIFF"), so they are still served until `npm run db:encrypt-photos`
 *     has encrypted them.
 *
 * Keep the key safe: without it the photos cannot be read, and a backup of the database is not
 * enough on its own. Put a copy in the council's password manager.
 */

const MAGIC = Buffer.from("SNG1", "ascii");
const IV_BYTES = 12;
const TAG_BYTES = 16;
const HEADER = MAGIC.length + IV_BYTES + TAG_BYTES;

/** Reads the key: 32 random bytes, written as base64 (openssl rand -base64 32) or as 64 hex characters. */
export function parseKey(value: string | undefined): Buffer {
  const text = (value ?? "").trim();
  if (!text) throw new Error("PHOTO_ENCRYPTION_KEY is not set. Make one with: openssl rand -base64 32");
  const key = /^[0-9a-fA-F]{64}$/.test(text) ? Buffer.from(text, "hex") : Buffer.from(text, "base64");
  if (key.length !== 32) throw new Error("PHOTO_ENCRYPTION_KEY must be 32 random bytes (openssl rand -base64 32).");
  return key;
}

const key = (): Buffer => parseKey(process.env.PHOTO_ENCRYPTION_KEY);

/** True when these stored bytes carry the encryption header. */
export function isEncrypted(stored: Uint8Array): boolean {
  return stored.length >= HEADER && Buffer.from(stored.subarray(0, MAGIC.length)).equals(MAGIC);
}

/** Encrypts photo bytes for the database. An already-encrypted value is returned unchanged. */
export function encryptPhoto(plain: Uint8Array, withKey: Buffer = key()): Buffer {
  if (isEncrypted(plain)) return Buffer.from(plain);
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv("aes-256-gcm", withKey, iv);
  const body = Buffer.concat([cipher.update(plain), cipher.final()]);
  return Buffer.concat([MAGIC, iv, cipher.getAuthTag(), body]);
}

/**
 * Photo bytes as stored in the database, back to the picture. Throws if the photo was altered
 * or the key is wrong. Photos stored before encryption was added are returned as they are.
 */
export function decryptPhoto(stored: Uint8Array, withKey?: Buffer): Buffer {
  if (!isEncrypted(stored)) return Buffer.from(stored);
  const buf = Buffer.from(stored);
  const iv = buf.subarray(MAGIC.length, MAGIC.length + IV_BYTES);
  const tag = buf.subarray(MAGIC.length + IV_BYTES, HEADER);
  const decipher = createDecipheriv("aes-256-gcm", withKey ?? key(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(buf.subarray(HEADER)), decipher.final()]);
}
