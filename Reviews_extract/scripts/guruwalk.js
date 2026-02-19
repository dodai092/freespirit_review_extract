(function() {
    console.log("Guruwalk Review Scraper Started...");

    // --- 1. Helper: Copy to Clipboard ---
    function copyToClipboard(text) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).catch(err => {
                console.warn("Async clipboard failed, trying fallback...", err);
                fallbackCopy(text);
            });
        } else {
            fallbackCopy(text);
        }
    }

    function fallbackCopy(text) {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        textArea.style.top = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
            document.execCommand('copy');
        } catch (err) {
            console.error('Fallback copy failed', err);
        }
        document.body.removeChild(textArea);
    }

    // --- 2. Helper Functions ---
    const formatCell = (text) => {
        if (!text) return '';
        let cleanText = text.replace(/\t/g, '    ').trim();
        if (cleanText.includes('\n') || cleanText.includes('"')) {
            cleanText = cleanText.replace(/"/g, '""');
            return `"${cleanText}"`;
        }
        return cleanText;
    };

    // Updated Date Formatter: DD/Mmm/YYYY
    const formatDateObj = (dateObj) => {
        if (isNaN(dateObj.getTime())) return '';
        
        const day = String(dateObj.getDate()).padStart(2, '0');
        // Array of short month names
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const month = monthNames[dateObj.getMonth()]; // getMonth() is 0-indexed
        
        return `${day}/${month}/${dateObj.getFullYear()}`;
    };

    const formatTimeObj = (dateObj) => {
        if (isNaN(dateObj.getTime())) return '';
        const hours = String(dateObj.getHours()).padStart(2, '0');
        const minutes = String(dateObj.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
    };

    const formatLang = (code) => {
        const map = { 'EN': 'eng', 'ES': 'esp', 'DE': 'deu', 'FR': 'fra', 'IT': 'ita', 'PT': 'por' };
        return map[code] || code.toLowerCase();
    };

    // --- 3. Main Scraping Logic ---
    
    // Automatic Card Selection
    const allDivs = document.querySelectorAll('div');
    let cards = Array.from(allDivs).filter(div => {
        const hasText = div.innerText.includes("Content visible only for gurus");
        const hasGuide = div.innerText.includes("Guided by");
        const isNotTooBig = div.innerText.length < 2000;
        return hasText && hasGuide && isNotTooBig;
    });

    // Filter duplicates
    cards = cards.filter(card => !cards.some(other => other !== card && card.contains(other)));

    if (cards.length === 0) {
        console.warn("No review cards found. Make sure you are on a Guruwalk bookings/reviews page.");
        // Fallback selector
        const gridContainers = document.querySelectorAll('.grid.gap-y-4');
        if(gridContainers.length > 0) {
             cards = Array.from(gridContainers[0].children);
        } else {
             return;
        }
    }

    const headers = ['Date', 'Time', 'Guide', 'Rating', 'Tour', 'Language', 'Platform', 'Review'];
    const rows = [];

    cards.forEach(card => {
        try {
            const text = card.innerText;
            if (!text.includes("Content visible only for gurus")) return;

            // --- A. Rating ---
            let ratingVal = '';
            const starWrappers = Array.from(card.querySelectorAll('.grid.grid-flow-col'));
            const mainRatingWrapper = starWrappers.find(wrapper => wrapper.querySelector('svg'));

            if (mainRatingWrapper) {
                const greenStars = Array.from(mainRatingWrapper.querySelectorAll('svg')).filter(svg => 
                    svg.classList.contains('text-secondary-500')
                ).length;
                ratingVal = greenStars.toString();
            }

            // --- B. Full Info Line ---
            const fullInfoRegex = /(.*?) \/ ([A-Z]{2}) \/ (.*?) at (.*)/;
            let fullLine = '';
            const lines = text.split('\n').map(l => l.trim());
            const contentMarkerIndex = lines.indexOf("Content visible only for gurus");
            
            if (contentMarkerIndex > -1 && lines[contentMarkerIndex + 1]) {
                fullLine = lines[contentMarkerIndex + 1];
            }

            // --- C. Parse Info ---
            let dateVal = '';
            let timeVal = '';
            let tourVal = '';
            let langVal = '';

            const fullMatch = fullLine.match(fullInfoRegex);
            if (fullMatch) {
                tourVal = fullMatch[1].trim();
                langVal = formatLang(fullMatch[2].trim());
                
                const dateTimeStr = `${fullMatch[3]} ${fullMatch[4]}`;
                const d = new Date(dateTimeStr);
                dateVal = formatDateObj(d);
                timeVal = formatTimeObj(d);
            }

            // --- D. Guide ---
            let guideVal = '';
            const guideMatch = text.match(/Guided by (.*?)(?:\n|\|)/);
            if (guideMatch) guideVal = guideMatch[1].trim();

            // --- E. Review ---
            let reviewVal = '';
            const reviewMatch = text.match(/-\s[A-Z][a-z]{2}\s\d{4}\n([\s\S]*?)Content visible only for gurus/);
            if (reviewMatch) reviewVal = reviewMatch[1].trim();

            const platformVal = 'Guruwalk';

            // --- F. Add Row ---
            rows.push([
                dateVal, 
                timeVal, 
                guideVal, 
                ratingVal, 
                tourVal, 
                langVal, 
                platformVal, 
                reviewVal
            ].map(formatCell).join('\t'));

        } catch (e) {
            console.error("Error processing card", e);
        }
    });

    // --- 4. Copy ---
    const tsvContent = headers.join('\t') + '\n' + rows.join('\n');
    copyToClipboard(tsvContent);

    console.log(`✅ Extracted ${rows.length} reviews from Guruwalk.`);

})();