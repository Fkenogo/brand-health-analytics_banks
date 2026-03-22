import fs from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const specPath = path.join(repoRoot, 'monitoring', 'brandedge-observability-spec.json');

const args = new Set(process.argv.slice(2));
const projectId = process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT || '';

if (!fs.existsSync(specPath)) {
  console.error(`Missing monitoring spec: ${specPath}`);
  process.exit(1);
}

const spec = JSON.parse(fs.readFileSync(specPath, 'utf8'));

const buildMetricCommand = (metric) => (
  [
    `gcloud logging metrics create ${metric.name}`,
    `  --description=${JSON.stringify(metric.description)}`,
    `  --log-filter=${JSON.stringify(metric.filter)}`,
  ].join(' \\\n')
);

const buildAlertPolicy = (alert) => ({
  displayName: alert.displayName,
  documentation: {
    content: alert.documentation,
    mimeType: 'text/markdown',
  },
  combiner: 'OR',
  conditions: [
    {
      displayName: `${alert.displayName} threshold`,
      conditionThreshold: {
        filter: `metric.type="logging.googleapis.com/user/${alert.metric}" AND resource.type="${alert.resourceType || 'cloud_run_revision'}"`,
        comparison: 'COMPARISON_GT',
        thresholdValue: alert.threshold,
        duration: alert.duration,
        aggregations: [
          {
            alignmentPeriod: '60s',
            perSeriesAligner: 'ALIGN_RATE',
          },
        ],
        trigger: {
          count: 1,
        },
      },
    },
  ],
  enabled: true,
  alertStrategy: {
    autoClose: '1800s',
  },
});

const outDir = path.join(repoRoot, 'monitoring', 'generated');
if (args.has('--write')) {
  fs.mkdirSync(outDir, { recursive: true });
  for (const alert of spec.alerts) {
    const target = path.join(outDir, `${alert.name}.json`);
    fs.writeFileSync(target, `${JSON.stringify(buildAlertPolicy(alert), null, 2)}\n`);
  }
}

const lines = [];
lines.push('# BrandEdge monitoring provisioning plan');
lines.push('');
if (projectId) {
  lines.push(`Detected project: ${projectId}`);
  lines.push('');
}

lines.push('## Log-based metrics');
for (const metric of spec.metrics) {
  lines.push('');
  lines.push(buildMetricCommand(metric));
}

lines.push('');
lines.push('## Alert policies');
lines.push('');
lines.push('Run with `--write` first to emit alert policy JSON files under `monitoring/generated/`.');
for (const alert of spec.alerts) {
  const filename = `monitoring/generated/${alert.name}.json`;
  lines.push('');
  lines.push(`gcloud alpha monitoring policies create --policy-from-file=${filename}`);
}

const output = `${lines.join('\n')}\n`;
process.stdout.write(output);
