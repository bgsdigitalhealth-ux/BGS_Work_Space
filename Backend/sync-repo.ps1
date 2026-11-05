# Auto-sync script for Worker_Space repository
param(
    [string]$CommitMessage = "Auto-update: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
)

$gitExe = "C:\Users\BGSMCH\.qoder\bin\git\cmd\git.exe"
if (-not (Test-Path $gitExe)) {
    $gitExe = "git"
}

$repoRoot = Resolve-Path "$PSScriptRoot\.."
Set-Location $repoRoot

Write-Host "--- Pulling latest changes from remote ---" -ForegroundColor Cyan
& $gitExe pull --rebase origin main

$status = & $gitExe status --porcelain
if ($status) {
    Write-Host "--- Local changes detected, staging and committing ---" -ForegroundColor Yellow
    & $gitExe add -A
    & $gitExe commit -m $CommitMessage
    Write-Host "--- Pushing changes to remote repository ---" -ForegroundColor Green
    & $gitExe push origin main
}
else {
    Write-Host "--- Working tree clean, no local changes to push ---" -ForegroundColor Green
}
