# Script pour régénérer le client Prisma en forçant la suppression des fichiers verrouillés

Write-Host "🔄 Arrêt de tous les processus Node.js..." -ForegroundColor Yellow
taskkill /F /IM node.exe 2>$null

Write-Host "⏳ Attente de 2 secondes..." -ForegroundColor Yellow
Start-Sleep -Seconds 2

Write-Host "🗑️ Suppression du dossier .prisma..." -ForegroundColor Yellow
if (Test-Path "node_modules\.prisma") {
    Remove-Item -Path "node_modules\.prisma" -Recurse -Force -ErrorAction SilentlyContinue
}

Write-Host "⏳ Attente de 1 seconde..." -ForegroundColor Yellow
Start-Sleep -Seconds 1

Write-Host "🔨 Génération du client Prisma..." -ForegroundColor Yellow
npx prisma generate

if ($LASTEXITCODE -eq 0) {
    Write-Host "Client Prisma genere avec succes!" -ForegroundColor Green
} else {
    Write-Host "Erreur lors de la generation du client Prisma" -ForegroundColor Red
}
