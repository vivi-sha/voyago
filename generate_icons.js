const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
    try {
        const browser = await puppeteer.launch({ headless: 'new' });
        const page = await browser.newPage();
        
        // 1024x1024 for icon
        await page.setViewport({ width: 1024, height: 1024 });

        // HTML with dark background and a perfectly centered green location pin
        // No text, as requested for the app cover
        const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {
                    margin: 0;
                    padding: 0;
                    width: 1024px;
                    height: 1024px;
                    background-color: #111827; /* Dark blue/slate */
                    display: flex;
                    justify-content: center;
                    align-items: center;
                }
                .icon {
                    width: 500px;
                    height: 500px;
                    color: #10B981; /* Green */
                }
            </style>
        </head>
        <body>
            <svg class="icon" viewBox="0 0 512 512" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <!-- A clean location pin path -->
                <path d="M256 0C161.73 0 85.33 76.4 85.33 170.67c0 118.66 160.91 332.61 164.71 337.58a7.86 7.86 0 0 0 11.92 0c3.8-4.97 164.71-218.92 164.71-337.58C426.67 76.4 350.27 0 256 0zm0 256A85.33 85.33 0 1 1 341.33 170.67 85.43 85.43 0 0 1 256 256z"/>
            </svg>
        </body>
        </html>
        `;

        await page.setContent(html);
        
        // Screenshot exact viewport
        await page.screenshot({ path: 'C:\\Users\\panch\\voyago\\assets\\icon.png', clip: { x: 0, y: 0, width: 1024, height: 1024 } });
        
        // Adaptive icon foreground needs transparent background and smaller icon
        const adaptiveHtml = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {
                    margin: 0;
                    padding: 0;
                    width: 1024px;
                    height: 1024px;
                    background-color: transparent;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                }
                .icon {
                    width: 650px;
                    height: 650px;
                    color: #10B981; /* Green */
                }
            </style>
        </head>
        <body>
            <svg class="icon" viewBox="0 0 512 512" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M256 0C161.73 0 85.33 76.4 85.33 170.67c0 118.66 160.91 332.61 164.71 337.58a7.86 7.86 0 0 0 11.92 0c3.8-4.97 164.71-218.92 164.71-337.58C426.67 76.4 350.27 0 256 0zm0 256A85.33 85.33 0 1 1 341.33 170.67 85.43 85.43 0 0 1 256 256z"/>
            </svg>
        </body>
        </html>
        `;
        
        await page.setContent(adaptiveHtml);
        await page.screenshot({ path: 'C:\\Users\\panch\\voyago\\assets\\android-icon-foreground.png', omitBackground: true, clip: { x: 0, y: 0, width: 1024, height: 1024 } });

        // Adaptive icon background
        const bgHtml = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { margin: 0; padding: 0; width: 1024px; height: 1024px; background-color: #111827; }
            </style>
        </head>
        <body></body>
        </html>
        `;
        await page.setContent(bgHtml);
        await page.screenshot({ path: 'C:\\Users\\panch\\voyago\\assets\\android-icon-background.png', clip: { x: 0, y: 0, width: 1024, height: 1024 } });

        console.log('Saved properly centered icon screenshots!');
        await browser.close();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
})();
