class HTMLExtractor {
    constructor() {
        this.elements = {
            inputContainer: document.getElementById('inputContainer'),
            resultsContainer: document.getElementById('resultsContainer'),
            uploadArea: document.getElementById('uploadArea'),
            fileInput: document.getElementById('fileInput'),
            pasteArea: document.getElementById('pasteArea'),
            resetBtn: document.getElementById('resetBtn'),
            stats: document.getElementById('stats'),
            tabs: document.querySelectorAll('.tab'),
            tabContents: document.querySelectorAll('.tab-content'),
            htmlOutput: document.getElementById('htmlOutput'),
            cssOutput: document.getElementById('cssOutput'),
            jsOutput: document.getElementById('jsOutput'),
            htmlFilename: document.getElementById('htmlFilename'),
            cssFilename: document.getElementById('cssFilename'),
            jsFilename: document.getElementById('jsFilename'),
            downloadHtmlBtn: document.getElementById('downloadHtmlBtn'),
            downloadCssBtn: document.getElementById('downloadCssBtn'),
            downloadJsBtn: document.getElementById('downloadJsBtn'),
            downloadZipBtn: document.getElementById('downloadZipBtn'),
            previewFrame: document.getElementById('preview-frame'),
            useFoldersCheckbox: document.getElementById('useFoldersCheckbox'),
            scrollToTopBtn: document.getElementById('scrollToTopBtn'),
        };

        this.originalFilename = 'untitled.html';
        this.originalHtmlContent = null;
        this.extracted = { html: '', css: '', js: '' };
        this.crc32Table = this.generateCrc32Table();
        this.init();
    }

    init() {
        this.addEventListeners();
    }

    addEventListeners() {
        this.elements.uploadArea.addEventListener('click', () => this.elements.fileInput.click());
        this.elements.fileInput.addEventListener('change', this.handleFileSelect.bind(this));
        this.elements.pasteArea.addEventListener('input', this.handlePaste.bind(this));

        this.elements.uploadArea.addEventListener('dragover', this.handleDragOver.bind(this));
        this.elements.uploadArea.addEventListener('dragleave', this.handleDragLeave.bind(this));
        this.elements.uploadArea.addEventListener('drop', this.handleDrop.bind(this));

        this.elements.resetBtn.addEventListener('click', this.reset.bind(this));
        this.elements.tabs.forEach(tab => tab.addEventListener('click', () => this.switchTab(tab.dataset.tab)));

        this.elements.downloadHtmlBtn.addEventListener('click', () => this.downloadFile(this.extracted.html, this.elements.htmlFilename.value, 'text/html'));
        this.elements.downloadCssBtn.addEventListener('click', () => this.downloadFile(this.extracted.css, this.elements.cssFilename.value, 'text/css'));
        this.elements.downloadJsBtn.addEventListener('click', () => this.downloadFile(this.extracted.js, this.elements.jsFilename.value, 'application/javascript'));
        this.elements.downloadZipBtn.addEventListener('click', this.downloadAllAsZip.bind(this));

        this.elements.useFoldersCheckbox.addEventListener('change', this.handleOptionsChange.bind(this));

        // Scroll to top listeners
        window.addEventListener('scroll', () => {
            if (window.scrollY > 100) {
                this.elements.scrollToTopBtn.classList.add('show');
            } else {
                this.elements.scrollToTopBtn.classList.remove('show');
            }
        });

        this.elements.scrollToTopBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    handleOptionsChange() {
        if (this.originalHtmlContent) {
            this.processHTML(this.originalHtmlContent);
        }
    }

    handleFileSelect(e) {
        const file = e.target.files[0];
        if (file) {
            this.originalFilename = file.name;
            const reader = new FileReader();
            reader.onload = (e) => this.processHTML(e.target.result);
            reader.readAsText(file);
        }
    }

    handlePaste(e) {
        const content = e.target.value;
        if (content && content.trim().startsWith('<')) {
            this.originalFilename = 'pasted-code.html';
            this.processHTML(content);
        }
    }

    handleDragOver(e) { e.preventDefault(); this.elements.uploadArea.classList.add('dragover'); }
    handleDragLeave() { this.elements.uploadArea.classList.remove('dragover'); }
    handleDrop(e) {
        e.preventDefault();
        this.elements.uploadArea.classList.remove('dragover');
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('text/html')) {
            this.originalFilename = file.name;
            const reader = new FileReader();
            reader.onload = (e) => this.processHTML(e.target.result);
            reader.readAsText(file);
        }
    }

    processHTML(htmlString) {
        this.originalHtmlContent = htmlString;
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlString, 'text/html');

        if (!doc.head) {
            const head = doc.createElement('head');
            if (doc.documentElement) doc.documentElement.prepend(head);
        }
        if (!doc.body) {
            const body = doc.createElement('body');
            if (doc.documentElement) doc.documentElement.appendChild(body);
        }

        const styleNodes = doc.querySelectorAll('style');
        const scriptNodes = doc.querySelectorAll('script:not([src])');

