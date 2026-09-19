/**
 * GenericAdapter
 * ---------------------------------------------------------------------------
 * Best-effort, dependency-free extractor for job postings on arbitrary
 * (unknown) web pages. Meant to be the fallback adapter behind site-specific
 * adapters (LinkedIn, Indeed, etc.) in a browser extension.
 *
 * Strategy, per field, from most to least reliable:
 *   1. JSON-LD structured data (schema.org "JobPosting")
 *   2. Meta tags (OpenGraph / Twitter / itemprop)
 *   3. DOM heuristics (visible <h1>, keyword-matched selectors, content
 *      scoring for the mandate body)
 *   4. Weak fallbacks (document.title parsing, hostname, document.body)
 *
 * USAGE
 * ---------------------------------------------------------------------------
 *   // Synchronous — good for static/SSR pages.
 *   const data = GenericAdapter.extract();
 *
 *   // Async — waits for content to actually render. Recommended default,
 *   // since a lot of ATS pages (Workday, Greenhouse, React apps, etc.) are
 *   // client-rendered and empty at document-idle time.
 *   const data = await GenericAdapter.extractWhenReady();
 *
 * RETURN SHAPE
 * ---------------------------------------------------------------------------
 *   {
 *     uri: string,
 *
 *     titleElement: Element|null,   companyElement: Element|null,
 *     titleText: string,            companyText: string,
 *
 *     mandateElement: Element|null,
 *     mandateText: string,
 *
 *     _debug: { titleSource, companySource, mandateSource, hasJsonLd }
 *   }
 *
 * `*Element` is provided mainly so the extension UI can highlight/scroll to
 * the source on the page. It can legitimately be `null` (e.g. data came from
 * JSON-LD and no matching DOM node could be located) — always prefer the
 * `*Text` fields for the actual content.
 */
class GenericAdapter {
  // ===========================================================================
  // Public API
  // ===========================================================================

  static extract() {
    let jsonLd = null;
    try {
      jsonLd = this._extractJobPostingJsonLd();
    } catch (e) {
      /* structured data is a bonus, never fatal */
    }

    const title = this._safe(() => this._resolveTitle(jsonLd), { text: '', element: null, source: 'error' });
    const company = this._safe(() => this._resolveCompany(jsonLd), { text: '', element: null, source: 'error' });
    const mandate = this._safe(() => this._resolveMandate(jsonLd), { text: '', element: null, source: 'error' });
    const salary = this._safe(() => this.extractSalary(document), null);

    return {
      uri: window.location.href,

      titleElement: title.element,
      titleText: title.text,

      companyElement: company.element,
      companyText: company.text,

      mandateElement: mandate.element,
      mandateText: mandate.text,

      salary: salary,

      _debug: {
        titleSource: title.source,
        companySource: company.source,
        mandateSource: mandate.source,
        hasJsonLd: !!jsonLd
      }
    };
  }

  /**
   * Polls the page until a reasonably-sized mandate has appeared (or a
   * timeout is hit), then returns the extraction result. Useful for
   * client-rendered / SPA job pages where the DOM isn't ready when your
   * content script first runs.
   */
  static extractWhenReady({ timeoutMs = 8000, intervalMs = 300, minMandateLength = 200 } = {}) {
    return new Promise((resolve) => {
      const start = Date.now();

      const attempt = () => {
        const result = this.extract();
        const hasEnoughContent = result.mandateText.length >= minMandateLength;
        const timedOut = Date.now() - start >= timeoutMs;

        if (hasEnoughContent || timedOut) {
          resolve(result);
        } else {
          setTimeout(attempt, intervalMs);
        }
      };

      attempt();
    });
  }

  // ===========================================================================
  // JSON-LD (schema.org JobPosting)
  // ===========================================================================

