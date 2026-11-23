$ErrorActionPreference = 'Stop'
$revision = $PSScriptRoot
$renderer = Join-Path $revision '../../../workflows/reference-video/cinematic'
$map = Join-Path $revision 'map-props.json'
$assets = Join-Path $revision 'public'

Push-Location $renderer
try {
    node node_modules/@remotion/cli/remotion-cli.js render src/china-rail/map-entry.tsx ChinaRailMap (Join-Path $revision 'map-scene.mp4') "--props=$map" "--public-dir=$assets" --codec=h264 --crf=17 --concurrency=6 --is-production=false --log=warn
    if ($LASTEXITCODE -ne 0) { throw "Remotion exited with code $LASTEXITCODE" }
}
finally {
    Pop-Location
}
