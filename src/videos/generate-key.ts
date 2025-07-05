import { randomBytes } from 'crypto';
import { join } from 'path';
import { mkdirSync, writeFileSync } from 'fs';

export function generateEncryptionKey(outputDir: string, videoId: string) {
  const key = randomBytes(16); // Generate 16-byte encryption key
  const keyFileName = `video-key-${Date.now()}-${Math.round(Math.random() * 1e9)}.bin`;
  const keyFilePath = join(outputDir, keyFileName);
  mkdirSync(outputDir, { recursive: true });
  writeFileSync(keyFilePath, key);
  const keyUrl = `http://localhost:3000/videos/key-request?videoId=${videoId}`; // Use endpoint instead of hex or file
  return { key, keyFilePath, keyUrl };
}
