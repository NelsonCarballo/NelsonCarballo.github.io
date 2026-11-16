# =====================================================================
#  ACTUALIZAR GALERIA
#  Escanea la carpeta "contenido" y regenera contenido/galeria.js
#  No hace falta abrir este archivo: haz doble clic en ACTUALIZAR-GALERIA.bat
#
#  - contenido/miniaturas/        imagenes (subcarpetas = categorias)
#  - contenido/videos/            videos .mp4/.webm (subcarpetas = categorias)
#  - contenido/videos/shorts/     videos verticales
#  - contenido/videos/youtube.txt links de YouTube
#  - contenido/antes-despues/     pares nombre-antes.jpg / nombre-despues.jpg
#  - contenido/showreel/          un video para el showreel
#
#  Los titulos/descripciones que edites a mano en galeria.js se conservan.
# =====================================================================
$ErrorActionPreference = 'Stop'

$contenido = Split-Path -Parent $MyInvocation.MyCommand.Path
$raiz = Split-Path -Parent $contenido
$salida = Join-Path $contenido 'galeria.js'

$extImg = @('.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif')
$extVid = @('.mp4', '.webm', '.m4v', '.mov')

function Get-Rel([string]$full) {
  return ($full.Substring($raiz.Length).TrimStart('\', '/')) -replace '\\', '/'
}

function Get-Titulo([string]$base) {
  # "borja-197" -> "Borja"  /  "Healthy-166B" -> "Healthy"
  $limpio = $base -replace '[\s_\-]+\d+[a-zA-Z]?$', ''
  if ($limpio) { $base = $limpio }
  $t = ($base -replace '[_\-]+', ' ' -replace '\s+', ' ').Trim()
  if ($t.Length -gt 0) { $t = $t.Substring(0, 1).ToUpper() + $t.Substring(1) }
  return $t
}

function Get-Archivos([string]$dir, [string[]]$exts) {
  if (-not (Test-Path -LiteralPath $dir)) { return @() }
  return @(Get-ChildItem -LiteralPath $dir -File -Recurse | Where-Object {
      ($exts -contains $_.Extension.ToLower()) -and -not $_.Name.StartsWith('_') -and -not $_.Name.StartsWith('.')
    })
}

function Get-Prop($obj, [string]$name, $def) {
  if ($null -ne $obj -and $obj.PSObject.Properties[$name] -and $null -ne $obj.$name) { return $obj.$name }
  return $def
}

# ---------- version optimizada para la web (max 1280px, JPG liviano) ----------
Add-Type -AssemblyName System.Drawing
$dirWeb = Join-Path $contenido '_web'
$usadosWeb = @{}
$jpgEnc = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
function Get-Web($file) {
  if ($file.Extension.ToLower() -eq '.gif') { return '' }   # los gif se dejan como estan (animados)
  $rel = $file.FullName.Substring($contenido.Length).TrimStart('\')
  $dest = Join-Path $dirWeb ([IO.Path]::ChangeExtension($rel, '.jpg'))
  $usadosWeb[$dest.ToLower()] = $true
  # la copia liviana guarda la misma fecha que el original: si no coinciden, se reemplazo la imagen
  if ((Test-Path -LiteralPath $dest) -and (Get-Item -LiteralPath $dest).LastWriteTimeUtc -eq $file.LastWriteTimeUtc) {
    return Get-Rel $dest
  }
  try {
    $img = [System.Drawing.Image]::FromFile($file.FullName)
    try {
      $w = [Math]::Min(1280, $img.Width)
      $h = [int][Math]::Round($img.Height * $w / $img.Width)
      $bmp = New-Object System.Drawing.Bitmap $w, $h
      $g = [System.Drawing.Graphics]::FromImage($bmp)
      $g.InterpolationMode = 'HighQualityBicubic'; $g.SmoothingMode = 'HighQuality'; $g.PixelOffsetMode = 'HighQuality'
      $g.Clear([System.Drawing.Color]::Black)
      $g.DrawImage($img, 0, 0, $w, $h)
      New-Item -ItemType Directory -Force -Path (Split-Path $dest) | Out-Null
      $p = New-Object System.Drawing.Imaging.EncoderParameters 1
      $p.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter ([System.Drawing.Imaging.Encoder]::Quality), ([long]84)
      $bmp.Save($dest, $jpgEnc, $p)
      $g.Dispose(); $bmp.Dispose()
      (Get-Item -LiteralPath $dest).LastWriteTimeUtc = $file.LastWriteTimeUtc
    } finally { $img.Dispose() }
    return Get-Rel $dest
  } catch {
    Write-Host ("  (Aviso) No se pudo optimizar " + $file.Name + ". Se usa el original.") -ForegroundColor Yellow
    return ''
  }
}

function Get-Subcarpeta($file, [string]$base) {
  $sub = $file.DirectoryName.Substring($base.Length).TrimStart('\', '/')
  if ($sub) { return ($sub -split '[\\/]')[0] }
  return ''
}

# ---------- carpetas (se crean si no existen) ----------
$dirMin = Join-Path $contenido 'miniaturas'
$dirVid = Join-Path $contenido 'videos'
$dirBA = Join-Path $contenido 'antes-despues'
$dirReel = Join-Path $contenido 'showreel'
foreach ($d in @($dirMin, $dirVid, (Join-Path $dirVid 'shorts'), $dirBA, $dirReel)) {
  if (-not (Test-Path -LiteralPath $d)) { New-Item -ItemType Directory -Path $d | Out-Null }
}

Write-Host ''
Write-Host '  ===============================================' -ForegroundColor Red
Write-Host '   CARBALLO//NELSON  -  Actualizando galeria...' -ForegroundColor White
Write-Host '  ===============================================' -ForegroundColor Red
Write-Host ''

# ---------- datos anteriores (para conservar titulos editados) ----------
$prev = @{}
if (Test-Path -LiteralPath $salida) {
  try {
    $txt = [IO.File]::ReadAllText($salida)
    $k = $txt.IndexOf('window.GALERIA')
    $i = if ($k -ge 0) { $txt.IndexOf('{', $k) } else { -1 }
    $j = $txt.LastIndexOf('}')
    if ($i -ge 0 -and $j -gt $i) {
      $old = $txt.Substring($i, $j - $i + 1) | ConvertFrom-Json
      foreach ($m in @($old.miniaturas)) { if ($m -and $m.archivo) { $prev['m|' + $m.archivo] = $m } }
      foreach ($v in @($old.videos)) {
        if (-not $v) { continue }
        if ($v.tipo -eq 'youtube') { $prev['y|' + $v.id] = $v } elseif ($v.archivo) { $prev['v|' + $v.archivo] = $v }
      }
      foreach ($p in @($old.antesDespues)) { if ($p -and $p.despues) { $prev['a|' + $p.despues] = $p } }
      if ($old.PSObject.Properties['canales']) {
        foreach ($c in @($old.canales)) { if ($c -and $c.id) { $prev['c|' + $c.id.ToLower()] = $c } }
      }
    }
  } catch {
    Write-Host '  (Aviso) No se pudo leer la galeria anterior. Se crea de nuevo.' -ForegroundColor Yellow
  }
}

# ---------- MINIATURAS ----------
$minis = @(foreach ($f in (Get-Archivos $dirMin $extImg)) {
    $rel = Get-Rel $f.FullName
    $o = $prev['m|' + $rel]
    $cat = Get-Subcarpeta $f $dirMin
    if (-not $cat) { $cat = Get-Prop $o 'categoria' '' }
    [pscustomobject][ordered]@{
      archivo     = $rel
      web         = (Get-Web $f)
      titulo      = (Get-Prop $o 'titulo' (Get-Titulo $f.BaseName))
      categoria   = $cat
      descripcion = (Get-Prop $o 'descripcion' '')
      destacada   = [bool](Get-Prop $o 'destacada' $false)
      fecha       = $f.LastWriteTime.ToString('yyyy-MM-ddTHH:mm:ss')
    }
  })
$minis = @($minis | Sort-Object -Property @{ Expression = 'destacada'; Descending = $true }, @{ Expression = 'fecha'; Descending = $true })

# ---------- VIDEOS (archivos) ----------
$vids = New-Object System.Collections.ArrayList
foreach ($f in (Get-Archivos $dirVid $extVid)) {
  $rel = Get-Rel $f.FullName
  $o = $prev['v|' + $rel]
  $first = Get-Subcarpeta $f $dirVid
  $vertical = $first -match '^(shorts?|reels?|tiktoks?|verticale?s?)$'
  $cat = if ($first -and -not $vertical) { $first } else { Get-Prop $o 'categoria' '' }
  $posterFile = Get-ChildItem -LiteralPath $f.DirectoryName -File |
    Where-Object { $_.BaseName -eq $f.BaseName -and ($extImg -contains $_.Extension.ToLower()) } |
    Select-Object -First 1
  $poster = if ($posterFile) { Get-Rel $posterFile.FullName } else { '' }
  $formato = if ($vertical) { 'vertical' } else { Get-Prop $o 'formato' 'horizontal' }
  if ($f.Extension.ToLower() -eq '.mov') {
    Write-Host ("  (Aviso) " + $f.Name + ": los .mov no se ven en todos los navegadores. Mejor exporta en .mp4 (H.264).") -ForegroundColor Yellow
  }
  [void]$vids.Add([pscustomobject][ordered]@{
      tipo        = 'archivo'
      archivo     = $rel
      id          = ''
      poster      = $poster
      titulo      = (Get-Prop $o 'titulo' (Get-Titulo $f.BaseName))
      categoria   = $cat
      formato     = $formato
      descripcion = (Get-Prop $o 'descripcion' '')
      destacada   = [bool](Get-Prop $o 'destacada' $false)
      fecha       = $f.LastWriteTime.ToString('yyyy-MM-ddTHH:mm:ss')
    })
}

# ---------- VIDEOS (YouTube) ----------
$ytFile = Join-Path $dirVid 'youtube.txt'
if (Test-Path -LiteralPath $ytFile) {
  try { [Net.ServicePointManager]::SecurityProtocol = [Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12 } catch { }
  $base = (Get-Item -LiteralPath $ytFile).LastWriteTime
  $n = 0
  foreach ($line in [IO.File]::ReadAllLines($ytFile)) {
    $l = $line.Trim()
    if (-not $l -or $l.StartsWith('#')) { continue }
    $parts = @($l -split '\|' | ForEach-Object { $_.Trim() })
    $url = $parts[0]
    $id = $null
    if ($url -match '(?:youtu\.be/|[?&]v=|/shorts/|/embed/|/live/)([A-Za-z0-9_-]{11})') { $id = $Matches[1] }
    elseif ($url -match '^[A-Za-z0-9_-]{11}$') { $id = $url }
    if (-not $id) { Write-Host ("  (Aviso) Link de YouTube no reconocido: " + $url) -ForegroundColor Yellow; continue }
    $o = $prev['y|' + $id]
    $vertical = ($url -match '/shorts/') -or ($parts.Count -gt 3 -and $parts[3] -match '^(vertical|shorts?)$')
    $titulo = if ($parts.Count -gt 1 -and $parts[1]) { $parts[1] } else { Get-Prop $o 'titulo' '' }
    $cat = if ($parts.Count -gt 2 -and $parts[2]) { $parts[2] } else { Get-Prop $o 'categoria' '' }
    if (-not $titulo) {
      # intenta traer el titulo real desde YouTube
      try {
        $info = Invoke-RestMethod -Uri ("https://www.youtube.com/oembed?format=json&url=https://www.youtube.com/watch?v=" + $id) -TimeoutSec 8 -UseBasicParsing
        if ($info.title) { $titulo = [string]$info.title }
      } catch { $titulo = 'Video de YouTube' }
    }
    $n++
    [void]$vids.Add([pscustomobject][ordered]@{
        tipo        = 'youtube'
        archivo     = ''
        id          = $id
        poster      = ''
        titulo      = $titulo
        categoria   = $cat
        formato     = $(if ($vertical) { 'vertical' } else { 'horizontal' })
        descripcion = (Get-Prop $o 'descripcion' '')
        destacada   = [bool](Get-Prop $o 'destacada' $false)
        fecha       = $base.AddSeconds(-$n).ToString('yyyy-MM-ddTHH:mm:ss')
      })
  }
}
$vids = @($vids | Sort-Object -Property @{ Expression = 'destacada'; Descending = $true }, @{ Expression = 'fecha'; Descending = $true })

# ---------- ANTES & DESPUES ----------
$grupos = [ordered]@{}
foreach ($f in (Get-Archivos $dirBA $extImg)) {
  if ($f.BaseName -match '^(.*?)[\s_\-\.]*(antes|before|despu.s|after)$') {
    $nombre = $Matches[1]
    $tipo = $Matches[2].ToLower()
    $key = (Join-Path $f.DirectoryName $nombre).ToLower()
    if (-not $grupos.Contains($key)) { $grupos[$key] = @{ nombre = $nombre; antes = $null; despues = $null } }
    if ($tipo -eq 'antes' -or $tipo -eq 'before') { $grupos[$key].antes = $f } else { $grupos[$key].despues = $f }
  } else {
    Write-Host ("  (Aviso) " + $f.Name + ': el nombre debe terminar en -antes o -despues') -ForegroundColor Yellow
  }
}
$pares = @(foreach ($g in $grupos.Values) {
    if (-not $g.antes -or -not $g.despues) {
      Write-Host ("  (Aviso) Falta la pareja de '" + $g.nombre + "' (necesita -antes y -despues)") -ForegroundColor Yellow
      continue
    }
    $rel = Get-Rel $g.despues.FullName
    $o = $prev['a|' + $rel]
    [pscustomobject][ordered]@{
      nombre  = (Get-Prop $o 'nombre' (Get-Titulo $g.nombre))
      antes   = (Get-Rel $g.antes.FullName)
      antesWeb   = (Get-Web $g.antes)
      despuesWeb = (Get-Web $g.despues)
      despues = $rel
      fecha   = $g.despues.LastWriteTime.ToString('yyyy-MM-ddTHH:mm:ss')
    }
  })
$pares = @($pares | Sort-Object -Property fecha -Descending)

# ---------- SHOWREEL ----------
$showreel = ''
$reel = Get-Archivos $dirReel $extVid | Sort-Object LastWriteTime -Descending | Select-Object -First 1
if ($reel) { $showreel = Get-Rel $reel.FullName }

# ---------- CANALES (contenido/canales.txt) ----------
$canales = New-Object System.Collections.ArrayList
$canalesTxt = Join-Path $contenido 'canales.txt'
if (Test-Path -LiteralPath $canalesTxt) {
  try { [Net.ServicePointManager]::SecurityProtocol = [Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12 } catch { }
  $dirCan = Join-Path $dirWeb 'canales'
  New-Item -ItemType Directory -Force -Path $dirCan | Out-Null
  $hdr = @{ 'Accept-Language' = 'es-ES,es;q=0.9'; 'User-Agent' = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36' }
  foreach ($line in [IO.File]::ReadAllLines($canalesTxt)) {
    $l = $line.Trim()
    if (-not $l -or $l.StartsWith('#')) { continue }
    $parts = @($l -split '\|' | ForEach-Object { $_.Trim() })
    $u = $parts[0]
    if ($u -match '@([A-Za-z0-9._\-]+)') { $id = '@' + $Matches[1] }
    elseif ($u -match 'youtube\.com/((?:channel|c|user)/[^/?#\s]+)') { $id = $Matches[1] }
    else { Write-Host ("  (Aviso) Link de canal no reconocido: " + $u) -ForegroundColor Yellow; continue }
    $url = 'https://www.youtube.com/' + $id
    $o = $prev['c|' + $id.ToLower()]
    $nombre = Get-Prop $o 'nombre' ''
    $subs = Get-Prop $o 'suscriptores' ''
    $avatar = Get-Prop $o 'avatar' ''
    Write-Host ("  Canal " + $id + " ...") -ForegroundColor DarkGray
    try {
      $html = (Invoke-WebRequest -Uri $url -UseBasicParsing -Headers $hdr -TimeoutSec 20).Content
      $t = [regex]::Match($html, '<meta property="og:title" content="([^"]*)"').Groups[1].Value
      if ($t) { $nombre = [Net.WebUtility]::HtmlDecode($t) }
      $todos = @([regex]::Matches($html, '[\d.,]+\s?(?:mil|M|K)?\s(?:de )?suscriptores') | ForEach-Object { $_.Value })
      $s = @($todos | Where-Object { $_ -match '\s(mil|M)\s' }) + $todos | Select-Object -First 1
      if ($s) { $subs = ($s -replace '(\d)\.(\d)', '$1,$2') }
      $img = [regex]::Match($html, '<meta property="og:image" content="([^"]*)"').Groups[1].Value
      if ($img) {
        $img = $img -replace '=s\d+-', '=s240-'
        $dest = Join-Path $dirCan (($id -replace '[^A-Za-z0-9_\-]', '_') + '.jpg')
        Invoke-WebRequest -Uri $img -OutFile $dest -UseBasicParsing -TimeoutSec 20
        $avatar = Get-Rel $dest
      }
    } catch {
      Write-Host ("  (Aviso) No se pudo leer " + $url + ". Se usan los datos anteriores.") -ForegroundColor Yellow
    }
    if ($parts.Count -gt 1 -and $parts[1]) { $nombre = $parts[1] }
    if ($parts.Count -gt 2 -and $parts[2]) { $subs = $parts[2] }
    if ($avatar) { $usadosWeb[(Join-Path $raiz ($avatar -replace '/', '\')).ToLower()] = $true }
    [void]$canales.Add([pscustomobject][ordered]@{
        id           = $id
        url          = $url
        nombre       = $(if ($nombre) { $nombre } else { $id })
        suscriptores = $subs
        avatar       = $avatar
      })
  }
}

# ---------- limpiar versiones optimizadas que ya no se usan ----------
if (Test-Path -LiteralPath $dirWeb) {
  Get-ChildItem -LiteralPath $dirWeb -File -Recurse | Where-Object { -not $usadosWeb.ContainsKey($_.FullName.ToLower()) } | Remove-Item -Force
}

# ---------- escribir galeria.js ----------
$data = [ordered]@{
  generado     = (Get-Date).ToString('yyyy-MM-dd HH:mm')
  showreel     = $showreel
  miniaturas   = @($minis)
  videos       = @($vids)
  antesDespues = @($pares)
  canales      = @($canales)
}
$json = $data | ConvertTo-Json -Depth 6
$header = "// ARCHIVO GENERADO AUTOMATICAMENTE por ACTUALIZAR-GALERIA.bat`r`n" +
"// Puedes editar titulos, descripciones y categorias aqui: se conservan al volver a ejecutar el script.`r`n" +
"// Si borras un archivo de la carpeta contenido, desaparece de la web la proxima vez que ejecutes el script.`r`n"
$out = $header + 'window.GALERIA = ' + $json + ";`r`n"
[IO.File]::WriteAllText($salida, $out, (New-Object System.Text.UTF8Encoding($false)))

$nH = @($vids | Where-Object { $_.formato -ne 'vertical' }).Count
$nV = @($vids | Where-Object { $_.formato -eq 'vertical' }).Count
Write-Host ("  Miniaturas ........ " + $minis.Count) -ForegroundColor Gray
Write-Host ("  Videos ............ " + $nH) -ForegroundColor Gray
Write-Host ("  Shorts/verticales . " + $nV) -ForegroundColor Gray
Write-Host ("  Antes y despues ... " + $pares.Count) -ForegroundColor Gray
Write-Host ("  Canales ........... " + $canales.Count) -ForegroundColor Gray
Write-Host ("  Showreel .......... " + $(if ($showreel) { $showreel } else { '(ninguno en la carpeta)' })) -ForegroundColor Gray
Write-Host ''
Write-Host '  LISTO. Recarga la web (F5) para ver los cambios.' -ForegroundColor Green
Write-Host ''
