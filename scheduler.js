const cron = require('node-cron');
const { execSync } = require('child_process');

console.log('Scheduler started. The task will run daily at 02:00 AM (Asia/Ho_Chi_Minh).');
console.log('Keep this process running to ensure updates happen.');

// Schedule task for 02:00 AM Vietnam Time
cron.schedule('0 2 * * *', () => {
    const now = new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' });
    console.log(`[${now}] Starting daily sync job...`);
    
    try {
        // Step 1: Scan for new links (first 50 pages)
        console.log('>>> Step 1: Scanning for new links...');
        execSync('node scan_latest.js', { stdio: 'inherit' });
        
        // Step 2: Scrape content (updates content for all questions)
        console.log('>>> Step 2: Scraping content...');
        execSync('node scrape_content.js', { stdio: 'inherit' });
        
        // Step 3: Regenerate HTML
        console.log('>>> Step 3: Regenerating HTML...');
        execSync('node markdown_to_html.js', { stdio: 'inherit' });
        
        console.log(`[${new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' })}] Daily sync job completed successfully.`);
    } catch (error) {
        console.error('Job failed:', error.message);
    }
}, {
    scheduled: true,
    timezone: "Asia/Ho_Chi_Minh"
});