        let cssContent = Array.from(styleNodes)
            .map(node => this.dedent(node.innerHTML))
            .join('\n\n/* --- Next Style Block --- */\n\n');
        styleNodes.forEach(node => node.remove());

        let jsContent = Array.from(scriptNodes)
            .filter(node => node.innerHTML.trim())
            .map(node => this.dedent(node.innerHTML))
            .join('\n\n// --- Next Script Block ---\n\n');
        scriptNodes.forEach(node => node.remove());

        this.extracted.css = cssContent.trim();
        this.extracted.js = jsContent.trim();

        const useFolders = this.elements.useFoldersCheckbox.checked;
        const cssFilename = this.elements.cssFilename.value;
        const jsFilename = this.elements.jsFilename.value;

        const cssLinkHref = useFolders ? `styles/${cssFilename}` : cssFilename;
        const jsScriptSrc = useFolders ? `scripts/${jsFilename}` : jsFilename;

        if (this.extracted.css) {
            const link = doc.createElement('link');
            link.setAttribute('rel', 'stylesheet');
            link.setAttribute('href', cssLinkHref);
            doc.head.appendChild(link);
        }

        if (this.extracted.js) {
            const script = doc.createElement('script');
            script.setAttribute('src', jsScriptSrc);
            script.setAttribute('defer', '');
            doc.body.appendChild(script);
        }

        const hasDoctype = htmlString.trim().toLowerCase().startsWith('<!doctype html');
        this.extracted.html = (hasDoctype ? '<!DOCTYPE html>\n' : '') + doc.documentElement.outerHTML;

