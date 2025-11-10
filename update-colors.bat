@echo off
echo Actualizando colores a beige en archivos HTML...

powershell -Command "(Get-Content 'src\main\resources\templates\*.html' -Raw) -replace 'background: linear-gradient\(135deg, #fce4ec, #f8bbd9\)', 'background: linear-gradient(135deg, #f5f5dc, #ddbf94)' | Set-Content 'src\main\resources\templates\*.html'"

powershell -Command "Get-ChildItem 'src\main\resources\templates\*.html' | ForEach-Object { (Get-Content $_.FullName -Raw) -replace 'background: linear-gradient\(135deg, #fce4ec, #f8bbd9\)', 'background: linear-gradient(135deg, #f5f5dc, #ddbf94)' | Set-Content $_.FullName }"

powershell -Command "Get-ChildItem 'src\main\resources\templates\*.html' | ForEach-Object { (Get-Content $_.FullName -Raw) -replace 'background: linear-gradient\(135deg, #b3e5fc, #81d4fa\)', 'background: linear-gradient(135deg, #ddbf94, #cd853f)' | Set-Content $_.FullName }"

powershell -Command "Get-ChildItem 'src\main\resources\templates\*.html' | ForEach-Object { (Get-Content $_.FullName -Raw) -replace 'background: linear-gradient\(135deg, #81d4fa, #4fc3f7\)', 'background: linear-gradient(135deg, #cd853f, #a0522d)' | Set-Content $_.FullName }"

powershell -Command "Get-ChildItem 'src\main\resources\templates\*.html' | ForEach-Object { (Get-Content $_.FullName -Raw) -replace 'background: linear-gradient\(135deg, #ad1457, #c2185b\)', 'background: linear-gradient(135deg, #8b4513, #a0522d)' | Set-Content $_.FullName }"

powershell -Command "Get-ChildItem 'src\main\resources\templates\*.html' | ForEach-Object { (Get-Content $_.FullName -Raw) -replace 'background: #fce4ec', 'background: #f5f5dc' | Set-Content $_.FullName }"

powershell -Command "Get-ChildItem 'src\main\resources\templates\*.html' | ForEach-Object { (Get-Content $_.FullName -Raw) -replace 'background: linear-gradient\(135deg, #4fc3f7, #29b6f6\)', 'background: linear-gradient(135deg, #cd853f, #a0522d)' | Set-Content $_.FullName }"

echo Colores actualizados exitosamente!
pause