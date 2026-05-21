/**
 * 使用 puppeteer-extra 和 stealth 插件测试
 */

const puppeteer = require('puppeteer');

async function testWithStealth() {
  console.log('启动浏览器（使用高级反检测模式）...');

  const browser = await puppeteer.launch({
    headless: 'new',  // 使用新的无头模式
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--disable-gpu',
      '--window-size=1920,1080',
      '--disable-blink-features=AutomationControlled',
      '--disable-web-security',
      '--disable-features=IsolateOrigins,site-per-process',
      '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    ]
  });

  const page = await browser.newPage();

  // 设置视窗
  await page.setViewport({ width: 1920, height: 1080 });

  // 注入高级反检测脚本
  await page.evaluateOnNewDocument(() => {
    // 删除 webdriver 属性
    delete Object.getPrototypeOf(navigator).webdriver;

    // 模拟 Chrome 运行时
    window.chrome = {
      runtime: {
        OnInstalledReason: { CHROME_UPDATE: "chrome_update", INSTALL: "install", SHARED_MODULE_UPDATE: "shared_module_update", UPDATE: "update" },
        OnRestartRequiredReason: { APP_UPDATE: "app_update", OS_UPDATE: "os_update", PERIODIC: "periodic" },
        PlatformArch: { ARM: "arm", ARM64: "arm64", MIPS: "mips", MIPS64: "mips64", MIPS64EL: "mips64el", MIPSEL: "mipsel", X86_32: "x86-32", X86_64: "x86-64" },
        PlatformNaclArch: { ARM: "arm", MIPS: "mips", MIPS64: "mips64", MIPS64EL: "mips64el", MIPSEL: "mipsel", MIPSEL64: "mipsel64", X86_32: "x86-32", X86_64: "x86-64" },
        PlatformOs: { ANDROID: "android", CROS: "cros", LINUX: "linux", MAC: "mac", OPENBSD: "openbsd", WIN: "win" },
        RequestUpdateCheckStatus: { NO_UPDATE: "no_update", THROTTLED: "throttled", UPDATE_AVAILABLE: "update_available" }
      },
      loadTimes: () => {},
      csi: () => {},
      app: {}
    };

    // 覆盖 permissions
    const originalQuery = window.navigator.permissions.query;
    window.navigator.permissions.query = (parameters) => (
      parameters.name === 'notifications'
        ? Promise.resolve({ state: Notification.permission })
        : originalQuery(parameters)
    );

    // 添加插件
    Object.defineProperty(navigator, 'plugins', {
      get: () => [
        { name: 'Chrome PDF Plugin', filename: 'internal-pdf-viewer', description: 'Portable Document Format', version: 'undefined', length: 1, item: () => {}, namedItem: () => {} },
        { name: 'Chrome PDF Viewer', filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai', description: 'Portable Document Format', version: 'undefined', length: 1, item: () => {}, namedItem: () => {} },
        { name: 'Native Client', filename: 'internal-nacl-plugin', description: '', version: 'undefined', length: 2, item: () => {}, namedItem: () => {} }
      ]
    });

    // 添加 mimeTypes
    Object.defineProperty(navigator, 'mimeTypes', {
      get: () => [
        { type: 'application/pdf', suffixes: 'pdf', description: 'Portable Document Format', enabledPlugin: navigator.plugins[0] },
        { type: 'application/x-google-chrome-pdf', suffixes: 'pdf', description: 'Portable Document Format', enabledPlugin: navigator.plugins[1] },
        { type: 'application/x-nacl', suffixes: '', description: 'Native Client module', enabledPlugin: navigator.plugins[2] },
        { type: 'application/x-pnacl', suffixes: '', description: 'Portable Native Client module', enabledPlugin: navigator.plugins[2] }
      ]
    });

    // 添加语言
    Object.defineProperty(navigator, 'languages', {
      get: () => ['zh-CN', 'zh', 'en-US', 'en']
    });

    // 模拟 notification
    if (!window.Notification) {
      window.Notification = {
        permission: 'default',
        requestPermission: () => Promise.resolve('default')
      };
    }
  });

  try {
    console.log('正在访问贝壳找房...');

    // 先访问首页
    await page.goto('https://sz.ke.com', {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });

    // 等待一些时间让页面完全加载
    await page.waitForTimeout(3000);

    const homeTitle = await page.title();
    console.log('首页标题:', homeTitle);

    // 模拟人类行为 - 滚动页面
    await page.evaluate(() => {
      window.scrollBy(0, 500);
    });
    await page.waitForTimeout(1000);

    // 点击小区链接
    const xiaoquLink = await page.$('a[href*="/xiaoqu/"]');
    if (xiaoquLink) {
      console.log('找到小区链接，点击...');
      await xiaoquLink.click();
      await page.waitForTimeout(3000);
    }

    // 或者直接访问小区列表
    console.log('访问福田区小区列表...');
    await page.goto('https://sz.ke.com/xiaoqu/futian/', {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });

    await page.waitForTimeout(5000);

    const title = await page.title();
    const url = page.url();

    console.log('\n页面标题:', title);
    console.log('页面URL:', url);

    if (url.includes('passport') || url.includes('clogin') || title.includes('登录')) {
      console.log('\n❌ 仍被重定向到登录页面');
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

      fs.writeFileSync(path.join(outputPath, 'success-page.html'), html);
      console.log('页面已保存到 data/crawled/success-page.html');

      // 尝试解析小区列表
      const communities = await page.evaluate(() => {
        const items = [];
        // 尝试多种可能的选择器
        const selectors = [
          '.xiaoquListItem',
          '[data-component="list"] .item',
          '.listContent li',
          '.xiaoquListItemWrap',
          '[class*="xiaoqu"]',
          '.info'
        ];

        for (const selector of selectors) {
          const elements = document.querySelectorAll(selector);
          if (elements.length > 0) {
            console.log(`找到选择器: ${selector}, 数量: ${elements.length}`);
            elements.forEach((el, index) => {
              if (index < 5) { // 只取前5个
                items.push({
                  selector: selector,
                  text: el.textContent?.substring(0, 100)
                });
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

  await browser.close();
  console.log('\n测试完成!');
}

testWithStealth().catch(console.error);
