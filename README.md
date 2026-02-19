# Reviews Extract Chrome Extension

## Overview
The Reviews Extract Chrome Extension is a powerful tool designed to help users quickly and efficiently extract and reformat customer reviews from various online review platforms. This extension is ideal for researchers, businesses, or anyone needing to collect review data for analysis, reporting, or data migration purposes.

## Features
- **Platform Support**: Extracts reviews from:
    - Airbnb
    - Freetour.com
    - GetYourGuide
    - Google (Google Maps/Business Reviews)
    - Guruwalk
    - Viator
- **Automated Data Extraction**: Automatically identifies and scrapes key review details, including:
    - Date of review/travel
    - Time of review (where available)
    - Guide name (extracted from review text, where applicable)
    - Rating (star rating)
    - Tour/Product Name
    - City (where applicable, with some auto-guessing and user confirmation)
    - Language (where explicitly stated)
    - Originating Platform
    - Full Review Text
- **Standardized Output**: Formats all extracted data into a Tab-Separated Values (TSV) format, which can be easily pasted into spreadsheets (e.g., Google Sheets, Excel) for further analysis.
- **Clipboard Integration**: Automatically copies the formatted TSV data to your clipboard for quick pasting.

## Installation

To install and use this Chrome extension:

1.  **Download/Clone**: Download this repository as a ZIP file and unzip it, or clone it using Git.
2.  **Open Chrome Extensions Page**: Open Google Chrome and navigate to `chrome://extensions`.
3.  **Enable Developer Mode**: In the top right corner, toggle on "Developer mode".
4.  **Load Unpacked**: Click on the "Load unpacked" button that appears.
5.  **Select Folder**: Navigate to and select the unzipped/cloned project folder (`Reviews_extract`).
6.  **Pin Extension (Optional)**: Click the puzzle piece icon in your Chrome toolbar and pin "Reviews Extract" for easy access.

## Usage

1.  **Navigate to a Supported Platform**: Go to a web page on one of the supported platforms (e.g., an Airbnb tour page with reviews, a Google Business listing with reviews).
2.  **Open the Extension**: Click on the "Reviews Extract" icon in your Chrome toolbar.
3.  **Select Platform Button**: In the popup, click the button corresponding to the platform you are currently viewing (e.g., "Airbnb Reviews").
4.  **Scraping Process**:
    *   The extension will inject a script into the active tab to automatically scrape the reviews.
    *   For some platforms (e.g., GetYourGuide, Viator, Google), the script will automatically expand "Show more" or "Show details" buttons to ensure all available review text is captured.
    *   For platforms like Airbnb, it might prompt you to confirm a city abbreviation.
    *   The status message in the popup will update (e.g., "Scraping...", "Done! Copied.").
5.  **Paste Data**: Once "Done! Copied." appears, the extracted review data (in TSV format) is in your clipboard. You can now open a spreadsheet application (like Google Sheets or Excel) and paste (`Ctrl+V` or `Cmd+V`) the data directly. Each column will be correctly separated by tabs.

## Project Structure

-   `manifest.json`: Defines the extension's properties, permissions, and popup.
-   `popup.html`: The HTML structure for the extension's popup interface.
-   `popup.js`: The JavaScript logic for the popup, handling button clicks and injecting content scripts.
-   `logo.png`: The extension's icon.
-   `scripts/`: This directory contains individual content scripts for each supported platform.
    -   `airbnb.js`: Script for scraping Airbnb reviews.
    -   `freetour.js`: Script for scraping Freetour.com reviews.
    -   `getyourguide.js`: Script for scraping GetYourGuide reviews.
    -   `google.js`: Script for scraping Google reviews.
    -   `guruwalk.js`: Script for scraping Guruwalk reviews.
    -   `viator.js`: Script for scraping Viator reviews.

Each script in the `scripts/` directory is responsible for:
1.  Identifying relevant HTML elements containing review data.
2.  Extracting specific fields (date, rating, text, etc.).
3.  Formatting the data.
4.  Copying the formatted data to the clipboard as TSV.

## License
[TODO: Add license information here, e.g., MIT, Apache 2.0, etc.]
