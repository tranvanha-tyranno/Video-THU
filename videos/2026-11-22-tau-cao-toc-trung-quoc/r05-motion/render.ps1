param([switch]$Proof)
$ErrorActionPreference = 'Stop'
$previous = Join-Path $PSScriptRoot '../r04-long'
$renderer = Join-Path $PSScriptRoot '../../../workflows/reference-video/cinematic'
$compositionArgs = @(
    'src/china-rail/documentary-entry.tsx', 'ChinaRailMotion',
    "--props=$(Join-Path $previous 'props.json')",
    "--public-dir=$(Join-Path $previous 'public')",
    '--is-production=false', '--quiet'
)

Push-Location $renderer
try {
    if ($Proof) {
        $output = Join-Path $PSScriptRoot 'ban-do-chuyen-dong.mp4'
        $renderArgs = @('--frames=872-1827', '--scale=0.6666667')
    } else {
        $output = Join-Path $PSScriptRoot 'hinh.mp4'
        $renderArgs = @()
    }
    node node_modules/@remotion/cli/remotion-cli.js render @compositionArgs $output @renderArgs --codec=h264 --pixel-format=yuv420p --crf=18 --image-format=jpeg --jpeg-quality=91 --concurrency=8 --muted --log=warn
    if ($LASTEXITCODE -ne 0) { throw "Remotion exited with code $LASTEXITCODE" }
}
finally {
    Pop-Location
}
