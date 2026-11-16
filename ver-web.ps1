# =====================================================================
#  VER WEB - abre tu portfolio en el navegador como si estuviera publicado
#  (asi los videos de YouTube se reproducen). Cierra esta ventana para apagarlo.
# =====================================================================
param([switch]$NoAbrir)
$ErrorActionPreference = 'Stop'
$raiz = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)

$tipos = @{
  '.html' = 'text/html; charset=utf-8'; '.js' = 'text/javascript; charset=utf-8'; '.css' = 'text/css; charset=utf-8'
  '.jpg' = 'image/jpeg'; '.jpeg' = 'image/jpeg'; '.png' = 'image/png'; '.webp' = 'image/webp'; '.gif' = 'image/gif'
  '.avif' = 'image/avif'; '.svg' = 'image/svg+xml'; '.mp4' = 'video/mp4'; '.m4v' = 'video/mp4'; '.webm' = 'video/webm'
  '.mov' = 'video/quicktime'; '.txt' = 'text/plain; charset=utf-8'; '.json' = 'application/json'
}

$listener = $null
foreach ($p in 5500..5520) {
  try {
    $l = New-Object System.Net.HttpListener
    $l.Prefixes.Add("http://localhost:$p/")
    $l.Start()
    $listener = $l; $puerto = $p; break
  } catch { }
}
if (-not $listener) { Write-Host '  No se pudo iniciar el servidor local.' -ForegroundColor Red; exit 1 }

$url = "http://localhost:$puerto/"
Write-Host ''
Write-Host '  ===============================================' -ForegroundColor Red
Write-Host '   CARBALLO//NELSON  -  Web local encendida' -ForegroundColor White
Write-Host '  ===============================================' -ForegroundColor Red
Write-Host ''
Write-Host "  Abriendo $url" -ForegroundColor Gray
Write-Host '  Deja esta ventana abierta mientras miras la web.' -ForegroundColor Gray
Write-Host '  Para apagarla, cierra esta ventana.' -ForegroundColor Gray
Write-Host ''
if (-not $NoAbrir) { Start-Process $url }

while ($listener.IsListening) {
  $ctx = $listener.GetContext()
  $res = $ctx.Response
  try {
    $ruta = [Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath)
    if ($ruta.EndsWith('/')) { $ruta += 'index.html' }
    $archivo = [IO.Path]::GetFullPath((Join-Path $raiz ($ruta.TrimStart('/') -replace '/', '\')))
    if (-not $archivo.StartsWith($raiz) -or -not (Test-Path -LiteralPath $archivo -PathType Leaf)) {
      $res.StatusCode = 404; $res.Close(); continue
    }
    $ext = [IO.Path]::GetExtension($archivo).ToLower()
    $res.ContentType = if ($tipos.ContainsKey($ext)) { $tipos[$ext] } else { 'application/octet-stream' }
    $res.AddHeader('Cache-Control', 'no-store')
    $res.AddHeader('Accept-Ranges', 'bytes')
    $fs = [IO.File]::Open($archivo, 'Open', 'Read', 'ReadWrite')
    try {
      $total = $fs.Length; $inicio = 0; $fin = $total - 1
      $rango = $ctx.Request.Headers['Range']
      if ($rango -and $rango -match 'bytes=(\d*)-(\d*)') {
        if ($Matches[1]) { $inicio = [long]$Matches[1] }
        if ($Matches[2]) { $fin = [long]$Matches[2] } else { $fin = [Math]::Min($inicio + 8MB, $total - 1) }
        $res.StatusCode = 206
        $res.AddHeader('Content-Range', "bytes $inicio-$fin/$total")
      }
      $largo = $fin - $inicio + 1
      $res.ContentLength64 = $largo
      $fs.Seek($inicio, 'Begin') | Out-Null
      $buf = New-Object byte[] 262144
      $quedan = $largo
      while ($quedan -gt 0) {
        $n = $fs.Read($buf, 0, [int][Math]::Min($buf.Length, $quedan))
        if ($n -le 0) { break }
        $res.OutputStream.Write($buf, 0, $n)
        $quedan -= $n
      }
    } finally { $fs.Close() }
  } catch {
    # el navegador cancelo la descarga (normal con videos); seguimos
  } finally {
    try { $res.Close() } catch { }
  }
}
