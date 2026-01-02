# Migration Script: QHSE to Logistique and Logistique to Livreur
# Date: 2025-01-27

Write-Host "Starting migration: QHSE -> Logistique and Logistique -> Livreur" -ForegroundColor Green
Write-Host ""

$rootDir = "c:\Users\Lenovo\OneDrive\Documents\gestion-demandes-materiel (7)"
Set-Location $rootDir

# File extensions to process
$extensions = @("*.ts", "*.tsx", "*.js", "*.jsx")

# Directories to exclude
$excludeDirs = @("node_modules", ".next", "dist", "build", ".git", "prisma\migrations")

Write-Host "Searching for files to modify..." -ForegroundColor Cyan

# Find all files
$files = Get-ChildItem -Path $rootDir -Include $extensions -Recurse | 
    Where-Object { 
        $file = $_
        $exclude = $false
        foreach ($dir in $excludeDirs) {
            if ($file.FullName -like "*\$dir\*") {
                $exclude = $true
                break
            }
        }
        -not $exclude
    }

Write-Host "Found $($files.Count) files" -ForegroundColor Green
Write-Host ""

$totalReplacements = 0
$modifiedFiles = @()

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw -Encoding UTF8
    $originalContent = $content
    $fileModified = $false
    $fileReplacements = 0
    
    # Replace responsable_qhse with responsable_logistique
    if ($content -match 'responsable_qhse') {
        $matches = ([regex]::Matches($content, 'responsable_qhse')).Count
        $content = $content -replace 'responsable_qhse', 'responsable_logistique'
        $fileReplacements += $matches
        $fileModified = $true
    }
    
    # Replace en_attente_validation_qhse with en_attente_validation_logistique
    if ($content -match 'en_attente_validation_qhse') {
        $matches = ([regex]::Matches($content, 'en_attente_validation_qhse')).Count
        $content = $content -replace 'en_attente_validation_qhse', 'en_attente_validation_logistique'
        $fileReplacements += $matches
        $fileModified = $true
    }
    
    # Replace validationQHSE with validationLogistique
    if ($content -match 'validationQHSE') {
        $matches = ([regex]::Matches($content, 'validationQHSE')).Count
        $content = $content -replace 'validationQHSE', 'validationLogistique'
        $fileReplacements += $matches
        $fileModified = $true
    }
    
    # Replace QHSE label with Logistique
    if ($content -match '\bQHSE\b') {
        $matches = ([regex]::Matches($content, '\bQHSE\b')).Count
        $content = $content -replace '\bQHSE\b', 'Logistique'
        $fileReplacements += $matches
        $fileModified = $true
    }
    
    if ($fileModified) {
        Set-Content -Path $file.FullName -Value $content -Encoding UTF8 -NoNewline
        $modifiedFiles += $file.FullName
        $totalReplacements += $fileReplacements
        Write-Host "Modified $($file.Name): $fileReplacements replacement(s)" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "MIGRATION SUMMARY" -ForegroundColor Green
Write-Host "=================" -ForegroundColor Green
Write-Host "Files modified: $($modifiedFiles.Count)" -ForegroundColor Cyan
Write-Host "Total replacements: $totalReplacements" -ForegroundColor Cyan
Write-Host ""

if ($modifiedFiles.Count -gt 0) {
    Write-Host "Modified files:" -ForegroundColor Yellow
    foreach ($file in $modifiedFiles) {
        $relativePath = $file.Replace($rootDir, "").TrimStart("\")
        Write-Host "  - $relativePath" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "Migration completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "NEXT STEPS:" -ForegroundColor Yellow
Write-Host "1. Execute SQL migration script" -ForegroundColor White
Write-Host "2. Test the application" -ForegroundColor White
Write-Host "3. Check logs for errors" -ForegroundColor White
Write-Host ""
