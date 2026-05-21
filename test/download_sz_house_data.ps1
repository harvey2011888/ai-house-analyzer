# 深圳政府数据开放平台 - 房地产成交数据下载脚本
# 下载最近半年的二手房和一手商品房成交信息

# API配置
$BASE_URL = "https://opendata.sz.gov.cn/api"
$APP_KEY = "ab3cbc0e4b574adda096b3b47be57afa"

# 数据集ID
$SECOND_HAND_API_ID = "29200_01903513"  # 二手房成交信息
$NEW_HOUSE_API_ID = "29200_01903510"    # 一手商品房成交信息

# 请求参数
$PAGE_SIZE = 1000  # 每页最大记录数

# 设置输出目录
$OUTPUT_DIR = Join-Path $PSScriptRoot ".." "data"
if (!(Test-Path $OUTPUT_DIR)) {
    New-Item -ItemType Directory -Path $OUTPUT_DIR -Force | Out-Null
}

# 获取当前日期
$TODAY = Get-Date -Format "yyyyMMdd"

function Fetch-Data {
    param(
        [string]$ApiId,
        [int]$Page = 1,
        [int]$Rows = 1000
    )
    
    $url = "$BASE_URL/$ApiId/1/service.xhtml?page=$Page&rows=$Rows&appKey=$APP_KEY"
    
    try {
        $response = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 30
        return $response.Content | ConvertFrom-Json
    }
    catch {
        Write-Host "请求失败: $_" -ForegroundColor Red
        return $null
    }
}

function Fetch-AllData {
    param(
        [string]$ApiId,
        [string]$DataName
    )
    
    $allData = @()
    $page = 1
    
    Write-Host "开始获取 $DataName 数据..." -ForegroundColor Cyan
    
    while ($true) {
        Write-Host "  正在获取第 $page 页数据..."
        
        $result = Fetch-Data -ApiId $ApiId -Page $page -Rows $PAGE_SIZE
        
        if ($null -eq $result -or $null -eq $result.data) {
            Write-Host "  第 $page 页无数据，停止获取" -ForegroundColor Yellow
            break
        }
        
        $data = $result.data
        if ($data.Count -eq 0) {
            Write-Host "  第 $page 页数据为空，停止获取" -ForegroundColor Yellow
            break
        }
        
        $allData += $data
        Write-Host "  第 $page 页获取成功，本页 $($data.Count) 条记录，总计 $($allData.Count) 条" -ForegroundColor Green
        
        # 如果本页数据少于PAGE_SIZE，说明已经获取完所有数据
        if ($data.Count -lt $PAGE_SIZE) {
            break
        }
        
        $page++
    }
    
    Write-Host "$DataName 数据获取完成，共 $($allData.Count) 条记录" -ForegroundColor Cyan
    return $allData
}

function Filter-RecentHalfYear {
    param(
        [array]$Data,
        [string]$DateField = "TJ_DATE"
    )
    
    # 计算半年前的日期
    $halfYearAgo = (Get-Date).AddDays(-180)
    
    $filteredData = @()
    foreach ($item in $Data) {
        $dateStr = $item.$DateField
        if ([string]::IsNullOrEmpty($dateStr)) {
            continue
        }
        
        try {
            # 尝试解析日期（格式可能是 YYYY-MM-DD 或 YYYY/MM/DD）
            $dateStr = $dateStr -replace "/", "-"
            $itemDate = [DateTime]::ParseExact($dateStr, "yyyy-MM-dd", $null)
            
            if ($itemDate -ge $halfYearAgo) {
                $filteredData += $item
            }
        }
        catch {
            # 日期格式不匹配，保留该记录
            $filteredData += $item
        }
    }
    
    return $filteredData
}

