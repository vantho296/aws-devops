const fs = require('fs');

(async () => {
  // Range based on observation
  const startId = 110000;
  const endId = 160000;
  const concurrency = 10;
  const outputFile = 'links.json';

  let foundLinks = [];
  if (fs.existsSync(outputFile)) {
    foundLinks = JSON.parse(fs.readFileSync(outputFile));
    console.log(`Loaded ${foundLinks.length} existing links.`);
  }

  const save = () => {
    fs.writeFileSync(outputFile, JSON.stringify(foundLinks, null, 2));
  };

  console.log(
    `Scanning range ${startId} to ${endId} with concurrency ${concurrency}...`
  );

  for (let i = startId; i <= endId; i += concurrency) {
    const chunk = [];
    for (let j = 0; j < concurrency && i + j <= endId; j++) {
      chunk.push(i + j);
    }

    await Promise.all(
      chunk.map(async (id) => {
        // Check if already found (optimization if re-running)
        if (foundLinks.some((l) => l.id === id)) return;

        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);

          const url = `https://www.examtopics.com/discussions/amazon/view/${id}-check/`;
          const res = await fetch(url, {
            method: 'HEAD',
            redirect: 'manual',
            headers: {
              'User-Agent':
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            },
            signal: controller.signal,
          });
          clearTimeout(timeoutId);

          if (res.status === 301 || res.status === 302) {
            const location = res.headers.get('location');
            if (location && location.includes('dop-c02')) {
              const fullUrl = 'https://www.examtopics.com' + location;
              console.log(`[FOUND] ${id} -> ${fullUrl}`);
              foundLinks.push({ id, url: fullUrl });
            }
          }
        } catch (e) {
          // Ignore timeouts/errors
        }
      })
    );

    if (i % 1000 === 0) {
      console.log(
        `Progress: Scanned up to ${i}. Found so far: ${foundLinks.length}`
      );
      save();
    }

    // Rate limit delay
    await new Promise((r) => setTimeout(r, 200));
  }

  save();
  console.log(`Scan complete. Total found: ${foundLinks.length}`);
})();
