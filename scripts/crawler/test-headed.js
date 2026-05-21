/**
 * 使用有界面浏览器模式测试
 * 贝壳找房反爬严格，尝试使用有界面模式
 */

const puppeteer = require('puppeteer');

async function testWithHeadedBrowser() {
  console.log('启动有界面浏览器...');

  const browser = await puppeteer.launch({
    headless: false,  // 有界面模式
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--window-size=1920,1080',
      '--disable-blink-features=AutomationControlled'
    ]
  });

  const page = await browser.newPage();

  // 设置视窗
  await page.setViewport({ width: 1920, height: 1080 });

  // 注入反检测脚本
  await page.evaluateOnNewDocument(() => {
    delete Object.getPrototypeOf(navigator).webdriver;

    window.chrome = {
      runtime: {},
      loadTimes: () => {},
      csi: () => {},
      app: {}
    };

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

  try {
    console.log('正在访问贝壳找房...');

    // 访问小区列表页
    await page.goto('https://sz.ke.com/xiaoqu/futian/', {
      waitUntil: 'networkidle2',
      timeout: 60000
    });

    // 等待更长时间
    await page.waitForTimeout(10000);

    const title = await page.title();
    const url = page.url();

    console.log('\n页面标题:', title);
    console.log('页面URL:', url);

    if (url.includes('passport') || url.includes('clogin') || title.includes('登录')) {
      console.log('\n❌ 仍被重定向到登录页面');
      console.log('请手动在浏览器中完成验证...');

      // 等待用户手动操作
      await page.waitForTimeout(30000);
    } else {
      console.log('\n✅ 成功访问小区列表页！');

      // 保存页面内容
      const html = await page.content();
      const fs = require('fs');
      const path = require('path');
      const outputPath = path.join(__dirname, '..', '..', 'data', 'crawled');

      if (!fs.existsSync(outputPath)) {
        fs.mkdirSync(outputPath, { recursive: true });
      }

      fs.writeFileSync(path.join(outputPath, 'headed-page.html'), html);
      console.log('页面已保存到 data/crawled/headed-page.html');

      // 尝试解析小区列表
      const communities = await page.evaluate(() => {
        const items = [];
        const selectors = [
          '.xiaoquListItem',
          '[data-component="list"] .item',
          '.listContent li',
          '.xiaoquListItemWrap',
          '[class*="xiaoqu"]'
        ];

        for (const selector of selectors) {
          const elements = document.querySelectorAll(selector);
          if (elements.length > 0) {
            console.log(`找到选择器: ${selector}, 数量: ${elements.length}`);
            elements.forEach((el, index) => {
              if (index < 3) {
                items.push(el.textContent?.substring(0, 200));
              }
            });
            break;
          }
        }
        return items;
      });

      console.log('\n解析到的小区数据:', communities);
    }

  } catch (error) {
    console.error('访问出错:', error.message);
  }

  // 保持浏览器打开一段时间以便查看
  await page.waitForTimeout(10000);
  await browser.close();
  console.log('\n测试完成!');
}

testWithHeadedBrowser().catch(console.error);
