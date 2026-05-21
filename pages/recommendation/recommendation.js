/**
 * 推荐结果页 - 展示AI购房推荐结果
 * 包含AI综合建议、TOP3对比表格、详细推荐理由
 * 已改为多AI讨论推荐模式（千问+DS三轮讨论）
 */

// const localRecommend = require('../../utils/local-recommend');
// const aiService = require('../../utils/ai-service');
const multiAiService = require('../../utils/multi-ai-service');
// const dataLoader = require('../../utils/data-loader');

Page({
  data: {
    loading: true,
    loadingText: 'AI正在分析您的需求...',
    isFallback: false,
    recommendations: [],
    advice: '',
    requirements: {},
    discussionRounds: [] // 记录讨论过程
  },

  onLoad(options) {
    console.log('推荐结果页加载');
    
    // 从本地存储获取需求
    const requirements = wx.getStorageSync('last_requirement') || {};
    this.setData({ requirements });
    
    // 获取推荐结果
    this.getRecommendations(requirements);
  },

  /**
   * 获取推荐结果 - 多AI讨论模式
   */
  async getRecommendations(requirements) {
    this.setData({ 
      loading: true,
      loadingText: 'AI专家团正在讨论分析...',
      discussionRounds: []
    });

    try {
      // 调用多AI讨论服务
      const result = await multiAiService.getMultiAIRecommendation(requirements);

      console.log('========== 多AI讨论最终结果 ==========');
      console.log('【最终整体建议】:', result.advice);
      console.log('【最终推荐列表】:', JSON.stringify(result.recommendations, null, 2));
      console.log('======================================');

      const enriched = this.enrichRecommendations(
        result.recommendations || []
      );

      console.log('【页面展示数据】:', JSON.stringify(enriched, null, 2));

      this.setData({
        loading: false,
        recommendations: enriched.slice(0, 3),
        advice: result.advice || '',
        isFallback: false
      });
    } catch (error) {
      console.error('多AI推荐失败:', error);
      // AI失败时显示友好提示
      this.setData({
        loading: false,
        recommendations: [],
        advice: 'AI服务暂时不可用，请稍后重试。您可以联系专业购房顾问获取推荐。',
        isFallback: true
      });
    }
  },

  /**
   * 转换用户答案格式
   * 支持范围值 [min, max] 和单值两种格式
   */
  convertRequirements(requirements) {
    const result = {};

    // 处理预算 - 支持范围数组 [min, max] 或单值
    if (requirements.budget) {
      if (Array.isArray(requirements.budget)) {
        // 范围值 [min, max]
        result.minBudget = requirements.budget[0];
        result.maxBudget = requirements.budget[1];
      } else {
        // 单值，兼容旧数据
        const budget = parseInt(requirements.budget);
        result.minBudget = Math.max(0, budget - 100);
        result.maxBudget = budget + 100;
      }
    }

    // 处理面积 - 支持范围数组 [min, max] 或单值
    if (requirements.area) {
      if (Array.isArray(requirements.area)) {
        // 范围值 [min, max]
        result.minArea = requirements.area[0];
        result.maxArea = requirements.area[1];
      } else {
        // 单值，兼容旧数据
        const area = parseInt(requirements.area);
        result.minArea = Math.max(0, area - 20);
        result.maxArea = area + 20;
      }
    }

    if (requirements.district && requirements.district.length > 0) {
      result.district = requirements.district;
    }

    if (requirements.layout && requirements.layout.length > 0) {
      result.layouts = requirements.layout;
    }

    return result;
  },

  /**
   * 将AI推荐结果格式化
   * 多AI模式下，AI返回完整的小区信息
   */
  enrichRecommendations(aiRecommendations) {
    return aiRecommendations.map((rec, index) => {
      const avgPrice = rec.avg_price || rec.price || 0;
      const filingPrice = rec.filing_price || 0;
      const priceDate = rec.price_date || '';

      return {
        id: rec.community_id || `ai_${index}`,
        rank: index + 1,
        name: rec.name || rec.community_name || '推荐小区',
        district: rec.district || '',
        matchScore: rec.match_score || 80,
        reasons: rec.reasons || [],
        pros: rec.pros || [],
        cons: rec.cons || [],
        // 最新成交价（主要展示）
        currentAvgPrice: avgPrice,
        // 备案价（对比参考）
        filingPrice: filingPrice,
        // 价格数据时间
        priceDate: priceDate,
        // 价格差异（成交价 - 备案价）
        priceDiff: avgPrice && filingPrice ? avgPrice - filingPrice : 0,
        momChange: rec.mom_change || 0,
        yoyChange: rec.yoy_change || 0,
        avgArea: rec.avg_area || rec.area || 0,
        layoutTypes: rec.layout_types || rec.layouts || [],
        layoutTypesStr: (rec.layout_types || rec.layouts || []).join('、'),
        buildYear: rec.build_year || rec.buildYear || 2010,
        totalHouseholds: rec.total_households || rec.households || 0,
        metroDistance: rec.metro_distance || rec.metroDistance || 0,
        // 数据来源
        dataSource: rec.data_source || ''
      };
    });
  },

  /**
   * 点击小区卡片
   */
  onCommunityClick(event) {
    const { id } = event.currentTarget.dataset;
    if (!id) return;
    wx.navigateTo({
      url: `/pages/community-detail/community-detail?id=${id}`
    });
  },

  /**
   * 重新咨询
   */
  onReMatch() {
    wx.redirectTo({
      url: '/pages/chat/chat'
    });
  },

  /**
   * 分享结果
   */
  onShareAppMessage() {
    return {
      title: 'AI专家团为我推荐的深圳房源',
      path: '/pages/index/index'
    };
  }
});
