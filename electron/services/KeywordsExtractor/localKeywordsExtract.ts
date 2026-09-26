import { createHash } from 'node:crypto';
import nlp from 'compromise';
import { Language } from '../../../shared/profile.interface';
import { EN_STOP_WORDS, FR_STOP_WORDS } from './stopWords.const';
import { AMBIGUOUS_SKILLS, GENERIC_TERMS, SECTION_HEADINGS, SKILL_LEXICON } from './skillLexicon.const';
import { KeywordsAffinityDatabase } from './KeywordsAffinityDatabase';
import { foldText } from './textSanitizer';

const MAX_KEYWORDS = 25;
const MAX_PHRASE_TOKENS = 3;
const MAX_LEXICON_TOKENS = 4;
/** How many top candidates are scored against the affinity database and recorded as document frequency. */
const MAX_AFFINITY_CANDIDATES = 150;

/**
 * A word, keeping technical tokens intact: C++, C#, .NET, Node.js, CI/CD, S3, R&D, front-end.
 * Inner punctuation is only kept when followed by a letter or digit, so a sentence-ending dot is dropped.
 */
const TOKEN_PATTERN = /(?<![\p{L}\p{N}])\.?[\p{L}\p{N}](?:[\p{L}\p{N}+#]|[.\-/'&](?=[\p{L}\p{N}]))*[+#]*/gu;
/** Anything that can't be part of a token ends a phrase (commas, parentheses, colons, quotes...). */
const SEGMENT_BREAK = /[^\p{L}\p{N}\s.+#\-/'&]+/u;
const NUMERIC_TOKEN = /^[\p{N}.,+%\-/#&]+$/u;
/** "Python-based", "data-driven": the suffix adds nothing to the skill. */
const GENERIC_HYPHEN_SUFFIX = /^(.+)-(?:based|driven|oriented|related|focused|minded|centric|level|native)$/iu;
/** French future tense ("développerez", "participerez", "mettrez"), typical of job postings. */
const FRENCH_VERB_ENDINGS = /(?:rez|ras|rons|ront|issez|issons)$/;
/** French elisions split off a word: "d'achat" -> "d'" + "achat". */
const FRENCH_ELISION = /^(qu|[ldjnmtsc])'(?=\p{L})/iu;
const FRENCH_ELISION_KEYS: Record<string, string> = { qu: 'que', l: 'le', d: 'de', j: 'je', n: 'ne', m: 'me', t: 'te', s: 'se', c: 'ce' };
/** Linking words allowed inside a French phrase ("tableaux de bord", "prévisions de ventes", "comportement d'achat"). */
const FRENCH_PHRASE_JOINERS = new Set(['de', 'du', 'des']);

interface Token {
    surface: string;
    key: string;
    sentenceStart: boolean;
    /** Canonical display form when the token is a known skill from the lexicon. */
    skill?: string;
    isBreak?: boolean;
    isJoiner?: boolean;
}

interface Segment {
    tokens: Token[];
    weight: number;
}

interface Candidate {
    key: string;
    parts: string[];
    tf: number;
    weight: number;
    skill?: string;
    surfaces: Map<string, number>;
    midSentenceOccurrences: number;
    capitalizedMidSentence: number;
    firstIndex: number;
    /** Sub-phrases of long chunks are only kept when they recur, otherwise they are arbitrary n-grams. */
    needsRecurrence: boolean;
    subsumed: boolean;
}

interface WordClasses {
    verbs: Set<string>;
    gerunds: Set<string>;
}

const BREAK_TOKEN: Token = { surface: '', key: '', sentenceStart: false, isBreak: true };

export class LocalkeywordsExtractor {
    private static STOP_WORDS = new Set<string>();
    private static language: Language = Language.ENGLISH;
    private static lexicon: Map<string, string> | null = null;
    /** Every word used inside a multi-word lexicon entry ("event-driven" in "event-driven architecture"). */
    private static lexiconWords: Set<string> | null = null;
    private static headingMatchers: { weight: number; full: RegExp; prefix: RegExp }[] | null = null;

    public static setStopWords(language: Language) {
        this.language = language;
        const lists = language === Language.FRENCH
            ? [FR_STOP_WORDS.fillers, FR_STOP_WORDS.jobContext, FR_STOP_WORDS.structural, FR_STOP_WORDS.verbs, GENERIC_TERMS.fr]
            : [EN_STOP_WORDS.fillers, EN_STOP_WORDS.jobContext, EN_STOP_WORDS.structural, EN_STOP_WORDS.verbs, GENERIC_TERMS.en];

        // Stop words are compared on accent-folded keys, so "très" and "tres" both match.
        this.STOP_WORDS = new Set(lists.flat().map(word => foldText(word.trim())));
    }

    public static extractKeywords(text: string, language: Language = Language.ENGLISH): string[] {
        if (!text || text.trim().length === 0) return [];
        this.setStopWords(language || Language.ENGLISH);

        const preparedText = this.prepareText(text);
        const segments = this.segmentText(preparedText);
        const wordClasses = this.language === Language.ENGLISH
            ? this.detectWordClasses(preparedText)
            : { verbs: new Set<string>(), gerunds: new Set<string>() };

        const candidates = this.collectCandidates(segments, wordClasses);
        this.markSubsumedCandidates(candidates);

        const ranked = Array.from(candidates.values())
            .filter(candidate => !candidate.subsumed && !(candidate.needsRecurrence && candidate.tf < 2))
            .map(candidate => ({ candidate, display: this.displayForm(candidate) }))
            .filter(({ display }) => display.length > 1 && display.length <= 40)
            .map(item => ({ ...item, score: this.baseScore(item.candidate, item.display) }))
            .sort((a, b) => b.score - a.score || a.candidate.firstIndex - b.candidate.firstIndex)
            .slice(0, MAX_AFFINITY_CANDIDATES);

        const dbAffinity = KeywordsAffinityDatabase.getInstance();
        const affinityKeys = ranked.map(({ display }) => display.toLowerCase());
        const multipliers = dbAffinity.getAffinityMultipliers(affinityKeys);

        const result = ranked
            .map(item => ({ ...item, score: item.score * (multipliers.get(item.display.toLowerCase()) ?? 1) }))
            .sort((a, b) => b.score - a.score || a.candidate.firstIndex - b.candidate.firstIndex)
            .slice(0, MAX_KEYWORDS)
            .map(({ display }) => display);

        // Document frequency is recorded after scoring so a posting doesn't influence its own ranking.
        // Kept keywords are counted by the caller (see mandateAnalysis), not here, to avoid double counting.
        const documentHash = createHash('sha1').update(foldText(preparedText).replace(/\s+/g, ' ')).digest('hex');
        dbAffinity.recordDocument(documentHash, affinityKeys);

        return result;
    }

    /**
     * Light, language-aware normalisation needed by the tokenizer.
     * Encoding repair and typography cleanup belong to sanitizeText(), applied where the text enters the app.
     */
    private static prepareText(text: string): string {
        const normalized = text
            .normalize('NFC')
            .replace(/\r\n?/g, '\n')
            .replace(/[\u2018\u2019\u201B`\u00B4]/g, "'");

        // French elisions are split by the tokenizer, since "d'" can link a phrase ("comportement d'achat").
        if (this.language === Language.FRENCH) return normalized;
        // bachelor's, you'll, don't -> bachelor, you, don
        return normalized.replace(/'(?:s|ll|re|ve|d|m|t)(?![\p{L}])/giu, '');
    }

    /**
     * Splits the text into phrase-safe segments and weights each one by the section it belongs to.
     */
    private static segmentText(text: string): Segment[] {
        const segments: Segment[] = [];
        let sectionWeight = 1;

        for (const rawLine of text.split('\n')) {
            let line = rawLine.trim();
            if (!line) continue;

            const headingWeight = this.detectHeading(line);
            if (headingWeight !== null) {
                sectionWeight = headingWeight;
                continue;
            }

            // Inline heading: "Requirements: Python, Docker"
            let lineWeight = sectionWeight;
            const inlineHeading = line.match(/^([^:]{2,40}):\s*(.+)$/);
            if (inlineHeading) {
                const inlineWeight = this.detectHeading(`${inlineHeading[1]}:`);
                if (inlineWeight !== null) {
                    lineWeight = inlineWeight;
                    line = inlineHeading[2];
                }
            }

            for (const sentence of line.split(/(?<=[.!?;:])\s+/)) {
                let sentenceStart = true;
                for (const part of sentence.split(new RegExp(`${SEGMENT_BREAK.source}|\\s-\\s`, 'u'))) {
                    const tokens = this.tokenize(part, sentenceStart);
                    if (tokens.length > 0) {
                        segments.push({ tokens: this.matchLexicon(tokens), weight: lineWeight });
                        sentenceStart = false;
                    }
                }
            }
        }
        return segments;
    }

    private static tokenize(text: string, sentenceStart: boolean): Token[] {
        const tokens: Token[] = [];
        const lexiconWords = this.getLexiconWords();

        for (const match of text.matchAll(TOKEN_PATTERN)) {
            let surface = match[0];
            const isFirst = sentenceStart && tokens.length === 0;

            const elision = this.language === Language.FRENCH ? surface.match(FRENCH_ELISION) : null;
            if (elision) {
                const key = FRENCH_ELISION_KEYS[elision[1].toLowerCase()];
                tokens.push({ surface: elision[0], key, sentenceStart: isFirst, isJoiner: FRENCH_PHRASE_JOINERS.has(key) });
                surface = surface.slice(elision[0].length);
            }

            const isKnown = lexiconWords.has(foldText(surface));
            const genericSuffix = surface.match(GENERIC_HYPHEN_SUFFIX);
            if (genericSuffix && !isKnown) {
                surface = genericSuffix[1];
            }

            // "React/Vue" -> two terms, but keep "CI/CD", "TCP/IP", "A/B", "UI/UX" whole.
            const slashParts = surface.split('/');
            if (slashParts.length > 1 && !isKnown && slashParts.every(part => part.length >= 3)) {
                slashParts.forEach((part, index) => {
                    if (index > 0) tokens.push(BREAK_TOKEN);
                    tokens.push({ surface: part, key: foldText(part), sentenceStart: isFirst && index === 0 });
                });
                continue;
            }

            const key = foldText(surface);
            const isJoiner = this.language === Language.FRENCH && FRENCH_PHRASE_JOINERS.has(key);
            tokens.push({ surface, key, sentenceStart: isFirst && !elision, isJoiner });
        }
        return tokens;
    }

    /**
     * Greedy longest match of known skills, merging multi-word skills ("Ruby on Rails", "machine learning")
     * into a single protected token.
     */
    private static matchLexicon(tokens: Token[]): Token[] {
        const lexicon = this.getLexicon();
        const merged: Token[] = [];

        for (let i = 0; i < tokens.length; i++) {
            let matched = false;
            for (let length = Math.min(MAX_LEXICON_TOKENS, tokens.length - i); length >= 1; length--) {
                const slice = tokens.slice(i, i + length);
                if (slice.some(token => token.isBreak)) continue;

                const key = slice.map(token => token.key).join(' ');
                const canonical = lexicon.get(key);
                if (!canonical || (length === 1 && !this.isUnambiguousSkill(slice[0], canonical))) continue;

                merged.push({
                    surface: this.joinSurfaces(slice),
                    key: foldText(canonical),
                    sentenceStart: slice[0].sentenceStart,
                    skill: canonical,
                });
                i += length - 1;
                matched = true;
                break;
            }
            if (!matched) merged.push(tokens[i]);
        }
        return merged;
    }

    private static isUnambiguousSkill(token: Token, canonical: string): boolean {
        const rule = AMBIGUOUS_SKILLS[token.key];
        if (rule === 'exact') return token.surface === canonical;
        if (rule === 'capitalized') return /^\p{Lu}/u.test(token.surface);
        return true;
    }

    /**
     * Uses compromise's part-of-speech tagging (English only) to find words mostly used as verbs or adverbs
     * in this posting ("maintain", "optimizing", "closely"), which then act as phrase delimiters.
     */
    private static detectWordClasses(text: string): WordClasses {
        const votes = new Map<string, { verb: number; gerund: number; total: number }>();
        const sentences = nlp(text).json() as { terms: { text: string; normal?: string; tags: string[] }[] }[];

        for (const sentence of sentences) {
            for (const term of sentence.terms) {
                const key = foldText(term.normal || term.text);
                const vote = votes.get(key) ?? { verb: 0, gerund: 0, total: 0 };
                const isGerund = term.tags.includes('Gerund');
                if (isGerund) vote.gerund++;
                else if (term.tags.includes('Verb') || term.tags.includes('Adverb')) vote.verb++;
                vote.total++;
                votes.set(key, vote);
            }
        }

        const verbs = new Set<string>();
        const gerunds = new Set<string>();
        for (const [key, vote] of votes) {
            if (vote.verb > vote.total / 2) verbs.add(key);
            if (vote.gerund > vote.total / 2) gerunds.add(key);
        }
        return { verbs, gerunds };
    }

    private static isDelimiter(token: Token, wordClasses: WordClasses): boolean {
        if (token.isBreak) return true;
        if (token.skill) return false;

        const { key, surface } = token;
        if (key.length <= 2 || key.length > 30 || NUMERIC_TOKEN.test(key)) return true;
        if (this.STOP_WORDS.has(key) || this.STOP_WORDS.has(this.singular(key))) return true;

        const lowercaseOrSentenceStart = token.sentenceStart || !/^\p{Lu}/u.test(surface);
        if (wordClasses.verbs.has(key) && lowercaseOrSentenceStart) return true;
        if (this.language === Language.FRENCH && FRENCH_VERB_ENDINGS.test(key) && lowercaseOrSentenceStart) return true;
        return false;
    }

    private static collectCandidates(segments: Segment[], wordClasses: WordClasses): Map<string, Candidate> {
        const candidates = new Map<string, Candidate>();
        let position = 0;

        const addCandidate = (tokens: Token[], weight: number, needsRecurrence: boolean) => {
            const skill = tokens.length === 1 ? tokens[0].skill : undefined;
            const parts = skill ? [tokens[0].key] : tokens.map(token => this.singular(token.key));
            const key = parts.join(' ');
            const surface = this.joinSurfaces(tokens);
            const isMidSentence = !tokens[0].sentenceStart;

            const candidate = candidates.get(key) ?? {
                key,
                parts,
                tf: 0,
                weight,
                skill,
                surfaces: new Map<string, number>(),
                midSentenceOccurrences: 0,
                capitalizedMidSentence: 0,
                firstIndex: position,
                needsRecurrence,
                subsumed: false,
            };

            candidate.tf++;
            candidate.weight = Math.max(candidate.weight, weight);
            candidate.needsRecurrence = candidate.needsRecurrence && needsRecurrence;
            // Sentence-initial capitals say nothing about the word, so mid-sentence spellings win for display.
            candidate.surfaces.set(surface, (candidate.surfaces.get(surface) ?? 0) + (isMidSentence ? 2 : 1));
            if (isMidSentence) {
                candidate.midSentenceOccurrences++;
                if (tokens.some(token => /^\p{Lu}/u.test(token.surface))) candidate.capitalizedMidSentence++;
            }
            candidates.set(key, candidate);
        };

        for (const segment of segments) {
            let chunk: Token[] = [];

            const contentLength = (tokens: Token[]) => tokens.filter(token => !token.isJoiner).length;

            const flushChunk = () => {
                // "Designing APIs", "Managing budgets": a leading gerund describes the task, not the skill.
                while (chunk.length > 0 && (chunk[0].isJoiner || wordClasses.gerunds.has(chunk[0].key))) chunk.shift();
                while (chunk.length > 0 && chunk[chunk.length - 1].isJoiner) chunk.pop();

                const chunkLength = contentLength(chunk);
                if (chunkLength > 0 && chunkLength <= MAX_PHRASE_TOKENS) {
                    addCandidate(chunk, segment.weight, false);
                }
                // Sub-phrases: never starting or ending on a joiner ("de bord", "prévisions de").
                for (let start = 0; start < chunk.length && chunkLength > 1; start++) {
                    for (let end = start + 1; end <= chunk.length; end++) {
                        const slice = chunk.slice(start, end);
                        const sliceLength = contentLength(slice);
                        if (sliceLength > MAX_PHRASE_TOKENS) break;
                        if (slice.length === chunk.length || slice[0].isJoiner || slice[slice.length - 1].isJoiner) continue;
                        addCandidate(slice, segment.weight, sliceLength > 1);
                    }
                }
                chunk = [];
            };

            for (const token of segment.tokens) {
                position++;
                if (token.skill) {
                    // Known skills stand alone: lists like "Python Django Flask" shouldn't become one phrase.
                    flushChunk();
                    addCandidate([token], segment.weight, false);
                } else if (token.isJoiner) {
                    if (chunk.length > 0) chunk.push(token);
                } else if (this.isDelimiter(token, wordClasses)) {
                    flushChunk();
                } else {
                    chunk.push(token);
                }
            }
            flushChunk();
        }
        return candidates;
    }

    /**
     * A shorter candidate that only appears inside longer ones ("statements" in "financial statements",
     * "tax" in "tax filings" + "corporate income tax") is redundant.
     * Comparison is done on whole tokens, so "java" is never hidden by "javascript".
     */
    private static markSubsumedCandidates(candidates: Map<string, Candidate>): void {
        const occurrencesInsidePhrases = new Map<string, number>();

        for (const candidate of candidates.values()) {
            const { parts } = candidate;
            if (parts.length < 2 || (candidate.needsRecurrence && candidate.tf < 2)) continue;

            const innerKeys = new Set<string>();
            for (let size = 1; size < parts.length; size++) {
                for (let start = 0; start + size <= parts.length; start++) {
                    innerKeys.add(parts.slice(start, start + size).join(' '));
                }
            }
            for (const innerKey of innerKeys) {
                occurrencesInsidePhrases.set(innerKey, (occurrencesInsidePhrases.get(innerKey) ?? 0) + candidate.tf);
            }
        }

        for (const candidate of candidates.values()) {
            if (!candidate.skill && (occurrencesInsidePhrases.get(candidate.key) ?? 0) >= candidate.tf) {
                candidate.subsumed = true;
            }
        }
    }

    private static baseScore(candidate: Candidate, display: string): number {
        const frequency = 1 + Math.log(candidate.tf);
        const phraseBonus = candidate.parts.length > 1 ? 1.15 : 1;
        return frequency * this.specificity(candidate, display) * candidate.weight * phraseBonus;
    }

    /**
     * How much a term looks like a hard skill rather than everyday vocabulary.
     */
    private static specificity(candidate: Candidate, display: string): number {
        if (candidate.skill) return 2;
        // Letters mixed with digits or symbols: S3, ES2022, OAuth2, Vue3, C++ variants...
        if (/\p{L}\p{N}|\p{N}\p{L}|[+#]|\.\p{L}/u.test(display)) return 1.6;
        // Acronyms: SOX, HACCP, CRM, GMP
        if (/^[\p{Lu}\p{N}&/-]{2,8}$/u.test(display)) return 1.5;
        // Consistently capitalised mid-sentence: product names and proper nouns (Kubernetes, Figma, Revit...)
        if (candidate.capitalizedMidSentence > 0 && candidate.capitalizedMidSentence * 2 >= candidate.midSentenceOccurrences) return 1.35;
        // A single, lowercase, unknown word is most often generic vocabulary.
        if (candidate.parts.length === 1) return 0.7;
        return 1;
    }

    /**
     * Known skills use their canonical spelling, except when a French posting uses a French alias
     * ("statistiques", "tableaux de bord"), which is kept as written.
     */
    private static displayForm(candidate: Candidate): string {
        const { skill } = candidate;
        if (skill) {
            const usesCanonicalSpelling = Array.from(candidate.surfaces.keys()).some(surface => foldText(surface) === foldText(skill));
            if (this.language !== Language.FRENCH || usesCanonicalSpelling) return skill;
        }
        let best = '';
        let bestCount = -1;
        for (const [surface, count] of candidate.surfaces) {
            if (count > bestCount) {
                best = surface;
                bestCount = count;
            }
        }
        return best;
    }

    /** "comportement" + "d'" + "achat" -> "comportement d'achat" */
    private static joinSurfaces(tokens: Token[]): string {
        return tokens.reduce((text, token) => (!text || text.endsWith("'") ? text + token.surface : `${text} ${token.surface}`), '');
    }

    /** Minimal plural folding used for grouping ("APIs"/"API", "pipelines"/"pipeline"). */
    private static singular(key: string): string {
        if (key.length > 4 && key.endsWith('ies')) return `${key.slice(0, -3)}y`;
        if (key.length > 3 && key.endsWith('s') && !/(?:ss|us|is|os|as)$/.test(key)) return key.slice(0, -1);
        return key;
    }

    private static detectHeading(line: string): number | null {
        if (line.split(/\s+/).length > 7) return null;

        const normalized = foldText(line)
            .replace(/[^\p{L}\p{N}' -]/gu, ' ')
            .replace(/\s+/g, ' ')
            .trim();
        if (!normalized) return null;

        const endsWithColon = /:\s*$/.test(line);
        for (const matcher of this.getHeadingMatchers()) {
            if (matcher.full.test(normalized) || (endsWithColon && matcher.prefix.test(normalized))) {
                return matcher.weight;
            }
        }
        return null;
    }

    private static getHeadingMatchers() {
        if (!this.headingMatchers) {
            this.headingMatchers = SECTION_HEADINGS.map(({ weight, patterns }) => {
                const alternatives = patterns.join('|');
                return {
                    weight,
                    full: new RegExp(`^(?:(?:our|your|the|nos|vos|les|la|le) |l')?(?:${alternatives})$`),
                    prefix: new RegExp(`^(?:(?:our|your|the|nos|vos|les|la|le) |l')?(?:${alternatives})\\b`),
                };
            });
        }
        return this.headingMatchers;
    }

    /** Lexicon index: folded alias tokens joined by a space -> canonical display. */
    private static getLexicon(): Map<string, string> {
        if (!this.lexicon) {
            this.lexicon = new Map();
            this.lexiconWords = new Set();
            for (const entry of SKILL_LEXICON) {
                const [canonical, ...aliases] = entry.split('|');
                for (const alias of [canonical, ...aliases]) {
                    // Elisions are keyed the way the tokenizer emits them: "tests d'intégration" -> "tests de integration".
                    const expanded = alias.replace(/(?<!\p{L})(qu|[ldjnmtsc])'(?=\p{L})/giu, (_, elided: string) => `${FRENCH_ELISION_KEYS[elided.toLowerCase()]} `);
                    const words = Array.from(expanded.matchAll(TOKEN_PATTERN), match => foldText(match[0]));
                    const key = words.join(' ');
                    words.forEach(word => this.lexiconWords!.add(word));
                    if (key && !this.lexicon.has(key)) this.lexicon.set(key, canonical);
                }
            }
        }
        return this.lexicon;
    }

    private static getLexiconWords(): Set<string> {
        this.getLexicon();
        return this.lexiconWords!;
    }
}
