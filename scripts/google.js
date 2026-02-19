(function () {
  console.log('🚀 Google Script Injected');

  function parseRelativeDate(relativeText) {
    if (!relativeText) return null;
    const now = new Date();
    const text = relativeText.toLowerCase().trim();

    const match = text.match(/(\d+)\s+(minute|hour|day|week|month|year)s?\s+ago/);
    if (match) {
      const num = parseInt(match[1], 10);
      const unit = match[2];
      const d = new Date(now);
      switch (unit) {
        case 'minute': d.setMinutes(d.getMinutes() - num); break;
        case 'hour':   d.setHours(d.getHours() - num); break;
        case 'day':    d.setDate(d.getDate() - num); break;
        case 'week':   d.setDate(d.getDate() - num * 7); break;
        case 'month':  d.setMonth(d.getMonth() - num); break;
        case 'year':   d.setFullYear(d.getFullYear() - num); break;
      }
      return d.toISOString();
    }

    if (text.startsWith('a minute ago'))  { now.setMinutes(now.getMinutes() - 1); return now.toISOString(); }
    if (text.startsWith('an hour ago'))   { now.setHours(now.getHours() - 1); return now.toISOString(); }
    if (text.startsWith('a day ago'))     { now.setDate(now.getDate() - 1); return now.toISOString(); }
    if (text.startsWith('a week ago'))    { now.setDate(now.getDate() - 7); return now.toISOString(); }
    if (text.startsWith('a month ago'))   { now.setMonth(now.getMonth() - 1); return now.toISOString(); }
    if (text.startsWith('a year ago'))    { now.setFullYear(now.getFullYear() - 1); return now.toISOString(); }

    return null;
  }

  function formatDate(isoString) {
    if (!isoString) return '';
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '';
    const day = String(d.getUTCDate()).padStart(2, '0');
    const mon = months[d.getUTCMonth()];
    const year = d.getUTCFullYear();
    return `${day}/${mon}/${year}`;
  }

  function extractGuide(text) {
    if (!text) return 'N/A';

    const guideNames = [
      'Kristina','Nikolina','Katarina',
      'Ivana','Diana','Darko','Doris',
      'Luka','Vid','Iva','Ena'
    ];

    const aliases = {
      'luca':'Luka','looka':'Luka','lucca':'Luka','lukka':'Luka',
      'veed':'Vid','vidd':'Vid',
      'cristina':'Kristina','christina':'Kristina',
      'nickolina':'Nikolina','nicolina':'Nikolina','nikolena':'Nikolina',
      'catherina':'Katarina','katharina':'Katarina','catarina':'Katarina','katerina':'Katarina','katrina':'Katarina',
      'ivanna':'Ivana',
      'diane':'Diana','dianna':'Diana','dyana':'Diana',
      'darco':'Darko','darkko':'Darko',
      'doriz':'Doris','dorris':'Doris',
      'enna':'Ena'
    };

    for (const name of guideNames) {
      const regex = new RegExp(`\\b${name}\\b`, 'i');
      if (regex.test(text)) return name;
    }

    const lowerText = text.toLowerCase();
    for (const [alias, canonical] of Object.entries(aliases)) {
      const regex = new RegExp(`\\b${alias}\\b`, 'i');
      if (regex.test(lowerText)) return canonical;
    }

    return 'N/A';
  }

  function cleanReviewText(text) {
    if (!text) return '';
    return text
      .replace(/\b(TRUE|FALSE)\b/g, '')
      .replace(/\t/g, ' ')
      .replace(/\n/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim();
  }

  function expandAllReviews() {
    const moreButtons = document.querySelectorAll('button.w8nwRe.kyuRq');
    moreButtons.forEach(btn => btn.click());
    console.log(`✅ Expanded ${moreButtons.length} truncated reviews`);
  }

  function parseReviews() {
    // Note: Google classes (.jftiEf, .wiI7pd) change occasionally. 
    // If extraction fails in the future, check these selectors.
    const reviewElements = document.querySelectorAll('.jftiEf[data-review-id]');
    const reviews = [];

    reviewElements.forEach(el => {
      const starsEl = el.querySelector('.kvMYJc[role="img"]');
      const starsLabel = starsEl ? starsEl.getAttribute('aria-label') : '';
      const starsMatch = starsLabel.match(/(\d+)/);
      const stars = starsMatch ? parseInt(starsMatch[1], 10) : '';

      const dateEl = el.querySelector('.rsqaWe');
      const publishAt = dateEl ? dateEl.textContent.trim() : null;
      const publishedAtDate = parseRelativeDate(publishAt);

      const textEl = el.querySelector('.wiI7pd');
      const text = textEl ? textEl.textContent.trim() : '';

      reviews.push({ publishedAtDate, stars, text, reviewOrigin: 'Google' });
    });

    return reviews;
  }

  // ========================================================
  // BUILD TSV
  // ========================================================
  function buildTSV(reviews) {
    const header = ['Date','Time','Guide','Rating','Tour','City','Language','Platform','Review'].join('\t');

    const rows = reviews.map(r => {
      const date     = formatDate(r.publishedAtDate);
      const guide    = extractGuide(r.text);
      const rating   = r.stars != null ? r.stars : '';
      const platform = r.reviewOrigin || 'Google';
      const review   = cleanReviewText(r.text);

      return [date, '', guide, rating, '', 'zg', '', platform, review].join('\t');
    });

    return [header, ...rows].join('\n');
  }

  // ========================================================
  // COPY TO CLIPBOARD
  // ========================================================
  function copyToClipboard(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    textarea.style.top = '-9999px';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    textarea.setSelectionRange(0, textarea.value.length);

    let success = false;
    try {
      success = document.execCommand('copy');
    } catch (e) {
      success = false;
    }

    document.body.removeChild(textarea);

    if (success) {
      console.log('✅ Copied to clipboard! Paste directly into Google Sheets / Excel.');
    } else {
      navigator.clipboard.writeText(text).then(() => {
        console.log('✅ Copied to clipboard via Clipboard API!');
      }).catch(() => {
        console.log('⚠️ Auto-copy failed. Printing below — triple-click to select all:\n');
        console.log(text);
      });
    }
  }

  // ========================================================
  // RUN
  // ========================================================
  expandAllReviews();

  // Increased timeout slightly to 1500ms to allow DOM to update after clicking "More"
  setTimeout(() => {
    const reviews = parseReviews();
    const tsv = buildTSV(reviews);

    copyToClipboard(tsv);

    console.log(`\n📊 Total reviews parsed: ${reviews.length}\n`);
    // console.log(tsv); // Uncomment if you want to see the TSV in console
  }, 1500);

})();