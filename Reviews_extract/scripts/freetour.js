(function() {
    console.log("--> Starting Freetour Scraper...");

    // --- AUTO-DETECT CONTAINER ---
    // Replaces $0. Finds the element with the most children containing yellow stars.
    function findBestContainer() {
        const allDivs = document.querySelectorAll('div, ul, section');
        let bestContainer = null;
        let maxScore = 0;

        allDivs.forEach(div => {
            // Count direct children that look like reviews (contain the star color)
            let score = 0;
            if (div.children.length > 1) { // Optimization: Must have children
                Array.from(div.children).forEach(child => {
                    if (child.querySelector('[style*="fba749"]')) {
                        score++;
                    }
                });
            }

            if (score > maxScore) {
                maxScore = score;
                bestContainer = div;
            }
        });
        
        return bestContainer || document.body;
    }

    let container = findBestContainer();
    console.log("Selected Container:", container);

    // 2. Prepare Headers
    const headers = ['Date', 'Time', 'Guide', 'Rating', 'Tour', 'Language', 'Platform', 'Review', 'Review title', 'Full'];
    const rows = [];

    // Helper: Format Cell
    const formatCell = (text) => {
        if (!text && text !== 0) return '';
        let cleanText = text.toString().replace(/\t/g, '    ').trim();
        if (cleanText.includes('\n') || cleanText.includes('"')) {
            cleanText = cleanText.replace(/"/g, '""');
            return `"${cleanText}"`;
        }
        return cleanText;
    };

    // Helper: Format Date
    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const parts = dateStr.split('-');
        if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
        return dateStr;
    };

    // 3. Iterate through review cards
    const cards = Array.from(container.children);

    cards.forEach(card => {
        const text = card.innerText.trim();
        if (!text) return; 

        // --- FILTER: SKIP PAGINATION / JUNK ---
        if (text.startsWith('«') || text.startsWith('»') || text.length < 10) return;

        // --- EXTRACT RATING (Yellow Stars) ---
        let rating = '';
        const starSpan = card.querySelector('[style*="fba749"]'); 
        if (starSpan) {
            rating = starSpan.innerText.length; // Count squares
            if (rating === 0 && starSpan.children.length > 0) {
                rating = starSpan.children.length; // Fallback for icons
            }
        }

        // --- EXTRACT TEXT FIELDS ---
        const lines = text.split('\n').map(l => l.trim()).filter(l => l);
        
        let title = '';
        if (lines.length > 0) title = lines[0].replace(/^"|"$/g, '');

        // Find metadata line (Tour / Date / Time)
        let date = '', time = '', tour = '', full = '';
        const infoLineIndex = lines.findIndex(l => l.match(/\d{4}-\d{2}-\d{2}/) && l.includes('/'));

        if (infoLineIndex > -1) {
            full = lines[infoLineIndex];
            const parts = full.split(' / ');
            if (parts.length >= 3) {
                tour = parts[0].trim();
                date = formatDate(parts[1].trim());
                time = parts[2].replace(/(AM|PM)/i, '').trim();
            }
        }

        // --- FINAL VALIDATION CHECK ---
        if (!date && !tour) return;

        // Review Body
        let review = '';
        const replyIndex = lines.indexOf('Reply');
        if (replyIndex > -1) {
            review = lines.slice(replyIndex + 1).join('\n').replace(/Report$/, '').trim();
        }

        const guide = ''; 
        const platform = 'freetour com';
        const language = ''; 

        rows.push([date, time, guide, rating, tour, language, platform, review, title, full].map(formatCell).join('\t'));
    });

    // 4. Copy to Clipboard
    if (rows.length === 0) {
        alert("No reviews found. Make sure you scroll down to load reviews before clicking.");
        return;
    }

    const tsvContent = headers.join('\t') + '\n' + rows.join('\n');
    
    // Copy logic adapted for Extension (Background copy usually requires focus, but this runs in tab so it's fine)
    const el = document.createElement('textarea');
    el.value = tsvContent;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);

    console.log(`Success! Copied ${rows.length} valid reviews.`);
    alert(`Copied ${rows.length} reviews to clipboard!`);
})();