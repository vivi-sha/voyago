const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
    try {
        const browser = await puppeteer.launch({ headless: 'new' });
        const page = await browser.newPage();
        
        // Load the image into a page to analyze and crop it using Canvas
        const imagePath = 'file:///' + path.resolve('pdf_full.png').replace(/\\/g, '/');
        
        const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>body { margin: 0; padding: 0; }</style>
        </head>
        <body>
            <img id="img" src="${imagePath}" onload="processImage()" style="display:none;" />
            <canvas id="canvas"></canvas>
            
            <script>
                async function processImage() {
                    const img = document.getElementById('img');
                    const canvas = document.getElementById('canvas');
                    const ctx = canvas.getContext('2d');
                    
                    canvas.width = img.width;
                    canvas.height = img.height;
                    ctx.drawImage(img, 0, 0);
                    
                    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    const data = imgData.data;
                    
                    // The background of the PDF is white (or very light).
                    // The logo is a dark blue rounded rectangle.
                    // Let's find the bounding box of all non-white pixels.
                    let minX = canvas.width, minY = canvas.height, maxX = 0, maxY = 0;
                    
                    for (let y = 0; y < canvas.height; y++) {
                        for (let x = 0; x < canvas.width; x++) {
                            const idx = (y * canvas.width + x) * 4;
                            const r = data[idx], g = data[idx+1], b = data[idx+2];
                            
                            // If it's noticeably dark (dark blue is around r:15, g:23, b:42)
                            // So if r, g, b are all less than 200, it's part of the logo.
                            if (r < 200 && g < 200 && b < 200) {
                                if (x < minX) minX = x;
                                if (x > maxX) maxX = x;
                                if (y < minY) minY = y;
                                if (y > maxY) maxY = y;
                            }
                        }
                    }
                    
                    // We now have the bounding box of the whole logo.
                    // The logo contains the dark rounded rect, and maybe text below it.
                    // Wait, the text is also dark. The bounding box will include the text.
                    // But the rounded rect itself is a solid block of dark pixels.
                    
                    // Let's find just the dark rounded rect bounding box by checking rows.
                    // A solid dark rect will have a large continuous horizontal span of dark pixels.
                    let rectMinY = -1, rectMaxY = -1;
                    let rectMinX = canvas.width, rectMaxX = 0;
                    
                    for (let y = minY; y <= maxY; y++) {
                        let darkCount = 0;
                        let firstX = -1, lastX = -1;
                        for (let x = minX; x <= maxX; x++) {
                            const idx = (y * canvas.width + x) * 4;
                            if (data[idx] < 100 && data[idx+1] < 100 && data[idx+2] < 100) {
                                darkCount++;
                                if (firstX === -1) firstX = x;
                                lastX = x;
                            }
                        }
                        // If a row has a lot of dark pixels (e.g. > 100 pixels wide), it's part of the rounded rect.
                        // The text "voyago" is also dark but it has many gaps.
                        if (darkCount > 100) {
                            if (rectMinY === -1) rectMinY = y;
                            rectMaxY = y;
                            if (firstX < rectMinX) rectMinX = firstX;
                            if (lastX > rectMaxX) rectMaxX = lastX;
                        }
                    }
                    
                    // Expose the bounding box to puppeteer
                    window.boundingBox = { x: rectMinX, y: rectMinY, w: rectMaxX - rectMinX + 1, h: rectMaxY - rectMinY + 1 };
                    
                    // To get the app cover WITHOUT TEXT, we just need the dark blue rounded rect background,
                    // and the circle/pin inside it. Wait, the text is INSIDE the rounded rect!
                    // In the image, the rounded rect contains the circle, the pin, AND the text "voyago share the journey".
                    // If the text is inside the rounded rect, how can we remove it?
                    // The text is white and green. We can find the text and erase it by painting the background color over it!
                    
                    // The background color of the rounded rect:
                    // Just sample a pixel near the top left corner (e.g. x+10, y+10)
                    const bgIdx = ((rectMinY + 20) * canvas.width + (rectMinX + 20)) * 4;
                    const bgR = data[bgIdx], bgG = data[bgIdx+1], bgB = data[bgIdx+2];
                    
                    // Create an App Cover version without text
                    const coverCanvas = document.createElement('canvas');
                    coverCanvas.width = 1024;
                    coverCanvas.height = 1024;
                    const coverCtx = coverCanvas.getContext('2d');
                    
                    // Fill with background color
                    coverCtx.fillStyle = \`rgb(\${bgR}, \${bgG}, \${bgB})\`;
                    coverCtx.fillRect(0, 0, 1024, 1024);
                    
                    // Now copy JUST the center circle and pin!
                    // The center circle is slightly lighter dark blue. The pin is green.
                    // Both are in the upper half of the rounded rect.
                    // Let's just find the bounding box of the green pin and the lighter blue circle!
                    let circleMinX = canvas.width, circleMaxX = 0, circleMinY = canvas.height, circleMaxY = 0;
                    
                    for (let y = rectMinY; y <= rectMaxY; y++) {
                        for (let x = rectMinX; x <= rectMaxX; x++) {
                            const idx = (y * canvas.width + x) * 4;
                            const r = data[idx], g = data[idx+1], b = data[idx+2];
                            
                            // If a pixel is significantly different from bg color, it belongs to circle, pin, or text.
                            const diff = Math.abs(r - bgR) + Math.abs(g - bgG) + Math.abs(b - bgB);
                            if (diff > 10) {
                                // Exclude text! Text is usually lower half.
                                // Let's just consider the top 60% of the rounded rect.
                                if (y < rectMinY + (rectMaxY - rectMinY) * 0.6) {
                                    if (x < circleMinX) circleMinX = x;
                                    if (x > circleMaxX) circleMaxX = x;
                                    if (y < circleMinY) circleMinY = y;
                                    if (y > circleMaxY) circleMaxY = y;
                                }
                            }
                        }
                    }
                    
                    // Now draw the circle/pin onto the center of the 1024x1024 cover canvas
                    const circleW = circleMaxX - circleMinX;
                    const circleH = circleMaxY - circleMinY;
                    const scale = 500 / circleW; // scale it to be about 500px wide
                    
                    const drawW = circleW * scale;
                    const drawH = circleH * scale;
                    const drawX = (1024 - drawW) / 2;
                    const drawY = (1024 - drawH) / 2;
                    
                    coverCtx.drawImage(canvas, circleMinX, circleMinY, circleW, circleH, drawX, drawY, drawW, drawH);
                    
                    window.appCoverDataUrl = coverCanvas.toDataURL('image/png');
                    
                    // We also need the full logo (with text) for the inside app!
                    // Let's extract the rounded rect bounding box, but with a transparent background!
                    // Actually, the rounded rect already has its own background color.
                    // We can just crop it directly from the original canvas.
                    const insideCanvas = document.createElement('canvas');
                    insideCanvas.width = window.boundingBox.w;
                    insideCanvas.height = window.boundingBox.h;
                    const insideCtx = insideCanvas.getContext('2d');
                    insideCtx.drawImage(canvas, window.boundingBox.x, window.boundingBox.y, window.boundingBox.w, window.boundingBox.h, 0, 0, window.boundingBox.w, window.boundingBox.h);
                    
                    window.insideLogoDataUrl = insideCanvas.toDataURL('image/png');

                    window.done = true;
                }
            </script>
        </body>
        </html>
        `;

        await page.setContent(html);
        
        await page.waitForFunction('window.done === true', { timeout: 10000 });
        
        const coverBase64 = await page.evaluate(() => window.appCoverDataUrl);
        const insideBase64 = await page.evaluate(() => window.insideLogoDataUrl);
        
        const fs = require('fs');
        fs.writeFileSync('assets/icon.png', Buffer.from(coverBase64.split(',')[1], 'base64'));
        fs.writeFileSync('assets/logo.png', Buffer.from(insideBase64.split(',')[1], 'base64'));
        
        // Also make splash screen!
        const splashCanvasHtml = `
            const splashCanvas = document.createElement('canvas');
            splashCanvas.width = 1284;
            splashCanvas.height = 2778;
            const splashCtx = splashCanvas.getContext('2d');
            
            // Background
            splashCtx.fillStyle = \`rgb(\${bgR}, \${bgG}, \${bgB})\`;
            splashCtx.fillRect(0, 0, 1284, 2778);
            
            // Draw the inside logo centered
            const logoW = window.boundingBox.w;
            const logoH = window.boundingBox.h;
            const sScale = 800 / logoW;
            const sDrawW = logoW * sScale;
            const sDrawH = logoH * sScale;
            
            splashCtx.drawImage(canvas, window.boundingBox.x, window.boundingBox.y, logoW, logoH, (1284 - sDrawW)/2, (2778 - sDrawH)/2, sDrawW, sDrawH);
            
            window.splashDataUrl = splashCanvas.toDataURL('image/png');
        `;
        
        await page.evaluate(splashCanvasHtml);
        const splashBase64 = await page.evaluate(() => window.splashDataUrl);
        fs.writeFileSync('assets/splash.png', Buffer.from(splashBase64.split(',')[1], 'base64'));

        console.log('Successfully cropped and saved icons directly from PDF screenshot!');
        await browser.close();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
})();
