Add-Type -AssemblyName System.Drawing
$srcPath = Join-Path $PSScriptRoot "..\public\uploads\egg_dosa.jpg"
$destPath = Join-Path $PSScriptRoot "..\public\uploads\egg_dosa.jpg"
$tempPath = Join-Path $PSScriptRoot "..\public\uploads\egg_dosa_temp.jpg"

if (Test-Path $srcPath) {
    $img = [System.Drawing.Image]::FromFile($srcPath)
    $targetWidth = 1000
    $scale = $targetWidth / $img.Width
    $newWidth = [int]($img.Width * $scale)
    $newHeight = [int]($img.Height * $scale)
    $bmp = New-Object System.Drawing.Bitmap $newWidth, $newHeight
    $graphics = [System.Drawing.Graphics]::FromImage($bmp)
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.DrawImage($img, 0, 0, $newWidth, $newHeight)
    $img.Dispose()
    
    $bmp.Save($tempPath, [System.Drawing.Imaging.ImageFormat]::Jpeg)
    $bmp.Dispose()
    $graphics.Dispose()

    Move-Item -Path $tempPath -Destination $destPath -Force
    Write-Host "Egg Dosa image optimized successfully! New size: " ((Get-Item $destPath).Length / 1KB) "KB"
}
