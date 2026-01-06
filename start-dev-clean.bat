@echo off
echo ========================================
echo DEMARRAGE PROPRE DE L'APPLICATION
echo ========================================
echo.

echo [1/4] Arret des processus Node existants...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 /nobreak >nul
echo ✓ Processus arretes
echo.

echo [2/4] Suppression du cache Next.js...
if exist .next (
    rmdir /s /q .next
    echo ✓ Cache .next supprime
) else (
    echo ✓ Pas de cache a supprimer
)
echo.

echo [3/4] Regeneration du client Prisma...
call npx prisma generate
if %errorlevel% neq 0 (
    echo ⚠ Erreur Prisma - Continuons quand meme...
)
echo.

echo [4/4] Lancement de l'application...
echo.
echo ========================================
echo ✓ Application prete !
echo   Ouvrez: http://localhost:3000
echo ========================================
echo.
call npm run dev
