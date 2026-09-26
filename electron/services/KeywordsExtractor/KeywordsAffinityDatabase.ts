import Database from 'better-sqlite3';
import path from 'node:path';
import fs from 'node:fs';
import { KeywordStat } from '../../../shared/Keywords.types';

/** Below this number of analysed postings, the affinity model stays neutral (cold start). */
const MIN_DOCUMENTS_FOR_AFFINITY = 3;
/** Pseudo-count controlling how many sightings are needed before the keep rate is trusted. */
const AFFINITY_CONFIDENCE_PRIOR = 3;
const MAX_DOCUMENT_FREQUENCY_ROWS = 20000;

export class KeywordsAffinityDatabase {
  private static instance: KeywordsAffinityDatabase | null = null;
  private db: Database.Database | null = null;
  private dbPath: string | null = null;

  private constructor() {}

  public static getInstance(): KeywordsAffinityDatabase {
    if (!KeywordsAffinityDatabase.instance) {
      KeywordsAffinityDatabase.instance = new KeywordsAffinityDatabase();
    }
    return KeywordsAffinityDatabase.instance;
  }

  public static reduceCountForKeyword(keyword: string, amount: number = 1): void {
    const instance = this.getInstance();
    if (!instance.db) throw new Error("Affinity Database not connected");
    const stmt = instance.db.prepare(`
      UPDATE local_skills_affinity SET global_count = global_count - ? WHERE keyword = ?
    `);
    stmt.run(amount, keyword.toLowerCase().trim());
  }

  public connect(profilePath: string): void {
    this.initDatabase(profilePath);
  }

  /**
   * Init the SQLite database in a global app data folder, ensuring persistence across sessions and security (no user access to raw files).
   */
  private initDatabase(profilePath: string): void {
    if (!fs.existsSync(profilePath)) {
      fs.mkdirSync(profilePath, { recursive: true });
    }

    const dbPath = path.join(profilePath, 'keywords_affinity.db');
    if (this.dbPath === dbPath && this.db) {
      return;
    }
    this.dbPath = dbPath;
    this.db = new Database(dbPath);

    this.initSchema();
  }

