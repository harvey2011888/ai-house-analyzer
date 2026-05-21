Add-Type -AssemblyName System.Drawing

$size = 81
$gray = [System.Drawing.Color]::FromArgb(255, 153, 153, 153)
$blue = [System.Drawing.Color]::FromArgb(255, 25, 137, 250)
$transparent = [System.Drawing.Color]::Transparent
$white = [System.Drawing.Color]::FromArgb(255, 255, 255, 255)

function Make-Bitmap {
    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    for ($x = 0; $x -lt $size; $x++) {
        for ($y = 0; $y -lt $size; $y++) {
            $bmp.SetPixel($x, $y, $transparent)
        }
    }
    return $bmp
}

function Save-Home {
    param($path, $color)
    $bmp = Make-Bitmap
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $cx = $size / 2
    $brush = [System.Drawing.SolidBrush]::new($color)
    $tbrush = [System.Drawing.SolidBrush]::new($transparent)

    # roof
    $pts = @(
        [System.Drawing.Point]::new($cx, 18),
        [System.Drawing.Point]::new(14, 38),
        [System.Drawing.Point]::new($size - 14, 38)
    )
    $g.FillPolygon($brush, $pts)
    # body
    $g.FillRectangle($brush, 20, 36, 41, 29)
    # door
    $g.FillRectangle($tbrush, $cx - 7, 47, 14, 18)

    $g.Dispose()
    $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Host "Generated: $path"
}

function Save-Requirement {
    param($path, $color)
    $bmp = Make-Bitmap
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $brush = [System.Drawing.SolidBrush]::new($color)
    $wbrush = [System.Drawing.SolidBrush]::new($white)
    $tbrush = [System.Drawing.SolidBrush]::new($transparent)

    # paper
    $g.FillRectangle($brush, 18, 14, 45, 53)
    # fold corner
    $fpts = @(
        [System.Drawing.Point]::new($size - 18 - 10, 14),
        [System.Drawing.Point]::new($size - 18, 14),
        [System.Drawing.Point]::new($size - 18, 14 + 10)
    )
    $g.FillPolygon($tbrush, $fpts)
    # lines
    $g.FillRectangle($wbrush, 28, 30, 25, 3)
    $g.FillRectangle($wbrush, 28, 42, 35, 3)
    $g.FillRectangle($wbrush, 28, 54, 35, 3)

    $g.Dispose()
    $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Host "Generated: $path"
}

function Save-Profile {
    param($path, $color)
    $bmp = Make-Bitmap
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $cx = $size / 2
    $brush = [System.Drawing.SolidBrush]::new($color)

    # head
    $g.FillEllipse($brush, $cx - 12, 20, 24, 24)
    # body
    $bpts = @(
        [System.Drawing.Point]::new($cx - 16, 42),
        [System.Drawing.Point]::new($cx + 16, 42),
        [System.Drawing.Point]::new($cx + 30, 67),
        [System.Drawing.Point]::new($cx - 30, 67)
    )
    $g.FillPolygon($brush, $bpts)

    $g.Dispose()
    $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Host "Generated: $path"
}

$dir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $dir

Write-Host "========================================"
Write-Host "Generating WeChat Mini Program tabBar icons"
Write-Host "Output: $dir"
Write-Host "Size: ${size}x${size}"
Write-Host "========================================"

Save-Home "home.png" $gray
Save-Home "home-active.png" $blue
Save-Requirement "requirement.png" $gray
Save-Requirement "requirement-active.png" $blue
Save-Profile "profile.png" $gray
Save-Profile "profile-active.png" $blue

Write-Host "========================================"
Write-Host "All icons generated successfully!"
Write-Host "========================================"
