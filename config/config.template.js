/**
 * 深圳购房助手 - 配置文件模板
 * 
 * 使用方法：
 * 1. 复制此文件为 config.js：cp config/config.template.js config/config.js
 * 2. 在 config.js 中填入你自己的 API Key
 * 3. config.js 已被 .gitignore 排除，不会提交到仓库
 */

module.exports = {
  // 千问(通义千问) API Key
  // 获取地址：https://dashscope.console.aliyun.com/
  qianwenApiKey: 'your-qianwen-api-key-here',

  // 混元 AI API Key
  // 获取地址：https://console.cloud.tencent.com/hunyuan
  hunyuanApiKey: 'your-hunyuan-api-key-here'
};