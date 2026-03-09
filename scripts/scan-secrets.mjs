#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const IGNORE_DIRS = new Set(['.git', 'node_modules', 'dist', '.firebase']);
const IGNORE_FILES = new Set(['package-lock.json', 'functions/package-lock.json']);

const PATTERNS = [
  { name: 'Google API key', regex: /AIza[0-9A-Za-z_-]{20,}/g },
  { name: 'OpenAI key', regex: /sk-[A-Za-z0-9]{20,}/g },
  { name: 'Private key block', regex: /-----BEGIN [A-Z ]*PRIVATE KEY-----/g },
  { name: 'GitHub token', regex: /ghp_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{20,}/g },
  { name: 'AWS access key', regex: /AKIA[0-9A-Z]{16}/g },
  { name: 'Slack token', regex: /xox[baprs]-[A-Za-z0-9-]{10,}/g },
  { name: 'SendGrid key', regex: /SG\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g },
];

const findings = [];

const walk = (dir) => {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    const rel = path.relative(ROOT, full);
    if (entry.isDirectory()) {
      if (IGNORE_DIRS.has(entry.name)) continue;
      walk(full);
      continue;
    }
    if (entry.name === '.env' || entry.name.startsWith('.env.')) continue;
    if (IGNORE_FILES.has(rel)) continue;
    scanFile(full, rel);
  }
};

const scanFile = (full, rel) => {
  let content;
  try {
    content = fs.readFileSync(full, 'utf8');
  } catch {
    return;
  }
  for (const { name, regex } of PATTERNS) {
    regex.lastIndex = 0;
    const match = regex.exec(content);
    if (match) {
      findings.push({ file: rel, type: name, sample: match[0].slice(0, 24) });
    }
  }
};

walk(ROOT);

if (findings.length > 0) {
  console.error('Potential secrets detected:');
  for (const finding of findings) {
    console.error(`- ${finding.file}: ${finding.type} (${finding.sample}...)`);
  }
  process.exit(1);
}

console.log('No known secret patterns detected.');
