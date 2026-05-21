/**
 * 配套设施数据模块
 * 包含地铁、学校、医院、商场等配套信息
 */

module.exports = {
  facilities: [
    {
      community_id: "c001",
      metro: { name: "香梅站", line: "2号线", distance: 450 },
      schools: [
        { name: "福田外国语学校", type: "初中", distance: 800 },
        { name: "香蜜湖小学", type: "小学", distance: 600 }
      ],
      hospitals: [
        { name: "北京大学深圳医院", distance: 1200 },
        { name: "深圳市儿童医院", distance: 1500 }
      ],
      malls: [
        { name: "山姆会员店", distance: 700 },
        { name: "东海城市广场", distance: 900 }
      ]
    },
    {
      community_id: "c002",
      metro: { name: "购物公园站", line: "1/3号线", distance: 380 },
      schools: [
        { name: "福田中学", type: "高中", distance: 1000 },
        { name: "石厦学校", type: "九年一贯", distance: 700 }
      ],
      hospitals: [
        { name: "深圳市妇幼保健院", distance: 900 },
        { name: "中山大学附属第八医院", distance: 1100 }
      ],
      malls: [
        { name: "COCO Park", distance: 400 },
        { name: "皇庭广场", distance: 600 }
      ]
    },
    {
      community_id: "c003",
      metro: { name: "市民中心站", line: "2/4号线", distance: 520 },
      schools: [
        { name: "莲花中学", type: "初中", distance: 600 },
        { name: "荔园小学", type: "小学", distance: 500 }
      ],
      hospitals: [
        { name: "深圳市第二人民医院", distance: 1300 },
        { name: "北大深圳医院", distance: 1400 }
      ],
      malls: [
        { name: "中心城", distance: 800 },
        { name: "卓悦中心", distance: 1000 }
      ]
    },
    {
      community_id: "c004",
      metro: { name: "景田站", line: "2/9号线", distance: 600 },
      schools: [
        { name: "红岭中学", type: "高中", distance: 900 },
        { name: "景田小学", type: "小学", distance: 400 }
      ],
      hospitals: [
        { name: "深圳市中医院", distance: 700 },
        { name: "北大深圳医院", distance: 1000 }
      ],
      malls: [
        { name: "沃尔玛", distance: 500 },
        { name: "景田岁宝", distance: 600 }
      ]
    },
    {
      community_id: "c005",
      metro: { name: "高新园站", line: "1号线", distance: 350 },
      schools: [
        { name: "南山外国语学校", type: "九年一贯", distance: 800 },
        { name: "大冲学校", type: "九年一贯", distance: 600 }
      ],
      hospitals: [
        { name: "华中科技大学协和深圳医院", distance: 1500 },
        { name: "深圳大学总医院", distance: 2000 }
      ],
      malls: [
        { name: "万象天地", distance: 300 },
        { name: "益田假日广场", distance: 1200 }
      ]
    },
    {
      community_id: "c006",
      metro: { name: "东角头站", line: "2号线", distance: 800 },
      schools: [
        { name: "蛇口学校", type: "九年一贯", distance: 700 },
        { name: "育才中学", type: "高中", distance: 1200 }
      ],
      hospitals: [
        { name: "蛇口人民医院", distance: 600 },
        { name: "南山区妇幼保健院", distance: 1000 }
      ],
      malls: [
        { name: "海上世界", distance: 900 },
        { name: "花园城", distance: 1100 }
      ]
    },
    {
      community_id: "c007",
      metro: { name: "湾厦站", line: "2号线", distance: 400 },
      schools: [
        { name: "育才三中", type: "初中", distance: 800 },
        { name: "后海小学", type: "小学", distance: 600 }
      ],
      hospitals: [
        { name: "蛇口人民医院", distance: 900 },
        { name: "南山区人民医院", distance: 1500 }
      ],
      malls: [
        { name: "太古城", distance: 200 },
        { name: "海岸城", distance: 1000 }
      ]
    },
    {
      community_id: "c008",
      metro: { name: "登良站", line: "2号线", distance: 500 },
      schools: [
        { name: "北师大南山附属学校", type: "九年一贯", distance: 700 },
        { name: "蔚蓝海岸幼儿园", type: "幼儿园", distance: 300 }
      ],
      hospitals: [
        { name: "南山区人民医院", distance: 1200 },
        { name: "蛇口人民医院", distance: 1400 }
      ],
      malls: [
        { name: "海岸城", distance: 800 },
        { name: "太古城", distance: 900 }
      ]
    },
    {
      community_id: "c009",
      metro: { name: "太安站", line: "5/7号线", distance: 450 },
      schools: [
        { name: "翠竹中学", type: "初中", distance: 600 },
        { name: "百仕达小学", type: "小学", distance: 400 }
      ],
      hospitals: [
        { name: "深圳市人民医院", distance: 800 },
        { name: "罗湖区妇幼保健院", distance: 1000 }
      ],
      malls: [
        { name: "喜荟城", distance: 500 },
        { name: "吉之岛", distance: 700 }
      ]
    },
    {
      community_id: "c010",
      metro: { name: "翠竹站", line: "3号线", distance: 380 },
      schools: [
        { name: "深圳中学", type: "高中", distance: 1200 },
        { name: "翠北小学", type: "小学", distance: 500 }
      ],
      hospitals: [
        { name: "深圳市人民医院", distance: 600 },
        { name: "康宁医院", distance: 800 }
      ],
      malls: [
        { name: "翠竹沃尔玛", distance: 400 },
        { name: "东门商圈", distance: 1500 }
      ]
    },
    {
      community_id: "c011",
      metro: { name: "翠竹站", line: "3号线", distance: 200 },
      schools: [
        { name: "翠竹小学", type: "小学", distance: 300 },
        { name: "东湖中学", type: "初中", distance: 800 }
      ],
      hospitals: [
        { name: "深圳市人民医院", distance: 500 },
        { name: "罗湖区中医院", distance: 700 }
      ],
      malls: [
        { name: "翠竹沃尔玛", distance: 300 },
        { name: "华润万家", distance: 500 }
      ]
    },
    {
      community_id: "c012",
      metro: { name: "宝安中心站", line: "1/5号线", distance: 300 },
      schools: [
        { name: "宝安中学", type: "高中", distance: 800 },
        { name: "海旺学校", type: "九年一贯", distance: 600 }
      ],
      hospitals: [
        { name: "宝安区人民医院", distance: 1000 },
        { name: "南方医科大学深圳医院", distance: 1500 }
      ],
      malls: [
        { name: "壹方城", distance: 200 },
        { name: "宝安大仟里", distance: 1200 }
      ]
    },
    {
      community_id: "c013",
      metro: { name: "西乡站", line: "1号线", distance: 600 },
      schools: [
        { name: "西乡中学", type: "高中", distance: 700 },
        { name: "桃源居学校", type: "九年一贯", distance: 400 }
      ],
      hospitals: [
        { name: "宝安区中医院", distance: 800 },
        { name: "恒生医院", distance: 1200 }
      ],
      malls: [
        { name: "西乡天虹", distance: 500 },
        { name: "大仟里", distance: 1000 }
      ]
    },
    {
      community_id: "c014",
      metro: { name: "宝体站", line: "1号线", distance: 400 },
      schools: [
        { name: "宝安小学", type: "小学", distance: 500 },
        { name: "新安中学", type: "初中", distance: 800 }
      ],
      hospitals: [
        { name: "宝安区妇幼保健院", distance: 600 },
        { name: "宝安区人民医院", distance: 1000 }
      ],
      malls: [
        { name: "沃尔玛", distance: 400 },
        { name: "华润万家", distance: 600 }
      ]
    },
    {
      community_id: "c015",
      metro: { name: "坂田站", line: "5号线", distance: 800 },
      schools: [
        { name: "万科城实验学校", type: "九年一贯", distance: 300 },
        { name: "坂田小学", type: "小学", distance: 600 }
      ],
      hospitals: [
        { name: "坂田医院", distance: 700 },
        { name: "深圳市人民医院坂田院区", distance: 1000 }
      ],
      malls: [
        { name: "万科城商业街", distance: 200 },
        { name: "天虹商场", distance: 800 }
      ]
    },
    {
      community_id: "c016",
      metro: { name: "坂田北站", line: "10号线", distance: 500 },
      schools: [
        { name: "科技城外国语学校", type: "九年一贯", distance: 600 },
        { name: "坂田小学", type: "小学", distance: 800 }
      ],
      hospitals: [
        { name: "坂田医院", distance: 500 },
        { name: "龙华人民医院", distance: 1500 }
      ],
      malls: [
        { name: "佳兆业城市广场商业", distance: 100 },
        { name: "天虹", distance: 700 }
      ]
    },
    {
      community_id: "c017",
      metro: { name: "大运站", line: "3/14/16号线", distance: 600 },
      schools: [
        { name: "大运学校", type: "九年一贯", distance: 500 },
        { name: "龙岗外国语学校", type: "九年一贯", distance: 800 }
      ],
      hospitals: [
        { name: "龙岗区中医院", distance: 900 },
        { name: "龙岗中心医院", distance: 1200 }
      ],
      malls: [
        { name: "大运天地", distance: 400 },
        { name: "COCO Park", distance: 800 }
      ]
    },
    {
      community_id: "c018",
      metro: { name: "龙华站", line: "4号线", distance: 350 },
      schools: [
        { name: "龙华中学", type: "高中", distance: 700 },
        { name: "龙华中心小学", type: "小学", distance: 500 }
      ],
      hospitals: [
        { name: "龙华人民医院", distance: 600 },
        { name: "深圳市人民医院龙华分院", distance: 1000 }
      ],
      malls: [
        { name: "壹方天地", distance: 300 },
        { name: "大润发", distance: 600 }
      ]
    },
    {
      community_id: "c019",
      metro: { name: "红山站", line: "4/6号线", distance: 200 },
      schools: [
        { name: "红山学校", type: "九年一贯", distance: 400 },
        { name: "民治中学", type: "初中", distance: 800 }
      ],
      hospitals: [
        { name: "龙华区人民医院", distance: 700 },
        { name: "新华医院", distance: 1000 }
      ],
      malls: [
        { name: "红山6979", distance: 100 },
        { name: "天虹", distance: 500 }
      ]
    },
    {
      community_id: "c020",
      metro: { name: "观澜湖站", line: "4号线", distance: 800 },
      schools: [
        { name: "观澜中学", type: "高中", distance: 1000 },
        { name: "振能小学", type: "小学", distance: 700 }
      ],
      hospitals: [
        { name: "观澜人民医院", distance: 900 },
        { name: "龙华中心医院", distance: 1200 }
      ],
      malls: [
        { name: "观澜湖新城", distance: 600 },
        { name: "观澜天虹", distance: 1000 }
      ]
    }
  ]
};
