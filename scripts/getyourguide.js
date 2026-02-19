(function() {
    console.log("GetYourGuide Review Scraper Started...");

    // 1. Helper: Format Date (DD/Mon/YYYY)
    function formatDate(dateStr) {
        if (!dateStr) return "";
        const parts = dateStr.replace(/,/g, '').split(' ');
        if (parts.length !== 3) return dateStr;
        
        let [month, day, year] = parts;
        day = day.length < 2 ? '0' + day : day;
        month = month.substring(0, 3); // e.g., "January" -> "Jan"
        return `${day}/${month}/${year}`;
    }

    // 2. Helper: Copy to Clipboard
    function copyToClipboard(text) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).catch(err => {
                // Silently fall back without logging a warning
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
            // Silently ignore if fallback fails
        }
        document.body.removeChild(textArea);
    }

    // 3. Helper: Extract City from Tour Name
    function extractCity(tourName) {
        const t = tourName.toLowerCase();
        if (t.includes("dubrovnik")) return "du";
        if (t.includes("rovinj")) return "rv";
        if (t.includes("pula")) return "pu";
        if (t.includes("split")) return "st";
        if (t.includes("zadar")) return "zd";
        if (t.includes("zagreb")) return "zg";
        return ""; 
    }

    // 4. Helper: Extract Guide Name using Regex Rules
    function extractGuide(reviewText) {
        const text = reviewText.toLowerCase();
        
        // Define regex patterns (with word boundaries \b to prevent partial matches)
        const guideRegexes = [
            { regex: /\b(luka|luca)\b/g, name: "Luka Pelicarić" },
            { regex: /\b(vid|veed)\b/g, name: "Vid Dorić" },
            { regex: /\b(kristina|christina)\b/g, name: "Kristina Božić" },
            { regex: /\b(nikolina|nicolina)\b/g, name: "Nikolina Folnović" },
            { regex: /\b(katarina|catarina)\b/g, name: "Katarina Novoselac" },
            { regex: /\b(ivana)\b/g, name: "Ivana Čakarić" },
            { regex: /\b(diana|diane)\b/g, name: "Diana Bolić" },
            { regex: /\b(darko)\b/g, name: "Darko Crnolatac" },
            { regex: /\b(iva)\b/g, name: "Iva Pavlović" },
            { regex: /\b(ena)\b/g, name: "Ena" }, 
            { regex: /\b(doris)\b/g, name: "Doris" }, 
            { regex: /\b(katija|katia)\b/g, name: "Katija Crnčević" }
        ];

        for (let g of guideRegexes) {
            if (g.regex.test(text)) {
                return g.name;
            }
        }

        return "N/A";
    }

    // 5. Main Logic: Expand cards -> Wait -> Scrape
    function expandAndScrape() {
        const expandButtons = document.querySelectorAll('button[data-testid="review-card-expand"]');
        let clickedCount = 0;

        expandButtons.forEach(btn => {
            if (btn.innerText.includes("Show details")) {
                btn.click();
                clickedCount++;
            }
        });

        console.log(`Expanded ${clickedCount} reviews. Waiting for content to load...`);

        setTimeout(() => {
            scrapeData();
        }, 500); 
    }

    // 6. The actual Scraping Function
    function scrapeData() {
        const cards = document.querySelectorAll('[data-testid="review-card"]');
        
        if (cards.length === 0) {
            console.warn("No review cards found.");
            return;
        }

        let output = "Date\tTime\tGuide\tRating\tTour\tCity\tLanguage\tPlatform\tReview\n";

        cards.forEach(card => {
            try {
                // --- 1. Extract Travel Date ---
                const dateRow = card.querySelector('[data-testid="Travel date"] .text-body');
                const dateRaw = dateRow ? dateRow.innerText.trim() : card.querySelector('.absolute.top-4.right-4')?.innerText.trim();
                const date = formatDate(dateRaw || "");

                // --- 2. Extract Rating ---
                const rating = card.querySelector('.c-user-rating__rating')?.innerText.trim() || "";

                // --- 3. Extract Review & Guide Name ---
                const reviewRaw = card.querySelector('[data-testid="review-card-comment"]')?.innerText || "";
                const review = reviewRaw.replace(/(\r\n|\n|\r)/gm, " "); 
                const guide = extractGuide(reviewRaw);

                // --- 4. Extract Tour Name & City ---
                let tourRaw = card.querySelector('.text-ellipsis')?.innerText.trim() || "";
                let city = extractCity(tourRaw);
                let tour = tourRaw;
                
                // Rename specific tours
                if (tourRaw.includes("Free Spirit Walking Tour Zagreb")) {
                    tour = "free";
                } else if (tourRaw.includes("Zagreb: Communism and Croatian Homeland War Tour")) {
                    tour = "war";
                } else if (tourRaw.includes("Zagreb: Guided City Tour with WWII Tunnels")) {
                    tour = "best";
                }

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

                output += `${date}\t${time}\t${guide}\t${rating}\t${tour}\t${city}\t${language}\t${platform}\t${review}\n`;

            } catch (e) {
                console.error("Error parsing a card:", e);
            }
        });

        copyToClipboard(output);
        console.log(`Scraped ${cards.length} reviews successfully.`);
    }

    // Start the process
    expandAndScrape();

})();