/**
 * 深圳购房助手 - 小程序入口
 * 核心功能：AI智能推荐深圳房源
 */

// 引入数据加载器
const dataLoader = require('./utils/data-loader');

// 尝试加载本地配置文件（不提交到Git），如果不存在则使用模板
let appConfig = {};
try {
  appConfig = require('./config/config');
  console.log('已加载本地配置文件 config/config.js');
} catch (e) {
  console.warn('未找到 config/config.js，请复制 config/config.template.js 并填写你的API Key');
  try {
    appConfig = require('./config/config.template');
    console.log('使用配置模板 config/config.template.js（API Key为空，部分功能不可用）');
  } catch (e2) {
    console.warn('配置模板也未找到');
  }
}

App({
  onLaunch() {
    console.log('深圳购房助手启动');

    // 初始化数据加载器，尝试从深圳政府数据平台获取真实数据
    this.initData();
  },

  onShow() {
    console.log('小程序显示');
  },

  /**
   * 初始化数据
   * 尝试从深圳政府数据开放平台获取真实数据
   */
  async initData() {
    try {
      await dataLoader.initDataLoader();
      console.log('数据初始化完成');
    } catch (error) {
      console.error('数据初始化失败:', error);
    }
  },

  globalData: {
    // 千问API Key - 从配置文件读取
    qianwenApiKey: appConfig.qianwenApiKey || ''
  }
});
