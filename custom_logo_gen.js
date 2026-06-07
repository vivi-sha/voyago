const fs = require('fs');
const puppeteer = require('puppeteer');

(async () => {
    try {
        const browser = await puppeteer.launch({ headless: 'new' });
        const page = await browser.newPage();
        
        const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>body { margin: 0; padding: 0; background-color: #111827; display: flex; justify-content: center; align-items: center; width: 1024px; height: 1024px; }</style>
        </head>
        <body>
            <canvas id="c" width="1024" height="1024"></canvas>
            <script>
                const ctx = document.getElementById('c').getContext('2d');
                
                // Draw background circle
                ctx.fillStyle = '#1e293b'; // slightly lighter dark blue for the circle behind the pin
                ctx.beginPath();
                ctx.arc(512, 512, 380, 0, Math.PI * 2);
                ctx.fill();

                // Draw Location Pin
                ctx.fillStyle = '#10B981';
                ctx.beginPath();
                // A classic teardrop pin centered at 512, 512
                ctx.moveTo(512, 850); // Bottom point
                // Curve up to the left
                ctx.bezierCurveTo(300, 500, 250, 400, 250, 350);
                // Top half circle
                ctx.arc(512, 350, 262, Math.PI, 0);
                // Curve down to the bottom point
                ctx.bezierCurveTo(774, 400, 724, 500, 512, 850);
                ctx.fill();

                // Cutout the leaf/flame shape
                ctx.globalCompositeOperation = 'destination-out';
                ctx.beginPath();
                
                // The cutout is roughly a leaf curving to the right
                ctx.moveTo(480, 500); // bottom tip of the cutout
                // Curve up-left
                ctx.bezierCurveTo(400, 400, 430, 280, 550, 220); // Top tip of cutout
                // Curve down-right back to bottom tip
                ctx.bezierCurveTo(500, 280, 600, 400, 480, 500);
                
                ctx.fill();
                
                // Reset composite
                ctx.globalCompositeOperation = 'source-over';
            </script>
        </body>
        </html>
        `;

        await page.setViewport({ width: 1024, height: 1024 });
        await page.setContent(html);
        await page.screenshot({ path: 'assets/icon.png' });
        
        // Adaptive Icon
        const adaptiveHtml = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>body { margin: 0; padding: 0; background-color: transparent; display: flex; justify-content: center; align-items: center; width: 1024px; height: 1024px; }</style>
        </head>
        <body>
            <canvas id="c" width="1024" height="1024"></canvas>
            <script>
                const ctx = document.getElementById('c').getContext('2d');
                
                // Draw Location Pin (smaller for adaptive)
                ctx.fillStyle = '#10B981';
                ctx.beginPath();
                ctx.moveTo(512, 800);
                ctx.bezierCurveTo(342, 520, 302, 440, 302, 400);
                ctx.arc(512, 400, 210, Math.PI, 0);
                ctx.bezierCurveTo(722, 440, 682, 520, 512, 800);
                ctx.fill();

                ctx.globalCompositeOperation = 'destination-out';
                ctx.beginPath();
                ctx.moveTo(486, 520);
                ctx.bezierCurveTo(422, 440, 446, 344, 542, 296);
                ctx.bezierCurveTo(502, 344, 582, 440, 486, 520);
                ctx.fill();
            </script>
        </body>
        </html>
        `;
        await page.setContent(adaptiveHtml);
        await page.screenshot({ path: 'assets/android-icon-foreground.png', omitBackground: true });
        
        // Splash Screen
        const splashHtml = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { margin: 0; padding: 0; background-color: #111827; display: flex; flex-direction: column; justify-content: center; align-items: center; width: 1284px; height: 2778px; }
                .text { display: flex; font-family: sans-serif; margin-top: 50px; }
                .vo { color: #10B981; font-size: 130px; font-weight: 800; letter-spacing: -3px; }
                .yago { color: #FFFFFF; font-size: 130px; font-weight: 800; letter-spacing: -3px; }
                .tagline { color: #94A3B8; font-size: 45px; font-weight: 600; margin-top: 20px; font-family: sans-serif; letter-spacing: 1px;}
            </style>
        </head>
        <body>
            <canvas id="c" width="800" height="800"></canvas>
            <div class="text"><span class="vo">vo</span><span class="yago">yago</span></div>
            <div class="tagline">share the journey</div>
            <script>
                const ctx = document.getElementById('c').getContext('2d');
                
                // Draw background circle
                ctx.fillStyle = '#1e293b'; 
                ctx.beginPath();
                ctx.arc(400, 400, 300, 0, Math.PI * 2);
                ctx.fill();

                // Draw Location Pin
                ctx.fillStyle = '#10B981';
                ctx.beginPath();
                ctx.moveTo(400, 680); 
                ctx.bezierCurveTo(230, 400, 190, 320, 190, 280);
                ctx.arc(400, 280, 210, Math.PI, 0);
                ctx.bezierCurveTo(610, 320, 570, 400, 400, 680);
                ctx.fill();

                // Cutout
                ctx.globalCompositeOperation = 'destination-out';
                ctx.beginPath();
                ctx.moveTo(375, 400); 
                ctx.bezierCurveTo(311, 320, 335, 224, 431, 176); 
                ctx.bezierCurveTo(391, 224, 471, 320, 375, 400);
                ctx.fill();
            </script>
        </body>
        </html>
        `;
        await page.setViewport({ width: 1284, height: 2778 });
        await page.setContent(splashHtml);
        await page.screenshot({ path: 'assets/splash.png' });

        console.log('Done rendering perfect custom canvas icons!');
        await browser.close();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
})();
