// Bundles the keyword extractor evaluation with esbuild and runs it in plain Node.
import { build } from 'esbuild';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const outDir = mkdtempSync(path.join(tmpdir(), 'cvmaker-keywords-eval-'));
const outFile = path.join(outDir, 'evaluateKeywords.cjs');

try {
    await build({
        entryPoints: ['electron/services/KeywordsExtractor/evaluation/evaluateKeywords.ts'],
        outfile: outFile,
        bundle: true,
        platform: 'node',
        format: 'cjs',
        logLevel: 'warning',
        // The evaluation never connects the affinity database, and the native module is built for Electron's ABI.
        plugins: [{
            name: 'stub-better-sqlite3',
            setup(pluginBuild) {
                pluginBuild.onResolve({ filter: /^better-sqlite3$/ }, () => ({ path: 'better-sqlite3', namespace: 'stub' }));
                pluginBuild.onLoad({ filter: /.*/, namespace: 'stub' }, () => ({ contents: 'module.exports = class Database {};' }));
            },
        }],
    });
    const { status } = spawnSync(process.execPath, [outFile, ...process.argv.slice(2)], { stdio: 'inherit' });
    process.exitCode = status ?? 1;
} finally {
    rmSync(outDir, { recursive: true, force: true });
}
