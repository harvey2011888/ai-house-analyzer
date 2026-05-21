/**
 * 深圳区域数据
 * 包含各区基本信息、热门商圈等
 */

const districts = [
  {
    code: 'nanshan',
    name: '南山区',
    alias: '南山',
    description: '深圳科技创新中心，科技园区聚集地',
    avgPrice: 95000,
    priceTrend: 'up',
    hotAreas: ['科技园', '前海', '蛇口', '后海', '深圳湾'],
    subwayLines: ['1号线', '2号线', '5号线', '9号线', '11号线'],
    features: ['科技产业', '高端住宅', '海景资源']
  },
  {
    code: 'futian',
    name: '福田区',
    alias: '福田',
    description: '深圳金融中心，CBD核心区',
    avgPrice: 88000,
    priceTrend: 'stable',
    hotAreas: ['CBD', '华强北', '香蜜湖', '梅林', '皇岗'],
    subwayLines: ['1号线', '2号线', '3号线', '4号线', '7号线', '9号线', '11号线'],
    features: ['金融中心', '商业繁华', '交通便利']
  },
  {
    code: 'luohu',
    name: '罗湖区',
    alias: '罗湖',
    description: '深圳老城区，商业繁华',
    avgPrice: 65000,
    priceTrend: 'stable',
    hotAreas: ['东门', '人民南', '蔡屋围', '笋岗', '布心'],
    subwayLines: ['1号线', '2号线', '3号线', '5号线', '7号线', '9号线'],
    features: ['商业成熟', '生活便利', '老牌商圈']
  },
  {
    code: 'baoan',
    name: '宝安区',
    alias: '宝安',
    description: '深圳西部中心，机场所在地',
    avgPrice: 58000,
    priceTrend: 'up',
    hotAreas: ['宝安中心', '西乡', '新安', '福永', '沙井'],
    subwayLines: ['1号线', '5号线', '11号线', '12号线'],
    features: ['航空枢纽', '制造业基地', '新兴城区']
  },
  {
    code: 'longgang',
    name: '龙岗区',
    alias: '龙岗',
    description: '深圳东部中心，面积最大的区',
    avgPrice: 45000,
    priceTrend: 'up',
    hotAreas: ['龙岗中心城', '坂田', '布吉', '大运', '平湖'],
    subwayLines: ['3号线', '5号线', '10号线', '14号线', '16号线'],
    features: ['大运新城', '产业转型', '生态宜居']
  },
  {
    code: 'longhua',
    name: '龙华区',
    alias: '龙华',
    description: '深圳北部新城，高铁枢纽',
    avgPrice: 52000,
    priceTrend: 'up',
    hotAreas: ['龙华中心', '民治', '大浪', '观澜', '红山'],
    subwayLines: ['4号线', '5号线', '6号线'],
    features: ['高铁新城', '数字经济', '文化创意']
  },
  {
    code: 'yantian',
    name: '盐田区',
    alias: '盐田',
    description: '深圳东部滨海城区，港口物流基地',
    avgPrice: 48000,
    priceTrend: 'stable',
    hotAreas: ['沙头角', '盐田港', '梅沙', '海山'],
    subwayLines: ['8号线'],
    features: ['滨海旅游', '港口物流', '生态宜居']
  },
  {
    code: 'pingshan',
    name: '坪山区',
    alias: '坪山',
    description: '深圳东部新兴产业基地',
    avgPrice: 35000,
    priceTrend: 'up',
    hotAreas: ['坪山中心', '坑梓', '龙田', '石井'],
    subwayLines: ['14号线', '16号线'],
    features: ['新能源汽车', '生物医药', '智能制造']
  },
  {
    code: 'guangming',
    name: '光明区',
    alias: '光明',
    description: '深圳北部科学城',
    avgPrice: 42000,
    priceTrend: 'up',
    hotAreas: ['光明中心', '公明', '新湖', '凤凰'],
    subwayLines: ['6号线'],
    features: ['科学城', '高等教育', '生态农业']
  },
  {
    code: 'dapeng',
    name: '大鹏新区',
    alias: '大鹏',
    description: '深圳东部生态旅游胜地',
    avgPrice: 32000,
    priceTrend: 'stable',
    hotAreas: ['大鹏', '南澳', '葵涌'],
    subwayLines: [],
    features: ['生态旅游', '海洋产业', '历史文化']
  }
];

/**
 * 根据代码获取区域信息
 * @param {string} code - 区域代码
 * @returns {Object|null} 区域信息
 */
function getDistrictByCode(code) {
  return districts.find(item => item.code === code) || null;
}

/**
 * 获取所有区域列表
 * @returns {Array} 区域列表
 */
function getAllDistricts() {
  return districts;
}

/**
 * 获取区域名称
 * @param {string} code - 区域代码
 * @returns {string} 区域名称
 */
function getDistrictName(code) {
  const district = getDistrictByCode(code);
  return district ? district.name : code;
}

module.exports = {
  districts,
  getDistrictByCode,
  getAllDistricts,
  getDistrictName
};
