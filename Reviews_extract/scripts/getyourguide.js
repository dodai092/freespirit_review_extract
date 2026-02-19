(function() {
    console.log("GetYourGuide Review Scraper Started...");

    // 1. Helper: Format Date
    function formatDate(dateStr) {
        if (!dateStr) return "";
        const parts = dateStr.replace(/,/g, '').split(' ');
        if (parts.length !== 3) return dateStr;
        
        let [month, day, year] = parts;
        day = day.length < 2 ? '0' + day : day;
        return `${day}/${month}/${year}`;
    }

    // 2. Helper: Copy to Clipboard
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

    // 3. Main Logic: Expand cards -> Wait -> Scrape
    function expandAndScrape() {
        // A. Find all expand buttons
        const expandButtons = document.querySelectorAll('button[data-testid="review-card-expand"]');
        let clickedCount = 0;

        // B. Click them only if they currently say "Show details"
        expandButtons.forEach(btn => {
            if (btn.innerText.includes("Show details")) {
                btn.click();
                clickedCount++;
            }
        });

        console.log(`Expanded ${clickedCount} reviews. Waiting for content to load...`);

        // C. Wait for the UI to update (500ms), then scrape
        setTimeout(() => {
            scrapeData();
        }, 500); 
    }

    // 4. The actual Scraping Function (Runs after expansion)
    function scrapeData() {
        const cards = document.querySelectorAll('[data-testid="review-card"]');
        
        if (cards.length === 0) {
            console.warn("No review cards found.");
            return;
        }

        let output = "Date\tTime\tGuide\tRating\tTour\tLanguage\tPlatform\tReview\n";

        cards.forEach(card => {
            try {
                // --- 1. Extract Travel Date (From the expanded details) ---
                // We look for the row identifying as 'Travel date', then get the text body inside it
                const dateRow = card.querySelector('[data-testid="Travel date"] .text-body');
                
                // Fallback: If travel date is missing (sometimes happens), grab the top-right Review Date
                const dateRaw = dateRow ? dateRow.innerText.trim() : card.querySelector('.absolute.top-4.right-4')?.innerText.trim();
                
                const date = formatDate(dateRaw || "");

                // --- 2. Extract Rating ---
                const rating = card.querySelector('.c-user-rating__rating')?.innerText.trim() || "";

                // --- 3. Extract Review ---
                const reviewRaw = card.querySelector('[data-testid="review-card-comment"]')?.innerText || "";
                const review = reviewRaw.replace(/(\r\n|\n|\r)/gm, " "); 

                // --- 4. Extract Tour Name ---
                const tour = card.querySelector('.text-ellipsis')?.innerText.trim() || "";

                // --- 5. Extract Language ---
                const optionText = card.querySelector('[data-testid="Option"] .text-body span')?.innerText || "";
                let language = "";
                if (optionText) {
                    const parts = optionText.split('|')[0].trim().split(' ');
                    language = parts[parts.length - 1] || "";
                }

                // --- 6. Constants ---
                const platform = "GYG"; 
                const time = ""; 
                const guide = ""; 

                output += `${date}\t${time}\t${guide}\t${rating}\t${tour}\t${language}\t${platform}\t${review}\n`;

            } catch (e) {
                console.error("Error parsing a card:", e);
            }
        });

        copyToClipboard(output);
        console.log(`Scraped ${cards.length} reviews successfully.`);
        // Optional: Alert the user in the browser window so they know it finished
        // alert(`Done! Scraped ${cards.length} reviews.`); 
    }

    // Start the process
    expandAndScrape();

})();