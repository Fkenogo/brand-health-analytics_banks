import fs from 'node:fs';
import path from 'node:path';

const ENV_FILES = ['.env.local', '.env'];

const parseValue = (raw) => {
  const trimmed = raw.trim();
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
};

export const loadLocalEnv = () => {
  for (const file of ENV_FILES) {
    const fullPath = path.join(process.cwd(), file);
    if (!fs.existsSync(fullPath)) continue;
    const content = fs.readFileSync(fullPath, 'utf8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const separator = trimmed.indexOf('=');
      if (separator <= 0) continue;
      const key = trimmed.slice(0, separator).trim();
      if (!key || process.env[key] !== undefined) continue;
      process.env[key] = parseValue(trimmed.slice(separator + 1));
    }
  }
};
