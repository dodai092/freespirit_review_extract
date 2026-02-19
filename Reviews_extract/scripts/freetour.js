(function() {
    console.log("--> Starting Freetour Scraper...");

    // --- AUTO-DETECT CONTAINER ---
    function findBestContainer() {
        const allDivs = document.querySelectorAll('div, ul, section');
        let bestContainer = null;
        let maxScore = 0;

        allDivs.forEach(div => {
            let score = 0;
            if (div.children.length > 1) { 
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

    // 2. Prepare Headers (Reordered)
    const headers = ['Date', 'Time', 'Guide', 'Rating', 'Tour', 'City', 'Language', 'Platform', 'Review'];
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

    // Helper: Format Date to DD/MMM/YYYY
    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const parts = dateStr.split('-'); 
        if (parts.length === 3) {
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const monthIndex = parseInt(parts[1], 10) - 1;
            return `${parts[2]}/${months[monthIndex]}/${parts[0]}`;
        }
        return dateStr;
    };

    // Helper: Extract City code from Tour name
    const getCityCode = (tourName) => {
        const t = tourName.toLowerCase();
        if (t.includes('dubrovnik')) return 'du';
        if (t.includes('rovinj')) return 'rv';
        if (t.includes('pula')) return 'pu';
        if (t.includes('split')) return 'st';
        if (t.includes('zadar')) return 'zd';
        if (t.includes('zagreb')) return 'zg';
        return '';
    };

    // Helper: Format Tour name
    const formatTour = (tourName) => {
        if (tourName.includes('Free Spirit Walking Tour')) {
            return 'free';
        }
        return tourName;
    };

    // Helper: Extract and Normalize Guide Name
    const extractGuide = (text) => {
        if (!text) return 'N/A';
        
        const guideMap = [
            { regex: /\b(darko)\b/i, full: 'Darko Crnolatac' },
            { regex: /\b(diana|diane)\b/i, full: 'Diana Bolić' },
            { regex: /\b(ivana)\b/i, full: 'Ivana Čakarić' }, 
            { regex: /\b(iva)\b/i, full: 'Iva Pavlović' },
            { regex: /\b(katarina)\b/i, full: 'Katarina Novoselac' },
            { regex: /\b(katija)\b/i, full: 'Katija Crnčević' },
            { regex: /\b(luka|luca)\b/i, full: 'Luka Pelicarić' },
            { regex: /\b(nikolina(\s+f)?)\b/i, full: 'Nikolina Folnović' },
            { regex: /\b(vid|veed)\b/i, full: 'Vid Dorić' },
            { regex: /\b(ena)\b/i, full: 'Ena' },
            { regex: /\b(doris)\b/i, full: 'Doris' },
            { regex: /\b(kristina)\b/i, full: 'Kristina' }
        ];

        for (let guide of guideMap) {
            if (guide.regex.test(text)) {
                return guide.full;
            }
        }
        
        return 'N/A';
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
            rating = starSpan.innerText.length; 
            if (rating === 0 && starSpan.children.length > 0) {
                rating = starSpan.children.length; 
            }
        }

        // --- EXTRACT TEXT FIELDS ---
        const lines = text.split('\n').map(l => l.trim()).filter(l => l);
        
        let title = '';
        if (lines.length > 0) title = lines[0].replace(/^"|"$/g, '');

        let date = '', time = '', tour = '', city = '';
        const infoLineIndex = lines.findIndex(l => l.match(/\d{4}-\d{2}-\d{2}/) && l.includes('/'));

        if (infoLineIndex > -1) {
            const full = lines[infoLineIndex];
            const parts = full.split(' / ');
            if (parts.length >= 3) {
                const rawTourName = parts[0].trim();
                
                city = getCityCode(rawTourName); 
                tour = formatTour(rawTourName);
                
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

        // --- GUIDE EXTRACTION ---
        const combinedText = `${title} ${review}`;
        const guide = extractGuide(combinedText); 

        const platform = 'freetour com';
        const language = ''; 

        // Build Row (Reordered)
        rows.push([date, time, guide, rating, tour, city, language, platform, review].map(formatCell).join('\t'));
    });

    // 4. Copy to Clipboard
    if (rows.length === 0) {
        alert("No reviews found. Make sure you scroll down to load reviews before clicking.");
        return;
    }

    const tsvContent = headers.join('\t') + '\n' + rows.join('\n');
    
    const el = document.createElement('textarea');
    el.value = tsvContent;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);

    console.log(`Success! Copied ${rows.length} valid reviews.`);
    alert(`Copied ${rows.length} reviews to clipboard!`);
})();