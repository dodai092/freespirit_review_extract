(function() {
    console.log("Airbnb Review Scraper Started...");

    // 1. Helper: Format Date (DD/Mon/YYYY, e.g. 30/Dec/2025)
    function formatDate(dateString) {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString; 
        
        const d = String(date.getDate()).padStart(2, '0');
        const m = date.toLocaleString('en-US', { month: 'short' });
        const y = date.getFullYear();
        
        return `${d}/${m}/${y}`;
    }

    // 2. Helper: Format Time (Airbnb specific: 3:00 PM -> 15:00)
    function formatTime(timeString) {
        if (!timeString) return "";
        const [time, modifier] = timeString.split(' ');
        let [hours, minutes] = time.split(':');
        if (hours === '12') { hours = '00'; }
        if (modifier === 'PM') { hours = parseInt(hours, 10) + 12; }
        return `${hours}:${minutes}`;
    }

    // 3. Helper: Robust Copy to Clipboard with Fallback
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

    // 4. Main Scraping Function
    function scrapeData() {
        // Find review containers
        const reviewNodes = document.querySelectorAll('button[aria-label="Opens detailed review"]');
        
        if (reviewNodes.length === 0) {
            console.warn("No reviews found. Check selectors.");
            alert("No reviews found on this page.");
            return;
        }

        // --- Get the Tour Name from header ---
        let tourName = "";
        try {
            const titleEl = document.querySelector('h1');
            if(titleEl) {
                // Split by the middle dot to remove rating score if present
                tourName = titleEl.innerText.split('·')[0].trim();
            }
        } catch (e) {
            tourName = "Tour Name Not Found";
        }

        // --- NEW LOGIC: Override specific tour name ---
        if (tourName === "Zagreb must-sees with the ww2 Tunnels") {
            tourName = "Best Zagreb";
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

                // --- Constants ---
                const guide = ""; 
                const language = ""; 
                const platform = "Airbnb";

                // --- Build Row ---
                output += `${dateVal}\t${timeVal}\t${guide}\t${rating}\t${tourName}\t${language}\t${platform}\t${reviewText}\n`;

            } catch (err) {
                console.error("Error parsing a row", err);
            }
        });

        // 5. Execute Copy
        copyToClipboard(output);
        console.log(`Successfully extracted ${reviewNodes.length} reviews.`);
    }

    // Run the scraper
    scrapeData();

})();