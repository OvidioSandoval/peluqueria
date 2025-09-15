@echo off
echo Aplicando estilos compactos a todos los archivos HTML...

for %%f in (src\main\resources\templates\*.html) do (
    echo Procesando %%f...
    powershell -Command "(Get-Content '%%f') -replace '  <link rel=\"\"stylesheet\"\" href=\"\"/modern-styles.css\"\">\r\n  <link rel=\"\"stylesheet\"\" href=\"\"/unified-styles.css\"\">', '  <link rel=\"\"stylesheet\"\" href=\"\"/modern-styles.css\"\">\r\n  <link rel=\"\"stylesheet\"\" href=\"\"/unified-styles.css\"\">\r\n  <link rel=\"\"stylesheet\"\" href=\"\"/compact-styles.css\"\">' | Set-Content '%%f'"
)

echo Completado!
pause