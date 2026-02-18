import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';

const ROOT = join(import.meta.dirname, '..');

// ─── Fix lesson files (d01–d15) ────────────────────────────────────
// Pattern: After the first <div class="goal">...</div> there is a duplicate
// <!DOCTYPE html>...full document injected. We need to:
// 1. Remove the duplicate document block from inside <article class="day-body">
// 2. Remove the dangling fragment at the end of the file after </html>

for (let i = 1; i <= 15; i++) {
  const id = `d${String(i).padStart(2, '0')}`;
  const filePath = join(ROOT, `lesson-${id}.html`);
  let html = readFileSync(filePath, 'utf8');

  // Strategy: Find the injected duplicate. It starts with "<!DOCTYPE html>" 
  // appearing AFTER the first one (which is at position 0).
  // The first <!DOCTYPE html> is at position 0.
  // The second one is the injected duplicate inside lessonBody.
  
  const firstDoctype = html.indexOf('<!DOCTYPE html>');
  const secondDoctype = html.indexOf('<!DOCTYPE html>', firstDoctype + 1);
  
  if (secondDoctype === -1) {
    console.log(`${id}: No duplicate found, skipping`);
    continue;
  }

  // The duplicate runs from the second <!DOCTYPE to just before the clean content resumes.
  // Looking at the pattern: the duplicate ends with a </div> that matches the goal wrapper,
  // then clean content follows with a newline.
  // The duplicate contains: <!DOCTYPE html>...<article class="day-body"><div class="goal">...</div>
  // After that, the REAL content continues.
  
  // Find where the duplicate block ends. It's everything from secondDoctype up to (but not including)
  // the next line that starts real content. The duplicate always ends with the goal text </div>
  // followed by a newline, then the real content continues.
  
  // The duplicate is a minified single line starting with <!DOCTYPE html> and ending with </div>
  // followed by a newline
  const afterSecondDoctype = html.indexOf('\n', secondDoctype);
  
  // Remove the duplicate line (from secondDoctype to end of that line)
  const duplicateLine = html.substring(secondDoctype, afterSecondDoctype + 1);
  html = html.substring(0, secondDoctype) + html.substring(afterSecondDoctype + 1);

  // Now fix the dangling fragment at the end.
  // After the clean </body></html>, there's junk.
  // Find the LAST proper </body>\n</html> and remove everything after.
  const lastHtmlClose = html.lastIndexOf('</html>');
  
  // Find the first </html> (which closes the clean document)
  const firstHtmlClose = html.indexOf('</html>');
  
  if (firstHtmlClose !== lastHtmlClose) {
    // There are multiple </html> — keep only up to the first one
    html = html.substring(0, firstHtmlClose + '</html>'.length).trimEnd() + '\n';
  } else {
    // Just one — check for junk after it
    const afterClose = html.substring(firstHtmlClose + '</html>'.length).trim();
    if (afterClose.length > 0) {
      html = html.substring(0, firstHtmlClose + '</html>'.length).trimEnd() + '\n';
    }
  }

  writeFileSync(filePath, html, 'utf8');
  console.log(`Fixed: lesson-${id}.html`);
}

