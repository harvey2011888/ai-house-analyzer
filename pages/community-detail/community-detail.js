/**
 * 小区详情页逻辑
 * 展示小区详细信息、价格走势、周边配套等
 */

// 引入数据加载模块
const dataLoader = require('../../utils/data-loader');

Page({
  /**
   * 页面的初始数据
   */
  data: {
    // 小区ID
    communityId: '',
    // 小区基本信息
    community: {},
    // 价格信息
    price: {},
    // 配套设施
    facilities: {},
    // 加载状态
    loading: true,
    // 当前年份（用于计算楼龄）
    currentYear: new Date().getFullYear(),
    // 总价估算
    totalPrice: 0
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    console.log('小区详情页加载，参数:', options);

    const { id } = options;
    if (!id) {
      wx.showToast({
        title: '参数错误',
        icon: 'none'
      });
      return;
    }

    this.setData({ communityId: id });

    // 加载小区详情数据
    this.loadCommunityDetail(id);
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    console.log('小区详情页显示');
  },

  /**
   * 加载小区详情数据
   */
  loadCommunityDetail(id) {
    this.setData({ loading: true });

    // 获取小区基本信息
    const communities = dataLoader.getCommunities();
    const community = communities.find(c => c.id === id);

    // 获取价格信息
    const prices = dataLoader.getPrices();
    const price = prices.find(p => p.community_id === id);

    // 获取配套设施信息
    const facilities = dataLoader.getCommunityFacilities(id);

    if (!community) {
      wx.showToast({
        title: '小区不存在',
        icon: 'none'
      });
      this.setData({ loading: false });
      return;
    }

    // 计算总价估算（均价 * 平均面积 / 10000，转换为万元）
    const totalPrice = price && community ? Math.round(price.current_avg_price * community.avg_area / 10000) : 0;

    this.setData({
      community: community,
      price: price || {},
      facilities: facilities || {},
      totalPrice: totalPrice,
      loading: false
    });

    console.log('小区详情加载完成:', community.name);
  },

  /**
   * 查看地图位置
   */
  onViewMap() {
    const { community } = this.data;
    if (!community || !community.latitude || !community.longitude) {
      wx.showToast({
        title: '暂无位置信息',
        icon: 'none'
      });
      return;
    }

    wx.openLocation({
      latitude: community.latitude,
      longitude: community.longitude,
      name: community.name,
      address: community.address || ''
    });
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {
    this.loadCommunityDetail(this.data.communityId);
    wx.stopPullDownRefresh();
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {
    const { community } = this.data;
    return {
      title: `深圳购房助手 - ${community.name}`,
      path: `/pages/community-detail/community-detail?id=${community.id}`
    };
  }
});
