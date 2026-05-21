# 深圳购房助手 - 纯前端小程序版产品需求文档

**版本号**：V2.0  
**编写日期**：2026-05-08  
**产品形态**：纯前端微信小程序（无服务器）  
**状态**：定稿

---

## 目录

1. [产品概述](#1-产品概述)
2. [技术方案](#2-技术方案)
3. [数据管理方案](#3-数据管理方案)
4. [AI功能设计](#4-ai功能设计)
5. [功能需求](#5-功能需求)
6. [开发计划](#6-开发计划)
7. [成本分析](#7-成本分析)

---

## 1. 产品概述

### 1.1 核心特点

| 特点 | 说明 |
|------|------|
| **零服务器成本** | 纯前端小程序，无需购买服务器 |
| **AI智能推荐** | 接入大模型API，智能推荐+解释原因 |
| **离线可用** | 数据打包在小程序内，无网络也能查看基础信息 |
| **每周更新** | 每周手动更新数据，保持数据新鲜度 |

### 1.2 产品定位

**一句话描述**：一款基于本地数据+AI智能推荐的深圳购房决策工具。

**核心价值**：
- 🆓 **零成本运营** - 无服务器费用，仅小程序认证费300元/年
- 🤖 **AI智能推荐** - 大模型理解用户需求，给出推荐理由
- 📊 **数据透明** - 基于政府公开数据，客观中立
- 🔄 **每周更新** - 数据定期更新，保持时效性

### 1.3 与原方案对比

| 维度 | 原方案（服务器版） | 新方案（纯前端版） |
|------|------------------|------------------|
| 服务器成本 | ~400元/月 | **0元** |
| 数据更新 | 自动每日更新 | 手动每周更新 |
| 开发复杂度 | 前后端分离 | 仅前端开发 |
| 维护成本 | 高（服务器运维） | 低（仅更新数据） |
| AI能力 | 需自建服务 | 直接调用API |
| 离线能力 | 无 | 有（基础数据） |

---

## 2. 技术方案

### 2.1 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                    微信小程序（纯前端）                        │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                    页面层                            │   │
│  │  首页 │ 需求页 │ 推荐页 │ 详情页 │ 对比页 │ 我的     │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                    数据层（本地）                      │   │
│  │  小区数据.json │ 房价数据.json │ 配套数据.json        │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                    服务层                             │   │
│  │  本地推荐算法 │ AI API调用 │ 数据缓存管理             │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────┬───────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
        ┌──────────┐   ┌──────────┐   ┌──────────┐
        │ AI大模型  │   │ 腾讯地图  │   │ 微信登录 │
        │ API      │   │ SDK      │   │ API     │
        └──────────┘   └──────────┘   └──────────┘
```

### 2.2 技术选型

| 层级 | 技术 | 说明 |
|------|------|------|
| **开发框架** | 微信小程序原生 | 无需学习额外框架，开发效率高 |
| **UI组件** | Vant Weapp | 轻量级，适合工具类小程序 |
| **图表** | ECharts-for-weixin | 微信小程序专用版本 |
| **地图** | 腾讯地图SDK（内置） | 微信小程序内置，免费 |
| **AI服务** | DeepSeek API | 国内直连，免费额度充足 |
| **数据存储** | 小程序本地存储 | 数据打包在小程序内 |

### 2.3 AI服务选择

**推荐：DeepSeek API**

| 对比项 | DeepSeek | 通义千问 | 智谱GLM | 豆包 |
|--------|----------|---------|---------|------|
| 免费额度 | 500万tokens/月 | 100万tokens/月 | 100万tokens/月 | 50万tokens/月 |
| 国内直连 | ✅ | ✅ | ✅ | ✅ |
| API稳定性 | 高 | 高 | 高 | 中 |
| 价格（超出后） | 1元/百万tokens | 2元/百万tokens | 2元/百万tokens | 3元/百万tokens |
| **推荐度** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |

**DeepSeek API 接入方式**：
```javascript
// 小程序中调用示例
wx.request({
  url: 'https://api.deepseek.com/v1/chat/completions',
  method: 'POST',
  header: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_API_KEY'
  },
  data: {
    model: 'deepseek-chat',
    messages: [
      { role: 'system', content: '你是一个专业的购房顾问...' },
      { role: 'user', content: '我的需求是...' }
    ]
  }
})
```

---

## 3. 数据管理方案

### 3.1 数据下载流程（每周执行）

```
每周数据更新流程
│
├── 周一：数据下载
│   ├── 1. 登录深圳政府数据开放平台
│   ├── 2. 下载二手房成交数据（CSV）
│   ├── 3. 下载一手房成交数据（CSV）
│   ├── 4. 下载城市更新单元计划
│   └── 5. 整理学区划分信息（各区教育局官网）
│
├── 周二：数据处理
│   ├── 1. 运行数据处理脚本
│   ├── 2. 清洗异常数据
│   ├── 3. 计算小区均价
│   ├── 4. 生成JSON数据文件
│   └── 5. 压缩数据（减小体积）
│
├── 周三：数据验证
│   ├── 1. 抽样检查数据准确性
│   ├── 2. 对比上周数据变化
│   ├── 3. 标注异常数据
│   └── 4. 生成数据报告
│
├── 周四：小程序更新
│   ├── 1. 替换小程序内数据文件
│   ├── 2. 更新数据版本号
│   ├── 3. 本地测试验证
│   └── 4. 提交微信审核
│
└── 周五：发布上线
    ├── 1. 审核通过后发布
    ├── 2. 用户自动更新
    └── 3. 监控用户反馈
```

### 3.2 数据文件结构

```
小程序数据目录（/data/）
│
├── communities.json          # 小区基础信息（约500KB）
│   ├── 版本信息
│   ├── 更新时间
│   └── 小区列表[]
│       ├── id
│       ├── name
│       ├── district
│       ├── address
│       ├── longitude
│       ├── latitude
│       ├── build_year
│       ├── total_households
│       └── ...
│
├── prices.json               # 房价数据（约200KB）
│   ├── 版本信息
│   ├── 更新时间
│   └── 价格数据[]
│       ├── community_id
│       ├── current_avg_price
│       ├── price_history[6个月]
│       ├── yoy_change
│       └── mom_change
│
├── facilities.json           # 配套数据（约300KB）
│   ├── 版本信息
│   ├── 更新时间
│   └── 配套数据[]
│       ├── community_id
│       ├── metro: {name, distance}
│       ├── schools: []
│       ├── hospitals: []
│       └── malls: []
│
├── districts.json            # 区域统计（约50KB）
│   └── 各区房价、成交量统计
│
└── meta.json                 # 元数据
    ├── data_version: "2026.05.08"
    ├── update_date: "2026-05-08"
    ├── total_communities: 3500
    ├── price_range: {min, max}
    └── data_source: "深圳政府数据开放平台"
```

### 3.3 数据处理脚本

```python
# data_processor.py - 每周数据处理脚本

import pandas as pd
import json
from datetime import datetime

def process_weekly_data():
    """
    每周数据处理主流程
    """
    # 1. 读取政府数据
    secondhand_df = pd.read_csv('download/二手房成交信息.csv')
    newhouse_df = pd.read_csv('download/一手商品房成交信息.csv')
    
    # 2. 处理小区数据
    communities = process_communities(secondhand_df)
    
    # 3. 计算房价数据
    prices = calculate_prices(secondhand_df)
    
    # 4. 获取配套数据（调用地图API）
    facilities = get_facilities(communities)
    
    # 5. 生成JSON文件
    save_to_json(communities, 'communities.json')
    save_to_json(prices, 'prices.json')
    save_to_json(facilities, 'facilities.json')
    
    # 6. 生成元数据
    meta = {
        'data_version': datetime.now().strftime('%Y.%m.%d'),
        'update_date': datetime.now().strftime('%Y-%m-%d'),
        'total_communities': len(communities),
        'data_source': '深圳政府数据开放平台'
    }
    save_to_json(meta, 'meta.json')
    
    print(f"数据处理完成，共{len(communities)}个小区")

def calculate_prices(df):
    """
    计算小区均价
    """
    # 按小区分组，计算近6个月均价
    price_data = df.groupby('community_id').agg({
        'price': 'mean',
        'deal_date': 'count'
    }).reset_index()
    
    return price_data.to_dict('records')

if __name__ == '__main__':
    process_weekly_data()
```

### 3.4 数据体积控制

| 数据类型 | 原始大小 | 压缩后 | 优化策略 |
|---------|---------|--------|---------|
| 小区基础信息 | 2MB | 500KB | 精简字段、压缩JSON |
| 房价数据 | 1MB | 200KB | 仅保留近6个月数据 |
| 配套数据 | 1.5MB | 300KB | 仅保留核心配套 |
| **总计** | **4.5MB** | **~1MB** | 小程序包限制20MB |

---

## 4. AI功能设计

### 4.1 AI智能推荐流程

```
用户输入需求
      │
      ▼
┌─────────────────────────────────────┐
│         本地初步筛选                  │
│  根据预算、面积、区域等硬性条件        │
│  筛选出候选小区（约20-50个）           │
└─────────────────┬───────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│         AI深度分析                   │
│  将用户需求+候选小区发送给AI          │
│  AI分析匹配度并给出推荐理由           │
└─────────────────┬───────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│         结果展示                     │
│  展示TOP10推荐小区                   │
│  每个小区附带AI推荐理由               │
└─────────────────────────────────────┘
```

### 4.2 AI Prompt设计

```javascript
// AI推荐Prompt模板
const SYSTEM_PROMPT = `
你是一位专业的深圳购房顾问，拥有10年从业经验。
你的任务是根据用户需求，从候选小区中推荐最合适的3-5个小区。

你需要：
1. 分析用户的核心需求
2. 评估每个候选小区的匹配度
3. 给出推荐理由（每个小区2-3条）
4. 提供购房建议

输出格式（JSON）：
{
  "recommendations": [
    {
      "community_id": "小区ID",
      "match_score": 95,
      "reasons": ["理由1", "理由2", "理由3"]
    }
  ],
  "advice": "整体购房建议"
}
`;

const USER_PROMPT_TEMPLATE = `
用户需求：
- 预算：{min_budget}万 - {max_budget}万
- 面积：{min_area}平 - {max_area}平
- 户型：{layouts}
- 核心诉求：{priorities}
- 工作地点：{work_location}

候选小区列表：
{candidate_communities}

请分析并推荐最合适的小区。
`;
```

### 4.3 AI调用示例代码

```javascript
// utils/ai-service.js

const DEEPSEEK_API = 'https://api.deepseek.com/v1/chat/completions';
const API_KEY = 'YOUR_API_KEY'; // 建议从安全的地方获取

/**
 * AI智能推荐
 * @param {Object} userRequirement 用户需求
 * @param {Array} candidates 候选小区列表
 */
async function getAIRecommendation(userRequirement, candidates) {
  // 构建Prompt
  const userPrompt = buildUserPrompt(userRequirement, candidates);
  
  try {
    const res = await wx.request({
      url: DEEPSEEK_API,
      method: 'POST',
      header: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      data: {
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 2000
      }
    });
    
    // 解析AI返回结果
    const aiResponse = JSON.parse(res.data.choices[0].message.content);
    return aiResponse;
    
  } catch (error) {
    console.error('AI调用失败:', error);
    // 降级：使用本地算法
    return localRecommendation(userRequirement, candidates);
  }
}

/**
 * 本地推荐算法（降级方案）
 */
function localRecommendation(requirement, candidates) {
  return candidates.map(c => ({
    community_id: c.id,
    match_score: calculateMatchScore(c, requirement),
    reasons: generateReasons(c, requirement)
  })).sort((a, b) => b.match_score - a.match_score).slice(0, 10);
}
```

### 4.4 AI费用估算

| 场景 | Token消耗 | 费用（DeepSeek） |
|------|----------|-----------------|
| 单次推荐请求 | ~2000 tokens | 0.002元 |
| 日均100次请求 | ~20万 tokens | 0.2元 |
| 月均3000次请求 | ~60万 tokens | 0.6元 |
| **免费额度** | 500万 tokens/月 | **完全免费** |

> **结论**：DeepSeek免费额度完全够用，每月可支持约2500次AI推荐请求。

---

## 5. 功能需求

### 5.1 页面结构

```
深圳购房助手（纯前端版）
│
├── pages/
│   ├── index/                    # 首页
│   │   ├── 数据版本提示
│   │   ├── 快速入口（开始匹配）
│   │   ├── 热门小区（本地排序）
│   │   └── 市场概况（本地统计）
│   │
│   ├── requirement/              # 需求填写页
│   │   ├── 预算设置（slider）
│   │   ├── 面积需求（slider）
│   │   ├── 户型选择（grid）
│   │   ├── 核心诉求（tag多选）
│   │   └── 工作地点（可选）
│   │
│   ├── recommendation/           # 推荐结果页
│   │   ├── AI分析中（loading）
│   │   ├── 推荐小区列表
│   │   ├── AI推荐理由（每个小区）
│   │   ├── AI购房建议
│   │   └── 重新匹配按钮
│   │
│   ├── community-detail/         # 小区详情页
│   │   ├── 基本信息
│   │   ├── 房价走势（echarts）
│   │   ├── 周边配套（地图）
│   │   ├── AI优缺点分析（可选）
│   │   └── 收藏按钮
│   │
│   ├── compare/                  # 对比页
│   │   ├── 选择对比小区
│   │   ├── 对比表格
│   │   └── AI对比分析（可选）
│   │
│   └── profile/                  # 我的
│       ├── 收藏列表
│       ├── 浏览历史
│       ├── 数据版本信息
│       └── 关于我们
│
├── data/                         # 本地数据
│   ├── communities.json
│   ├── prices.json
│   ├── facilities.json
│   └── meta.json
│
└── utils/                        # 工具函数
    ├── data-loader.js           # 数据加载
    ├── local-recommend.js       # 本地推荐算法
    ├── ai-service.js            # AI服务
    └── storage.js               # 本地存储
```

### 5.2 核心功能流程

#### 5.2.1 智能推荐流程

```
用户点击"开始匹配"
        │
        ▼
   需求填写页面
   （预算、面积、户型、诉求）
        │
        ▼
   点击"获取推荐"
        │
        ▼
┌───────────────────────┐
│   本地初步筛选         │
│   根据硬性条件过滤     │
│   得到候选小区(20-50个)│
└───────────┬───────────┘
            │
            ▼
┌───────────────────────┐
│   调用AI API          │
│   发送需求+候选小区    │
│   显示"AI分析中..."    │
└───────────┬───────────┘
            │
      ┌─────┴─────┐
      ▼           ▼
   AI成功      AI失败
      │           │
      ▼           ▼
 显示AI推荐   降级本地推荐
      │           │
      └─────┬─────┘
            │
            ▼
   推荐结果页
   （TOP10 + 推荐理由）
```

### 5.3 数据更新提示

```javascript
// app.js - 启动时检查数据版本

onLaunch() {
  this.checkDataVersion();
}

async checkDataVersion() {
  // 读取本地数据版本
  const localVersion = wx.getStorageSync('data_version');
  const currentVersion = require('./data/meta.json').data_version;
  
  if (localVersion !== currentVersion) {
    // 显示更新提示
    wx.showModal({
      title: '数据已更新',
      content: `最新数据版本：${currentVersion}\n数据更新时间：每周四`,
      showCancel: false,
      confirmText: '知道了'
    });
    
    // 保存新版本号
    wx.setStorageSync('data_version', currentVersion);
  }
}
```

---

## 6. 开发计划

### 6.1 开发阶段（共8周）

```
第1周：环境准备 + 数据处理
├── Day1-2：注册小程序账号、申请AI API
├── Day3-4：编写数据处理脚本
├── Day5-6：下载首批数据、处理成JSON
└── Day7：测试数据脚本

第2周：核心页面开发
├── 首页（快速入口、热门小区）
├── 需求填写页（表单组件）
└── 本地数据加载功能

第3周：推荐功能开发
├── 本地筛选算法
├── AI API集成
├── 推荐结果页
└── 降级方案

第4周：详情页开发
├── 小区详情页
├── 房价走势图（echarts）
├── 周边配套地图
└── 收藏功能

第5周：辅助功能开发
├── 对比功能
├── 我的页面
├── 浏览历史
└── 分享功能

第6周：优化与测试
├── 性能优化（数据加载）
├── UI美化
├── 真机测试
└── Bug修复

第7周：首批数据完善
├── 完善小区数据（补充缺失信息）
├── 获取配套数据（地图API）
├── 数据验证
└── 数据压缩

第8周：上线准备
├── 提交审核
├── 准备宣传素材
├── 审核通过后发布
└── 收集用户反馈
```

### 6.2 每周数据更新流程（上线后）

```
每周四固定流程（约1小时）

Step 1：下载数据（15分钟）
├── 登录深圳政府数据开放平台
├── 下载最新成交数据
└── 下载其他相关数据

Step 2：运行脚本（10分钟）
├── python data_processor.py
├── 检查输出日志
└── 验证数据质量

Step 3：更新小程序（15分钟）
├── 替换data目录下JSON文件
├── 更新meta.json版本号
└── 本地测试验证

Step 4：提交审核（5分钟）
├── 微信开发者工具上传代码
├── 填写版本说明
└── 提交审核

Step 5：发布上线（审核通过后）
├── 点击发布
└── 用户自动更新
```

---

## 7. 成本分析

### 7.1 开发成本

| 项目 | 费用 | 说明 |
|------|------|------|
| 小程序认证 | 300元/年 | 微信官方收取 |
| 域名 | 0元 | 不需要 |
| 服务器 | 0元 | 纯前端 |
| 数据库 | 0元 | 本地存储 |
| AI API | 0元 | DeepSeek免费额度够用 |
| 地图API | 0元 | 腾讯地图小程序内置 |
| **总计** | **300元/年** | 仅小程序认证费 |

### 7.2 时间成本

| 阶段 | 时间投入 |
|------|---------|
| 开发阶段（8周） | 每周10-15小时 |
| 上线后维护 | 每周1小时（数据更新） |
| AI调优 | 按需（优化Prompt） |

### 7.3 与原方案成本对比

| 项目 | 原方案（服务器版） | 新方案（纯前端版） |
|------|------------------|------------------|
| 年度成本 | ~5000元 | **300元** |
| 开发周期 | 12周 | **8周** |
| 维护难度 | 高 | **低** |
| 数据时效性 | 每日更新 | 每周更新 |

---

## 8. 风险与对策

### 8.1 技术风险

| 风险 | 影响 | 对策 |
|------|------|------|
| AI API调用失败 | 推荐功能不可用 | 本地算法降级方案 |
| 数据包体积过大 | 小程序包超限 | 数据压缩、分片加载 |
| 小程序审核不通过 | 无法上线 | 提前了解审核规范 |
| AI推荐质量不佳 | 用户体验差 | 持续优化Prompt |

### 8.2 数据风险

| 风险 | 影响 | 对策 |
|------|------|------|
| 政府数据格式变化 | 数据处理失败 | 脚本增加容错逻辑 |
| 数据下载受限 | 无法更新数据 | 多渠道备份 |
| 数据质量问题 | 推荐不准确 | 数据验证+人工抽查 |

### 8.3 业务风险

| 风险 | 影响 | 对策 |
|------|------|------|
| 用户增长超预期 | AI额度不够 | 升级付费套餐或换模型 |
| 竞品出现 | 用户流失 | 快速迭代，建立壁垒 |
| 数据更新不及时 | 用户投诉 | 固定更新时间，提前通知 |

---

## 9. 附录

### 9.1 数据下载清单

| 数据 | 来源 | 下载频率 | 格式 |
|------|------|---------|------|
| 二手房成交信息 | 深圳政府数据开放平台 | 每周 | CSV |
| 一手商品房成交信息 | 深圳政府数据开放平台 | 每周 | CSV |
| 城市更新单元计划 | 深圳政府数据开放平台 | 每月 | CSV |
| 学区划分信息 | 各区教育局官网 | 每年5月 | PDF/网页 |
| 地铁站点信息 | 深圳地铁官网 | 不定期 | 网页 |

### 9.2 AI Prompt优化建议

```
优化方向：
1. 增加深圳房地产市场背景知识
2. 加入各区域特点描述
3. 考虑学区、地铁等因素的权重
4. 输出更人性化的推荐理由

示例优化Prompt：
"""
你是深圳购房专家，熟悉深圳各区域特点：
- 福田：金融中心，配套成熟，学区优质
- 南山：科技中心，年轻人多，房价较高
- 宝安：发展迅速，性价比高，地铁便利
- 龙岗：价格亲民，适合刚需，通勤较远
...

请根据用户需求，结合区域特点给出推荐。
"""
```

### 9.3 变更记录

| 版本 | 日期 | 变更内容 |
|------|------|---------|
| V2.0 | 2026-05-08 | 纯前端小程序版，新增AI推荐、数据管理方案 |

---

**文档结束**
