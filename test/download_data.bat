@echo off
chcp 65001 >nul
echo ========================================
echo 深圳房地产成交数据下载工具
echo ========================================
echo.

set APP_KEY=ab3cbc0e4b574adda096b3b47be57afa
set OUTPUT_DIR=data

if not exist %OUTPUT_DIR% mkdir %OUTPUT_DIR%

echo 【1】下载二手房成交信息...
powershell -Command "Invoke-WebRequest -Uri 'https://opendata.sz.gov.cn/api/29200_01903513/1/service.xhtml?page=1&rows=10000&appKey=%APP_KEY%' -UseBasicParsing | Select-Object -ExpandProperty Content | Out-File '%OUTPUT_DIR%/second_hand_house_raw.json' -Encoding UTF8"
if %errorlevel% equ 0 (
    echo 二手房数据下载成功
) else (
    echo 二手房数据下载失败
)

echo.
echo 【2】下载一手商品房成交信息...
powershell -Command "Invoke-WebRequest -Uri 'https://opendata.sz.gov.cn/api/29200_01903510/1/service.xhtml?page=1&rows=10000&appKey=%APP_KEY%' -UseBasicParsing | Select-Object -ExpandProperty Content | Out-File '%OUTPUT_DIR%/new_house_raw.json' -Encoding UTF8"
if %errorlevel% equ 0 (
    echo 一手商品房数据下载成功
) else (
    echo 一手商品房数据下载失败
)

echo.
echo ========================================
echo 原始数据下载完成！
echo 输出目录: %OUTPUT_DIR%
echo ========================================
pause
