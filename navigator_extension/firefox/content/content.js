console.log("CVMaker Extractor is active on this page !");

function applyHighlight(element, className) {
  if (!element) return;
  element.classList.add(className);
}

function clearHighlights() {
  const classes = ['cvmaker-highlight-title', 'cvmaker-highlight-company', 'cvmaker-highlight-mandate'];
  classes.forEach(cls => {
    document.querySelectorAll('.' + cls).forEach(el => el.classList.remove(cls));
  });
}

browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "EXTRACT_AND_HIGHLIGHT") {
    clearHighlights();

    GenericAdapter.extractWhenReady({ timeoutMs: 3000, minMandateLength: 100 })
      .then((extracted) => {
        if (extracted.titleElement) applyHighlight(extracted.titleElement, 'cvmaker-highlight-title');
        if (extracted.companyElement) applyHighlight(extracted.companyElement, 'cvmaker-highlight-company');
        if (extracted.mandateElement) applyHighlight(extracted.mandateElement, 'cvmaker-highlight-mandate');

        if (extracted.titleElement) {
          extracted.titleElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        if (extracted.salary) {
          document.getElementById('job-salary').value = extracted.salary;
        }

        sendResponse({
          title: extracted.titleText || "Not found",
          company: extracted.companyText || "Not found",
          salary: extracted.salary || "Not found",
          mandate: extracted.mandateText || "Not found",
          url: extracted.uri,
          debug: extracted._debug
        });
      });

    return true;
  }
});