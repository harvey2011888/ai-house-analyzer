Add-Type -AssemblyName System.Drawing
$size = 81
$gray = [System.Drawing.Color]::FromArgb(255, 153, 153, 153)
$blue = [System.Drawing.Color]::FromArgb(255, 25, 137, 250)
$t = [System.Drawing.Color]::Transparent
$w = [System.Drawing.Color]::FromArgb(255, 255, 255, 255)

$scriptDir = $PSScriptRoot
Write-Host "Script directory: $scriptDir"
Set-Location $scriptDir

function MakeBmp {
    $b = New-Object System.Drawing.Bitmap($size, $size)
    for ($x = 0; $x -lt $size; $x++) {
        for ($y = 0; $y -lt $size; $y++) {
            $b.SetPixel($x, $y, $t)
        }
    }
    return $b
}

function DrawHome($p, $c) {
    Write-Host "Drawing home icon to: $p"
    $b = MakeBmp
    $g = [System.Drawing.Graphics]::FromImage($b)
    $cx = $size / 2
    $br = [System.Drawing.SolidBrush]::new($c)
    $tr = [System.Drawing.SolidBrush]::new($t)
    $pts = @([System.Drawing.Point]::new($cx, 18), [System.Drawing.Point]::new(14, 38), [System.Drawing.Point]::new($size - 14, 38))
    $g.FillPolygon($br, $pts)
    $g.FillRectangle($br, 20, 36, 41, 29)
    $g.FillRectangle($tr, $cx - 7, 47, 14, 18)
    $g.Dispose()
    $fullPath = Join-Path $scriptDir $p
    Write-Host "Saving to: $fullPath"
    $b.Save($fullPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $b.Dispose()
    Write-Host "OK: $fullPath"
}

function DrawReq($p, $c) {
    Write-Host "Drawing requirement icon to: $p"
    $b = MakeBmp
    $g = [System.Drawing.Graphics]::FromImage($b)
    $br = [System.Drawing.SolidBrush]::new($c)
    $wr = [System.Drawing.SolidBrush]::new($w)
    $tr = [System.Drawing.SolidBrush]::new($t)
    $g.FillRectangle($br, 18, 14, 45, 53)
    $fpts = @([System.Drawing.Point]::new($size - 28, 14), [System.Drawing.Point]::new($size - 18, 14), [System.Drawing.Point]::new($size - 18, 24))
    $g.FillPolygon($tr, $fpts)
    $g.FillRectangle($wr, 28, 30, 25, 3)
    $g.FillRectangle($wr, 28, 42, 35, 3)
    $g.FillRectangle($wr, 28, 54, 35, 3)
    $g.Dispose()
    $fullPath = Join-Path $scriptDir $p
    Write-Host "Saving to: $fullPath"
    $b.Save($fullPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $b.Dispose()
    Write-Host "OK: $fullPath"
}

function DrawProf($p, $c) {
    Write-Host "Drawing profile icon to: $p"
    $b = MakeBmp
    $g = [System.Drawing.Graphics]::FromImage($b)
    $cx = $size / 2
    $br = [System.Drawing.SolidBrush]::new($c)
    $g.FillEllipse($br, $cx - 12, 20, 24, 24)
    $bpts = @([System.Drawing.Point]::new($cx - 16, 42), [System.Drawing.Point]::new($cx + 16, 42), [System.Drawing.Point]::new($cx + 30, 67), [System.Drawing.Point]::new($cx - 30, 67))
    $g.FillPolygon($br, $bpts)
    $g.Dispose()
    $fullPath = Join-Path $scriptDir $p
    Write-Host "Saving to: $fullPath"
    $b.Save($fullPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $b.Dispose()
    Write-Host "OK: $fullPath"
}

Write-Host "========================================"
Write-Host "Generating WeChat Mini Program tabBar icons"
Write-Host "========================================"

DrawHome "home.png" $gray
DrawHome "home-active.png" $blue
DrawReq "requirement.png" $gray
DrawReq "requirement-active.png" $blue
DrawProf "profile.png" $gray
DrawProf "profile-active.png" $blue

Write-Host "========================================"
Write-Host "Checking files..."
Get-ChildItem $scriptDir -Filter "*.png" | ForEach-Object { Write-Host "Found: $($_.Name) ($($_.Length) bytes)" }
Write-Host "All done!"
