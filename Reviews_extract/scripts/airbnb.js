(function() {
    console.log("Airbnb Review Scraper Started...");

    // 1. Helper: Format Date (DD/Mon/YYYY, e.g. 01/Jan/2026)
    function formatDate(dateString) {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString; 
        
        const d = String(date.getDate()).padStart(2, '0');
        const m = date.toLocaleString('en-US', { month: 'short' });
        const y = date.getFullYear();
        
        return `${d}/${m}/${y}`;
    }

    // 2. Helper: Format Time
    function formatTime(timeString) {
        if (!timeString) return "";
        const [time, modifier] = timeString.split(' ');
        let [hours, minutes] = time.split(':');
        if (hours === '12') { hours = '00'; }
        if (modifier === 'PM') { hours = parseInt(hours, 10) + 12; }
        return `${hours}:${minutes}`;
    }

    // 3. Helper: Map Tour Name
    function mapTourName(rawName) {
        const nameLower = rawName.toLowerCase();
        if (nameLower.includes("communism & croatian homeland war")) return "war";
        if (nameLower.includes("zagreb food tour")) return "food";
        if (nameLower.includes("best zagreb") || nameLower.includes("zagreb must-sees with the ww2 tunnels")) return "best";
        return rawName; 
    }

    // 4. Helper: Auto-Guess City from Tour Name
    function guessCity(rawTourName) {
        const nameLower = rawTourName.toLowerCase();
        if (nameLower.includes("dubrovnik")) return "du";
        if (nameLower.includes("rovinj")) return "rv";
        if (nameLower.includes("pula")) return "pu";
        if (nameLower.includes("split")) return "st";
        if (nameLower.includes("zadar")) return "zd";
        if (nameLower.includes("zagreb") || nameLower.includes("communism & croatian homeland war")) return "zg";
        return ""; 
    }

    // 5. Helper: Extract Guide Name from Review Text
    function extractGuideName(reviewText) {
        if (!reviewText) return "N/A";
        
        // We use \b to ensure we only match whole words. 
        // The 'i' flag at the end makes it case-insensitive.
        const guideMap = [
            { fullName: "Darko Crnolatac", regex: /\b(darko)\b/i },
            { fullName: "Diana Bolić", regex: /\b(diana|diane)\b/i },
            { fullName: "Ivana Čakarić", regex: /\b(ivana)\b/i },
            { fullName: "Iva Pavlović", regex: /\b(iva)\b/i },
            { fullName: "Katarina Novoselac", regex: /\b(katarina)\b/i },
            { fullName: "Katija Crnčević", regex: /\b(katija)\b/i },
            { fullName: "Luka Pelicarić", regex: /\b(luka|luca)\b/i },
            { fullName: "Nikolina Folnović", regex: /\b(nikolina(\s?f)?)\b/i },
            { fullName: "Vid Dorić", regex: /\b(vid|veed)\b/i },
            // Keeping the ones without full names in your list as just their first names
            { fullName: "Kristina", regex: /\b(kristina)\b/i },
            { fullName: "Ena", regex: /\b(ena)\b/i },
            { fullName: "Doris", regex: /\b(doris)\b/i }
        ];

        for (const guide of guideMap) {
            if (guide.regex.test(reviewText)) {
                return guide.fullName;
            }
        }

        return "N/A"; // Fallback if no specific name is found
    }

    // 6. Helper: Copy to Clipboard
    function copyToClipboard(text) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(() => {
                console.log("Copied via Async Clipboard API");
            }).catch(err => {
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
            console.log("Copied via Fallback method");
        } catch (err) {
            console.error('Fallback copy failed', err);
            alert("Failed to copy data. Please check console.");
        }
        document.body.removeChild(textArea);
    }

    // 7. Main Scraping Function
    function scrapeData() {
        const reviewNodes = document.querySelectorAll('button[aria-label="Opens detailed review"]');
        
        if (reviewNodes.length === 0) {
            console.warn("No reviews found. Check selectors.");
            alert("No reviews found on this page.");
            return;
        }

        // --- Get Tour Name ---
        let rawTourName = "";
        try {
            const titleEl = document.querySelector('h1');
            if(titleEl) {
                rawTourName = titleEl.innerText.split('·')[0].trim();
            }
        } catch (e) {
            rawTourName = "Tour Name Not Found";
        }
        
        const finalTourName = mapTourName(rawTourName);

        // --- Get City Name (Prompt User with Auto-Guess) ---
        const suggestedCity = guessCity(rawTourName);
        const finalCityName = prompt("Please confirm the city abbreviation for this tour (du, rv, pu, st, zd, zg):", suggestedCity);
        
        if (finalCityName === null) {
            console.log("Scraping cancelled by user.");
            return; 
        }

        let output = ""; 

        reviewNodes.forEach(node => {
            try {
                // --- Extract Date & Time ---
                const metaDiv = node.querySelector('.d1ylbvwr');
                let dateVal = "";
                let timeVal = "";
                
                if (metaDiv) {
                    const textParts = metaDiv.innerText.split('·');
                    if (textParts.length > 0) dateVal = formatDate(textParts[0].trim());
                    if (textParts.length > 1) timeVal = formatTime(textParts[1].trim());
                }

                // --- Extract Rating ---
                const ratingContainer = node.querySelector('.scbur3z');
                const rating = ratingContainer ? ratingContainer.querySelectorAll('svg').length : 5; 

                // --- Extract Review Text ---
                const textDiv = node.querySelector('.cwk6og9');
                const reviewText = textDiv ? textDiv.innerText.replace(/(\r\n|\n|\r)/gm, " ") : "";

                // --- Extract Guide Name ---
                const guide = extractGuideName(reviewText);

                // --- Constants ---
                const language = ""; 
                const platform = "Airbnb";

                // --- Build Row ---
                output += `${dateVal}\t${timeVal}\t${guide}\t${rating}\t${finalTourName}\t${finalCityName.trim().toLowerCase()}\t${language}\t${platform}\t${reviewText}\n`;

            } catch (err) {
                console.error("Error parsing a row", err);
            }
        });

        // Execute Copy
        copyToClipboard(output);
        console.log(`Successfully extracted ${reviewNodes.length} reviews.`);
        alert(`Successfully copied ${reviewNodes.length} reviews for city: ${finalCityName.toUpperCase()}`);
    }

    // Run the scraper
    scrapeData();

})();