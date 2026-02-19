(async function() {
    // --- 1. UTILITY: WAIT FUNCTION ---
    const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    // --- 2. UTILITY: DATE FORMATTER ---
    function formatDate(dateString) {
        if (!dateString) return "";
        const date = new Date(dateString);
        if (isNaN(date)) return dateString;
        const day = String(date.getDate()).padStart(2, '0');
        const year = date.getFullYear();
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const month = monthNames[date.getMonth()];
        return `${day}/${month}/${year}`;
    }

    // --- 3. UTILITY: COPY TO CLIPBOARD ---
    // Uses a temporary textarea to ensure compatibility with Chrome extensions content scripts
    function copyToClipboard(text) {
        const el = document.createElement('textarea');
        el.value = text;
        el.setAttribute('readonly', '');
        el.style.position = 'absolute';
        el.style.left = '-9999px';
        document.body.appendChild(el);
        el.select();
        try {
            document.execCommand('copy');
        } catch (err) {
            console.error('Viator Scraper: Failed to copy to clipboard', err);
        }
        document.body.removeChild(el);
    }

    // --- 4. UTILITY: GUIDE NAME EXTRACTOR ---
    function extractGuideName(text) {
        // Regex \b looks for exact word matches (case-insensitive)
        // Grouped variations using (Name1|Name2) syntax
        const guideMappings = [
            { regex: /\bDarko\b/i, full: "Darko Crnolatac" },
            { regex: /\b(Diana|Diane)\b/i, full: "Diana Bolić" },
            { regex: /\b(Ivana|Ivanna)\b/i, full: "Ivana Čakarić" }, 
            { regex: /\b(Iva|Eva)\b/i, full: "Iva Pavlović" },
            { regex: /\b(Katarina|Catarina)\b/i, full: "Katarina Novoselac" },
            { regex: /\b(Katija|Katia)\b/i, full: "Katija Crnčević" },
            { regex: /\b(Kristina|Christina)\b/i, full: "Kristina Božić" },
            { regex: /\b(Luka|Luca|Looka)\b/i, full: "Luka Pelicarić" },
            { regex: /\b(Nikolina|Nicolina)(\s*F)?\b/i, full: "Nikolina Folnović" }, 
            { regex: /\b(Vid|Veed)\b/i, full: "Vid Dorić" }
        ];

        let foundGuides = new Set();
        for (let g of guideMappings) {
            if (g.regex.test(text)) {
                foundGuides.add(g.full);
            }
        }
        // Returns the found names comma-separated, or an empty string if none found
        return Array.from(foundGuides).join(", ");
    }

    // --- 5. UTILITY: TOUR NAME MAPPER ---
    function mapTourName(rawTourName) {
        if (!rawTourName) return "";
        const lowerName = rawTourName.toLowerCase();
        
        if (lowerName.includes("big zagreb private")) return "big";
        if (lowerName.includes("old zagreb private")) return "old";
        if (lowerName.includes("free spirit")) return "free";
        if (lowerName.includes("communism") || lowerName.includes("homeland war")) return "war";
        
        // Fallback: clean up Tripadvisor prefix if it's an unmapped tour
        return rawTourName.replace("Tripadvisor review: ", "").trim();
    }

    // --- MAIN LOGIC ---
    try {
        
        // A. EXPAND "SHOW ALL" BUTTONS
        const allButtons = document.querySelectorAll('div[class*="ReviewView__reviewContent"] button');
        let clickedCount = 0;

        for (const btn of allButtons) {
            // Check specifically for "Show all" to avoid clicking other UI elements
            if (btn.innerText.includes("Show all")) {
                btn.click();
                clickedCount++;
            }
        }

        // Only wait if we actually clicked something
        if (clickedCount > 0) {
            await wait(2000); // 2 seconds delay to allow text to expand
        }

        // B. SCRAPE DATA
        const allElements = document.querySelectorAll('div[data-automation^="review-"]');
        // Filter out the header/filter row (IDs must end in a number)
        const reviewCards = Array.from(allElements).filter(el => /\d+$/.test(el.getAttribute('data-automation')));

        let tsvOutput = "Date\tTime\tGuide\tRating\tTour\tCity\tLanguage\tPlatform\tReview\n";

        reviewCards.forEach(card => {
            try {
                // DATE
                const dateRaw = card.querySelector('[class*="ReviewHeader__reviewDate"]')?.innerText || "";
                const dateFormatted = formatDate(dateRaw);

                // RATING
                const rating = card.querySelectorAll('svg.jumpstart_ui__Rating__rating').length || 5;

                // TOUR
                const rawTourText = card.querySelector('[class*="ReviewHeader__reviewEntity"]')?.innerText || "";
                const tour = mapTourName(rawTourText);

                // REVIEW CONTENT (With Cleanup)
                const contentDiv = card.querySelector('[class*="ReviewView__reviewContent___"]');
                let reviewText = "";

                if (contentDiv) {
                    const clone = contentDiv.cloneNode(true);
                    
                    // Remove ALL buttons (Show all, Show less, etc.) before extraction
                    const buttons = clone.querySelectorAll('button');
                    buttons.forEach(btn => btn.remove());

                    reviewText = clone.innerText || "";
                }

                // Clean up whitespace and newlines
                reviewText = reviewText
                    .replace(/[\r\n]+/g, " ")
                    .replace(/\s+/g, " ")
                    .trim();

                // CONSTANTS & DYNAMIC EXTRACTIONS
                const time = "";
                const guide = extractGuideName(reviewText);
                const city = "zg";
                const language = "";
                const platform = "Viator";

                // ADD ROW
                // Quotes around reviewText handles commas/tabs inside the review
                tsvOutput += `${dateFormatted}\t${time}\t${guide}\t${rating}\t${tour}\t${city}\t${language}\t${platform}\t"${reviewText}"\n`;

            } catch (innerError) {
                console.error("Viator Scraper: Error parsing a card", innerError);
            }
        });

        // C. OUTPUT
        copyToClipboard(tsvOutput);
        console.log("Viator Scraper: Done! TSV data copied to clipboard.");

    } catch (e) {
        console.error("Viator Scraper: General Error", e);
    }

})();