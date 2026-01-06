@echo off
echo ========================================
echo FIX ET REDEMARRAGE DE L'APPLICATION
echo ========================================
echo.

echo [1/3] Nettoyage du cache Next.js...
if exist .next rmdir /s /q .next
echo Cache supprime !
echo.

echo [2/3] Regeneration du client Prisma...
call npx prisma generate
echo Client Prisma regenere !
echo.

echo [3/3] Lancement de l'application...
echo.
echo ========================================
echo Application prete ! Ouvrez http://localhost:3000
echo ========================================
echo.
call npm run dev
