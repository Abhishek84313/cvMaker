/**
 * Offline quality report for the local keyword extractor.
 * Run with `npm run eval:keywords`. The affinity database is not connected here, so the
 * profile adaptation stays neutral and results only reflect the extraction pipeline itself.
 */
import { LocalkeywordsExtractor } from '../localKeywordsExtract';
import { foldText } from '../textSanitizer';
import { JOB_DESCRIPTIONS } from './jobDescriptions.fixture';

const verbose = process.argv.includes('--verbose');
let totalPrecision = 0;
let totalRecall = 0;

for (const job of JOB_DESCRIPTIONS) {
    const keywords = LocalkeywordsExtractor.extractKeywords(job.text, job.language);
    const expected = new Set(job.expected.map(foldText));
    const hits = keywords.filter(keyword => expected.has(foldText(keyword)));
    const found = new Set(keywords.map(foldText));
    const missed = job.expected.filter(keyword => !found.has(foldText(keyword)));

    const precision = keywords.length ? hits.length / keywords.length : 0;
    const recall = Math.min(keywords.length, expected.size) ? hits.length / Math.min(keywords.length, expected.size) : 0;
    totalPrecision += precision;
    totalRecall += recall;

    console.log(`\n${job.name}`);
    console.log(`  precision@${keywords.length}: ${(precision * 100).toFixed(0)}%   recall@25: ${(recall * 100).toFixed(0)}%`);
    console.log(`  noise: ${keywords.filter(keyword => !expected.has(foldText(keyword))).join(', ') || '-'}`);
    if (verbose) {
        console.log(`  keywords: ${keywords.join(', ')}`);
        console.log(`  missed: ${missed.join(', ') || '-'}`);
    }
}

const count = JOB_DESCRIPTIONS.length;
console.log(`\nMean precision: ${((totalPrecision / count) * 100).toFixed(1)}%   Mean recall@25: ${((totalRecall / count) * 100).toFixed(1)}%`);
