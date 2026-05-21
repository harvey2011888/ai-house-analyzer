# 数据更新脚本

## 说明

本项目支持两种数据获取方案：

### 方案1：启动时从API获取（默认）
- 小程序启动时自动从深圳政府数据平台获取最近半年数据
- 数据存储在本地缓存中
- 适合数据实时性要求高的场景

### 方案2：预下载数据打包（推荐）
- 通过脚本提前下载数据，打包进项目
- 无需等待API响应，启动更快
- 适合数据稳定性要求高的场景
- **建议每周运行一次更新数据**

---

## 使用方法

### 方案2：预下载数据

1. **运行下载脚本**
   ```bash
   cd scripts
   node download-data.js
   ```

2. **脚本会生成数据文件**
   - 输出文件：`utils/preloaded-data.js`
   - 包含：小区数据、价格数据、成交数据、配套设施

3. **重新编译小程序**
   - 在微信开发者工具中点击「编译」
   - 小程序会自动使用预下载的数据

### 自动化更新（可选）

可以设置定时任务每周自动更新：

**Windows (PowerShell)**
```powershell
# 创建定时任务，每周一上午9点运行
$action = New-ScheduledTaskAction -Execute "node" -Argument "D:\buy\ai赚钱计划\ai-house-analyzer\scripts\download-data.js"
$trigger = New-ScheduledTaskTrigger -Weekly -DaysOfWeek Monday -At 9am
Register-ScheduledTask -Action $action -Trigger $trigger -TaskName "Update Shenzhen House Data"
```

**Mac/Linux (crontab)**
```bash
# 编辑 crontab
crontab -e

# 添加每周一上午9点运行的任务
0 9 * * 1 cd /path/to/ai-house-analyzer/scripts && node download-data.js
```

---

## 数据来源

- **一手商品房成交信息**：深圳市政府数据开放平台
  - 接口ID：`29200_01903510`
  - 更新频率：按日
  
- **二手房成交信息**：深圳市政府数据开放平台
  - 接口ID：`29200_01903513`
  - 更新频率：按日

---

## 数据范围

- 默认获取最近 **6个月** 的成交数据
- 可在 `download-data.js` 中修改 `monthsToFetch` 配置

---

## 故障排查

### 下载失败

1. **检查网络连接**
   ```bash
   ping opendata.sz.gov.cn
   ```

2. **检查API Key**
   - 确认 `download-data.js` 中的 `appKey` 正确
   - 在 [深圳政府数据开放平台](https://opendata.sz.gov.cn) 个人中心查看

3. **检查接口订阅**
   - 确认已订阅以下接口：
     - 一手商品房成交信息（按日统计）
     - 二手房成交信息（按日统计）

### 数据不更新

1. 删除旧的 `utils/preloaded-data.js` 文件
2. 重新运行下载脚本
3. 在微信开发者工具中清除缓存并重新编译
