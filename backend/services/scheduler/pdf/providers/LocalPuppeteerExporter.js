import puppeteer from 'puppeteer';
import { marked } from 'marked';
import PdfExporter from './PdfExporter.js';

export default class LocalPuppeteerExporter extends PdfExporter {
  /**
   * Generates a PDF buffer from fully populated course data
   * @param {Object} course 
   * @returns {Promise<Buffer>}
   */
  async generatePdf(course) {
    const htmlContent = this.compileHtml(course);

    // Launch headless browser with sandbox options for Linux/Docker compatibility
    const browser = await puppeteer.launch({
      headless: 'shell',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-gpu',
        '--disable-dev-shm-usage',
        '--disable-software-rasterizer'
      ]
    });

    try {
      const page = await browser.newPage();
      
      // Set the generated HTML content and wait for network/styles to settle
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

      // Print PDF
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        displayHeaderFooter: true,
        headerTemplate: '<div></div>', // Empty top header
        footerTemplate: `
          <div style="font-family: 'Inter', sans-serif; font-size: 8px; width: 100%; text-align: center; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 5px; color: #888; display: flex; justify-content: space-between; padding-left: 40px; padding-right: 40px;">
            <span>GenCourse AI Academy</span>
            <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
          </div>
        `,
        margin: {
          top: '60px',
          bottom: '80px',
          left: '0px',
          right: '0px'
        }
      });

      return pdfBuffer;
    } finally {
      await browser.close();
    }
  }

  /**
   * Compiles course data, Markdown content, and quizzes into a premium CSS-styled HTML template.
   * @param {Object} course 
   * @returns {String}
   */
  compileHtml(course) {
    const title = course.title || 'AI Generated Course';
    const description = course.description || '';
    
    // 1. Build course modules and lessons HTML
    let modulesHtml = '';
    const modules = course.modules || [];
    
    modules.forEach((mod, modIdx) => {
      // Strip "Module X:" prefix if it exists to prevent duplication with MODULE X header
      const displayTitle = mod.title.replace(/^module\s+\d+:\s*/i, '');
      modulesHtml += `
        <div class="module-section">
          <div class="module-header">
            <span class="module-number">MODULE ${modIdx + 1}</span>
            <h2 class="module-title">${displayTitle}</h2>
          </div>
      `;

      const lessons = mod.lessons || [];
      lessons.forEach((lesson) => {
        let mdText = '';
        if (lesson.content instanceof Map) {
          mdText = lesson.content.get('en') || Array.from(lesson.content.values())[0] || '';
        } else if (lesson.content && typeof lesson.content === 'object') {
          mdText = lesson.content.en || Object.values(lesson.content)[0] || '';
        }

        // Render Markdown content to HTML
        const lessonHtml = marked.parse(mdText);
        
        let objectivesHtml = '';
        if (lesson.objectives && lesson.objectives.length > 0) {
          objectivesHtml = `
            <div class="objectives-box">
              <h3>Lesson Objectives</h3>
              <ul>
                ${lesson.objectives.map(obj => `<li>${obj}</li>`).join('')}
              </ul>
            </div>
          `;
        }

        modulesHtml += `
          <div class="lesson-section">
            <h3 class="lesson-title">${lesson.title}</h3>
            ${objectivesHtml}
            <div class="lesson-body-content">
              ${lessonHtml}
            </div>
          </div>
        `;
      });

      modulesHtml += `</div>`; // Close module-section
    });

    // 2. Build Table of Contents HTML
    let tocHtml = '';
    modules.forEach((mod, modIdx) => {
      // If the module title already starts with "Module", use it directly. Otherwise, prepend "Module X: "
      const tocModuleTitle = /^module/i.test(mod.title)
        ? mod.title
        : `Module ${modIdx + 1}: ${mod.title}`;

      tocHtml += `
        <div class="toc-module">
          <span class="toc-module-title">${tocModuleTitle}</span>
          <ul class="toc-lessons">
            ${(mod.lessons || []).map(lesson => `<li>${lesson.title}</li>`).join('')}
          </ul>
        </div>
      `;
    });

    // Add Quizzes to Table of Contents if they exist
    const quizzes = course.quizzes || [];
    if (quizzes.length > 0) {
      tocHtml += `
        <div class="toc-module">
          <span class="toc-module-title">Course Assessment</span>
          <ul class="toc-lessons">
            <li>Practice Quiz (${quizzes.length} question${quizzes.length === 1 ? '' : 's'})</li>
          </ul>
        </div>
      `;
    }

    // Premium styling imitating our workspace's dark and glow aesthetic
    const styles = `
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Outfit:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');
      
      * {
        box-sizing: border-box;
      }
      
      body {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        background-color: #030014;
        color: #e2e8f0;
        margin: 0;
        padding: 0;
        line-height: 1.6;
        font-size: 14px;
      }

      /* Cover Page */
      .cover-page {
        height: 100vh;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        text-align: center;
        padding: 40px;
        page-break-after: always;
        position: relative;
        overflow: hidden;
      }
      
      .cover-background {
        position: absolute;
        top: -10%;
        left: -10%;
        width: 120%;
        height: 120%;
        background: radial-gradient(circle at center, rgba(124,58,237,0.1) 0%, transparent 60%);
        z-index: 1;
      }

      .cover-card {
        z-index: 2;
        border: 1px solid rgba(255, 255, 255, 0.08);
        background: rgba(255, 255, 255, 0.02);
        padding: 60px 40px;
        border-radius: 24px;
        max-width: 600px;
        box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
      }

      .cover-logo {
        font-family: 'Outfit', sans-serif;
        font-weight: 800;
        font-size: 24px;
        margin-bottom: 40px;
        letter-spacing: -0.02em;
      }
      
      .cover-logo-main {
        color: #fff;
      }
      
      .cover-logo-accent {
        color: #7c3aed;
      }

      .cover-title {
        font-family: 'Outfit', sans-serif;
        font-size: 40px;
        font-weight: 800;
        line-height: 1.15;
        color: #fff;
        margin: 0 0 20px 0;
        letter-spacing: -0.03em;
        background: linear-gradient(135deg, #fff 0%, #a78bfa 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }

      .cover-description {
        font-size: 15px;
        color: #94a3b8;
        margin-bottom: 40px;
        font-weight: 300;
      }

      .cover-meta {
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        color: #64748b;
        border-top: 1px solid rgba(255, 255, 255, 0.05);
        padding-top: 20px;
      }

      .cover-meta span {
        color: #c084fc;
        font-weight: 600;
      }

      /* Table of Contents */
      .toc-page {
        padding: 60px 40px;
        page-break-after: always;
      }

      .toc-title {
        font-family: 'Outfit', sans-serif;
        font-size: 28px;
        font-weight: 700;
        color: #fff;
        margin-bottom: 40px;
        border-bottom: 2px solid rgba(124, 58, 237, 0.2);
        padding-bottom: 10px;
      }

      .toc-module {
        margin-bottom: 30px;
      }

      .toc-module-title {
        font-family: 'Outfit', sans-serif;
        font-size: 16px;
        font-weight: 700;
        color: #a78bfa;
        display: block;
        margin-bottom: 10px;
      }

      .toc-lessons {
        list-style: none;
        padding-left: 15px;
        margin: 0;
        border-left: 1px solid rgba(255, 255, 255, 0.05);
      }

      .toc-lessons li {
        font-size: 13px;
        color: #94a3b8;
        margin-bottom: 10px;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .toc-lessons li::before {
        content: "•";
        color: #7c3aed;
        font-weight: bold;
        font-size: 16px;
      }

      /* Modules & Lessons */
      .module-section {
        page-break-before: always;
        padding: 0 40px;
      }

      .module-header {
        border-bottom: 2px solid rgba(124, 58, 237, 0.25);
        padding-bottom: 20px;
        margin-bottom: 45px;
        margin-top: 20px;
        page-break-after: avoid;
      }

      .module-number {
        font-family: 'Outfit', sans-serif;
        font-weight: 700;
        font-size: 12px;
        letter-spacing: 0.15em;
        color: #c084fc;
        display: block;
        margin-bottom: 5px;
      }

      .module-title {
        font-family: 'Outfit', sans-serif;
        font-size: 32px;
        font-weight: 800;
        color: #fff;
        margin: 0;
        letter-spacing: -0.02em;
      }

      .lesson-section {
        margin-bottom: 60px;
      }

      .lesson-title {
        font-family: 'Outfit', sans-serif;
        font-size: 22px;
        font-weight: 700;
        color: #fff;
        margin-top: 0;
        margin-bottom: 20px;
        border-left: 4px solid #7c3aed;
        padding-left: 12px;
        page-break-after: avoid;
      }

      .objectives-box {
        background: rgba(124, 58, 237, 0.03);
        border: 1px solid rgba(124, 58, 237, 0.15);
        border-radius: 14px;
        padding: 22px;
        margin-bottom: 35px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
      }

      .objectives-box h3 {
        margin-top: 0;
        margin-bottom: 10px;
        font-size: 13px;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: #a78bfa;
      }

      .objectives-box ul {
        margin: 0;
        padding-left: 20px;
        font-size: 13px;
        color: #cbd5e1;
      }

      .objectives-box li {
        margin-bottom: 6px;
      }

      .lesson-body-content {
        color: #cbd5e1;
        font-size: 14px;
        text-align: justify;
      }

      .lesson-body-content p {
        margin-top: 0;
        margin-bottom: 1.5em;
      }

      /* Markdown parsing custom typography */
      .lesson-body-content h1, 
      .lesson-body-content h2, 
      .lesson-body-content h3 {
        font-family: 'Outfit', sans-serif;
        color: #fff;
        font-weight: 700;
        margin-top: 1.8em;
        margin-bottom: 0.8em;
        page-break-inside: avoid;
        page-break-after: avoid;
      }

      .lesson-body-content h1 { font-size: 20px; }
      .lesson-body-content h2 { font-size: 17px; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 5px; }
      .lesson-body-content h3 { font-size: 15px; }

      .lesson-body-content ul, 
      .lesson-body-content ol {
        margin-top: 0;
        margin-bottom: 1.5em;
        padding-left: 20px;
      }

      .lesson-body-content li {
        margin-bottom: 8px;
      }

      .lesson-body-content strong {
        color: #fff;
        font-weight: 600;
      }

      .lesson-body-content blockquote {
        border-left: 4px solid #06b6d4;
        background: rgba(6, 182, 212, 0.03);
        margin: 0 0 20px 0;
        padding: 18px 24px;
        border-radius: 0 12px 12px 0;
        font-style: italic;
        color: #cbd5e1;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
      }

      /* Monospace code styling */
      pre {
        background: #010103 !important;
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 12px;
        padding: 18px;
        overflow-x: auto;
        margin: 0 0 20px 0;
        font-family: 'JetBrains Mono', monospace;
        font-size: 12px;
        color: #67e8f9;
        page-break-inside: avoid;
        box-shadow: inset 0 1px 5px rgba(0, 0, 0, 0.5);
      }

      code {
        font-family: 'JetBrains Mono', monospace;
        font-size: 12px;
        background: rgba(255, 255, 255, 0.05);
        color: #f472b6;
        padding: 2px 6px;
        border-radius: 4px;
        border: 1px solid rgba(255,255,255,0.03);
      }
      
      pre code {
        background: transparent !important;
        color: inherit !important;
        padding: 0 !important;
        border-radius: 0 !important;
        border: none !important;
      }

      /* Quizzes Section */
      .quizzes-section {
        page-break-before: always;
        padding: 0 40px;
      }

      .quiz-card {
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid rgba(255, 255, 255, 0.06);
        border-radius: 16px;
        padding: 25px;
        margin-bottom: 30px;
        page-break-inside: avoid;
      }

      .quiz-question {
        font-family: 'Outfit', sans-serif;
        font-size: 16px;
        font-weight: 600;
        color: #fff;
        margin-top: 0;
        margin-bottom: 20px;
      }

      .quiz-question-number {
        color: #c084fc;
      }

      .quiz-options {
        list-style: none;
        padding: 0;
        margin: 0 0 20px 0;
      }

      .quiz-option {
        font-size: 13px;
        color: #cbd5e1;
        padding: 10px 15px;
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.01);
        border: 1px solid rgba(255, 255, 255, 0.03);
        margin-bottom: 8px;
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .correct-option {
        background: rgba(16, 185, 129, 0.04);
        border-color: rgba(16, 185, 129, 0.2);
        color: #34d399;
      }

      .option-letter {
        font-weight: 700;
        color: #a78bfa;
      }

      .correct-option .option-letter {
        color: #34d399;
      }

      .correct-badge {
        font-size: 10px;
        font-weight: 700;
        text-transform: uppercase;
        background: rgba(16, 185, 129, 0.15);
        color: #34d399;
        padding: 2px 6px;
        border-radius: 4px;
        margin-left: auto;
      }

      .quiz-explanation {
        background: rgba(124, 58, 237, 0.04);
        border-left: 3px solid #7c3aed;
        border-radius: 0 8px 8px 0;
        padding: 12px 15px;
        font-size: 12px;
        color: #cbd5e1;
        line-height: 1.5;
      }
    `;

    // 3. Build Quizzes HTML
    let quizzesHtml = '';
    if (quizzes.length > 0) {
      quizzesHtml += `
        <div class="quizzes-section">
          <div class="module-header">
            <span class="module-number">ASSESSMENT</span>
            <h2 class="module-title">Practice Quiz</h2>
          </div>
      `;

      quizzes.forEach((quiz, quizIdx) => {
        quizzesHtml += `
          <div class="quiz-card">
            <h3 class="quiz-question"><span class="quiz-question-number">Question ${quizIdx + 1}:</span> ${quiz.question}</h3>
            <ul class="quiz-options">
              ${quiz.options.map((opt, optIdx) => `
                <li class="quiz-option ${optIdx === quiz.correctIndex ? 'correct-option' : ''}">
                  <span class="option-letter">${String.fromCharCode(65 + optIdx)}.</span> ${opt}
                  ${optIdx === quiz.correctIndex ? ' <span class="correct-badge">(Correct Answer)</span>' : ''}
                </li>
              `).join('')}
            </ul>
            ${quiz.explanation ? `
              <div class="quiz-explanation">
                <strong>Explanation:</strong> ${quiz.explanation}
              </div>
            ` : ''}
          </div>
        `;
      });

      quizzesHtml += `</div>`; // Close quizzes-section
    }

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>${title}</title>
        <style>${styles}</style>
      </head>
      <body>
        <!-- Cover Page -->
        <div class="cover-page">
          <div class="cover-background"></div>
          <div class="cover-card">
            <div class="cover-logo">
              <span class="cover-logo-main">GenCourse</span><span class="cover-logo-accent">AI</span>
            </div>
            <h1 class="cover-title">${title}</h1>
            <p class="cover-description">${description}</p>
            <div class="cover-meta">
              Curriculum compiled dynamically by <span>GenCourse AI</span> Engine
            </div>
          </div>
        </div>

        <!-- Table of Contents -->
        <div class="toc-page">
          <h2 class="toc-title">Table of Contents</h2>
          ${tocHtml}
        </div>

        <!-- Course Curriculum -->
        ${modulesHtml}

        <!-- Course Quizzes / Assessments -->
        ${quizzesHtml}
      </body>
      </html>
    `;
  }
}
