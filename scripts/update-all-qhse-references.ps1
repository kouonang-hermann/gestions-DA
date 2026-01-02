# Script PowerShell pour supprimer toutes les references au responsable_qhse
# et les remplacer par responsable_logistique dans tous les fichiers

Write-Host "Suppression de toutes les references au responsable_qhse..." -ForegroundColor Yellow

# Liste des fichiers a modifier
$files = @(
    "components\modals\project-details-modal.tsx",
    "components\modals\details-modal.tsx",
    "components\mobile\universal-mobile-injector.tsx",
    "components\dashboard\super-admin-dashboard.tsx",
    "components\cloture\universal-closure-list.tsx",
    "components\admin\manage-admin-roles.tsx",
    "components\admin\create-user-modal.tsx",
    "components\admin\edit-project-modal.tsx",
    "components\admin\create-project-modal.tsx"
)

foreach ($file in $files) {
    $fullPath = Join-Path $PSScriptRoot "..\$file"
    
    if (Test-Path $fullPath) {
        Write-Host "Traitement de $file..." -ForegroundColor Cyan
        
        # Lire le contenu
        $content = Get-Content $fullPath -Raw
        
        # Supprimer les lignes contenant responsable_qhse
        $lines = Get-Content $fullPath
        $newLines = $lines | Where-Object { $_ -notmatch "responsable_qhse" }
        
        # Ecrire le nouveau contenu
        $newLines | Set-Content $fullPath
        
        Write-Host "  OK - References supprimees" -ForegroundColor Green
    } else {
        Write-Host "  SKIP - Fichier non trouve: $fullPath" -ForegroundColor Yellow
    }
}

Write-Host "`nTermine!" -ForegroundColor Green
