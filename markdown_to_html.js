const fs = require('fs');
const MarkdownIt = require('markdown-it');

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
});

const inputFile = 'DOP-C02_Questions.md';
const outputFile = 'DOP-C02_Questions.html';

if (!fs.existsSync(inputFile)) {
  console.error(`${inputFile} not found.`);
  process.exit(1);
}

const markdownContent = fs
  .readFileSync(inputFile, 'utf-8')
  .replace(/Disclaimers:[\s\S]*?ExamTopics website is not rel\*/g, '') // Remove disclaimer
  .replace(/\* ExamTopics website is not rel\*/g, '') // Safety catch
  .replace(/> \*\*Community Vote:\*\* (.*)/g, (match, content) => {
    const parts = content.split(',').map((s) => s.trim());
    let sum = 0;
    const kept = [];
    for (const part of parts) {
      const percentMatch = part.match(/(\d+)%/);
      if (percentMatch) {
        const val = parseInt(percentMatch[1], 10);
        if (sum + val > 100) {
          break;
        }
        sum += val;
        kept.push(part);
      } else {
        kept.push(part);
      }
    }
    return `> **Community Vote:** ${kept.join(', ')}`;
  });

const htmlContent = md.render(markdownContent);

const finalHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AWS DOP-C02 Exam Questions</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Roboto+Condensed:ital,wght@0,300..700;1,300..700&display=swap" rel="stylesheet">
    <style>
        :root {
            --primary-color: #2c3e50;
            --accent-color: #3498db;
            --bg-color: #f0f2f5;
            --card-bg: #ffffff;
            --text-color: #333;
            --border-color: #e1e4e8;
            --success-color: #27ae60;
            --warning-color: #e67e22;
        }

        /* Apply font to everything */
        * {
            font-family: 'Roboto Condensed', sans-serif;
        }

        body {
            font-family: 'Roboto Condensed', sans-serif;
            line-height: 1.6;
            color: var(--text-color);
            background-color: var(--bg-color);
            margin: 0;
            padding: 0;
        }

        .container {
            max-width: 1000px;
            margin: 0 auto;
            padding: 20px;
        }

        /* Header styling */
        h1 {
            color: var(--primary-color);
            text-align: center;
            font-weight: 700;
            margin: 30px 0;
            font-size: 2.5rem;
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        /* Question Card Styling */
        .question-block {
            background: var(--card-bg);
            border-radius: 12px;
            padding: 30px;
            margin-bottom: 30px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.05), 0 1px 3px rgba(0,0,0,0.1);
            transition: transform 0.2s, box-shadow 0.2s;
            border: 1px solid transparent;
            /* Optimization for long lists */
            content-visibility: auto; 
            contain-intrinsic-size: 1000px; /* Estimate height to prevent scrollbar jumping */
            scroll-margin-top: 100px; /* Offset for sticky header when scrolling */
        }

        .question-block:hover {
            box-shadow: 0 10px 15px rgba(0,0,0,0.05), 0 4px 6px rgba(0,0,0,0.05);
        }

        h2 {
            color: var(--accent-color);
            font-size: 1.5rem;
            margin-top: 0;
            padding-bottom: 15px;
            border-bottom: 2px solid #f0f2f5;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
        }
        
        h2::before {
            content: '#';
            margin-right: 8px;
            color: #bdc3c7;
            font-weight: 300;
        }

        /* Content Typography */
        p {
            margin-bottom: 16px;
            font-size: 1.1rem;
        }

        /* Options List */
        ul {
            list-style-type: none;
            padding-left: 0;
            margin: 20px 0;
        }

        li {
            background: #f8f9fa;
            margin-bottom: 10px;
            padding: 12px 15px;
            border-radius: 6px;
            border-left: 4px solid #dcdcdc;
            transition: all 0.2s;
        }

        li:hover {
            background: #fff;
            border-left-color: var(--accent-color);
            box-shadow: 0 2px 5px rgba(0,0,0,0.05);
            transform: translateX(2px);
        }

        /* Answer & Votes */
        blockquote {
            background-color: #f1f9f5;
            border-left: 5px solid var(--success-color);
            margin: 25px 0;
            padding: 20px;
            border-radius: 0 8px 8px 0;
            color: #2c3e50;
        }

        blockquote p {
            margin: 5px 0;
        }

        blockquote strong {
            color: var(--success-color);
        }
        
        /* Highlight specific text patterns if needed */
        p strong:first-child { color: var(--warning-color); } /* "Community Vote" label style if generic */

        /* Discussions */
        h3 {
            color: var(--primary-color);
            font-size: 1.3rem;
            margin-top: 30px;
            margin-bottom: 20px;
            border-left: 4px solid var(--primary-color);
            padding-left: 10px;
        }

        hr {
            border: 0;
            height: 1px;
            background: #e1e4e8;
            margin: 30px 0;
        }

        /* Comments Styling */
        .comment-meta {
            font-size: 0.95rem;
            color: #666;
            margin-bottom: 5px;
        }
        
        .comment-user {
            color: var(--primary-color);
            font-weight: 700;
        }
        
        .comment-upvotes {
            color: var(--warning-color);
            font-weight: 600;
        }

        /* Controls Bar */
        .controls-container {
            position: sticky;
            top: 0;
            z-index: 100;
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border-bottom: 1px solid rgba(0,0,0,0.1);
            box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
            padding: 15px 0;
            margin-bottom: 30px;
        }

        .controls {
            max-width: 1000px;
            margin: 0 auto;
            padding: 0 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 15px;
        }

        .control-group {
            display: flex;
            align-items: center;
            gap: 15px;
        }

        .control-label {
            font-weight: 600;
            color: var(--primary-color);
            font-size: 0.9rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        select, input {
            padding: 8px 12px;
            border-radius: 6px;
            border: 1px solid #d1d5db;
            background-color: #fff;
            font-family: inherit;
            font-size: 0.95rem;
            outline: none;
            transition: border-color 0.2s;
        }

        select:focus, input:focus {
            border-color: var(--accent-color);
            box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
        }

        /* Buttons */
        .btn {
            padding: 8px 16px;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-family: inherit;
            font-weight: 600;
            transition: all 0.2s;
            display: inline-flex;
            align-items: center;
            gap: 5px;
        }

        .btn-primary {
            background-color: var(--accent-color);
            color: white;
        }
        .btn-primary:hover {
            background-color: #2980b9;
            transform: translateY(-1px);
        }

        .btn-success {
            background-color: var(--success-color);
            color: white;
        }
        .btn-success:hover {
            background-color: #219150;
            transform: translateY(-1px);
        }
        
        .btn:disabled {
            background-color: #bdc3c7;
            cursor: not-allowed;
            transform: none;
        }

        /* Pagination Buttons */
        .pagination {
            display: flex;
            gap: 5px;
        }
        
        .page-btn {
            min-width: 35px;
            height: 35px;
            padding: 0 5px;
            border: 1px solid #e1e4e8;
            background: white;
            color: var(--text-color);
            border-radius: 6px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s;
        }

        .page-btn:hover:not(:disabled) {
            border-color: var(--accent-color);
            color: var(--accent-color);
        }

        .page-btn.active {
            background-color: var(--accent-color);
            color: white;
            border-color: var(--accent-color);
        }

        .page-btn:disabled {
            background-color: #f8f9fa;
            color: #cbd5e0;
            cursor: not-allowed;
        }

        .multi-select-badge {
            background-color: var(--warning-color);
            color: white;
            font-size: 0.75rem;
            padding: 3px 10px;
            border-radius: 12px;
            margin-left: 10px;
            vertical-align: middle;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .hidden {
            display: none !important;
        }
        
        .toggle-btn {
            background: none;
            border: 1px solid var(--accent-color);
            color: var(--accent-color);
            padding: 8px 16px;
            border-radius: 20px;
            cursor: pointer;
            font-size: 0.9rem;
            font-weight: 600;
            margin-top: 15px;
            margin-right: 10px;
            transition: all 0.2s;
            display: inline-flex;
            align-items: center;
            gap: 5px;
        }
        
        .toggle-btn:hover {
            background: var(--accent-color);
            color: white;
        }
        
        .toggle-btn svg {
            width: 16px;
            height: 16px;
        }

        /* Animation */
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .question-block {
            animation: fadeIn 0.4s ease-out;
        }

        /* Mobile Responsiveness */
        @media (max-width: 768px) {
            .controls {
                flex-direction: column;
                align-items: stretch;
            }
            .control-group {
                justify-content: space-between;
            }
            .pagination {
                justify-content: center;
            }
            h1 {
                font-size: 1.8rem;
            }
        }

        /* Print Styles */
        @media print {
            .controls-container, .btn-print-hide {
                display: none !important;
            }
            body {
                background: white;
                font-size: 12pt;
            }
            .container {
                max-width: 100%;
                width: 100%;
                margin: 0;
                padding: 0;
            }
            .question-block {
                break-inside: avoid;
                page-break-inside: avoid;
                border: 1px solid #eee;
                box-shadow: none;
                margin-bottom: 20px;
                padding: 15px;
                content-visibility: visible !important; /* Ensure everything renders for print */
            }

            /* Force Answer visible and Discussion hidden for PDF */
            .toggle-btn {
                display: none !important;
            }
            .answer-section {
                display: block !important;
            }
            .discussion-section {
                display: none !important;
            }

            h2 {
                color: #000;
                border-bottom: 1px solid #ccc;
            }
            blockquote {
                border-left-color: #000;
                background: #f9f9f9;
            }
            a {
                text-decoration: none;
                color: #000;
            }
        }
    </style>
</head>
<body>

    <div class="controls-container">
        <div class="controls">
            <div class="control-group">
                <div>
                    <span class="control-label">Per page:</span>
                    <select id="pageSize" onchange="changePageSize()">
                        <option value="5">5</option>
                        <option value="10" selected>10</option>
                        <option value="20">20</option>
                        <option value="50">50</option>
                        <option value="100">100</option>
                        <option value="0">All</option>
                    </select>
                </div>
                <div>
                    <span class="control-label">Go to Question:</span>
                    <input type="number" id="jumpInput" min="1" style="width: 70px;" placeholder="Q #">
                    <button onclick="jumpToQuestion()" class="btn btn-primary" style="padding: 8px 12px;">Go</button>
                </div>
            </div>

            <div class="control-group">
                <span id="pageInfo" style="font-weight: 500; color: #666;"></span>
                <button id="exportBtn" onclick="exportPDF()" class="btn btn-success btn-print-hide">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
                        <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/>
                    </svg>
                    Export PDF
                </button>
            </div>

            <div class="pagination" id="paginationTop"></div>
        </div>
    </div>

    <div class="container">
        <h1>AWS Certified DevOps Engineer - Professional DOP-C02</h1>
        
        <!-- Raw content hidden -->
        <div id="raw-content" style="display:none;">
            ${htmlContent}
        </div>

        <div id="content-area">
            <!-- Rendered content -->
        </div>

        <div style="margin-top: 40px; display: flex; justify-content: center;">
             <div class="pagination" id="paginationBottom"></div>
        </div>
    </div>

    <script>
        let allQuestions = [];
        let currentPage = 1;
        let itemsPerPage = 10;
        let renderTask = null; // Store requestAnimationFrame ID

        document.addEventListener('DOMContentLoaded', () => {
            processContent();
            
            document.getElementById('jumpInput').addEventListener('keypress', function (e) {
                if (e.key === 'Enter') jumpToQuestion();
            });

            renderQuestions();
        });

        async function exportPDF() {
            const btn = document.getElementById('exportBtn');
            const originalText = btn.innerHTML;
            const originalSize = document.getElementById('pageSize').value;
            const originalPage = currentPage;

            if (!confirm('This will render ALL questions on one page for printing/saving as PDF. It may take a few seconds. Continue?')) {
                return;
            }

            btn.disabled = true;
            btn.innerText = 'Preparing...';

            // Switch to show ALL
            document.getElementById('pageSize').value = '0';
            // Manually trigger changePageSize logic but wait for render
            itemsPerPage = allQuestions.length;
            currentPage = 1;
            
            // Render all synchronously for print to ensure completeness before print dialog
            const contentArea = document.getElementById('content-area');
            if (renderTask) cancelAnimationFrame(renderTask);
            contentArea.innerHTML = '';
            
            // Use a small timeout to allow UI to update "Preparing..." text
            await new Promise(resolve => setTimeout(resolve, 50));

            // Chunked render for PDF preparation too, to avoid total freeze, but faster
            const chunkSize = 50;
            let index = 0;
            
            function renderPrintChunk() {
                const chunk = allQuestions.slice(index, index + chunkSize);
                const fragment = document.createDocumentFragment();
                chunk.forEach(b => fragment.appendChild(b));
                contentArea.appendChild(fragment);
                index += chunkSize;
                
                if (index < allQuestions.length) {
                   // Continue rendering without yielding too much
                   renderPrintChunk();
                } else {
                   // Done rendering
                   setTimeout(() => {
                       window.print();
                       finishExport();
                   }, 500); // Give browser time to layout images
                }
            }
            
            renderPrintChunk();

            function finishExport() {
                // Restore state
                document.getElementById('pageSize').value = originalSize;
                itemsPerPage = originalSize === '0' ? allQuestions.length : parseInt(originalSize);
                currentPage = originalPage;
                
                // Re-render original view
                renderQuestions();
                
                btn.disabled = false;
                btn.innerHTML = originalText;
            }
        }

        function processContent() {
            const raw = document.getElementById('raw-content');
            // Select H2s but filter to ensure they are actual Questions
            const allH2 = Array.from(raw.querySelectorAll('h2'));
            let headers = allH2.filter(h => h.textContent.includes('Question'));
            
            // Fallback
            if (headers.length === 0) {
                console.warn('No questions found with filter. Falling back to all H2s.');
                headers = allH2;
            }

            console.log('Found H2:', allH2.length, 'Valid Questions:', headers.length);
            
            if (headers.length === 0 && allH2.length > 0) {
                 console.warn('Filter might be too strict. First H2 text:', allH2[0].innerText);
            }

            headers.forEach((h2, index) => {
                const block = document.createElement('div');
                block.className = 'question-block';
                block.appendChild(h2.cloneNode(true));
                
                let sibling = h2.nextSibling;
                const nextHeader = headers[index + 1];
                
                // Containers for toggled sections
                const answerSection = document.createElement('div');
                answerSection.className = 'answer-section hidden';
                
                const discussionSection = document.createElement('div');
                discussionSection.className = 'discussion-section hidden';
                
                let currentSection = block; // Default to main block
                let hasAnswer = false;
                let hasDiscussion = false;

                while (sibling) {
                    if (sibling === nextHeader) break;
                    
                    const clone = sibling.cloneNode(true);
                    const tagName = sibling.tagName ? sibling.tagName.toLowerCase() : '';
                    
                    // Detect start of Answer section (usually blockquote)
                    if (tagName === 'blockquote') {
                        currentSection = answerSection;
                        hasAnswer = true;
                        
                        // Check for Multiple Select
                        const text = clone.textContent || '';
                        // Matches "Suggested Answer: AD" or "Suggested Answer: A, B"
                        // Exclude "N/A"
                        if (/Suggested Answer:\\s*(?!N\\/A\\b)([A-Z]{2,}|[A-Z]\\s*,\\s*[A-Z])/.test(text)) {
                            const h2 = block.querySelector('h2');
                            if (h2 && !h2.querySelector('.multi-select-badge')) {
                                const badge = document.createElement('span');
                                badge.className = 'multi-select-badge';
                                badge.innerText = 'Multiple Select';
                                h2.appendChild(badge);
                            }
                        }
                    }
                    
                    // Detect start of Discussion section (usually h3)
                    if (tagName === 'h3') {
                        currentSection = discussionSection;
                        hasDiscussion = true;
                    }

                    currentSection.appendChild(clone);
                    sibling = sibling.nextSibling;
                }
                
                // Add Answer Toggle Button
                if (hasAnswer) {
                    const btn = document.createElement('button');
                    btn.className = 'toggle-btn';
                    btn.innerHTML = 'Show Suggested Answer';
                    btn.onclick = () => {
                        answerSection.classList.toggle('hidden');
                        btn.innerText = answerSection.classList.contains('hidden') ? 'Show Suggested Answer' : 'Hide Suggested Answer';
                    };
                    block.appendChild(btn);
                    block.appendChild(answerSection);
                }

                // Add Discussion Toggle Button
                if (hasDiscussion) {
                    const btn = document.createElement('button');
                    btn.className = 'toggle-btn';
                    btn.innerHTML = 'Show Discussion';
                    btn.onclick = () => {
                        discussionSection.classList.toggle('hidden');
                        btn.innerText = discussionSection.classList.contains('hidden') ? 'Show Discussion' : 'Hide Discussion';
                    };
                    block.appendChild(btn);
                    block.appendChild(discussionSection);
                }
                
                allQuestions.push(block);
            });
        }

        function changePageSize() {
            const select = document.getElementById('pageSize');
            const val = parseInt(select.value);
            itemsPerPage = val === 0 ? allQuestions.length : val;
            currentPage = 1;
            renderQuestions();
            window.scrollTo(0, 0);
        }

        function jumpToQuestion() {
            const input = document.getElementById('jumpInput');
            const val = parseInt(input.value);
            if (!isNaN(val) && val >= 1 && val <= allQuestions.length) {
                const questionIndex = val - 1;
                
                // Calculate page
                let targetPage = 1;
                if (itemsPerPage > 0) {
                    targetPage = Math.floor(questionIndex / itemsPerPage) + 1;
                }
                
                currentPage = targetPage;
                renderQuestions();
                
                // Wait for render then scroll
                setTimeout(() => {
                    const block = allQuestions[questionIndex];
                    if (block) {
                        block.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        // Highlight momentarily
                        block.style.transition = 'box-shadow 0.3s';
                        block.style.boxShadow = '0 0 0 4px var(--accent-color)';
                        setTimeout(() => {
                            block.style.boxShadow = '';
                        }, 2000);
                    }
                }, 100);
            } else {
                alert('Please enter a valid question number (1-' + allQuestions.length + ')');
            }
        }

        function goToPage(page) {
            const total = getTotalPages();
            if (page < 1) page = 1;
            if (page > total) page = total;
            
            currentPage = page;
            renderQuestions();
            window.scrollTo(0, 0);
            
            // Clear question jump input
            document.getElementById('jumpInput').value = '';
        }

        function getTotalPages() {
            if (itemsPerPage === 0 || allQuestions.length === 0) return 1;
            return Math.ceil(allQuestions.length / itemsPerPage);
        }

        function renderQuestions() {
            if (renderTask) cancelAnimationFrame(renderTask);

            const contentArea = document.getElementById('content-area');
            contentArea.innerHTML = '';
            
            if (allQuestions.length === 0) {
                contentArea.innerHTML = '<div class="question-block" style="text-align:center">No questions found.</div>';
                updatePaginationControls();
                return;
            }

            const start = (currentPage - 1) * itemsPerPage;
            let end = start + itemsPerPage;
            if (itemsPerPage === 0) end = allQuestions.length;
            
            const pageItems = allQuestions.slice(start, end);

            // If few items, render instantly
            if (pageItems.length <= 50) {
                pageItems.forEach(block => {
                    contentArea.appendChild(block);
                });
                updatePaginationControls();
                return;
            }

            // Large list? Chunk it.
            let index = 0;
            const chunkSize = 20; // Render 20 at a time to keep UI responsive

            function renderChunk() {
                const chunk = pageItems.slice(index, index + chunkSize);
                const fragment = document.createDocumentFragment();
                chunk.forEach(b => fragment.appendChild(b));
                contentArea.appendChild(fragment);

                index += chunkSize;
                if (index < pageItems.length) {
                    renderTask = requestAnimationFrame(renderChunk);
                }
            }
            
            renderChunk();
            updatePaginationControls();
        }

        function updatePaginationControls() {
            const totalPages = getTotalPages();
            const info = document.getElementById('pageInfo');
            const start = (currentPage - 1) * itemsPerPage + 1;
            let end = currentPage * itemsPerPage;
            if (itemsPerPage === 0 || end > allQuestions.length) end = allQuestions.length;
            
            if (allQuestions.length > 0) {
                info.innerText = \`Showing \${start}-\${end} of \${allQuestions.length}\`;
            } else {
                info.innerText = '';
            }

            const createBtns = () => {
                let html = '';
                // Prev
                html += \`<button class="page-btn" onclick="goToPage(\${currentPage - 1})" \${currentPage === 1 ? 'disabled' : ''}>&lsaquo;</button>\`;

                let startPage = Math.max(1, currentPage - 2);
                let endPage = Math.min(totalPages, currentPage + 2);

                if (startPage > 1) {
                    html += \`<button class="page-btn" onclick="goToPage(1)">1</button>\`;
                    if (startPage > 2) html += '<span style="padding: 5px;">...</span>';
                }

                for (let i = startPage; i <= endPage; i++) {
                    html += \`<button class="page-btn \${i === currentPage ? 'active' : ''}" onclick="goToPage(\${i})">\${i}</button>\`;
                }

                if (endPage < totalPages) {
                    if (endPage < totalPages - 1) html += '<span style="padding: 5px;">...</span>';
                    html += \`<button class="page-btn" onclick="goToPage(\${totalPages})">\${totalPages}</button>\`;
                }

                // Next
                html += \`<button class="page-btn" onclick="goToPage(\${currentPage + 1})" \${currentPage === totalPages ? 'disabled' : ''}>&rsaquo;</button>\`;
                return html;
            };

            const html = createBtns();
            document.getElementById('paginationTop').innerHTML = html;
            document.getElementById('paginationBottom').innerHTML = html;
        }
    </script>
</body>
</html>
`;

fs.writeFileSync(outputFile, finalHtml);
console.log(`HTML generated: ${outputFile}`);
