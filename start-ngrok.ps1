# Script para iniciar ngrok e mostrar URLs
Write-Host "Iniciando tuneis ngrok..." -ForegroundColor Green

# Iniciar tunel para frontend (porta 3000)
Write-Host "Frontend (porta 3000):" -ForegroundColor Yellow
Start-Process -FilePath "ngrok" -ArgumentList "http 3000" -WindowStyle Minimized

# Aguardar um pouco
Start-Sleep -Seconds 3

# Iniciar tunel para backend (porta 4000)
Write-Host "Backend (porta 4000):" -ForegroundColor Yellow
Start-Process -FilePath "ngrok" -ArgumentList "http 4000" -WindowStyle Minimized

Write-Host "Tuneis iniciados!" -ForegroundColor Green
Write-Host "Acesse: http://localhost:4040 para ver as URLs" -ForegroundColor Cyan
Write-Host "Use essas URLs para acessar de qualquer lugar!" -ForegroundColor Cyan 