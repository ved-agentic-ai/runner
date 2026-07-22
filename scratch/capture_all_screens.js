const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const pptxgen = require('pptxgenjs');

(async () => {
  console.log('Starting automated browser screenshot walkthrough...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const screenshotDir = path.join(__dirname, 'screenshots');
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // 1. Legal Disclaimer Modal
  await page.screenshot({ path: path.join(screenshotDir, '01_legal_disclaimer_modal.png') });
  console.log('Captured 01_legal_disclaimer_modal.png');

  // Dismiss Disclaimer
  await page.click('button:has-text("Confirm & Enter Dashboard")');
  await page.waitForTimeout(500);

  // 2. Tab 1: Upload Workspace
  await page.screenshot({ path: path.join(screenshotDir, '02_upload_workspace.png') });
  console.log('Captured 02_upload_workspace.png');

  // 3. Tab 2: Runner & Live Telemetry Workspace
  await page.click('button:has-text("2. Runner & Live Telemetry")');
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(screenshotDir, '03_runner_telemetry_workspace.png') });
  console.log('Captured 03_runner_telemetry_workspace.png');

  // 4. Environment Variables Manager Modal
  await page.click('button:has-text("Environment Variables")');
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(screenshotDir, '04_environment_variables_modal.png') });
  console.log('Captured 04_environment_variables_modal.png');
  await page.click('button:has-text("✕")');
  await page.waitForTimeout(300);

  // 5. Stakeholder PPT Deck Modal
  await page.click('button:has-text("Launch Stakeholder PPT")');
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(screenshotDir, '05_stakeholder_ppt_modal.png') });
  console.log('Captured 05_stakeholder_ppt_modal.png');
  await page.click('button:has-text("✕")');
  await page.waitForTimeout(300);

  // 6. Custom AI Test Generator Modal
  await page.click('button:has-text("+ Custom AI Test Generator")');
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(screenshotDir, '06_custom_ai_test_generator_modal.png') });
  console.log('Captured 06_custom_ai_test_generator_modal.png');
  await page.click('button:has-text("✕")');
  await page.waitForTimeout(300);

  // 7. View All AI Test Rules Modal
  await page.click('button:has-text("View All AI Test Rules")');
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(screenshotDir, '07_view_all_ai_test_rules_modal.png') });
  console.log('Captured 07_view_all_ai_test_rules_modal.png');
  await page.click('button:has-text("✕")');
  await page.waitForTimeout(300);

  // 8. Tab 3: Custom AI Rules Vault
  await page.click('button:has-text("3. Custom AI Rules Vault")');
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(screenshotDir, '08_custom_ai_rules_vault.png') });
  console.log('Captured 08_custom_ai_rules_vault.png');

  // 9. Tab 4: AWS Cloud, AI Deep Dive & Deck Guide
  await page.click('button:has-text("4. AWS Cloud")');
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(screenshotDir, '09_aws_cloud_ai_deepdive.png') });
  console.log('Captured 09_aws_cloud_ai_deepdive.png');

  await browser.close();

  // Create Native PowerPoint Presentation with Screenshots
  console.log('Building Native PowerPoint Presentation deck with UI Screenshots...');
  const pres = new pptxgen();
  pres.layout = 'LAYOUT_16x9';
  pres.title = 'API Collection Runner - Complete Application Walkthrough';
  pres.author = 'Ved Tripathi';

  const slidesData = [
    { title: 'Legal Disclaimer & Creator Statement', img: '01_legal_disclaimer_modal.png', desc: 'Mandatory zero-trust legal statement & portfolio confirmation modal displayed on every page load.' },
    { title: 'Workspace 1: Upload & Collection Presets', img: '02_upload_workspace.png', desc: 'Drag-and-drop Postman collection & environment JSON parser with instant JSONPlaceholder & ReqRes presets.' },
    { title: 'Workspace 2: Execution Telemetry & Runner Dashboard', img: '03_runner_telemetry_workspace.png', desc: 'Hierarchical tree selector with multi-level checkboxes, response SLA latency charts, and live execution progress.' },
    { title: 'Postman-Style Environment Variables Manager', img: '04_environment_variables_modal.png', desc: 'Scrollable environment key-value manager with local secret masking (password, tokens, auth keys).' },
    { title: 'Executable Stakeholder Presentation Deck Modal', img: '05_stakeholder_ppt_modal.png', desc: 'Interactive slide viewer and 1-click native Microsoft PowerPoint (.pptx) file generator.' },
    { title: 'Natural Language Custom AI Test Generator', img: '06_custom_ai_test_generator_modal.png', desc: 'Type natural language testing criteria (e.g. "Check rate limit 429 and latency < 300ms") to generate JSON test rules.' },
    { title: 'Comprehensive AI Test Rules Suite Viewer', img: '07_view_all_ai_test_rules_modal.png', desc: 'Inspect generated assertions across endpoints (HTTP status codes, latency SLAs, headers, and JSON schemas).' },
    { title: 'Workspace 3: Interactive Custom AI Rules Vault', img: '08_custom_ai_rules_vault.png', desc: 'Full CRUD management vault with Global, Folder, or Endpoint scope filters and custom rule badges.' },
    { title: 'Workspace 4: AWS Cloud Architecture & AI Deep Dive', img: '09_aws_cloud_ai_deepdive.png', desc: 'Enterprise AWS Cloud production architecture, CloudFormation IaC spec, and AI/Agentic AI execution loop deep dive.' },
  ];

  slidesData.forEach((s, idx) => {
    const slide = pres.addSlide();
    slide.background = { color: '0B0F19' };

    // Header Title
    slide.addText(`Slide ${idx + 1}: ${s.title}`, {
      x: 0.5,
      y: 0.4,
      w: 12.3,
      h: 0.5,
      fontSize: 18,
      bold: true,
      color: '818CF8',
      fontFace: 'Arial'
    });

    // Screenshot Image
    const imgPath = path.join(screenshotDir, s.img);
    if (fs.existsSync(imgPath)) {
      slide.addImage({
        path: imgPath,
        x: 0.5,
        y: 1.0,
        w: 8.8,
        h: 5.5
      });
    }

    // Right Side Description Box
    slide.addText(s.desc, {
      x: 9.5,
      y: 1.2,
      w: 3.3,
      h: 4.8,
      fontSize: 12,
      color: 'CBD5E1',
      fontFace: 'Arial',
      lineSpacing: 20
    });

    // Footer
    slide.addText('API Collection Runner Walkthrough | Ved Tripathi (vedmtripathi@gmail.com)', {
      x: 0.5,
      y: 6.8,
      w: 12.3,
      h: 0.3,
      fontSize: 9,
      color: '64748B',
      fontFace: 'Arial'
    });
  });

  const pptPath = path.join(__dirname, '..', 'public', 'API_Collection_Runner_Complete_Walkthrough.pptx');
  await pres.writeFile({ fileName: pptPath });
  console.log(`PPT successfully created at: ${pptPath}`);
})();