function Save-ToCsv {
    param(
        [array]$Data,
        [string]$Filename
    )
    
    if ($Data.Count -eq 0) {
        Write-Host "警告: 没有数据可保存到 $Filename" -ForegroundColor Yellow
        return
    }
    
    # 确保输出目录存在
    $outputDir = Split-Path $Filename -Parent
    if (!(Test-Path $outputDir)) {
        New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
    }
    
    # 获取所有字段名
    $fieldnames = $Data[0].PSObject.Properties.Name
    
    # 构建CSV内容
    $csvContent = @()
    $csvContent += ($fieldnames -join ",")
    
    foreach ($item in $Data) {
        $rowValues = @()
        foreach ($field in $fieldnames) {
            $value = $item.$field
            if ($null -eq $value) {
                $value = ""
            }
            # 处理包含逗号或换行符的字段
            if ($value -is [string] -and ($value -match "," -or $value -match "`n" -or $value -match '"')) {
                $value = '"' + ($value -replace '"', '""') + '"'
            }
            $rowValues += $value
        }
        $csvContent += ($rowValues -join ",")
    }
    
    # 添加BOM头以支持中文
    $utf8Bom = New-Object System.Text.UTF8Encoding $true
    [System.IO.File]::WriteAllLines($Filename, $csvContent, $utf8Bom)
    
    Write-Host "数据已保存到: $Filename" -ForegroundColor Green
}

function Save-ToJson {
    param(
        [array]$Data,
        [string]$Filename
    )
    
    if ($Data.Count -eq 0) {
        Write-Host "警告: 没有数据可保存到 $Filename" -ForegroundColor Yellow
        return
    }
    
    # 确保输出目录存在
    $outputDir = Split-Path $Filename -Parent
    if (!(Test-Path $outputDir)) {
        New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
    }
    
    $jsonContent = $Data | ConvertTo-Json -Depth 10
    [System.IO.File]::WriteAllText($Filename, $jsonContent, [System.Text.Encoding]::UTF8)
    
    Write-Host "数据已保存到: $Filename" -ForegroundColor Green
}

# 主程序
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host "深圳房地产成交数据下载工具" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Cyan

# 1. 获取二手房成交数据
Write-Host "`n【1】获取二手房成交信息..." -ForegroundColor Cyan
$secondHandData = Fetch-AllData -ApiId $SECOND_HAND_API_ID -DataName "二手房成交信息"

if ($secondHandData.Count -gt 0) {
    # 筛选最近半年数据
    $recentSecondHand = Filter-RecentHalfYear -Data $secondHandData
    Write-Host "最近半年二手房成交数据: $($recentSecondHand.Count) 条" -ForegroundColor Cyan
    
    # 保存数据
    $secondHandCsv = Join-Path $OUTPUT_DIR "second_hand_house_$TODAY.csv"
    $secondHandJson = Join-Path $OUTPUT_DIR "second_hand_house_$TODAY.json"
    Save-ToCsv -Data $recentSecondHand -Filename $secondHandCsv
    Save-ToJson -Data $recentSecondHand -Filename $secondHandJson
}

# 2. 获取一手商品房成交数据
Write-Host "`n【2】获取一手商品房成交信息..." -ForegroundColor Cyan
$newHouseData = Fetch-AllData -ApiId $NEW_HOUSE_API_ID -DataName "一手商品房成交信息"

if ($newHouseData.Count -gt 0) {
    # 筛选最近半年数据
    $recentNewHouse = Filter-RecentHalfYear -Data $newHouseData
    Write-Host "最近半年一手商品房成交数据: $($recentNewHouse.Count) 条" -ForegroundColor Cyan
    
    # 保存数据
    $newHouseCsv = Join-Path $OUTPUT_DIR "new_house_$TODAY.csv"
    $newHouseJson = Join-Path $OUTPUT_DIR "new_house_$TODAY.json"
    Save-ToCsv -Data $recentNewHouse -Filename $newHouseCsv
    Save-ToJson -Data $recentNewHouse -Filename $newHouseJson
}

Write-Host "`n" + ("=" * 60) -ForegroundColor Cyan
Write-Host "数据下载完成！" -ForegroundColor Cyan
Write-Host "输出目录: $OUTPUT_DIR" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Cyan
