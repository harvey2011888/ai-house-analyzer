/**
 * 基础爬虫类
 * 提供通用的爬虫功能
 */

const puppeteer = require('puppeteer');
const config = require('./config');
const antiDetect = require('./anti-detect');
const fs = require('fs').promises;
const path = require('path');

class BaseCrawler {
  constructor(options = {}) {
    this.options = {
      headless: options.headless !== false, // 默认无头模式
      ...options
    };
    this.browser = null;
    this.page = null;
    this.stats = {
      startTime: null,
      endTime: null,
      success: 0,
      failed: 0,
      total: 0
    };
  }

  /**
   * 初始化浏览器
   */
  async init() {
    console.log('正在初始化浏览器...');

    this.browser = await puppeteer.launch({
      headless: this.options.headless,
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
        '--allow-running-insecure-content',
        '--disable-features=BlockInsecurePrivateNetworkRequests'
      ]
    });

    this.page = await this.browser.newPage();

    // 设置浏览器指纹
    await antiDetect.setBrowserFingerprint(this.page);

    // 注入脚本隐藏自动化特征
    await this.page.evaluateOnNewDocument(() => {
      // 覆盖 navigator.webdriver
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined
      });

      // 覆盖 chrome 对象
      window.chrome = {
        runtime: {},
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
          { name: 'Chrome PDF Plugin', filename: 'internal-pdf-viewer' },
          { name: 'Chrome PDF Viewer', filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai' },
          { name: 'Native Client', filename: 'internal-nacl-plugin' }
        ]
      });

      // 添加语言
      Object.defineProperty(navigator, 'languages', {
        get: () => ['zh-CN', 'zh', 'en-US', 'en']
      });
    });

    // 设置超时
    this.page.setDefaultTimeout(config.crawler.timeout);

    console.log('浏览器初始化完成');
  }

  /**
   * 访问页面
   * @param {string} url 页面URL
   * @returns {Promise<Page>} 页面对象
   */
  async goto(url) {
    if (!this.page) {
      throw new Error('浏览器未初始化');
    }

    return antiDetect.retry(async () => {
      console.log(`访问: ${url}`);
      
      await this.page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: config.crawler.timeout
      });

      // 检查是否被反爬
      if (await antiDetect.isBlocked(this.page)) {
        throw new Error('页面访问被限制');
      }

      // 模拟人类行为
      await antiDetect.simulateHumanBehavior(this.page);

      return this.page;
    });
  }

  /**
   * 获取页面内容
   * @param {string} url 页面URL
   * @returns {Promise<string>} HTML内容
   */
  async fetch(url) {
    await this.goto(url);
    return this.page.content();
  }

  /**
   * 解析数据（子类需要重写）
   * @param {string} html HTML内容
   * @returns {Array} 解析后的数据
   */
  parse(html) {
    throw new Error('子类必须实现 parse 方法');
  }

  /**
   * 保存数据到文件
   * @param {Array} data 数据数组
   * @param {string} filename 文件名
   */
  async save(data, filename) {
    const filepath = path.join(config.output.baseDir, filename);
    
    // 确保目录存在
    await fs.mkdir(config.output.baseDir, { recursive: true });
    
    // 读取已有数据（如果存在）
    let existingData = [];
    try {
      const content = await fs.readFile(filepath, 'utf8');
      const parsed = JSON.parse(content);
      existingData = parsed.data || parsed;
    } catch (error) {
      // 文件不存在或解析失败，使用空数组
    }

    // 合并数据（去重）
    const mergedData = this.mergeData(existingData, data);
    
    // 保存数据
    const output = {
      meta: {
        total: mergedData.length,
        crawlTime: new Date().toISOString(),
        source: config.target.name
      },
      data: mergedData
    };

    await fs.writeFile(filepath, JSON.stringify(output, null, 2), 'utf8');
    console.log(`数据已保存: ${filepath} (${mergedData.length} 条)`);
  }

  /**
   * 合并数据（去重）
   * @param {Array} existing 已有数据
   * @param {Array} newData 新数据
   * @returns {Array} 合并后的数据
   */
  mergeData(existing, newData) {
    const map = new Map();
    
    // 将已有数据放入Map
    existing.forEach(item => {
      map.set(item.id, item);
    });
    
    // 合并新数据
    newData.forEach(item => {
      map.set(item.id, item);
    });
    
    return Array.from(map.values());
  }

  /**
   * 爬取单个页面
   * @param {string} url 页面URL
   * @returns {Promise<Array>} 解析后的数据
   */
  async crawlPage(url) {
    this.stats.total++;
    
    try {
      const html = await this.fetch(url);
      const data = this.parse(html);
      this.stats.success++;
      return data;
    } catch (error) {
      this.stats.failed++;
      console.error(`爬取失败 ${url}: ${error.message}`);
      return [];
    }
  }

  /**
   * 爬取多个页面（并发控制）
   * @param {Array<string>} urls URL列表
   * @param {Function} onProgress 进度回调
   * @returns {Promise<Array>} 所有数据
   */
  async crawlPages(urls, onProgress) {
    const results = [];
    const concurrency = config.crawler.concurrency;
    
    for (let i = 0; i < urls.length; i += concurrency) {
      const batch = urls.slice(i, i + concurrency);
      
      // 并发爬取
      const batchResults = await Promise.all(
        batch.map(url => this.crawlPage(url))
      );
      
      // 合并结果
      batchResults.forEach(data => results.push(...data));
      
      // 进度回调
      if (onProgress) {
        onProgress(i + batch.length, urls.length);
      }
      
      // 批次间延迟
      if (i + concurrency < urls.length) {
        await new Promise(resolve => setTimeout(resolve, antiDetect.getRandomDelay()));
      }
    }
    
    return results;
  }

  /**
   * 开始爬取（子类需要重写）
   */
  async crawl() {
    throw new Error('子类必须实现 crawl 方法');
  }

  /**
   * 关闭浏览器
   */
  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
      console.log('浏览器已关闭');
    }
  }

  /**
   * 获取统计信息
   * @returns {Object} 统计信息
   */
  getStats() {
    return {
      ...this.stats,
      duration: this.stats.endTime - this.stats.startTime
    };
  }

  /**
   * 打印统计信息
   */
  printStats() {
    const stats = this.getStats();
    console.log('\n========== 爬取统计 ==========');
    console.log(`总请求数: ${stats.total}`);
    console.log(`成功: ${stats.success}`);
    console.log(`失败: ${stats.failed}`);
    console.log(`成功率: ${((stats.success / stats.total) * 100).toFixed(2)}%`);
    console.log(`耗时: ${(stats.duration / 1000).toFixed(2)} 秒`);
    console.log('==============================\n');
  }
}

module.exports = BaseCrawler;
