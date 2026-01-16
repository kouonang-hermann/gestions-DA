# Script pour désactiver tous les fichiers .ts dans le dossier scripts
$scriptFiles = @(
    "check-and-create-user.ts",
    "check-user-655813782.ts",
    "check-user-697619722.ts",
    "check-user-aristide.ts",
    "check-user-djamen.ts",
    "create-user-655813782.ts",
    "create-user-697619722.ts",
    "reset-password-alfred.ts",
    "reset-password-djamen.ts",
    "search-alfred-ndando.ts",
    "test-change-password.ts",
    "test-workflow-livraisons.ts"
)

foreach ($file in $scriptFiles) {
    $path = "scripts\$file"
    if (Test-Path $path) {
        Rename-Item -Path $path -NewName "$file.disabled"
        Write-Host "✓ Désactivé: $file" -ForegroundColor Green
    } else {
        Write-Host "- Déjà désactivé ou introuvable: $file" -ForegroundColor Yellow
    }
}

Write-Host "`n✅ Tous les scripts TypeScript ont été désactivés!" -ForegroundColor Green
Write-Host "Vous pouvez maintenant exécuter: npx next build" -ForegroundColor Cyan
