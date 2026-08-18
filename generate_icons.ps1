# PowerShell script to resize and convert logo to extension icons
$srcPath = "C:\Users\2306214\.gemini\antigravity-ide\brain\866f7ca3-f048-4857-97ab-9dfee743a381\extension_logo_1787072109034.jpg"
$destDir = Join-Path $PSScriptRoot "icons"

if (-not (Test-Path $destDir)) {
    New-Item -ItemType Directory -Path $destDir | Out-Null
}

[Reflection.Assembly]::LoadWithPartialName("System.Drawing") | Out-Null

$sizes = @(16, 32, 48, 128)

foreach ($size in $sizes) {
    $src = [System.Drawing.Image]::FromFile($srcPath)
    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    
    # Set high quality resize settings
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    
    $g.DrawImage($src, 0, 0, $size, $size)
    
    $destPath = Join-Path $destDir "icon-$size.png"
    $bmp.Save($destPath, [System.Drawing.Imaging.ImageFormat]::Png)
    
    $g.Dispose()
    $bmp.Dispose()
    $src.Dispose()
    Write-Host "Generated icon-$size.png"
}
