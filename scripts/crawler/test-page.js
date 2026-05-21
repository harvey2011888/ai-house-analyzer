/**
 * 测试页面结构 - 用于调试选择器
 */

const puppeteer = require('puppeteer');

async function testPage() {
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--disable-gpu',
      '--window-size=1920,1080',
      '--disable-blink-features=AutomationControlled'
    ]
  });

  const page = await browser.newPage();

  // 设置用户代理
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

  // 设置视窗
  await page.setViewport({ width: 1920, height: 1080 });

  // 注入脚本隐藏自动化特征
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, 'webdriver', {
      get: () => undefined
    });

    window.chrome = {
      runtime: {},
      loadTimes: () => {},
      csi: () => {},
      app: {}
    };

    const originalQuery = window.navigator.permissions.query;
    window.navigator.permissions.query = (parameters) => (
      parameters.name === 'notifications'
        ? Promise.resolve({ state: Notification.permission })
        : originalQuery(parameters)
    );

    Object.defineProperty(navigator, 'plugins', {
      get: () => [
        { name: 'Chrome PDF Plugin', filename: 'internal-pdf-viewer' },
        { name: 'Chrome PDF Viewer', filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai' },
        { name: 'Native Client', filename: 'internal-nacl-plugin' }
      ]
    });

    Object.defineProperty(navigator, 'languages', {
      get: () => ['zh-CN', 'zh', 'en-US', 'en']
    });
  });

  console.log('正在访问页面...');

  try {
    // 先访问首页获取Cookie
    await page.goto('https://sz.ke.com', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    console.log('首页标题:', await page.title());

    // 等待一段时间
    await page.waitForTimeout(2000);

    // 再访问小区列表页
    await page.goto('https://sz.ke.com/xiaoqu/futian/pg1/', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    // 等待页面加载
    await page.waitForTimeout(3000);

    // 获取页面信息
    const title = await page.title();
    const url = page.url();
    console.log('\n页面标题:', title);
    console.log('页面URL:', url);

    // 检查是否被重定向到登录页
    if (url.includes('passport') || title.includes('登录')) {
      console.log('\n❌ 被重定向到登录页面，反爬检测生效');

      // 保存HTML以便分析
      const html = await page.content();
      const fs = require('fs');
      const path = require('path');
      const outputPath = path.join(__dirname, '..', '..', 'data', 'crawled');

      if (!fs.existsSync(outputPath)) {
        fs.mkdirSync(outputPath, { recursive: true });
      }

      fs.writeFileSync(path.join(outputPath, 'blocked-page.html'), html);
      console.log('被拦截页面已保存到 data/crawled/blocked-page.html');
    } else {
      console.log('\n✅ 成功访问小区列表页');

      // 获取页面HTML
      const html = await page.content();

      // 保存HTML到文件以便分析
      const fs = require('fs');
      const path = require('path');
      const outputPath = path.join(__dirname, '..', '..', 'data', 'crawled');

      if (!fs.existsSync(outputPath)) {
        fs.mkdirSync(outputPath, { recursive: true });
      }

      fs.writeFileSync(path.join(outputPath, 'test-page.html'), html);
      console.log('页面HTML已保存到 data/crawled/test-page.html');

      // 尝试多种可能的选择器
      const selectors = [
        '.xiaoquListItem',
        '[data-component="list"] li',
        '.listContent li',
        '.xiaoquListItemWrap',
        '.info',
        '[class*="xiaoqu"]',
        '[class*="community"]',
        '.title',
        'ul li',
        '[data-el]',
        '.item'
      ];

      console.log('\n测试各种选择器:');
      for (const selector of selectors) {
        const elements = await page.$$(selector);
        console.log(`${selector}: ${elements.length} 个元素`);
      }
    }

  } catch (error) {
    console.error('访问出错:', error.message);
  }

  await browser.close();
  console.log('\n测试完成!');
}

testPage().catch(console.error);
