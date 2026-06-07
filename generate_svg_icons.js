const puppeteer = require('puppeteer');

(async () => {
    try {
        const browser = await puppeteer.launch({ headless: 'new' });
        const page = await browser.newPage();
        
        // Use the exact same SVG path as Logo.js!
        const svgPath = `M 512 850 C 300 500, 250 400, 250 350 A 262 262 0 1 1 774 350 C 724 500, 774 400, 512 850 Z M 480 500 C 400 400, 430 280, 550 220 C 500 280, 600 400, 480 500 Z`;
        
        const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>body { margin: 0; padding: 0; background-color: #0F172A; display: flex; justify-content: center; align-items: center; width: 1024px; height: 1024px; }</style>
        </head>
        <body>
            <div style="background-color: #1E293B; width: 800px; height: 800px; border-radius: 400px; display: flex; justify-content: center; align-items: center;">
                <svg width="600" height="600" viewBox="0 0 1024 1024">
                    <path fill="#10B981" fill-rule="evenodd" d="${svgPath}" />
                </svg>
            </div>
        </body>
        </html>
        `;

        await page.setViewport({ width: 1024, height: 1024 });
        await page.setContent(html, { waitUntil: 'load' });
        await new Promise(r => setTimeout(r, 1000)); // Ensure render
        await page.screenshot({ path: 'assets/icon.png' });
        
        // Splash screen (1284x2778)
        const splashHtml = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { margin: 0; padding: 0; background-color: #0F172A; display: flex; flex-direction: column; justify-content: center; align-items: center; width: 1284px; height: 2778px; }
                .text { display: flex; font-family: sans-serif; margin-top: 50px; }
                .vo { color: #10B981; font-size: 130px; font-weight: 800; letter-spacing: -3px; }
                .yago { color: #FFFFFF; font-size: 130px; font-weight: 800; letter-spacing: -3px; }
                .tagline { color: #94A3B8; font-size: 45px; font-weight: 600; margin-top: 20px; font-family: sans-serif; letter-spacing: 1px;}
            </style>
        </head>
        <body>
            <div style="background-color: #1E293B; width: 800px; height: 800px; border-radius: 400px; display: flex; justify-content: center; align-items: center;">
                <svg width="600" height="600" viewBox="0 0 1024 1024">
                    <path fill="#10B981" fill-rule="evenodd" d="${svgPath}" />
                </svg>
            </div>
            <div class="text"><span class="vo">vo</span><span class="yago">yago</span></div>
            <div class="tagline">share the journey</div>
        </body>
        </html>
        `;
        await page.setViewport({ width: 1284, height: 2778 });
        await page.setContent(splashHtml, { waitUntil: 'load' });
        await new Promise(r => setTimeout(r, 1000));
        await page.screenshot({ path: 'assets/splash.png' });

        // Adaptive Foreground - Just the green pin, properly centered, no background circle.
        const adaptiveFgHtml = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { margin: 0; padding: 0; background-color: transparent; display: flex; justify-content: center; align-items: center; width: 1024px; height: 1024px; }
            </style>
        </head>
        <body>
            <svg width="680" height="680" viewBox="0 0 1024 1024">
                <path fill="#10B981" fill-rule="evenodd" d="${svgPath}" />
            </svg>
        </body>
        </html>
        `;
        await page.setViewport({ width: 1024, height: 1024 });
        await page.setContent(adaptiveFgHtml, { waitUntil: 'load' });
        await new Promise(r => setTimeout(r, 1000));
        await page.screenshot({ path: 'assets/android-icon-foreground.png', omitBackground: true });

        // Adaptive Background - Just a solid dark blue square
        const adaptiveBgHtml = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { margin: 0; padding: 0; background-color: #0F172A; width: 1024px; height: 1024px; }
            </style>
        </head>
        <body></body>
        </html>
        `;
        await page.setContent(adaptiveBgHtml, { waitUntil: 'load' });
        await new Promise(r => setTimeout(r, 1000));
        await page.screenshot({ path: 'assets/android-icon-background.png' });

        console.log('Done generating perfect SVG-based icons!');
        await browser.close();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
})();
