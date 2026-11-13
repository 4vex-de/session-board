# Autor: Marco Hallmeier
# Erzeugt assets\icon.png (512 x 512) neu.
param([string]$Ziel = (Join-Path $PSScriptRoot '..\assets\icon.png'))

Add-Type -AssemblyName System.Drawing

function Neue-Rundform([float]$X, [float]$Y, [float]$Breite, [float]$Hoehe, [float]$Radius) {
    $pfad = New-Object System.Drawing.Drawing2D.GraphicsPath
    $d = $Radius * 2
    $pfad.AddArc($X, $Y, $d, $d, 180, 90)
    $pfad.AddArc($X + $Breite - $d, $Y, $d, $d, 270, 90)
    $pfad.AddArc($X + $Breite - $d, $Y + $Hoehe - $d, $d, $d, 0, 90)
    $pfad.AddArc($X, $Y + $Hoehe - $d, $d, $d, 90, 90)
    $pfad.CloseFigure()
    return $pfad
}

$groesse = 512
$bild = New-Object System.Drawing.Bitmap $groesse, $groesse, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$flaeche = [System.Drawing.Graphics]::FromImage($bild)
$flaeche.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$flaeche.Clear([System.Drawing.Color]::Transparent)

$grund = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 23, 50, 77))
$flaeche.FillPath($grund, (Neue-Rundform 16 16 480 480 104))

$punktFarben = @(
    [System.Drawing.Color]::FromArgb(255, 60, 207, 125),
    [System.Drawing.Color]::FromArgb(255, 255, 157, 77),
    [System.Drawing.Color]::FromArgb(255, 110, 160, 255)
)
$balkenLaengen = @(200, 150, 180)
$weiss = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(235, 255, 255, 255))

for ($zeile = 0; $zeile -lt 3; $zeile++) {
    $mitte = 136 + $zeile * 120
    $punkt = New-Object System.Drawing.SolidBrush $punktFarben[$zeile]
    $flaeche.FillEllipse($punkt, 104, $mitte - 36, 72, 72)
    $flaeche.FillPath($weiss, (Neue-Rundform 212 ($mitte - 16) $balkenLaengen[$zeile] 32 16))
}

$ordner = Split-Path -Parent $Ziel
if (-not (Test-Path $ordner)) { New-Item -ItemType Directory -Path $ordner | Out-Null }
$bild.Save($Ziel, [System.Drawing.Imaging.ImageFormat]::Png)
$flaeche.Dispose()
$bild.Dispose()
Write-Output "geschrieben: $Ziel"
