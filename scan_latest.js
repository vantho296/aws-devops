const { chromium } = require('playwright');
const fs = require('fs');

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

  const browser = await chromium.launch({ headless: true });

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const randomDelay = () => Math.floor(Math.random() * 3000) + 3000;

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
      if (title.includes('Too Many Requests'))
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
        // console.log(`[Page ${pageNum}] Found ${links.length} links.`);
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
    extraHTTPHeaders: {
      Accept:
        'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
      'Accept-Language': 'en-US,en;q=0.9',
      'Cache-Control': 'max-age=0',
      'Sec-Ch-Ua':
        '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
      'Sec-Ch-Ua-Mobile': '?0',
      'Sec-Ch-Ua-Platform': '"Windows"',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Upgrade-Insecure-Requests': '1',
    },
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
