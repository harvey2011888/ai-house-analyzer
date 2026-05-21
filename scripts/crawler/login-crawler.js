/**
 * 贝壳找房手动登录爬虫
 * 显示浏览器窗口，让用户手动登录后再爬取数据
 * 自动检测登录状态，无需按回车
 */

const puppeteer = require('puppeteer');
const config = require('./config');
const antiDetect = require('./anti-detect');
const fs = require('fs').promises;
const path = require('path');

class LoginCrawler {
  constructor() {
    this.browser = null;
    this.page = null;
    this.cookies = null;
  }

  /**
   * 启动浏览器并打开登录页面
   */
  async start() {
    console.log('\n========================================');
    console.log('贝壳找房手动登录模式');
    console.log('========================================\n');

    console.log('正在启动浏览器...');
    this.browser = await puppeteer.launch({
      headless: false, // 显示浏览器窗口
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--window-size=1366,768'
      ]
    });

    this.page = await this.browser.newPage();
    await this.page.setViewport({ width: 1366, height: 768 });

    // 设置浏览器指纹
    await antiDetect.setBrowserFingerprint(this.page);

    // 打开贝壳找房首页
    console.log('正在打开贝壳找房...');
    await this.page.goto('https://sz.ke.com', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    console.log('\n========================================');
    console.log('【重要】请在浏览器中完成登录：');
    console.log('1. 在打开的浏览器窗口中点击"登录"按钮');
    console.log('2. 使用手机号/微信/QQ等方式登录贝壳找房');
    console.log('3. 登录成功后，程序会自动检测并继续');
    console.log('========================================\n');

    // 自动检测登录状态
    await this.waitForLogin();

    // 获取登录后的Cookie
    this.cookies = await this.page.cookies();
    console.log('已获取登录Cookie，共', this.cookies.length, '个');

    // 保存Cookie到文件
    await this.saveCookies();

    console.log('登录完成，准备开始爬取数据...\n');

    return this;
  }

  /**
   * 自动检测登录状态
   * 通过检查页面中是否存在用户头像或用户名来判断是否已登录
   */
  async waitForLogin() {
    console.log('正在等待登录...');
    
    const checkInterval = 3000; // 每3秒检查一次
    const maxWaitTime = 10 * 60 * 1000; // 最多等待10分钟
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitTime) {
      try {
        // 检查是否已登录（通过检查页面元素）
        const isLoggedIn = await this.page.evaluate(() => {
          // 检查是否有用户头像、用户名或退出按钮
          const userAvatar = document.querySelector('.user-avatar, .avatar, .user-img');
          const userName = document.querySelector('.user-name, .username, .nickname');
          const logoutBtn = document.querySelector('.logout, .exit, [data-action="logout"]');
          
          // 检查Cookie中是否有登录相关的标识
          const cookies = document.cookie;
          const hasSession = cookies.includes('lianjia') || cookies.includes('ke');
          
          return !!(userAvatar || userName || logoutBtn || hasSession);
        });
        
        if (isLoggedIn) {
          console.log('✓ 检测到已登录状态！');
          return;
        }
        
        // 显示倒计时
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        process.stdout.write(`\r等待登录中... 已等待 ${elapsed} 秒（请在浏览器中完成登录）`);
        
      } catch (error) {
        // 页面可能正在跳转，忽略错误
      }
      
      await new Promise(resolve => setTimeout(resolve, checkInterval));
    }
    
    console.log('\n等待超时，将使用未登录状态继续（可能无法获取完整数据）');
  }

  /**
   * 保存Cookie到文件
   */
  async saveCookies() {
    const cookiePath = path.join(config.output.baseDir, 'cookies.json');
    await fs.mkdir(config.output.baseDir, { recursive: true });
    await fs.writeFile(cookiePath, JSON.stringify(this.cookies, null, 2));
    console.log('Cookie已保存到:', cookiePath);
  }

  /**
   * 加载已保存的Cookie
   */
  async loadCookies() {
    try {
      const cookiePath = path.join(config.output.baseDir, 'cookies.json');
      const content = await fs.readFile(cookiePath, 'utf8');
      this.cookies = JSON.parse(content);
      console.log('已加载保存的Cookie');
      return true;
    } catch (error) {
      console.log('没有找到保存的Cookie，需要重新登录');
      return false;
    }
  }

  /**
   * 使用Cookie访问页面
   */
  async gotoWithCookies(url) {
    if (this.cookies) {
      await this.page.setCookie(...this.cookies);
    }
    await this.page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    return this.page;
  }

  /**
   * 关闭浏览器
   */
  async close() {
    if (this.browser) {
      await this.browser.close();
      console.log('浏览器已关闭');
    }
  }
}

module.exports = LoginCrawler;
