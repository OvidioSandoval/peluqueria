# Agregar configuración de Vuetify a todos los archivos JS
$jsFiles = Get-ChildItem "src\main\resources\static" -Filter "app-*.js"

foreach ($file in $jsFiles) {
    Write-Host "Procesando: $($file.Name)"
    
    $content = Get-Content $file.FullName -Raw -Encoding UTF8
    
    # Agregar vuetify: new Vuetify() si no existe
    if ($content -notmatch "vuetify:") {
        $content = $content -replace "new Vue\(\{", "new Vue({`n    vuetify: new Vuetify(),"
    }
    
    Set-Content $file.FullName -Value $content -Encoding UTF8
    Write-Host "  Completado: $($file.Name)"
}

Write-Host "Configuración de Vuetify agregada"