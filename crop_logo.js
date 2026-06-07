const puppeteer = require('puppeteer');

(async () => {
    try {
        const browser = await puppeteer.launch({ headless: 'new' });
        const page = await browser.newPage();
        
        await page.goto('file:///C:/Users/panch/Downloads/voyago_logo_dark.pdf');
        
        await new Promise(r => setTimeout(r, 3000));

        await page.screenshot({ path: 'pdf_full.png' });
        
        console.log('Saved full PDF screenshot!');
        await browser.close();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
})();
