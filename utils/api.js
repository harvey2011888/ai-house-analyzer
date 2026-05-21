/**
 * API 请求封装
 * 统一处理请求、响应、错误等
 */

// API 基础地址
const BASE_URL = 'https://api.example.com';

/**
 * 发送请求
 * @param {string} url - 请求地址
 * @param {string} method - 请求方法
 * @param {Object} data - 请求数据
 * @param {Object} options - 其他选项
 * @returns {Promise} 请求结果
 */
function request(url, method = 'GET', data = {}, options = {}) {
  return new Promise((resolve, reject) => {
    // 显示加载中
    if (!options.hideLoading) {
      wx.showLoading({ title: '加载中...', mask: true });
    }

    wx.request({
      url: `${BASE_URL}${url}`,
      method,
      data,
      header: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${wx.getStorageSync('token') || ''}`
      },
      success: (res) => {
        wx.hideLoading();
        if (res.statusCode === 200) {
          if (res.data.code === 0) {
            resolve(res.data.data);
          } else {
            wx.showToast({
              title: res.data.message || '请求失败',
              icon: 'none'
            });
            reject(res.data);
          }
        } else if (res.statusCode === 401) {
          // 未授权，清除登录状态
          wx.removeStorageSync('token');
          wx.removeStorageSync('userInfo');
          wx.showToast({
            title: '登录已过期，请重新登录',
            icon: 'none'
          });
          reject(new Error('Unauthorized'));
        } else {
          wx.showToast({
            title: `请求失败：${res.statusCode}`,
            icon: 'none'
          });
          reject(new Error(`HTTP ${res.statusCode}`));
        }
      },
      fail: (err) => {
        wx.hideLoading();
        wx.showToast({
          title: '网络请求失败',
          icon: 'none'
        });
        reject(err);
      }
    });
  });
}

/**
 * GET 请求
 * @param {string} url - 请求地址
 * @param {Object} data - 请求参数
 * @param {Object} options - 其他选项
 */
function get(url, data = {}, options = {}) {
  return request(url, 'GET', data, options);
}

/**
 * POST 请求
 * @param {string} url - 请求地址
 * @param {Object} data - 请求数据
 * @param {Object} options - 其他选项
 */
function post(url, data = {}, options = {}) {
  return request(url, 'POST', data, options);
}

/**
 * PUT 请求
 * @param {string} url - 请求地址
 * @param {Object} data - 请求数据
 * @param {Object} options - 其他选项
 */
function put(url, data = {}, options = {}) {
  return request(url, 'PUT', data, options);
}

/**
 * DELETE 请求
 * @param {string} url - 请求地址
 * @param {Object} data - 请求数据
 * @param {Object} options - 其他选项
 */
function del(url, data = {}, options = {}) {
  return request(url, 'DELETE', data, options);
}

// 房源相关接口
const houseApi = {
  // 获取推荐列表
  getRecommendList: (params) => get('/house/recommend', params),
  // 获取房源详情
  getHouseDetail: (id) => get(`/house/detail/${id}`),
  // 获取小区详情
  getCommunityDetail: (id) => get(`/community/detail/${id}`),
  // 搜索房源
  searchHouses: (params) => get('/house/search', params)
};

// 用户相关接口
const userApi = {
  // 登录
  login: (code) => post('/user/login', { code }),
  // 获取用户信息
  getUserInfo: () => get('/user/info'),
  // 更新用户信息
  updateUserInfo: (data) => put('/user/info', data)
};

module.exports = {
  request,
  get,
  post,
  put,
  del,
  houseApi,
  userApi
};
