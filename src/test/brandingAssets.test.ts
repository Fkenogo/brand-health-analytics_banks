import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const repoRoot = path.resolve(__dirname, '..', '..');

describe('branding assets', () => {
  it('serves BrandEdge favicon variants without lovable references', () => {
    const indexHtml = fs.readFileSync(path.join(repoRoot, 'index.html'), 'utf8');
    const viteConfig = fs.readFileSync(path.join(repoRoot, 'vite.config.ts'), 'utf8');
    const firebaseConfig = fs.readFileSync(path.join(repoRoot, 'firebase.json'), 'utf8');

    expect(indexHtml).toContain('/brandedge-favicon.svg?v=20260325');
    expect(indexHtml).toContain('/favicon-32x32.png?v=20260325');
    expect(indexHtml).toContain('/favicon-16x16.png?v=20260325');
    expect(indexHtml).toContain('/favicon.ico?v=20260325');
    expect(indexHtml).toContain('/apple-touch-icon.png?v=20260325');
    expect(indexHtml.toLowerCase()).not.toContain('lovable');
    expect(viteConfig.toLowerCase()).not.toContain('lovable');
    expect(firebaseConfig).toContain('/brandedge-favicon.svg');
    expect(firebaseConfig).toContain('/favicon.ico');
    expect(firebaseConfig).toContain('no-cache, no-store, must-revalidate');
  });

  it('stores generated favicon assets in public/', () => {
    expect(fs.existsSync(path.join(repoRoot, 'public', 'favicon.ico'))).toBe(true);
    expect(fs.existsSync(path.join(repoRoot, 'public', 'favicon-32x32.png'))).toBe(true);
    expect(fs.existsSync(path.join(repoRoot, 'public', 'favicon-16x16.png'))).toBe(true);
    expect(fs.existsSync(path.join(repoRoot, 'public', 'apple-touch-icon.png'))).toBe(true);
  });
});