// ─── Fix index.html ────────────────────────────────────────────────
// index.html has THREE full duplicate documents concatenated together,
// plus extra junk at the end. We only want the third version (the "platform-page" one).
{
  let html = readFileSync(join(ROOT, 'index.html'), 'utf8');
  
  // The file has 3 separate full HTML documents:
  // 1. First (line 1): old version with topbar
  // 2. Second (line 2): another old version  
  // 3. Third (lines 3+): the clean platform-page version
  // After the third one, there's junk CSS and duplicates.
  
  // Find the THIRD <!DOCTYPE html> — that's the clean one we want
  let pos = -1;
  let count = 0;
  while (count < 3) {
    pos = html.indexOf('<!DOCTYPE html>', pos + 1);
    if (pos === -1) break;
    count++;
  }
  
  if (pos !== -1 && count === 3) {
    html = html.substring(pos);
    
    // Now find the first proper </body></html> close and trim
    const bodyClose = html.indexOf('</body>');
    // Actually, the clean version ends with </script> before junk starts
    // Let's find </head>\n<body after the scripts (which is a duplicate start)
    
    // Find first occurrence of </html> then check if there's a second <body after it
    const firstScriptEnd = html.indexOf('</script>\n</head>');
    if (firstScriptEnd !== -1) {
      // Everything from </script>\n</head> onwards is junk
      html = html.substring(0, firstScriptEnd) + '</script>\n</body>\n</html>\n';
    } else {
      // Just find first </html>
      const firstClose = html.indexOf('</html>');
      if (firstClose !== -1) {
        html = html.substring(0, firstClose + '</html>'.length) + '\n';
      }
    }
  }
  
  // Actually let me take a more targeted approach — reconstruct the clean version
  // The clean index.html should be the platform-page version
  const cleanIndex = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>SONIC SQL Training Platform</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="styles.css" />
</head>
<body class="platform-page">
  <div class="ambient"><div class="ambient-orb orb-1"></div><div class="ambient-orb orb-2"></div><div class="ambient-orb orb-3"></div></div>
  <main class="main">
    <div class="content platform-shell">
      <header class="platform-hero">
        <div>
          <p class="hero-kicker">SONICMansourDataNew &middot; Operational SQL Enablement</p>
          <h1>Production SQL training built for <em>real SONIC reporting work</em></h1>
          <p class="hero-lead">A complete operator curriculum with guided lessons, progress tracking, bookmarks, and practical report-building outcomes.</p>
        </div>
        <div class="hero-actions">
          <a class="nav-btn primary" href="lesson-d01.html">Start Program</a>
          <a class="nav-btn" href="lesson-d15.html">Go to Final Assessment</a>
        </div>
      </header>

      <section class="kpi-grid" id="kpiGrid">
        <article class="kpi-card"><span>Lessons</span><strong id="kpiLessons">15</strong></article>
        <article class="kpi-card"><span>Completed</span><strong id="kpiDone">0</strong></article>
        <article class="kpi-card"><span>Bookmarks</span><strong id="kpiBookmarks">0</strong></article>
        <article class="kpi-card"><span>Program Progress</span><strong id="kpiProgress">0%</strong></article>
      </section>

      <section class="control-bar">
        <label class="search-wrap wide">
          <span>&#x2315;</span>
          <input id="searchInput" type="search" placeholder="Search by topic, concept, or day (example: joins, territory, debugging)" />
        </label>
        <select id="phaseFilter" class="phase-filter">
          <option value="all">All phases</option>
          <option value="1">Phase 1 &middot; JOIN Foundations</option>
          <option value="2">Phase 2 &middot; Schema Mastery</option>
          <option value="3">Phase 3 &middot; Reporting Execution</option>
          <option value="4">Phase 4 &middot; Mastery &amp; Assessment</option>
        </select>
        <select id="sortFilter" class="phase-filter">
          <option value="day">Sort by day</option>
          <option value="duration">Sort by duration</option>
          <option value="title">Sort by title</option>
        </select>
        <button class="cta-btn" id="resetFilters">Reset</button>
      </section>

      <section class="phase-summary-grid">
        <article class="phase-summary"><h3>Phase 1</h3><h4>JOIN Foundations</h4><p>Build strong relational thinking and join accuracy.</p></article>
        <article class="phase-summary"><h3>Phase 2</h3><h4>Schema Mastery</h4><p>Understand SONIC entities, paths, and constraints.</p></article>
        <article class="phase-summary"><h3>Phase 3</h3><h4>Reporting Execution</h4><p>Ship production-grade reports and debug issues fast.</p></article>
        <article class="phase-summary"><h3>Phase 4</h3><h4>Mastery &amp; Assessment</h4><p>Aggregate, parameterize, and validate independently.</p></article>
      </section>

      <section>
        <div class="sec-label">Lesson Library</div>
        <div class="lesson-library" id="lessonLibrary"></div>
      </section>

      <footer class="site-footer">SONIC SQL Training Platform &middot; Built for operational analytics teams</footer>
    </div>
  </main>
  <script src="data.js"></script>
  <script src="scripts.js"></script>
</body>
</html>
`;
  
  writeFileSync(join(ROOT, 'index.html'), cleanIndex, 'utf8');
  console.log('Fixed: index.html');
}

console.log('All HTML files fixed successfully!');
