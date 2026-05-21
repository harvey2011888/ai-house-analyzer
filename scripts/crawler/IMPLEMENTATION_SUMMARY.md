# 贝壳找房数据爬取 - 实现总结

## 完成的工作

### ✅ Phase 1: 基础爬虫框架

| 文件 | 功能 |
|-----|------|
| `config.js` | 爬虫配置（目标网站、区域列表、URL模板、爬取参数） |
| `anti-detect.js` | 反爬策略（随机延迟、UA轮换、浏览器指纹、重试机制） |
| `base-crawler.js` | 基础爬虫类（浏览器管理、数据保存、并发控制） |

**核心功能**:
- 随机延迟 2-5 秒
- User-Agent 轮换
- 浏览器指纹模拟（隐藏 webdriver）
- 失败重试 3 次
- 并发控制（最多3个）

---

### ✅ Phase 2: 小区列表爬取

| 文件 | 功能 |
|-----|------|
| `community-list-crawler.js` | 爬取贝壳找房小区列表页面 |

**功能**:
- 支持深圳10个区域（福田、南山、罗湖、宝安、龙岗、龙华、盐田、坪山、光明、大鹏）
- 自动分页处理
- 数据去重合并
- 断点续传

**输出**: `data/crawled/communities.json`

---

### ✅ Phase 3: 小区详情爬取

| 文件 | 功能 |
|-----|------|
| `detail-crawler.js` | 爬取小区详情页面 |

**功能**:
- 详细地址、建成年份、总户数
- 户型分布、平均面积
- 地铁信息
- 经纬度坐标（如有）
- 断点续传（每10个保存一次）

**输出**: 更新 `data/crawled/communities.json`

---

### ✅ Phase 4: 成交记录爬取（最近半年）

| 文件 | 功能 |
|-----|------|
| `transaction-crawler.js` | 爬取小区成交记录 |

**功能**:
- 仅爬取最近6个月成交记录
- 自动时间筛选（超出范围停止翻页）
- 成交价格、单价、面积、户型、楼层
- 按小区聚合统计

**输出**: `data/crawled/transactions.json`

---

### ✅ Phase 5: 数据合并与更新

| 文件 | 功能 |
|-----|------|
| `data-merger.js` | 合并所有数据并生成小程序可用文件 |

**功能**:
- 合并小区数据 + 成交记录
- 计算半年成交均价
- 生成价格历史（6个月）
- 生成配套设施数据
- 生成统计报告

**输出**:
- `data/crawled/merged-data.json` - 完整数据
- `data/preloaded-data.js` - 小程序可直接使用
- `data/crawled/report.json` - 统计报告

---

### ✅ Phase 6: 定时任务与监控

| 文件 | 功能 |
|-----|------|
| `schedule.js` | 定时任务服务 |
| `README.md` | 使用文档 |

**功能**:
- 每周日 02:00 全量更新
- 每天 03:00 增量更新（成交记录）
- 日志记录
- 支持 Windows/Linux/Mac 定时任务

---

## 文件结构

```
scripts/crawler/
├── config.js                 # 配置文件
├── anti-detect.js            # 反爬策略
├── base-crawler.js           # 基础爬虫类
├── community-list-crawler.js # 小区列表爬虫
├── detail-crawler.js         # 详情页爬虫
├── transaction-crawler.js    # 成交记录爬虫
├── data-merger.js            # 数据合并工具
├── schedule.js               # 定时任务
├── index.js                  # 入口文件
└── README.md                 # 使用文档

data/
├── crawled/                  # 爬取数据（.gitignore）
│   ├── communities.json
│   ├── transactions.json
│   ├── merged-data.json
│   ├── report.json
│   ├── last-update.json
│   └── schedule.log
└── preloaded-data.js         # 小程序数据
```

---

## 使用方法

### 安装依赖
```bash
npm install puppeteer cheerio node-cron
```

### 完整爬取
```bash
node scripts/crawler/index.js --full
```

### 测试模式（10个小区）
```bash
node scripts/crawler/index.js --full --limit 10
```

### 定时服务
```bash
node scripts/crawler/schedule.js
```

---

## 数据流程

```
用户执行爬虫
    ↓
1. 爬取小区列表 → communities.json
    ↓
2. 爬取小区详情 → 更新 communities.json
    ↓
3. 爬取成交记录 → transactions.json（最近6个月）
    ↓
4. 合并数据 → merged-data.json + preloaded-data.js
    ↓
小程序使用 preloaded-data.js
```

---

## 核心特性

1. **数据准确性**: 基于真实成交记录计算均价
2. **时间范围**: 仅最近6个月，数据新鲜
3. **反爬策略**: 多重保护，降低被封风险
4. **断点续传**: 中断后可继续，不丢失进度
5. **定时更新**: 自动化维护数据新鲜度
6. **数据格式**: 直接生成小程序可用格式

---

## 待优化项（可选）

1. **代理池**: 大量爬取时使用IP代理
2. **验证码识别**: 接入打码平台
3. **数据校验**: 更多规则确保数据质量
4. **可视化**: 数据更新仪表盘
5. **通知**: 更新完成邮件/微信通知

---

## 注意事项

1. **首次运行**: 完整流程约需 2-4 小时
2. **增量更新**: 每天仅需 10-30 分钟
3. **法律合规**: 仅供学习研究，遵守 robots.txt
4. **数据准确性**: 价格仅供参考，以实际看房为准

---

## 运行环境要求

- Node.js 14+
- Puppeteer（会自动下载 Chromium）
- 网络连接（访问贝壳找房）
- 磁盘空间（约 100MB 数据文件）

---

**实现完成时间**: 2026-05-10
**版本**: v1.0