  /**
   * - local_skills_affinity: how many times a keyword was kept as a final keyword (minus user removals).
   * - keyword_document_frequency: in how many analysed postings a keyword appeared as a candidate.
   * - analyzed_documents: hashes of analysed postings, so re-analysing the same text isn't counted twice.
   */
  private initSchema(): void {
    if (!this.db) return;

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS local_skills_affinity (
        keyword TEXT PRIMARY KEY,
        global_count INTEGER DEFAULT 1,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS keyword_document_frequency (
        keyword TEXT PRIMARY KEY,
        doc_count INTEGER NOT NULL DEFAULT 0,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS analyzed_documents (
        hash TEXT PRIMARY KEY,
        analyzed_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
  }

  /**
   * Get the global count of a keyword across all analyses.
   * This can be used to boost keywords that have been frequently validated by users, or to filter out noise.
   */
  public getKeywordGlobalCount(keyword: string): number {
    if (!this.db) return 0;

    const stmt = this.db.prepare(`
      SELECT global_count FROM local_skills_affinity WHERE keyword = ?
    `);

    const res = stmt.get(keyword.toLowerCase()) as { global_count: number } | undefined;
    return res ? res.global_count : 0;
  }

  /**
   * Number of distinct postings analysed by the local extractor for this profile.
   */
  public getDocumentCount(): number {
    if (!this.db) return 0;
    const res = this.db.prepare(`SELECT COUNT(*) as total FROM analyzed_documents`).get() as { total: number };
    return res.total;
  }

  /**
   * Profile adaptation model, returning a multiplier in [0.5, 1.5] per keyword (1 = neutral).
   *
   * Two local signals are combined:
   * - keep rate p = (kept + 1) / (df + 2): among the postings where the keyword was a candidate (df),
   *   how often it ended up kept (and not removed by the user). Hard skills the user targets get p -> 1,
   *   generic vocabulary that keeps showing up without being kept gets p -> 0.
   * - specificity (micro IDF) = ln((N + 1) / (df + 1)) + 1, normalised to [0, 1]: terms present in
   *   nearly every posting carry little information, unless the keep rate says otherwise.
   * The keep rate effect is weighted by a confidence df / (df + prior), so a keyword seen once
   * barely moves, and the whole model is neutral until MIN_DOCUMENTS_FOR_AFFINITY postings exist.
   */
  public getAffinityMultipliers(keywords: string[]): Map<string, number> {
    const multipliers = new Map<string, number>();
    const totalDocuments = this.getDocumentCount();

    if (!this.db || totalDocuments < MIN_DOCUMENTS_FOR_AFFINITY) {
      keywords.forEach((keyword) => multipliers.set(keyword, 1));
      return multipliers;
    }

    const statsStmt = this.db.prepare(`
      SELECT
        (SELECT doc_count FROM keyword_document_frequency WHERE keyword = @keyword) AS df,
        (SELECT global_count FROM local_skills_affinity WHERE keyword = @keyword) AS kept
    `);
    const maxIdf = Math.log(totalDocuments + 1) + 1;

    for (const keyword of keywords) {
      const row = statsStmt.get({ keyword: keyword.toLowerCase().trim() }) as { df: number | null; kept: number | null };
      const df = row.df ?? 0;
      const kept = Math.max(0, row.kept ?? 0);

      const keepRate = Math.min(1, (kept + 1) / (df + 2));
      const confidence = df / (df + AFFINITY_CONFIDENCE_PRIOR);
      const keepFactor = 1 + confidence * (keepRate - 0.5);

      const idf = Math.log((totalDocuments + 1) / (df + 1)) + 1;
      const specificity = 0.75 + 0.25 * (idf / maxIdf);

      const multiplier = keepFactor * specificity;
      multipliers.set(keyword, Math.min(1.5, Math.max(0.5, multiplier)));
    }

    return multipliers;
  }

  /**
   * Records one analysed posting and the candidates it contained (document frequency).
   * Returns false when the same posting was already recorded.
   */
  public recordDocument(documentHash: string, candidates: string[]): boolean {
    if (!this.db) return false;
    const db = this.db;

    const insertDocument = db.prepare(`INSERT OR IGNORE INTO analyzed_documents (hash) VALUES (?)`);
    const upsertFrequency = db.prepare(`
      INSERT INTO keyword_document_frequency (keyword, doc_count, updated_at)
      VALUES (?, 1, CURRENT_TIMESTAMP)
      ON CONFLICT(keyword) DO UPDATE SET
        doc_count = doc_count + 1,
        updated_at = CURRENT_TIMESTAMP
    `);

    const transaction = db.transaction((hash: string, list: string[]) => {
      if (insertDocument.run(hash).changes === 0) return false;
      for (const keyword of new Set(list.map((k) => k.toLowerCase().trim()))) {
        upsertFrequency.run(keyword);
      }
      return true;
    });

    return transaction(documentHash, candidates);
  }

  /**
   * Increment or insert the keyword after validation of an offer (Upsert)
   */
  public incrementKeywords(keywords: string[]): void {
    if (!this.db) throw new Error("Affinity Database not connected");

    const upsertStmt = this.db.prepare(`
      INSERT INTO local_skills_affinity (keyword, global_count, updated_at)
      VALUES (?, 1, CURRENT_TIMESTAMP)
      ON CONFLICT(keyword) DO UPDATE SET
        global_count = global_count + 1,
        updated_at = CURRENT_TIMESTAMP
    `);

    const transaction = this.db.transaction((list: string[]) => {
      for (const kw of list) {
        upsertStmt.run(kw.toLowerCase().trim());
      }
    });

    transaction(keywords);
  }

  /**
   * Eviction Policy
   * Removes noisy keywords that have only been crossed once if the tables grow too large.
   */
  public runEvictionPolicy(): void {
    if (!this.db) return;

    const noiseStmt = this.db.prepare(`
        SELECT COUNT(*) as noise_total FROM local_skills_affinity WHERE global_count <= 1
    `);
    const { noise_total } = noiseStmt.get() as { noise_total: number };
    const frequencyStmt = this.db.prepare(`
        SELECT COUNT(*) as frequency_total FROM keyword_document_frequency
    `);
    const { frequency_total } = frequencyStmt.get() as { frequency_total: number };

    if (noise_total > 2000) {
        this.db.exec(`DELETE FROM local_skills_affinity WHERE global_count <= 1;`);
    }
    if (frequency_total > MAX_DOCUMENT_FREQUENCY_ROWS) {
        this.db.exec(`DELETE FROM keyword_document_frequency WHERE doc_count <= 1;`);
    }
    if (noise_total > 2000 || frequency_total > MAX_DOCUMENT_FREQUENCY_ROWS) {
        this.db.exec(`VACUUM;`);
    }
  }

  /**
   * Get the top N keywords by global count, useful for displaying trending skills or for analytics.
   */
  public getTopKeywords(limit: number = 10): KeywordStat[] {
    if (!this.db) return [];

    const stmt = this.db.prepare(`
      SELECT keyword, global_count
      FROM local_skills_affinity
      ORDER BY global_count DESC
      LIMIT ?
    `);

    return stmt.all(limit) as KeywordStat[];
  }

  /**
   * Get the maximum global count across all keywords, useful for normalizing scores or for analytics.
   */
  public getTotalAnalysesCount(): number {
    if (!this.db) return 0;

    const stmt = this.db.prepare(`
      SELECT MAX(global_count) as max_count FROM local_skills_affinity
    `);

    const res = stmt.get() as { max_count: number } | undefined;
    return res && res.max_count ? res.max_count : 1;
  }

  public close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}
