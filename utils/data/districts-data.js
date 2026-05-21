/**
 * 区域数据模块
 * 将 districts.json 转换为 JS 模块，以便微信小程序可以 require 加载
 */

module.exports = {
  districts: [
    {
      name: "福田",
      avg_price: 115000,
      total_communities: 4,
      price_change_yoy: 4.1,
      volume: 1250
    },
    {
      name: "南山",
      avg_price: 121500,
      total_communities: 4,
      price_change_yoy: 5.7,
      volume: 1580
    },
    {
      name: "罗湖",
      avg_price: 71667,
      total_communities: 3,
      price_change_yoy: 1.6,
      volume: 980
    },
    {
      name: "宝安",
      avg_price: 76000,
      total_communities: 3,
      price_change_yoy: 2.9,
      volume: 1420
    },
    {
      name: "龙岗",
      avg_price: 51667,
      total_communities: 3,
      price_change_yoy: 1.1,
      volume: 1100
    },
    {
      name: "龙华",
      avg_price: 71667,
      total_communities: 3,
      price_change_yoy: 2.7,
      volume: 890
    }
  ]
};
