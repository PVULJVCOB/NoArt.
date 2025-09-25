(async () => {
  const { chromium, devices } = require('playwright');
  const iPhone = devices['iPhone 12'];
  const browser = await chromium.launch();
  const context = await browser.newContext({ ...iPhone });
  const page = await context.newPage();
  const url = 'https://pvuljvcob.github.io/NoArt./';
  console.log('navigating to', url);
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  const locOrder = await page.evaluate(() => {
    const header = document.querySelector('.location-section .section-header');
    if (!header) return { error: 'no header' };
    const content = document.querySelector('.location-section .location-content');
    if (!content) return { error: 'no location-content' };
    const first = content.children[0];
    const second = content.children[1];
    return {
      firstClass: first ? first.className : null,
      secondClass: second ? second.className : null,
      mapIndex: Array.from(content.children).findIndex(c => c.classList && c.classList.contains('location-map')),
      infoIndex: Array.from(content.children).findIndex(c => c.classList && c.classList.contains('location-info'))
    };
  });
  console.log('location order check:', locOrder);

  // compute visual positions for map and info (boundingClientRect)
  const locVisual = await page.evaluate(() => {
    const map = document.querySelector('.location-section .location-map');
    const info = document.querySelector('.location-section .location-info');
    if (!map || !info) return { error: 'missing map or info' };
    const m = map.getBoundingClientRect();
    const i = info.getBoundingClientRect();
    return {
      mapTop: Math.round(m.top),
      infoTop: Math.round(i.top),
      mapAboveInfo: m.top < i.top
    };
  });
  console.log('location visual positions:', locVisual);

  // Extra diagnostics: computed styles and offsets to find what's shifting layout
  const locDiagnostics = await page.evaluate(() => {
    const map = document.querySelector('.location-section .location-map');
    const info = document.querySelector('.location-section .location-info');
    const getDiag = (el) => {
      if (!el) return null;
      const cs = getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      return {
        tag: el.tagName.toLowerCase(),
        className: el.className,
        position: cs.position,
        transform: cs.transform,
        marginTop: cs.marginTop,
        marginBottom: cs.marginBottom,
        top: cs.top,
        bottom: cs.bottom,
        offsetTop: el.offsetTop,
        offsetParent: (el.offsetParent && el.offsetParent.tagName) || null,
        rectTop: Math.round(rect.top),
        rectHeight: Math.round(rect.height)
      };
    };
    const parent = document.querySelector('.location-section .location-content');
    const parentCS = parent ? getComputedStyle(parent) : null;
    return {
      parentDisplay: parentCS ? parentCS.display : null,
      parentPosition: parentCS ? parentCS.position : null,
      map: getDiag(map),
      info: getDiag(info),
      siblings: parent ? Array.from(parent.children).map(c => ({class: c.className, tag: c.tagName.toLowerCase()})) : null
    };
  });
  console.log('location diagnostics:', JSON.stringify(locDiagnostics, null, 2));

  const aboutOrder = await page.evaluate(() => {
    const about = document.querySelector('.about-section .about-content');
    if (!about) return { error: 'no about' };
    return { children: Array.from(about.children).map(c => c.className) };
  });
  console.log('about children order:', aboutOrder);

  const statsCenter = await page.evaluate(() => {
    const stats = document.querySelector('.about-stats');
    if (!stats) return { error: 'no stats' };
    const style = getComputedStyle(stats);
    return { justifyContent: style.justifyContent };
  });
  console.log('about-stats justifyContent:', statsCenter);

  const themePillPresent = await page.$('.theme-toggle-float');
  console.log('theme pill present?', !!themePillPresent);
  if (themePillPresent) {
    await page.touchscreen.tap(10, 10); // small tap to ensure focus
    // tap the pill
    const rect = await page.evaluate(() => {
      const el = document.querySelector('.theme-toggle-float');
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: Math.floor(r.left + r.width / 2), y: Math.floor(r.top + r.height / 2) };
    });
    if (rect) {
      await page.touchscreen.tap(rect.x, rect.y);
      await page.waitForTimeout(800);
      const expanded = await page.evaluate(() => !!document.querySelector('.theme-toggle-float.expanded'));
      console.log('theme pill expanded after tap?', expanded);
    } else {
      console.log('could not compute theme pill rect');
    }
  }

  // screenshot for manual inspection
  await page.screenshot({ path: 'playwright-mobile-snapshot.png', fullPage: false });
  console.log('screenshot written to playwright-mobile-snapshot.png');

  await browser.close();
})();
