const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
    try {
        const fontPath = 'node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Ionicons.ttf';
        const fontBase64 = fs.readFileSync(fontPath).toString('base64');
        const fontDataUri = `data:font/ttf;base64,${fontBase64}`;

        const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
        const page = await browser.newPage();
        
        const css = `
        @font-face {
            font-family: 'Ionicons';
            src: url("${fontDataUri}") format('truetype');
        }
        body { margin: 0; padding: 0; background-color: #111827; display: flex; justify-content: center; align-items: center; position: relative; font-family: 'Ionicons'; }
        .pin { color: #10B981; font-size: 800px; position: absolute; }
        .leaf { color: #111827; font-size: 320px; position: absolute; top: 310px; z-index: 2; }
        `;

        const iconHtml = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                ${css}
                body { width: 1024px; height: 1024px; }
            </style>
        </head>
        <body>
            <div class="pin">&#xf3c4;</div>
            <div class="leaf">&#xf3b2;</div>
        </body>
        </html>
        `;

        await page.setViewport({ width: 1024, height: 1024 });
        await page.setContent(iconHtml, { waitUntil: 'load' });
        await page.evaluateHandle('document.fonts.ready');
        await page.screenshot({ path: 'assets/icon.png' });
        
        // Splash screen (1284x2778)
        const splashHtml = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                ${css}
                body { width: 1284px; height: 2778px; flex-direction: column; }
                .pin { font-size: 500px; position: relative; z-index: 1;}
                .leaf { font-size: 190px; position: absolute; margin-top: -240px; z-index: 2;}
                .text { margin-top: 40px; display: flex; font-family: sans-serif; }
                .vo { color: #10B981; font-size: 120px; font-weight: 800; letter-spacing: -2px; }
                .yago { color: #FFFFFF; font-size: 120px; font-weight: 800; letter-spacing: -2px; }
                .tagline { color: #94A3B8; font-size: 40px; font-weight: 600; margin-top: 20px; font-family: sans-serif; }
            </style>
        </head>
        <body>
            <div>
                <div class="pin">&#xf3c4;</div>
                <div class="leaf">&#xf3b2;</div>
            </div>
            <div class="text">
                <span class="vo">vo</span><span class="yago">yago</span>
            </div>
            <div class="tagline">share the journey</div>
        </body>
        </html>
        `;
        await page.setViewport({ width: 1284, height: 2778 });
        await page.setContent(splashHtml, { waitUntil: 'load' });
        await page.evaluateHandle('document.fonts.ready');
        await page.screenshot({ path: 'assets/splash.png' });

        // Adaptive Icon Foreground
        const adaptiveHtml = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                ${css}
                body { width: 1024px; height: 1024px; background-color: transparent; }
                .pin { font-size: 650px; }
                .leaf { color: transparent; font-size: 260px; top: 340px; -webkit-text-stroke: 8px #10B981; } 
            </style>
        </head>
        <body>
            <div class="pin">&#xf3c4;</div>
            <div class="leaf">&#xf3b2;</div>
        </body>
        </html>
        `;
        await page.setViewport({ width: 1024, height: 1024 });
        await page.setContent(adaptiveHtml, { waitUntil: 'load' });
        await page.evaluateHandle('document.fonts.ready');
        await page.screenshot({ path: 'assets/android-icon-foreground.png', omitBackground: true });

        console.log('Saved icons and splash screen using local fonts base64!');
        await browser.close();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
})();
