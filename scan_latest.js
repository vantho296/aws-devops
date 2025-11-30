const { chromium } = require('playwright-extra');
const stealth = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');

chromium.use(stealth());

(async () => {
  const limitPages = 50; // Scan first 50 pages for updates
  const concurrency = 3;
  const outputFile = 'links.json';

  let foundLinks = [];
  if (fs.existsSync(outputFile)) {
    try {
      foundLinks = JSON.parse(fs.readFileSync(outputFile));
      console.log(`Loaded ${foundLinks.length} existing links.`);
    } catch (e) {}
  }

  const existingUrls = new Set(foundLinks.map((l) => l.url));
  let newLinksCount = 0;

  const browser = await chromium.launch({
    headless: true,
    channel: 'chrome', // Try to use real Chrome if available
    args: ['--disable-blink-features=AutomationControlled'], // Extra safety
  });

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const randomDelay = () => Math.floor(Math.random() * 5000) + 5000; // Increased delay 5-10s

  const processPage = async (pageNum, context) => {
    const url = `https://www.examtopics.com/discussions/amazon/${pageNum}/`;
    const page = await context.newPage();

    try {
      await sleep(randomDelay());

      const response = await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: 60000,
      });

      const status = response.status();

      if (status === 429 || status === 403) {
        throw new Error(`Rate limited (Status: ${status})`);
      }

      const title = await page.title();
      if (
        title.includes('Too Many Requests') ||
        title.includes('Just a moment')
      )
        throw new Error('Blocked by anti-bot detection');

      const links = await page.evaluate(() => {
        const anchors = Array.from(
          document.querySelectorAll('.discussion-link')
        );
        return anchors
          .map((a) => a.href)
          .filter(
            (href) =>
              href.includes('dop-c02') ||
              href.includes('devops-engineer-professional')
          );
      });

      if (links.length > 0) {
        for (const link of links) {
          if (!existingUrls.has(link)) {
            const match = link.match(/view\/(\d+)-/);
            const id = match ? parseInt(match[1]) : Date.now();
            foundLinks.push({ id, url: link });
            existingUrls.add(link);
            newLinksCount++;
            console.log(`[NEW] Found link: ${link}`);
          }
        }
      }
    } catch (e) {
      console.error(`Error on page ${pageNum}: ${e.message}`);
    } finally {
      await page.close();
    }
  };

  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1920, height: 1080 },
    locale: 'en-US',
    timezoneId: 'Asia/Ho_Chi_Minh',
  });

  // Export results to Github Actions Env if running in CI
  const setOutput = (name, value) => {
    if (process.env.GITHUB_OUTPUT) {
      fs.appendFileSync(process.env.GITHUB_OUTPUT, `${name}=${value}\n`);
    }
  };

  console.log(`Scanning first ${limitPages} pages for new questions...`);

  // Simple chunk processing
  for (let i = 1; i <= limitPages; i += concurrency) {
    const chunk = [];
    for (let j = 0; j < concurrency && i + j <= limitPages; j++) {
      chunk.push(i + j);
    }
    await Promise.all(chunk.map((p) => processPage(p, context)));
  }

  await browser.close();

  if (newLinksCount > 0) {
    console.log(`Found ${newLinksCount} new links. Updating ${outputFile}...`);

    // Create backup just in case
    if (fs.existsSync(outputFile)) {
      fs.copyFileSync(outputFile, `${outputFile}.bak`);
    }

    // Sort by ID to keep order
    foundLinks.sort((a, b) => a.id - b.id);
    fs.writeFileSync(outputFile, JSON.stringify(foundLinks, null, 2));
    setOutput('new_links_found', 'true');
  } else {
    console.log('No new links found.');
    setOutput('new_links_found', 'false');
  }
})();
