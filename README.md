# WebTools

This project is a client-side web application that combines multiple utilities into a single, easy-to-use interface. It's designed to be a one-stop shop for common tasks like image conversion, PDF manipulation, and text processing, all running directly in your browser without needing a server.

Developer: [Simon Oszust](https://github.com/Soszust40)

Languages: English

## Navigation

* **Navigate:** Use the sidebar menu to select your desired tool. The active tool will be highlighted.
* **Use Tool:** Follow the on-screen instructions for each tool (e.g., drag-and-drop files, type text, adjust settings).
* **Toggle Theme:** Use the moon icon in the top-right corner to switch between light and dark modes.
* **Mobile:** The sidebar can be toggled on mobile devices using the **☰** hamburger menu.

## Features

This project includes the following tools:

* **🖼️ Image Converter**
    * Convert multiple images to **PNG**, **JPG**, **WebP**, **ICO**, or **ICNS**.
    * Adjustable quality settings for JPG and WebP formats.
    * Advanced options to **resize** (by width/height) and **invert colors**.
    * Download files individually or all at once as a single **.zip archive**.

* **📄 PDF Tools**
    * **Compress:** Reduce the file size of a PDF using basic optimization.
    * **Combine:** Merge multiple PDF files into a single document.
    * **Split/Extract:** Extract specific pages or page ranges (e.g., "1-3, 5, 7") from a PDF.

* **📝 Word Counter**
    * Provides real-time counts for **words** and **characters** as you type.
    * Calculates estimated **reading time** (at 240 WPM) and **speaking time** (at 140 WPM).

* **📚 Citation Maker**
    * Generate citations for various sources (Website, Book, Journal, Film, etc.).
    * Formats in **APA 7**, **MLA 9**, and **Chicago 17** styles.
    * Dynamically shows the required fields for each source type.

* **🔲 QR Generator**
    * Generate a QR code from any text or URL.
    * Save the generated code as a **PNG** file in various sizes (200px, 300px, 400px).

* **🔤 List Sorter**
    * Sort text lists with one item per line.
    * Options for **ascending**/**descending** order.
    * Filter for **unique** entries only.
    * Toggle **case sensitivity** and **numeric sorting**.

* **🎨 Color Converter**
    * An interactive color picker.
    * Provides real-time conversion and syncing between **HEX**, **RGB**, and **HSL** color models.
    * Update values using the color picker, text inputs, or sliders.
    * Get the complementary (opposite) of your current color with one click.

* **🔄 Text/Code Diff**
    * Compare two blocks of text or code to see the differences highlighted.
    * Comparison modes: **Lines**, **Words**, or **Characters**.

* **🔒 Vigenère Cipher**
    * Encrypt or decrypt text using the classic Vigenère cipher.
    * Includes a **random keyword generator** using a built-in word list.
    * Options to **preserve case** and **keep non-alphabetic characters**.

## Technologies Used

* **HTML5**
* **CSS3** (with CSS Variables for dynamic light/dark theming)
* **JavaScript (ES6+)** (All logic is 100% client-side)
* **Libraries:**
    * [pdf-lib](https://pdf-lib.js.org/) for all PDF creation and manipulation.
    * [JSZip](https://stuk.github.io/jszip/) for creating .zip archives in the browser.
    * [FileSaver.js](https://github.com/eligrey/FileSaver.js/) for triggering file downloads.
    * [qrcode.js](https://github.com/davidshimjs/qrcodejs) for generating QR codes on the canvas.
    * [jsdiff](https://github.com/kpdecker/jsdiff) for comparing text and code.