  static _extractJobPostingJsonLd() {
    const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));

    for (const script of scripts) {
      let data;
      try {
        data = JSON.parse(script.textContent);
      } catch (e) {
        continue; // malformed JSON-LD is common in the wild, just skip it
      }

      const posting = this._findJobPosting(data);
      if (posting) return posting;
    }

    return null;
  }

  static _findJobPosting(node) {
    if (!node || typeof node !== 'object') return null;

    if (Array.isArray(node)) {
      for (const item of node) {
        const found = this._findJobPosting(item);
        if (found) return found;
      }
      return null;
    }

    const types = Array.isArray(node['@type']) ? node['@type'] : [node['@type']];
    if (types.some((t) => typeof t === 'string' && t.toLowerCase() === 'jobposting')) {
      return node;
    }

    // Some sites nest the posting inside a @graph array or a mainEntity.
    if (Array.isArray(node['@graph'])) {
      const found = this._findJobPosting(node['@graph']);
      if (found) return found;
    }
    if (node.mainEntity) {
      const found = this._findJobPosting(node.mainEntity);
      if (found) return found;
    }

    return null;
  }

  // ===========================================================================
  // Title
  // ===========================================================================

  static _resolveTitle(jsonLd) {
    if (jsonLd && jsonLd.title) {
      const text = this._cleanText(jsonLd.title);
      if (text) {
        const element = this._findElementWithText(text, ['h1', 'h2', 'title']);
        return { text, element, source: 'json-ld' };
      }
    }

    const metaSelectors = [
      'meta[property="og:title"]',
      'meta[name="twitter:title"]',
      'meta[itemprop="title"]',
      'meta[name="title"]'
    ];
    for (const sel of metaSelectors) {
      const meta = document.querySelector(sel);
      const content = meta && this._cleanText(meta.content);
      if (content) {
        const element = this._findElementWithText(content, ['h1', 'h2']) || meta;
        return { text: content, element, source: `meta:${sel}` };
      }
    }

    const h1Candidates = Array.from(document.querySelectorAll('h1')).filter((el) => {
      const text = this._textOf(el);
      return this._isVisible(el) && text.length > 0 && text.length < 150;
    });
    if (h1Candidates.length) {
      // Prefer the one closest to the top of the viewport/document.
      h1Candidates.sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top);
      const el = h1Candidates[0];
      return { text: this._textOf(el), element: el, source: 'h1' };
    }

    const keywordSelectors = [
      '[class*="job-title" i]',
      '[class*="jobtitle" i]',
      '[class*="position-title" i]',
      '[class*="posting-title" i]',
      '[itemprop="title"]',
      '[data-testid*="job-title" i]',
      '#job-title',
      '.job-title'
    ];
    for (const sel of keywordSelectors) {
      const el = document.querySelector(sel);
      const text = this._textOf(el);
      if (el && text.length > 0 && text.length < 150) {
        return { text, element: el, source: `selector:${sel}` };
      }
    }

    if (document.title) {
      const parts = document.title
        .split(/\s[-|–—:]\s|\s\bat\b\s|\s\bchez\b\s/i)
        .map((p) => p.trim())
        .filter(Boolean);
      if (parts.length) {
        return { text: this._cleanText(parts[0]), element: null, source: 'document.title' };
      }
    }

    return { text: '', element: null, source: 'none' };
  }

  // ===========================================================================
  // Company
  // ===========================================================================

  static _resolveCompany(jsonLd) {
    if (jsonLd && jsonLd.hiringOrganization) {
      const org = jsonLd.hiringOrganization;
      const name = typeof org === 'string' ? org : org.name;
      const text = this._cleanText(name);
      if (text) {
        const element = this._findElementWithExactText(text);
        return { text, element, source: 'json-ld' };
      }
    }

    const metaSelectors = ['meta[property="og:site_name"]', 'meta[name="author"]'];
    for (const sel of metaSelectors) {
      const meta = document.querySelector(sel);
      const content = meta && this._cleanText(meta.content);
      if (content && content.length < 100) {
        return { text: content, element: meta, source: `meta:${sel}` };
      }
    }

    const keywordSelectors = [
      '[itemprop="hiringOrganization"]',
      '[class*="company-name" i]',
      '[class*="companyname" i]',
      '[data-company]',
      '.company-name',
      '[class*="employer" i]',
      '[class*="organization" i]',
      '[class*="company" i]'
    ];
    const genericNoise = new Set(['apply now', 'apply', 'share', 'save job', 'company', 'save']);

    for (const sel of keywordSelectors) {
      const els = document.querySelectorAll(sel);
      for (const el of els) {
        const text = this._textOf(el);
        if (text && text.length > 1 && text.length < 100 && !genericNoise.has(text.toLowerCase())) {
          return { text, element: el, source: `selector:${sel}` };
        }
      }
    }

    // Last resort, low confidence: derive a name from the hostname.
    try {
      const host = window.location.hostname.replace(/^www\./, '').split('.')[0];
      if (host) {
        const text = host.charAt(0).toUpperCase() + host.slice(1);
        return { text, element: null, source: 'hostname-fallback' };
      }
    } catch (e) {
      /* ignore */
    }

    return { text: '', element: null, source: 'none' };
  }

  // ===========================================================================
  // Mandate / description
  // ===========================================================================

  static _resolveMandate(jsonLd) {
    if (jsonLd && jsonLd.description) {
      const text = this._stripHtml(jsonLd.description);
      if (text && text.length > 50) {
        const element = this._findBestMandateElement(); // for highlighting, may be null
        return { text, element, source: 'json-ld' };
      }
    }

    const best = this._findBestMandateElement();
    if (best) {
      return { text: this._textOf(best), element: best, source: 'heuristic-scoring' };
    }

    const fallbackSelectors = ['[class*="description" i]', '[id*="description" i]', 'article', 'main', '[role="main"]'];
    for (const sel of fallbackSelectors) {
      const el = document.querySelector(sel);
      const text = this._textOf(el);
      if (el && text.length > 100) {
        return { text, element: el, source: `selector:${sel}` };
      }
    }

    return { text: this._textOf(document.body), element: document.body, source: 'body-fallback' };
  }

  /**
   * Readability-lite: scores block-level elements by text density, list/
   * paragraph structure, link density, and keyword hints, then narrows the
   * winner down to the most specific wrapper that still holds the content
   * (so we don't return a giant outer <div> that also contains the header).
   */
  static _findBestMandateElement() {
    const candidates = Array.from(document.querySelectorAll('div, section, article, main, td')).filter((el) =>
      this._isEligibleMandateCandidate(el)
    );
    if (!candidates.length) return null;

    let best = null;
    let bestScore = -Infinity;
    for (const el of candidates) {
      const score = this._scoreMandateCandidate(el);
      if (score > bestScore) {
        bestScore = score;
        best = el;
      }
    }

    return best ? this._narrowToSpecificContainer(best) : null;
  }

  static _isEligibleMandateCandidate(el) {
    if (this._EXCLUDED_TAGS.has(el.tagName)) return false;
    if (el.closest('nav, header, footer, aside, form')) return false;
    if (!this._isVisible(el)) return false;
    return this._textOf(el).length >= 150;
  }

  static _scoreMandateCandidate(el) {
    const text = this._textOf(el);
    const textLength = text.length;

    const linkTextLength = Array.from(el.querySelectorAll('a')).reduce(
      (sum, a) => sum + this._textOf(a).length,
      0
    );
    const linkDensity = textLength > 0 ? linkTextLength / textLength : 1;

    let score = Math.log(textLength + 1) * 5;
    score -= linkDensity * 40;

    const paragraphCount = el.querySelectorAll('p').length;
    const listItemCount = el.querySelectorAll('li').length;
    score += Math.min(paragraphCount, 20) * 2;
    score += Math.min(listItemCount, 30) * 1.5;

    const idAndClass = `${el.id} ${el.className}`.toLowerCase();
    if (this._POSITIVE_PATTERN.test(idAndClass)) score += 25;
    if (this._NEGATIVE_PATTERN.test(idAndClass)) score -= 40;

    // Lots of interactive controls usually means UI chrome, not prose.
    const interactiveCount = el.querySelectorAll('button, input, select').length;
    score -= interactiveCount * 3;

    // Mild penalty for huge containers likely to be page-level wrappers.
    if (textLength > 20000) score -= 10;

    return score;
  }

  /**
   * Walks down into single dominant children as long as they still hold
   * (almost) all of the parent's text, to avoid returning an overly broad
   * wrapper element.
   */
  static _narrowToSpecificContainer(el) {
    let current = el;
    const referenceLength = this._textOf(current).length;

    // Bounded loop as a safety net against pathological DOM structures.
    for (let i = 0; i < 25; i++) {
      const dominantChildren = Array.from(current.children).filter((child) => {
        if (this._EXCLUDED_TAGS.has(child.tagName)) return false;
        return this._textOf(child).length > referenceLength * 0.85;
      });

      if (dominantChildren.length === 1) {
        current = dominantChildren[0];
      } else {
        break;
      }
    }

    return current;
  }

  // ===========================================================================
  // DOM / text utilities
  // ===========================================================================

  static _findElementWithText(text, tagNames) {
    if (!text) return null;
    const normalized = text.trim().toLowerCase();

    for (const tag of tagNames) {
      const els = document.querySelectorAll(tag);
      for (const el of els) {
        const candidate = this._textOf(el).toLowerCase();
        if (candidate && (candidate === normalized || candidate.includes(normalized) || normalized.includes(candidate))) {
          return el;
        }
      }
    }
    return null;
  }

  static _findElementWithExactText(text, maxLen = 100) {
    if (!text) return null;
    const normalized = text.trim().toLowerCase();

    const candidates = document.querySelectorAll('span, div, a, p, h2, h3, h4');
    for (const el of candidates) {
      if (el.children.length > 2) continue; // prefer leaf-ish nodes over big containers
      const candidateText = this._textOf(el);
      if (candidateText && candidateText.length < maxLen && candidateText.toLowerCase() === normalized) {
        return el;
      }
    }
    return null;
  }

  static _isVisible(el) {
    if (!el || !(el instanceof Element)) return false;
    const style = window.getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden' || parseFloat(style.opacity) === 0) {
      return false;
    }
    return el.offsetWidth > 0 || el.offsetHeight > 0 || el.getClientRects().length > 0;
  }

  static _textOf(el) {
    if (!el) return '';
    const raw = el.innerText !== undefined ? el.innerText : el.textContent;
    return this._cleanText(raw);
  }

  static _cleanText(str) {
    if (!str) return '';
    return str
      .replace(/\u00a0/g, ' ')
      .replace(/[ \t]+/g, ' ')
      .split('\n')
      .map((line) => line.trim())
      .join('\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  static _stripHtml(html) {
    if (!html) return '';
    const container = document.createElement('div');
    container.innerHTML = html;
    container.querySelectorAll('script, style').forEach((n) => n.remove());
    const raw = container.innerText !== undefined ? container.innerText : container.textContent;
    return this._cleanText(raw);
  }

  static _safe(fn, fallback) {
    try {
      const result = fn();
      return result || fallback;
    } catch (e) {
      return fallback;
    }
  }

  static extractSalary(documentOrText) {
    const text = typeof documentOrText === 'string' 
      ? documentOrText 
      : documentOrText.body.innerText;

    const keywords = ['salaire', 'salary', 'rémunération', 'compensation', 'pay rate'];
    const lines = text.split('\n');

    for (const line of lines) {
      const lowerLine = line.toLowerCase();
      if (keywords.some(kw => lowerLine.includes(kw))) {
        for (const regex of SALARY_REGEXES) {
          const match = line.match(regex);
          if (match) return match[0].trim();
        }
      }
    }

    for (const regex of SALARY_REGEXES) {
      const match = text.match(regex);
      if (match) return match[0].trim();
    }

    return null;
  }
}

// Excluded tags / keyword patterns used by the mandate-scoring algorithm.
GenericAdapter._EXCLUDED_TAGS = new Set([
  'SCRIPT', 'STYLE', 'NOSCRIPT', 'NAV', 'HEADER', 'FOOTER', 'ASIDE', 'FORM', 'IFRAME', 'SVG', 'BUTTON'
]);
GenericAdapter._NEGATIVE_PATTERN =
  /nav|footer|header|sidebar|menu|comment|related|share|social|cookie|banner|advert|breadcrumb|widget|promo|subscribe|newsletter/i;
GenericAdapter._POSITIVE_PATTERN =
  /description|job-details|jobdetail|job-body|posting|content|details|responsibilit|requirement|qualification|about-the-role|about-the-job|vacancy/i;

// Expose for both browser extension content scripts and Node-based testing.
if (typeof window !== 'undefined') {
  window.GenericAdapter = GenericAdapter;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GenericAdapter;
}