        this.displayResults({
            styleBlocks: styleNodes.length,
            scriptBlocks: scriptNodes.length
        });
    }

    dedent(text) {
        if (!text) return '';
        const lines = text.split('\n');

        let firstLineIndex = 0;
        while (firstLineIndex < lines.length && lines[firstLineIndex].trim() === '') {
            firstLineIndex++;
        }

        let lastLineIndex = lines.length - 1;
        while (lastLineIndex >= firstLineIndex && lines[lastLineIndex].trim() === '') {
            lastLineIndex--;
        }

        if (firstLineIndex > lastLineIndex) return '';

        const relevantLines = lines.slice(firstLineIndex, lastLineIndex + 1);
        if (relevantLines.length === 0) return '';

        let minIndent = Infinity;
        relevantLines.forEach(line => {
            if (line.trim().length > 0) {
                const indent = line.match(/^\s*/)[0].length;
                if (indent < minIndent) {
                    minIndent = indent;
                }
            }
        });

        if (minIndent === Infinity || minIndent === 0) {
            return relevantLines.join('\n');
        }

        return relevantLines.map(line => line.substring(minIndent)).join('\n');
    }

    displayResults(stats) {
        this.elements.htmlOutput.value = this.extracted.html;
        this.elements.cssOutput.value = this.extracted.css;
        this.elements.jsOutput.value = this.extracted.js;

        this.elements.inputContainer.style.display = 'none';
        this.elements.resultsContainer.classList.add('visible');

        this.updateStats(stats);
        this.updatePreview();
    }

    updateStats(counts) {
        const cssChars = this.extracted.css.length;
        const cssLines = this.extracted.css ? this.extracted.css.split('\n').length : 0;
        const jsChars = this.extracted.js.length;
        const jsLines = this.extracted.js ? this.extracted.js.split('\n').length : 0;

        this.elements.stats.innerHTML = `
                    <div class="stat-item"><div class="stat-value">${counts.styleBlocks}</div><div class="stat-label">&lt;style&gt; Blocks</div></div>
                    <div class="stat-item"><div class="stat-value">${counts.scriptBlocks}</div><div class="stat-label">&lt;script&gt; Blocks</div></div>
                    <div class="stat-item"><div class="stat-value">${cssChars.toLocaleString()}/${cssLines.toLocaleString()}</div><div class="stat-label">CSS Chars/Lines</div></div>
                    <div class="stat-item"><div class="stat-value">${jsChars.toLocaleString()}/${jsLines.toLocaleString()}</div><div class="stat-label">JS Chars/Lines</div></div>
                `;
    }

    updatePreview() {
        const cssBlob = new Blob([this.extracted.css], { type: 'text/css' });
        const jsBlob = new Blob([this.extracted.js], { type: 'application/javascript' });
        const cssUrl = URL.createObjectURL(cssBlob);
        const jsUrl = URL.createObjectURL(jsBlob);

        const useFolders = this.elements.useFoldersCheckbox.checked;
        const cssFilename = this.elements.cssFilename.value;
        const jsFilename = this.elements.jsFilename.value;
        const cssLinkHref = useFolders ? `styles/${cssFilename}` : cssFilename;
        const jsScriptSrc = useFolders ? `scripts/${jsFilename}` : jsFilename;

        let previewHtml = this.extracted.html
            .replace(cssLinkHref, cssUrl)
            .replace(jsScriptSrc, jsUrl);
        this.elements.previewFrame.srcdoc = previewHtml;
        setTimeout(() => { URL.revokeObjectURL(cssUrl); URL.revokeObjectURL(jsUrl); }, 10000);
    }

    switchTab(tabName) {
        this.elements.tabs.forEach(tab => tab.classList.toggle('active', tab.dataset.tab === tabName));
        this.elements.tabContents.forEach(content => content.classList.toggle('active', content.id === `${tabName}-tab`));
    }

    downloadFile(content, filename, mimeType) {
        if (typeof content !== 'string' && !(content instanceof Blob)) return;
        const blob = (content instanceof Blob) ? content : new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    reset() {
        this.elements.fileInput.value = '';
        this.elements.pasteArea.value = '';
        this.originalFilename = 'untitled.html';
        this.originalHtmlContent = null;
        this.extracted = { html: '', css: '', js: '' };
        this.elements.resultsContainer.classList.remove('visible');
        this.elements.inputContainer.style.display = 'block';
        this.elements.useFoldersCheckbox.checked = true;
        this.switchTab('html');
    }

    downloadAllAsZip() {
        const useFolders = this.elements.useFoldersCheckbox.checked;
        const cssFilename = this.elements.cssFilename.value;
        const jsFilename = this.elements.jsFilename.value;
        const htmlFilename = this.elements.htmlFilename.value;

        const cssZipPath = useFolders ? `styles/${cssFilename}` : cssFilename;
        const jsZipPath = useFolders ? `scripts/${jsFilename}` : jsFilename;

        const files = [
            { name: htmlFilename, content: this.extracted.html },
            { name: cssZipPath, content: this.extracted.css },
            { name: jsZipPath, content: this.extracted.js },
        ].filter(f => f.content);

        if (files.length === 0) return;

        const baseName = this.originalFilename.substring(0, this.originalFilename.lastIndexOf('.')) || this.originalFilename;
        const zipName = `${baseName}.zip`;

        const zipBlob = this.createZipBlob(files);
        this.downloadFile(zipBlob, zipName, 'application/zip');
    }

    createZipBlob(files) {
        const textEncoder = new TextEncoder();
        const fileParts = [];
        const centralDirectoryParts = [];
        let centralDirectorySize = 0;
        let offset = 0;

        const now = new Date();
        const dosTime = (now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1);
        const dosDate = ((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate();

        files.forEach(file => {
            const nameBytes = textEncoder.encode(file.name);
            const contentBytes = textEncoder.encode(file.content);
            const crc = this.crc32(contentBytes);

            const header = new ArrayBuffer(30 + nameBytes.length);
            const view = new DataView(header);
            view.setUint32(0, 0x04034b50, true);
            view.setUint16(4, 10, true);
            view.setUint16(8, 0, true);
            view.setUint16(10, dosTime, true);
            view.setUint16(12, dosDate, true);
            view.setUint32(14, crc, true);
            view.setUint32(18, contentBytes.length, true);
            view.setUint32(22, contentBytes.length, true);
            view.setUint16(26, nameBytes.length, true);
            new Uint8Array(header, 30).set(nameBytes);

            fileParts.push(new Uint8Array(header), contentBytes);

            const cdHeader = new ArrayBuffer(46 + nameBytes.length);
            const cdView = new DataView(cdHeader);
            cdView.setUint32(0, 0x02014b50, true);
            cdView.setUint16(4, 20, true);
            cdView.setUint16(6, 10, true);
            cdView.setUint16(12, dosTime, true);
            cdView.setUint16(14, dosDate, true);
            cdView.setUint32(16, crc, true);
            cdView.setUint32(20, contentBytes.length, true);
            cdView.setUint32(24, contentBytes.length, true);
            cdView.setUint16(28, nameBytes.length, true);
            cdView.setUint32(42, offset, true);
            new Uint8Array(cdHeader, 46).set(nameBytes);

            centralDirectoryParts.push(new Uint8Array(cdHeader));
            centralDirectorySize += cdHeader.byteLength;
            offset += header.byteLength + contentBytes.length;
        });

        const eocd = new ArrayBuffer(22);
        const eocdView = new DataView(eocd);
        eocdView.setUint32(0, 0x06054b50, true);
        eocdView.setUint16(8, files.length, true);
        eocdView.setUint16(10, files.length, true);
        eocdView.setUint32(12, centralDirectorySize, true);
        eocdView.setUint32(16, offset, true);

        const allParts = [...fileParts, ...centralDirectoryParts, new Uint8Array(eocd)];
        return new Blob(allParts, { type: 'application/zip' });
    }

    generateCrc32Table() {
        const table = new Uint32Array(256);
        for (let i = 0; i < 256; i++) {
            let c = i;
            for (let k = 0; k < 8; k++) {
                c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
            }
            table[i] = c;
        }
        return table;
    }

    crc32(bytes) {
        let crc = 0 ^ -1;
        for (let i = 0; i < bytes.length; i++) {
            crc = (crc >>> 8) ^ this.crc32Table[(crc ^ bytes[i]) & 0xFF];
        }
        return (crc ^ -1) >>> 0;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new HTMLExtractor();
});