/**
 * 本地存储工具模块（简化版）
 * 只保留数据版本相关功能
 */

// 本地存储键名常量定义
const DATA_VERSION_KEY = 'data_version';     // 数据版本键名

/**
 * 获取本地存储的数据版本号
 * @returns {string} 数据版本号
 */
function getDataVersion() {
  try {
    return wx.getStorageSync(DATA_VERSION_KEY) || '';
  } catch (error) {
    console.error('获取数据版本失败', error);
    return '';
  }
}

/**
 * 设置本地存储的数据版本号
 * @param {string} version - 数据版本号
 */
function setDataVersion(version) {
  try {
    wx.setStorageSync(DATA_VERSION_KEY, version);
  } catch (error) {
    console.error('设置数据版本失败', error);
  }
}

// 导出模块接口
module.exports = {
  DATA_VERSION_KEY,
  getDataVersion,
  setDataVersion
};
