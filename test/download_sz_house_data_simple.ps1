# 深圳政府数据开放平台 - 房地产成交数据下载脚本
# 下载最近半年的二手房和一手商品房成交信息

# API配置
$APP_KEY = "ab3cbc0e4b574adda096b3b47be57afa"

# 设置输出目录
$OUTPUT_DIR = "d:\buy\ai赚钱计划\ai-house-analyzer\data"
if (!(Test-Path $OUTPUT_DIR)) {
    New-Item -ItemType Directory -Path $OUTPUT_DIR -Force | Out-Null
}

$TODAY = Get-Date -Format "yyyyMMdd"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "深圳房地产成交数据下载工具" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# 下载二手房数据
Write-Host "`n【1】下载二手房成交信息..." -ForegroundColor Cyan

$secondHandUrl = "https://opendata.sz.gov.cn/api/29200_01903513/1/service.xhtml?page=1&rows=100000&appKey=$APP_KEY" -replace '&', '&'
try {
    $response = Invoke-WebRequest -Uri $secondHandUrl -UseBasicParsing -TimeoutSec 60
    $data = $response.Content | ConvertFrom-Json
    
    if ($data.data) {
        $allData = $data.data
        Write-Host "获取到 $($allData.Count) 条二手房成交记录" -ForegroundColor Green
        
        # 筛选最近半年数据
        $halfYearAgo = (Get-Date).AddDays(-180)
        $recentData = $allData | Where-Object { 
            $dateStr = $_.TJ_DATE -replace "/", "-"
            try {
                $itemDate = [DateTime]::ParseExact($dateStr, "yyyy-MM-dd", $null)
                $itemDate -ge $halfYearAgo
            } catch { $true }
        }
        
        Write-Host "最近半年数据: $($recentData.Count) 条" -ForegroundColor Cyan
        
        # 保存为JSON
        $jsonFile = Join-Path $OUTPUT_DIR "second_hand_house_$TODAY.json"
        $recentData | ConvertTo-Json -Depth 10 | Out-File $jsonFile -Encoding UTF8
        Write-Host "JSON文件已保存: $jsonFile" -ForegroundColor Green
        
        # 保存为CSV
        $csvFile = Join-Path $OUTPUT_DIR "second_hand_house_$TODAY.csv"
        $recentData | Export-Csv $csvFile -NoTypeInformation -Encoding UTF8
        Write-Host "CSV文件已保存: $csvFile" -ForegroundColor Green
    }
} catch {
    Write-Host "下载二手房数据失败: $_" -ForegroundColor Red
}

# 下载一手商品房数据
Write-Host "`n【2】下载一手商品房成交信息..." -ForegroundColor Cyan

$newHouseUrl = "https://opendata.sz.gov.cn/api/29200_01903510/1/service.xhtml?page=1&rows=100000&appKey=$APP_KEY" -replace '&', '&'
try {
    $response = Invoke-WebRequest -Uri $newHouseUrl -UseBasicParsing -TimeoutSec 60
    $data = $response.Content | ConvertFrom-Json
    
    if ($data.data) {
        $allData = $data.data
        Write-Host "获取到 $($allData.Count) 条一手商品房成交记录" -ForegroundColor Green
        
        # 筛选最近半年数据
        $halfYearAgo = (Get-Date).AddDays(-180)
        $recentData = $allData | Where-Object { 
            $dateStr = $_.TJ_DATE -replace "/", "-"
            try {
                $itemDate = [DateTime]::ParseExact($dateStr, "yyyy-MM-dd", $null)
                $itemDate -ge $halfYearAgo
            } catch { $true }
        }
        
        Write-Host "最近半年数据: $($recentData.Count) 条" -ForegroundColor Cyan
        
        # 保存为JSON
        $jsonFile = Join-Path $OUTPUT_DIR "new_house_$TODAY.json"
        $recentData | ConvertTo-Json -Depth 10 | Out-File $jsonFile -Encoding UTF8
        Write-Host "JSON文件已保存: $jsonFile" -ForegroundColor Green
        
        # 保存为CSV
        $csvFile = Join-Path $OUTPUT_DIR "new_house_$TODAY.csv"
        $recentData | Export-Csv $csvFile -NoTypeInformation -Encoding UTF8
        Write-Host "CSV文件已保存: $csvFile" -ForegroundColor Green
    }
} catch {
    Write-Host "下载一手商品房数据失败: $_" -ForegroundColor Red
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "数据下载完成！" -ForegroundColor Cyan
Write-Host "输出目录: $OUTPUT_DIR" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
