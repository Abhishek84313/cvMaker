import iconv from 'iconv-lite';

/**
 * Codecs a UTF-8 byte stream is commonly mis-decoded with before reaching us:
 * - cp850 / cp437: Windows console & stream reads (e.g. "ÔÇÖ" for "’", "├®" for "é")
 * - win1252: classic web/Excel mojibake (e.g. "Ã©" for "é")
 */
const MOJIBAKE_CODECS = ['cp850', 'cp437', 'win1252'] as const;
const NON_ASCII_RUN = /[^\p{ASCII}]{2,}/gu;
/** Characters a repaired run may legitimately contain: Latin letters, typographic punctuation, euro, trademark. */
const PLAUSIBLE_REPAIR = /^(?:[ -~\u00A0-\u017F\u2010-\u203A\u20AC\u2122])+$/;

/**
 * Tries to recover the original text of a run of mis-decoded characters by re-encoding it
 * with the codec that produced it and decoding the bytes as UTF-8.
 * The repair is only accepted when it round-trips losslessly and yields shorter UTF-8 made of
 * plausible characters, which legitimate accented text never does.
 */
function repairMojibakeRun(run: string): string {
    for (const codec of MOJIBAKE_CODECS) {
        const bytes = iconv.encode(run, codec);
        if (iconv.decode(bytes, codec) !== run) continue;

        const decoded = bytes.toString('utf8');
        if (decoded.length < run.length && PLAUSIBLE_REPAIR.test(decoded)) {
            return decoded;
        }
    }
    return run;
}

export function repairMojibake(text: string): string {
    return text.replace(NON_ASCII_RUN, repairMojibakeRun);
}

/**
 * Cleans raw text coming from outside the app (clipboard, files, streams) before any analysis.
 * Kept independent from the NLP pipeline: it only fixes encoding and typography, and preserves
 * accents and line breaks (the extractor uses them for display forms and section detection).
 */
export function sanitizeText(text: string): string {
    if (!text) return '';

    return repairMojibake(text)
        .normalize('NFC')
        .replace(/\r\n?/g, '\n')
        .replace(/[\u200B-\u200D\uFEFF]/g, '')
        .replace(/[\u00A0\u202F\u2007\t]/g, ' ')
        .replace(/[\u2018\u2019\u201B\u2032`\u00B4]/g, "'")
        .replace(/[\u201C\u201D\u201E\u00AB\u00BB]/g, '"')
        .replace(/\s*[\u2013\u2014]\s*/g, ' - ')
        .replace(/[\u2022\u00B7\u25AA\u25BA\u25CF\u25E6\u25A0\u27A2\u2713\u2714]/g, '\n')
        .replace(/[ ]{2,}/g, ' ')
        .replace(/ *\n */g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}

/** Accent-insensitive, lowercase comparison key ("Développement" -> "developpement"). */
export function foldText(text: string): string {
    return text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
}
