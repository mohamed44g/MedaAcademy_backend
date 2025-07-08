import { randomBytes } from 'crypto';
import { join } from 'path';
import { mkdirSync, writeFileSync } from 'fs';
import { config } from 'dotenv';
config();

export function generateEncryptionKey(outputDir: string, videoId: string) {
  const key = randomBytes(16); // Generate 16-byte encryption key
  const keyFileName = `video-key-${Date.now()}-${Math.round(Math.random() * 1e9)}.bin`;
  const keyFilePath = join(outputDir, keyFileName);
  mkdirSync(outputDir, { recursive: true });
  writeFileSync(keyFilePath, key);
  const backendUrl = process.env.backend_Url;
  const keyUrl = `${backendUrl}/videos/key-request?videoId=${videoId}`; // Use endpoint instead of hex or file
  return { key, keyFilePath, keyUrl };
}
