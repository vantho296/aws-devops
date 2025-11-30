const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    // Using one of the known links
    const url = 'https://www.examtopics.com/discussions/amazon/view/108414-exam-aws-certified-devops-engineer-professional-dop-c02/';
    
    console.log(`Visiting ${url}...`);
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    
    const content = await page.content();
    fs.writeFileSync('debug_question.html', content);
    console.log('Saved debug_question.html');
    
    await browser.close();
})();


