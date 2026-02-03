# PowerShell script to create simple placeholder icons
# Run: .\create-icons.ps1

$iconsPath = "icons"

# Ensure icons directory exists
if (-not (Test-Path $iconsPath)) {
    New-Item -ItemType Directory -Path $iconsPath | Out-Null
}

Write-Host "Creating placeholder icons..." -ForegroundColor Cyan
Write-Host ""

Add-Type -AssemblyName System.Drawing

function CreateIcon {
    param($size, $filename)
    
    try {
        $bitmap = New-Object System.Drawing.Bitmap($size, $size)
        $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
        
        # Create gradient background (blue)
        $color1 = [System.Drawing.Color]::FromArgb(59, 130, 246)
        $color2 = [System.Drawing.Color]::FromArgb(37, 99, 235)
        $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
            [System.Drawing.Point]::new(0, 0),
            [System.Drawing.Point]::new($size, $size),
            $color1,
            $color2
        )
        
        $graphics.FillRectangle($brush, 0, 0, $size, $size)
        
        # Draw "P" text
        $fontSize = [Math]::Round($size * 0.6)
        $font = New-Object System.Drawing.Font("Arial", $fontSize, [System.Drawing.FontStyle]::Bold)
        $textBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
        $format = New-Object System.Drawing.StringFormat
        $format.Alignment = [System.Drawing.StringAlignment]::Center
        $format.LineAlignment = [System.Drawing.StringAlignment]::Center
        
        $rect = New-Object System.Drawing.RectangleF(0, 0, $size, $size)
        $graphics.DrawString("P", $font, $textBrush, $rect, $format)
        
        # Save as PNG
        $filePath = Join-Path $iconsPath $filename
        $bitmap.Save($filePath, [System.Drawing.Imaging.ImageFormat]::Png)
        
        $brush.Dispose()
        $textBrush.Dispose()
        $font.Dispose()
        $graphics.Dispose()
        $bitmap.Dispose()
        
        Write-Host "Created $filename" -ForegroundColor Green
    } catch {
        Write-Host "Failed to create $filename : $_" -ForegroundColor Red
    }
}

# Create icons
CreateIcon -size 16 -filename "icon16.png"
CreateIcon -size 48 -filename "icon48.png"
CreateIcon -size 128 -filename "icon128.png"

Write-Host ""
Write-Host "Done! Icons created." -ForegroundColor Green
Write-Host "You can now load the extension in Chrome!" -ForegroundColor Cyan
