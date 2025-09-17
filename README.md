# HTML Extractor

**Try it online:** [htmlextractor.ct.ws](https://htmlextractor.ct.ws) - _directly in your browser, no installation required._

An online tool to extract all CSS (`<style>`) and JavaScript (`<script>`) code blocks from an HTML file. It cleans up your document by separating the code into external files and automatically linking them, making your project cleaner and easier to maintain. All processing is done locally in your browser, so your code remains private.

## Features

-   **Automated Extraction**: Instantly pulls all CSS from `<style>` blocks and JavaScript from `<script>` blocks (that don't have a `src` attribute). 
-   **Clean HTML Output**: Generates a cleaned HTML file with the extracted code removed and replaced by standard `<link>` and `<script>` tags.
-   **Folder Organization**: Optional feature to place extracted files into `styles/` and `scripts/` directories, with the paths in the HTML updated automatically.
-   **Privacy First**: All file processing happens client-side in your browser. No files or code are ever uploaded to a server.
-   **Multiple Input Methods**: Use drag & drop, the file selector, or simply paste your raw HTML code.
-   **Live Preview**: Instantly see how the cleaned HTML renders in an embedded `iframe`.
-   **Flexible Download Options**: Download the cleaned HTML, CSS, and JS files individually, or get everything together in a `.zip` archive.
-   **Modern Design**: A clean, responsive, and easy-to-use interface.
-   **Scroll-to-top button**: Quickly return to the top of the page.
    
## How to Use

1.  Open the `index.html` file in your web browser.
2.  Drag and drop an HTML file, click to select one, or paste your code into the text area.
3.  The tool will automatically process the code.
4.  Navigate the tabs to view the **Cleaned HTML**, **Extracted CSS**, and **Extracted JS**.
5.  Use the **Live Preview** tab to check the rendering.
6.  Click the download buttons to save the files individually or all at once as a `.zip` file.
    

## Technologies Used

-   **HTML5**: For the structure of the web application.
-   **CSS3**: For styling, layout, and responsive design capabilities.
-   **Vanilla JavaScript**: For all the application logic, including:
    -   HTML parsing and code block extraction.
    -   Live preview rendering.
    -   Client-side ZIP file generation.
    -   DOM manipulation and event handling.

<br>

---

## :heart: Donations
**If you enjoy this project, any support is greatly appreciated!**  

<a href="https://www.buymeacoffee.com/devilquest" target="_blank"><img src="https://i.imgur.com/RHHFQWs.png" alt="Buy Me A Dinosaur"></a>  
