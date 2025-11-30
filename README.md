# ExamTopics DOP-C02 Crawler Tool

This tool finds and captures screenshots of the AWS Certified DevOps Engineer - Professional (DOP-C02) exam questions from ExamTopics.

## Prerequisites

- Node.js installed (v16 or higher)

## Installation

1. Open a terminal in this folder.
2. Install dependencies:
   ```bash
   npm install
   npx playwright install chromium
   ```

## Usage

### Step 1: Scan for Links
Run the scanner to find the valid discussion IDs by checking for redirects. This scans IDs from 100,000 to 160,000.
*Note: This process may take 15-30 minutes depending on your network speed.*

```bash
node scan.js
```

This will create `links.json` containing the found URLs.

### Step 2: Capture Screenshots
Once `links.json` is generated, run the capture script to take screenshots of every found page.

```bash
node capture.js
```

Screenshots will be saved in the `screenshots/` folder.

### Step 3: Generate Report
Create an HTML summary of all questions.

```bash
node report.js
```

Open `index.html` to view the questions.

## Troubleshooting
- If `scan.js` misses questions, you can adjust the `startId` and `endId` range in the script.
- If `capture.js` fails on some pages, simply re-run it; it will skip already captured images.

