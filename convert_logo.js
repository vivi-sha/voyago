const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

(async () => {
    try {
        const browser = await puppeteer.launch({ headless: 'new' });
        const page = await browser.newPage();
        
        // Use a simple HTML page to load PDF.js and render the PDF
        const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js"></script>
        </head>
        <body style="margin:0; padding:0; background: transparent;">
            <canvas id="pdf-canvas"></canvas>
            <script>
                // We'll inject the PDF as base64
                window.renderPdf = async function(base64Data) {
                    const pdfjsLib = window['pdfjs-dist/build/pdf'];
                    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';
                    
                    const loadingTask = pdfjsLib.getDocument({data: atob(base64Data)});
                    const pdf = await loadingTask.promise;
                    const page = await pdf.getPage(1);
                    
                    const scale = 5; // High resolution
                    const viewport = page.getViewport({scale: scale});
                    
                    const canvas = document.getElementById('pdf-canvas');
                    const context = canvas.getContext('2d');
                    canvas.height = viewport.height;
                    canvas.width = viewport.width;
                    
                    const renderContext = {
                        canvasContext: context,
                        viewport: viewport
                    };
                    await page.render(renderContext).promise;
                    
                    return { width: canvas.width, height: canvas.height };
                };
            </script>
        </body>
        </html>
        `;

        await page.setContent(html);
        
        // Read PDF as base64
        const pdfData = fs.readFileSync('C:\\Users\\panch\\Downloads\\voyago_logo_dark.pdf').toString('base64');
        
        const dimensions = await page.evaluate(async (data) => {
            return await window.renderPdf(data);
        }, pdfData);
        
        console.log('Rendered PDF with dimensions:', dimensions);
        
        // The user wants it without text. Text is likely at the bottom.
        // We'll crop the top part (e.g. 70% of the image)
        const element = await page.$('#pdf-canvas');
        
        // First, take a full screenshot just in case
        await element.screenshot({ path: 'C:\\Users\\panch\\voyago\\assets\\logo_full.png' });
        
        // Now take a cropped screenshot (assuming logo is top half/70%)
        // We can tune this bounding box
        await element.screenshot({ 
            path: 'C:\\Users\\panch\\voyago\\assets\\icon.png',
            clip: {
                x: 0,
                y: 0,
                width: dimensions.width,
                height: dimensions.height * 0.65 // Crop out the bottom 35%
            }
        });

        // Also update adaptive icon
        fs.copyFileSync('C:\\Users\\panch\\voyago\\assets\\icon.png', 'C:\\Users\\panch\\voyago\\assets\\android-icon-foreground.png');
        
        console.log('Saved screenshots!');
        await browser.close();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
})();
