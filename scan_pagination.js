const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const totalPages = 570;
  const concurrency = 3; // Reduced concurrency
  const outputFile = 'links.json';

  let foundLinks = [];
  if (fs.existsSync(outputFile)) {
    try {
      foundLinks = JSON.parse(fs.readFileSync(outputFile));
      console.log(`Loaded ${foundLinks.length} existing links.`);
    } catch (e) {}
  }

  // Keep track of visited pages if you want to resume (optional, for now we rescan to be safe or we can track 'scanned_pages.json')
  // To ensure we get everything, I will re-scan pages, but skip if we already have IDs from them?
  // Actually, finding duplicates is fine, we dedup at save. The priority is to not miss any.

  const browser = await chromium.launch({ headless: true });

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const randomDelay = () => Math.floor(Math.random() * 3000) + 3000; // 3-6 seconds

  const save = () => {
    // Dedup by URL
    const unique = [];
    const seen = new Set();
    for (const link of foundLinks) {
      if (!seen.has(link.url)) {
        seen.add(link.url);
        unique.push(link);
      }
    }
    fs.writeFileSync(outputFile, JSON.stringify(unique, null, 2));
  };

  console.log(
    `Scanning ${totalPages} pages with concurrency ${concurrency} and anti-bot delays...`
  );

  const processPage = async (pageNum, context, retries = 3) => {
    const page = await context.newPage();
    const url = `https://www.examtopics.com/discussions/amazon/${pageNum}/`;

    try {
      await sleep(randomDelay()); // Polite delay before request

      const response = await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: 60000,
      });
      const status = response.status();

      if (status === 429 || status === 403) {
        throw new Error(`Rate limited (Status: ${status})`);
      }

      // Check for textual blocking indicators
      const title = await page.title();
      const content = await page.content();
      if (
        title.includes('Too Many Requests') ||
        content.includes('Cloudflare') ||
        content.includes('Robot Check')
      ) {
        throw new Error('Blocked by anti-bot detection');
      }

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
        console.log(`[Page ${pageNum}] Found ${links.length} links.`);
        for (const link of links) {
          const match = link.match(/view\/(\d+)-/);
          const id = match ? parseInt(match[1]) : Date.now();
          foundLinks.push({ id, url: link });
        }
      } else {
        // console.log(`[Page ${pageNum}] No links found.`);
      }
    } catch (e) {
      console.error(`Error on page ${pageNum}: ${e.message}`);
      if (retries > 0) {
        console.log(`Cooling down for 30s before retrying page ${pageNum}...`);
        await page.close();
        await sleep(30000); // 30s cooldown
        return processPage(pageNum, context, retries - 1);
      }
    } finally {
      if (!page.isClosed()) await page.close();
    }
  };

  // Process in chunks
  for (let i = 1; i <= totalPages; i += concurrency) {
    const chunk = [];
    for (let j = 0; j < concurrency && i + j <= totalPages; j++) {
      chunk.push(i + j);
    }

    const context = await browser.newContext({
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    });

    console.log(`Processing pages ${chunk[0]} - ${chunk[chunk.length - 1]}...`);

    await Promise.all(chunk.map((pageNum) => processPage(pageNum, context)));
    await context.close();

    save();
  }

  save();
  console.log(`Scan complete. Total matching links: ${foundLinks.length}`);
  await browser.close();
})();
