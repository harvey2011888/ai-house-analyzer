/**
 * 反爬策略模块
 * 提供反爬虫检测的各种策略
 */

const config = require('./config');

/**
 * 获取随机延迟时间
 * @returns {number} 延迟毫秒数
 */
function getRandomDelay() {
  const { min, max } = config.crawler.delay;
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * 获取随机User-Agent
 * @returns {string} User-Agent字符串
 */
function getRandomUserAgent() {
  const agents = config.crawler.userAgents;
  return agents[Math.floor(Math.random() * agents.length)];
}

/**
 * 随机延迟执行
 * @param {Function} fn 要执行的函数
 * @returns {Promise} 执行结果
 */
async function delayExecute(fn) {
  const delay = getRandomDelay();
  console.log(`等待 ${delay}ms...`);
  await new Promise(resolve => setTimeout(resolve, delay));
  return fn();
}

/**
 * 重试机制
 * @param {Function} fn 要执行的函数
 * @param {number} retries 重试次数
 * @returns {Promise} 执行结果
 */
async function retry(fn, retries = config.crawler.retries) {
  let lastError;
  
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      console.warn(`第 ${i + 1} 次尝试失败: ${error.message}`);
      
      if (i < retries - 1) {
        const waitTime = getRandomDelay() * (i + 1);
        console.log(`${waitTime}ms 后重试...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }
  
  throw lastError;
}

/**
 * 模拟人类行为
 * @param {Page} page Puppeteer页面对象
 */
async function simulateHumanBehavior(page) {
  // 随机滚动
  const scrollTimes = Math.floor(Math.random() * 3) + 1;
  for (let i = 0; i < scrollTimes; i++) {
    await page.evaluate(() => {
      window.scrollBy(0, Math.floor(Math.random() * 300) + 100);
    });
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
  }
  
  // 随机鼠标移动
  await page.mouse.move(
    Math.floor(Math.random() * 800) + 100,
    Math.floor(Math.random() * 600) + 100
  );
}

/**
 * 设置浏览器指纹
 * @param {Page} page Puppeteer页面对象
 */
async function setBrowserFingerprint(page) {
  // 设置User-Agent
  const userAgent = getRandomUserAgent();
  await page.setUserAgent(userAgent);
  
  // 设置视口
  await page.setViewport({
    width: 1920,
    height: 1080,
    deviceScaleFactor: 1,
    hasTouch: false,
    isLandscape: true,
    isMobile: false
  });
  
  // 设置语言
  await page.setExtraHTTPHeaders({
    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8'
  });
  
  // 注入脚本隐藏webdriver特征
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, 'webdriver', {
      get: () => undefined
    });
    
    Object.defineProperty(navigator, 'plugins', {
      get: () => [1, 2, 3, 4, 5]
    });
    
    Object.defineProperty(navigator, 'languages', {
      get: () => ['zh-CN', 'zh', 'en']
    });
    
    const originalQuery = window.navigator.permissions.query;
    window.navigator.permissions.query = (parameters) => (
      parameters.name === 'notifications' 
        ? Promise.resolve({ state: Notification.permission })
        : originalQuery(parameters)
    );
  });
}

/**
 * 检查是否被反爬
 * @param {Page} page Puppeteer页面对象
 * @returns {boolean} 是否被反爬
 */
async function isBlocked(page) {
  const url = page.url();
  const title = await page.title();
  
  // 检查常见的反爬页面特征
  const blockIndicators = [
    '验证码',
    '访问受限',
    '请稍后重试',
    '403',
    '404',
    '502',
    '503'
  ];
  
  const pageContent = await page.content();
  
  for (const indicator of blockIndicators) {
    if (title.includes(indicator) || pageContent.includes(indicator)) {
      console.error(`检测到反爬: ${indicator}`);
      return true;
    }
  }
  
  return false;
}

/**
 * 解析日期字符串
 * @param {string} dateStr 日期字符串（如"2026.04.15"）
 * @returns {string} 标准日期格式（YYYY-MM-DD）
 */
function parseDate(dateStr) {
  if (!dateStr) return null;
  
  // 处理"2026.04.15"格式
  const match = dateStr.match(/(\d{4})\.(\d{2})\.(\d{2})/);
  if (match) {
    return `${match[1]}-${match[2]}-${match[3]}`;
  }
  
  // 处理"2026年04月15日"格式
  const match2 = dateStr.match(/(\d{4})年(\d{2})月(\d{2})日/);
  if (match2) {
    return `${match2[1]}-${match2[2]}-${match2[3]}`;
  }
  
  return dateStr;
}

/**
 * 检查日期是否在指定时间范围内
 * @param {string} dateStr 日期字符串
 * @param {number} months 时间范围（月）
 * @returns {boolean} 是否在范围内
 */
function isWithinDateRange(dateStr, months = config.timeRange.transactionMonths) {
  const date = new Date(parseDate(dateStr));
  if (isNaN(date.getTime())) return false;
  
  const cutoffDate = new Date();
  cutoffDate.setMonth(cutoffDate.getMonth() - months);
  
  return date >= cutoffDate;
}

/**
 * 解析价格字符串
 * @param {string} priceStr 价格字符串（如"128000"或"12.8万"）
 * @returns {number} 价格数字
 */
function parsePrice(priceStr) {
  if (!priceStr) return 0;
  
  // 移除所有非数字字符（保留小数点）
  const cleaned = priceStr.replace(/[^一-龥a-zA-Z0-9.]/g, '');
  
  // 处理"12.8万"格式
  if (cleaned.includes('万')) {
    const num = parseFloat(cleaned.replace('万', ''));
    return Math.round(num * 10000);
  }
  
  // 处理纯数字
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : Math.round(num);
}

/**
 * 解析面积字符串
 * @param {string} areaStr 面积字符串（如"105㎡"）
 * @returns {number} 面积数字
 */
function parseArea(areaStr) {
  if (!areaStr) return 0;
  
  const match = areaStr.match(/(\d+(?:\.\d+)?)/);
  if (match) {
    return parseFloat(match[1]);
  }
  
  return 0;
}

module.exports = {
  getRandomDelay,
  getRandomUserAgent,
  delayExecute,
  retry,
  simulateHumanBehavior,
  setBrowserFingerprint,
  isBlocked,
  parseDate,
  isWithinDateRange,
  parsePrice,
  parseArea
};
