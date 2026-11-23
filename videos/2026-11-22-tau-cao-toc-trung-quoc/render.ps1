$ErrorActionPreference = 'Stop'
$batch = $PSScriptRoot
$renderer = Join-Path $batch '../../workflows/reference-video/cinematic'
$timeline = Join-Path $batch 'timeline.json'
$assets = Join-Path $batch 'public'

Push-Location $renderer
try {
    node node_modules/@remotion/cli/remotion-cli.js render src/china-rail/index.tsx ChinaHighSpeedRail (Join-Path $batch 'tau-cao-toc-trung-quoc.mp4') "--props=$timeline" "--public-dir=$assets" --codec=h264 --audio-codec=aac --crf=18 --concurrency=6 --is-production=false --log=warn
    if ($LASTEXITCODE -ne 0) { throw "Remotion exited with code $LASTEXITCODE" }
}
finally {
    Pop-Location
}
