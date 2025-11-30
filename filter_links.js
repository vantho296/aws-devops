const fs = require('fs');

const inputFile = 'links.json';
const outputFile = 'links.json';

if (fs.existsSync(inputFile)) {
    const links = JSON.parse(fs.readFileSync(inputFile));
    console.log(`Total links before filtering: ${links.length}`);
    
    const filteredLinks = links.filter(link => 
        link.url.includes('exam-aws-certified-devops-engineer-professional-dop-c02')
    );
    
    console.log(`Total links after filtering: ${filteredLinks.length}`);
    
    fs.writeFileSync(outputFile, JSON.stringify(filteredLinks, null, 2));
} else {
    console.log('links.json not found.');
}

