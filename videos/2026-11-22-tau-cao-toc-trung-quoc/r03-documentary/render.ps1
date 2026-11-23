$ErrorActionPreference = 'Stop'
$revision = $PSScriptRoot
$batch = Split-Path -Parent $revision
$renderer = Join-Path $revision '../../../workflows/reference-video/cinematic'
$propsPath = Join-Path $revision 'props.json'
$assets = Join-Path $revision 'public'
$timeline = Get-Content -Raw -LiteralPath (Join-Path $batch 'timeline.json') | ConvertFrom-Json
$map = Get-Content -Raw -LiteralPath (Join-Path $batch 'r02-map/map-props.json') | ConvertFrom-Json
@{audio='narration.wav'; chapters=$timeline.shots; overview=$map.overview; stations=$map.stations} |
    ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $propsPath -Encoding utf8NoBOM

Push-Location $renderer
try {
    node node_modules/@remotion/cli/remotion-cli.js render src/china-rail/documentary-entry.tsx ChinaRailDocumentary (Join-Path $revision 'tau-cao-toc-trung-quoc-ban-dung-moi.mp4') "--props=$propsPath" "--public-dir=$assets" --codec=h264 --audio-codec=aac --pixel-format=yuv420p --crf=18 --concurrency=7 --is-production=false --log=warn --quiet
    if ($LASTEXITCODE -ne 0) { throw "Remotion exited with code $LASTEXITCODE" }
}
finally {
    Pop-Location
}
