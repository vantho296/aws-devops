const fs = require('fs');
const path = require('path');

const outputDir = 'screenshots';
const outputFile = 'index.html';

if (!fs.existsSync(outputDir)) {
  console.error('No screenshots folder found.');
  return;
}

// Get all png files
const files = fs.readdirSync(outputDir).filter((f) => f.endsWith('.png'));

// Sort naturally (Question_1, Question_2, Question_10...)
files.sort((a, b) => {
  const numA = parseInt(a.match(/\d+/)?.[0] || 0);
  const numB = parseInt(b.match(/\d+/)?.[0] || 0);
  return numA - numB;
});

let html = `
<!DOCTYPE html>
<html>
<head>
    <title>AWS DOP-C02 Exam Questions</title>
    <style>
        body { font-family: sans-serif; background: #f0f0f0; margin: 0; padding: 20px; }
        .container { max-width: 1000px; margin: 0 auto; }
        .card { background: white; margin-bottom: 30px; padding: 20px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
        .card h2 { margin-top: 0; font-size: 18px; color: #333; }
        .card img { max-width: 100%; height: auto; border: 1px solid #ddd; margin-top: 10px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>AWS Certified DevOps Engineer - Professional DOP-C02</h1>
        <p>Total Questions Captured: ${files.length}</p>
`;

files.forEach((file) => {
  const questionName = file.replace('.png', '').replace(/_/g, ' ');
  html += `
        <div class="card">
            <h2>${questionName}</h2>
            <img src="${outputDir}/${file}" loading="lazy" alt="${questionName}">
        </div>
    `;
});

html += `
    </div>
</body>
</html>
`;

fs.writeFileSync(outputFile, html);
console.log(`Report generated: ${outputFile}`);
