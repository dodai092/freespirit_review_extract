document.addEventListener('DOMContentLoaded', () => {
  
  const injectScript = (scriptFile) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs[0] || !tabs[0].id) return;
      
      const tabId = tabs[0].id;
      const statusDiv = document.getElementById('status');
      statusDiv.innerText = "Scraping...";
      
      // We prepend 'scripts/' because the file is in the scripts subfolder
      chrome.scripting.executeScript({
        target: { tabId: tabId },
        files: [`scripts/${scriptFile}`]
      }, () => {
        if (chrome.runtime.lastError) {
          statusDiv.innerText = "Error (Check Console)";
          console.error(chrome.runtime.lastError);
        } else {
          statusDiv.innerText = "Done! Copied.";
          setTimeout(() => statusDiv.innerText = "Ready", 3000);
        }
      });
    });
  };

  // Helper to add listener safely
  const addListener = (id, scriptName) => {
    const btn = document.getElementById(id);
    if (btn) {
      btn.addEventListener('click', () => injectScript(scriptName));
    }
  };

  // Register Handlers
  addListener('btn-airbnb', 'airbnb.js');
  addListener('btn-freetour', 'freetour.js');
  addListener('btn-gyg', 'getyourguide.js');
  addListener('btn-guruwalk', 'guruwalk.js');
  addListener('btn-viator', 'viator.js');
  // New Google Handler
  addListener('btn-google', 'google.js');

});