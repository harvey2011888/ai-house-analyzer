# 贝壳找房数据爬取工具

从贝壳找房爬取深圳小区数据和成交记录，用于深圳购房助手小程序。

## 功能特性

- ✅ 小区列表爬取（深圳10个区，3000+小区）
- ✅ 小区详情爬取（地址、年代、户型、地铁等）
- ✅ 成交记录爬取（最近6个月）
- ✅ 数据合并与格式化
- ✅ 反爬策略（随机延迟、UA轮换、浏览器指纹）
- ✅ 定时自动更新
- ✅ 断点续传

## 安装依赖

```bash
cd scripts/crawler
npm install puppeteer cheerio node-cron
```

## 使用方法

### 完整流程（推荐）

```bash
node scripts/crawler/index.js --full
```

执行4个阶段：
1. 爬取小区列表
2. 爬取小区详情
3. 爬取成交记录（最近半年）
4. 合并数据并生成小程序可用文件

### 分阶段执行

```bash
# 仅爬取小区列表
node scripts/crawler/index.js --list

# 仅爬取小区详情
node scripts/crawler/index.js --detail

# 仅爬取成交记录
node scripts/crawler/index.js --transaction

# 仅合并数据
node scripts/crawler/index.js --merge
```

### 指定区域

```bash
# 仅爬取南山区
node scripts/crawler/index.js --list --district 南山

# 支持区域：福田、南山、罗湖、宝安、龙岗、龙华、盐田、坪山、光明、大鹏新区
```

### 测试模式

```bash
# 仅爬取10个小区（用于测试）
node scripts/crawler/index.js --full --limit 10

# 显示浏览器窗口（调试用）
node scripts/crawler/index.js --full --limit 10 --headed
```

### 定时任务

```bash
# 启动定时服务
node scripts/crawler/schedule.js
```

定时任务配置：
- 每周日 02:00 - 全量更新
- 每天 03:00 - 增量更新（成交记录）

### 系统定时任务（Windows）

```powershell
# 创建每周日运行的任务
schtasks /create /tn "贝壳找房数据更新" /tr "node D:\buy\ai赚钱计划\ai-house-analyzer\scripts\crawler\index.js --full" /sc weekly /d SUN /st 02:00
```

### 系统定时任务（Linux/Mac）

```bash
# 编辑 crontab
crontab -e

# 每周日凌晨2点执行
0 2 * * 0 cd /path/to/project && node scripts/crawler/index.js --full

# 每天凌晨3点执行增量更新
0 3 * * * cd /path/to/project && node scripts/crawler/index.js --transaction
```

## 输出文件

```
data/
├── crawled/
│   ├── communities.json      # 小区基础信息
│   ├── transactions.json     # 成交记录（最近半年）
│   ├── merged-data.json      # 合并后的完整数据
│   ├── report.json           # 统计报告
│   ├── last-update.json      # 更新时间戳
│   └── schedule.log          # 定时任务日志
└── preloaded-data.js         # 小程序可直接使用的数据文件
```

## 数据格式

### 小区数据
```javascript
{
  id: "bk_123456",
  name: "华润城",
  district: "南山",
  address: "深圳市南山区深南大道",
  longitude: 113.9432,
  latitude: 22.5401,
  build_year: 2015,
  total_households: 3500,
  layout_types: ["2室", "3室", "4室"],
  avg_area: 115,
  property_type: "住宅",
  avg_price: 128000,  // 基于半年成交均价
  subway: "1号线高新园站",
  deal_count_6m: 15,  // 近6个月成交套数
  source: "贝壳找房",
  crawl_time: "2026-05-10T10:00:00Z"
}
```

### 成交记录
```javascript
{
  id: "cj_bk_123456_20260415_0",
  communityId: "bk_123456",
  communityName: "华润城",
  district: "南山",
  dealDate: "2026-04-15",
  dealPrice: 13500000,
  unitPrice: 128571,
  area: 105,
  layout: "3室2厅",
  floor: "中楼层",
  source: "贝壳找房"
}
```

## 反爬策略

1. **随机延迟**: 每页间隔 2-5 秒
2. **User-Agent轮换**: 模拟不同浏览器
3. **浏览器指纹**: 隐藏 webdriver 特征
4. **重试机制**: 失败自动重试 3 次
5. **并发控制**: 最多 3 个并发请求

## 注意事项

1. **首次运行**: 完整流程可能需要 2-4 小时（取决于网络）
2. **增量更新**: 每天仅需 10-30 分钟
3. **数据准确性**: 价格数据仅供参考，以实际看房为准
4. **法律合规**: 仅供学习研究，遵守 robots.txt

## 故障排查

### 爬取失败

```bash
# 检查网络连接
ping sz.ke.com

# 测试单个区域
node scripts/crawler/index.js --list --district 南山 --headed

# 查看日志
type data\crawled\schedule.log
```

### 数据不完整

```bash
# 重新爬取详情
node scripts/crawler/index.js --detail

# 重新合并数据
node scripts/crawler/index.js --merge
```

## 更新日志

- **2026-05-10**: 初始版本，支持基础爬取和定时任务
