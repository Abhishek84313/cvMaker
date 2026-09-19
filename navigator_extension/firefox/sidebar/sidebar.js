document.getElementById('scan-btn').addEventListener('click', async () => {
  try {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });

    if (!tab || !tab.id) return;

    await browser.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["adapters/generic.js"]
    }).catch(() => {});

    await browser.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["content/content.js"]
    }).catch(() => {});

    const response = await browser.tabs.sendMessage(tab.id, { action: "EXTRACT_AND_HIGHLIGHT" });

    if (response) {
      document.getElementById('job-title').value = response.title || '';
      document.getElementById('job-company').value = response.company || '';
      document.getElementById('job-url').value = response.url || tab.url || '';
      document.getElementById('job-mandate').value = response.mandate || '';
      
      document.getElementById('send-btn').style.display = "block";
    }
  } catch (error) {
    console.error("Erreur durant le scan :", error);
  }
});

// Send the extracted data to the local CVMaker Engine server (if available)
document.getElementById('send-btn').addEventListener('click', async () => {
  const payload = {
    title: document.getElementById('job-title').value,
    company: document.getElementById('job-company').value,
    salary: document.getElementById('job-salary').value,
    url: document.getElementById('job-url').value,
    mandate: document.getElementById('job-mandate').value,
    extractedAt: new Date().toISOString()
  };

  try {
    const res = await fetch('http://127.0.0.1:9123/api/job', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      alert('Offer sent successfully to CVMaker !');
    } else {
      alert('Error while sending to the local server.');
    }
  } catch (err) {
    alert('Unable to contact CVMaker Engine (please make sure the desktop application is running).');
  }
});