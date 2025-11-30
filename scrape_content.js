const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  if (!fs.existsSync('links.json')) {
    console.error('links.json not found.');
    return;
  }

  const links = JSON.parse(fs.readFileSync('links.json'));
  const outputFile = 'DOP-C02_Questions.md';
  const concurrency = 5;

  console.log(`Starting content scrape for ${links.length} links...`);

  const browser = await chromium.launch({ headless: true });

  let questionsData = [];

  const processLink = async (item, context) => {
    const page = await context.newPage();
    try {
      await page.goto(item.url, {
        waitUntil: 'domcontentloaded',
        timeout: 60000,
      });

      // Extract Question Number
      let qNum = 9999;
      try {
        const text = await page.textContent('body');
        const match = text.match(/Question #:\s*(\d+)/);
        if (match) qNum = parseInt(match[1]);
      } catch (e) {}

      // Extract Discussion Date
      const discussionDate = await page.evaluate(() => {
        const el = document.querySelector('.discussion-meta-data');
        if (!el) return '';
        // The text is like "by User at Nov. 21, 2024, 8:36 a.m."
        // We want to extract the date part.
        return el.innerText.split('at')[1]?.trim() || '';
      });

      // Extract Question Text
      const questionText = await page.evaluate(() => {
        const el = document.querySelector('.question-body .card-text');
        return el ? el.innerText.trim() : '';
      });

      // Extract Options
      const options = await page.evaluate(() => {
        const els = Array.from(
          document.querySelectorAll('.question-choices-container ul li')
        );
        return els.map((el) => el.innerText.trim());
      });

      // Extract Suggested Answer & Votes
      const suggestedAnswer = await page.evaluate(() => {
        const el = document.querySelector('.question-answer .correct-answer');
        return el ? el.innerText.trim() : 'N/A';
      });

      const voteDistribution = await page.evaluate(() => {
        const els = Array.from(
          document.querySelectorAll('.vote-distribution-bar .vote-bar')
        );
        return els.map((el) => el.innerText.trim()).join(', ');
      });

      // Extract Comments
      const comments = await page.evaluate(() => {
        const comms = Array.from(
          document.querySelectorAll('.discussion-container .comment-container')
        );
        return comms.slice(0, 10).map((c) => {
          // Limit to top 10 comments
          const user =
            c.querySelector('.comment-username')?.innerText.trim() ||
            'Anonymous';
          const date = c.querySelector('.comment-date')?.title || '';
          const selectedEl = c.querySelector(
            '.comment-selected-answers .badge'
          );
          const selected = selectedEl
            ? selectedEl.innerText.replace('Selected Answer:', '').trim()
            : '';
          const content =
            c.querySelector('.comment-content')?.innerText.trim() || '';
          const upvotes =
            c.querySelector('.upvote-count')?.innerText.trim() || '0';
          return { user, date, selected, content, upvotes };
        });
      });

      return {
        id: item.id,
        qNum,
        url: item.url,
        discussionDate,
        questionText,
        options,
        suggestedAnswer,
        voteDistribution,
        comments,
      };
    } catch (e) {
      console.error(`Error processing ${item.id}:`, e.message);
      return null;
    } finally {
      await page.close();
    }
  };

  // Process in chunks
  for (let i = 0; i < links.length; i += concurrency) {
    const chunk = links.slice(i, i + concurrency);
    console.log(`Processing chunk ${i / concurrency + 1}...`);

    const context = await browser.newContext({
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    });

    const results = await Promise.all(
      chunk.map((item) => processLink(item, context))
    );
    questionsData.push(...results.filter((r) => r !== null));

    await context.close();
    // polite delay
    await new Promise((r) => setTimeout(r, 2000));
  }

  await browser.close();

  // Sort by Question Number
  questionsData.sort((a, b) => a.qNum - b.qNum);

  // Generate Markdown
  let mdContent = `# AWS Certified DevOps Engineer - Professional DOP-C02\n\n`;
  mdContent += `Total Questions: ${questionsData.length}\n\n---\n\n`;

  questionsData.forEach((q) => {
    mdContent += `## Question ${q.qNum}\n\n`;
    if (q.discussionDate) {
      mdContent += `*Date: ${q.discussionDate}*\n\n`;
    }
    mdContent += `${q.questionText}\n\n`;

    if (q.options.length > 0) {
      mdContent += `**Options:**\n`;
      q.options.forEach((opt) => (mdContent += `- ${opt}\n`));
      mdContent += `\n`;
    }

    mdContent += `> **Suggested Answer:** ${q.suggestedAnswer}\n`;
    if (q.voteDistribution) {
      mdContent += `> **Community Vote:** ${q.voteDistribution}\n`;
    }
    mdContent += `\n`;

    if (q.comments.length > 0) {
      mdContent += `### Discussions\n\n`;
      q.comments.forEach((c) => {
        mdContent += `**${c.user}** (${c.date}) - *Upvotes: ${c.upvotes}*\n`;
        if (c.selected) mdContent += `- Selected Answer: **${c.selected}**\n`;
        mdContent += `${c.content}\n\n`;
        mdContent += `---\n\n`;
      });
    }
    mdContent += `\n<br/>\n\n`; // Spacer
  });

  fs.writeFileSync(outputFile, mdContent);
  console.log(`Markdown generated: ${outputFile}`);
})();
