$ErrorActionPreference = 'Stop'
$revision = $PSScriptRoot
$renderer = Join-Path $revision '../../../workflows/reference-video/cinematic'
$propsPath = Join-Path $revision 'props.json'
$assets = Join-Path $revision 'public'

Push-Location $renderer
try {
    node node_modules/@remotion/cli/remotion-cli.js render src/china-rail/documentary-entry.tsx ChinaRailLong (Join-Path $revision 'hinh.mp4') "--props=$propsPath" "--public-dir=$assets" --codec=h264 --pixel-format=yuv420p --crf=18 --image-format=jpeg --jpeg-quality=91 --concurrency=8 --muted --is-production=false --log=warn --quiet
    if ($LASTEXITCODE -ne 0) { throw "Remotion exited with code $LASTEXITCODE" }
}
finally {
    Pop-Location
}
