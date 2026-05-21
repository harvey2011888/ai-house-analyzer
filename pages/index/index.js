/**
 * 首页 - 极简入口
 * 欢迎语 + AI购房助手介绍 + 开始咨询按钮
 * 热门小区预览功能已注释（数据加载问题）
 */

Page({
  data: {
    // hotCommunities: []
  },

  onLoad() {
    console.log('首页加载');
    // 热门小区功能已注释，避免数据加载错误
    // this.loadHotCommunities();
  },

  /**
   * 加载热门小区数据
   * 按成交量和价格综合排序
   * 已注释：preloadedData.hotCommunities 数据格式问题导致报错
   */
  /*
  loadHotCommunities() {
    try {
      // 异步引入数据，避免阻塞页面注册
      const preloadedData = require('../../data/preloaded-data.js');
      const transactionsData = require('../../data/transactions-data.js');

      // 统计每个小区的成交量
      const transactionCountMap = {};
      transactionsData.transactions.forEach(t => {
        const communityId = t.community_id;
        transactionCountMap[communityId] = (transactionCountMap[communityId] || 0) + 1;
      });

      // 获取所有小区并计算综合得分
      const allCommunities = preloadedData.hotCommunities.map(c => {
        const transactionCount = transactionCountMap[c.id] || 0;
        // 综合得分 = 价格得分 * 0.6 + 成交量得分 * 0.4
        // 价格得分：按价格排序（最高15万=100分）
        const priceScore = (c.price / 150000) * 100;
        // 成交量得分：最高成交量为基准
        const maxTransactions = Math.max(...Object.values(transactionCountMap), 1);
        const transactionScore = (transactionCount / maxTransactions) * 100;
        // 综合得分
        const compositeScore = priceScore * 0.6 + transactionScore * 0.4;

        return {
          id: c.id,
          name: c.name,
          district: c.district.replace('区', ''), // 去掉"区"字
          price: c.price,
          transactionCount: transactionCount,
          trend: c.price > 100000 ? '+5.2%' : (c.price > 80000 ? '+4.1%' : '+3.8%'),
          compositeScore: compositeScore
        };
      });

      // 按综合得分排序，取前6个
      const hotCommunities = allCommunities
        .sort((a, b) => b.compositeScore - a.compositeScore)
        .slice(0, 6);

      this.setData({ hotCommunities });
      console.log('热门小区加载完成:', hotCommunities.length, '个');
      console.log('排序依据: 价格*60% + 成交量*40%');
    } catch (error) {
      console.error('加载热门小区失败:', error);
      // 使用空数据，不影响页面显示
      this.setData({ hotCommunities: [] });
    }
  },
  */

  onShow() {
    console.log('首页显示');
  },

  /**
   * 点击开始咨询按钮
   */
  onStartChat() {
    wx.navigateTo({
      url: '/pages/chat/chat'
    });
  }

  /**
   * 点击热门小区
   * 已注释：热门小区功能暂时关闭
   */
  /*
  onCommunityClick(event) {
    const { id } = event.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/community-detail/community-detail?id=${id}`
    });
  }
  */
});
