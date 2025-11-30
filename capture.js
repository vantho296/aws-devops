const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
    if (!fs.existsSync('links.json')) {
        console.error("links.json not found.");
        return;
    }

    const links = JSON.parse(fs.readFileSync('links.json'));
    const outputDir = 'screenshots';
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir);
    }

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        viewport: { width: 1280, height: 1200 }
    });
    
    console.log(`Starting capture for ${links.length} links...`);

    for (let i = 0; i < links.length; i++) {
        const item = links[i];
        
        try {
            const page = await context.newPage();
            // Go to URL
            await page.goto(item.url, { waitUntil: 'domcontentloaded', timeout: 60000 });
            
            // 1. Extract Question Number
            let questionNum = null;
            try {
                // Search for "Question #:" text on the page
                const text = await page.textContent('body');
                const match = text.match(/Question #:\s*(\d+)/);
                if (match) {
                    questionNum = match[1];
                }
            } catch (e) {
                console.log(`Could not find Question # for ID ${item.id}`);
            }

            // Fallback if not found (though it should be there)
            const fileNum = questionNum ? questionNum.padStart(3, '0') : `ID_${item.id}`;
            const filename = `Question_${fileNum}.png`;
            const filePath = path.join(outputDir, filename);

            if (fs.existsSync(filePath)) {
                console.log(`[Skip] ${filename} already exists.`);
                await page.close();
                continue;
            }

            console.log(`[${i+1}/${links.length}] Processing Question ${questionNum || item.id}...`);

            // 2. Click "Show Suggested Answer"
            const revealBtn = page.locator('.reveal-solution').first();
            if (await revealBtn.count() > 0) {
                if (await revealBtn.isVisible()) {
                    await revealBtn.click();
                    // Small wait for animation/display
                    await page.waitForTimeout(500);
                }
            }

            // 3. Clean up page (hide ads/headers)
            await page.evaluate(() => {
                const selectors = [
                    '.adsbygoogle', 
                    '.d-print-none', 
                    'header', 
                    'footer', 
                    '.right-sidebar',
                    '.rs-toolbar',
                    '.full-width-header'
                ];
                selectors.forEach(sel => {
                    document.querySelectorAll(sel).forEach(el => el.style.display = 'none');
                });
            });

            // 4. Capture
            await page.screenshot({ path: filePath, fullPage: true });
            await page.close();
            
        } catch (e) {
            console.error(`Error processing ${item.id}:`, e.message);
        }
    }

    await browser.close();
    console.log("Capture complete.");
})();
