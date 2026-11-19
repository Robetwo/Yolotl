# YOLOTL — prototipo gastronómico para Azure Static Web Apps

Proyecto de muestra **HTML + CSS + JavaScript**, sin compilación ni dependencias Node. Muestra las 32 entidades federativas de México, 5 platillos por entidad (160 en total), 3 **espacios ficticios** para futuros restaurantes por entidad y una tarjeta de pasaporte **no canjeable** que simula descuentos entre 5 y 10 %. No hay restaurantes afiliados ni ofertas reales.

## Archivos

- `index.html`: vista principal.
- `styles.css`: presentación adaptable a escritorio y móvil.
- `app.js`: selección, mapa, catálogo y pasaporte demostrativo.
- `data/mapa-mexico.js`: geometría base del contorno de México y puntos interactivos locales para las 32 entidades; no necesita Internet.
- `data/estados.json`: catálogo editable de 32 entidades.
- `data/estados.js`: mismo catálogo cargado por el navegador; **edita también este archivo si modificas el JSON**.
- `assets/favicon.svg`: ícono de la marca.
- `staticwebapp.config.json`: cabeceras HTTP y fallback para Azure Static Web Apps.

## Probar localmente

Puedes abrir `index.html` en un navegador moderno, incluso sin Internet. El mapa de México es **siempre visible en móvil y escritorio**, y puedes **tocar cualquiera de los 32 puntos de estado**, acercar/alejar con `+` y `−`, arrastrar, hacer zoom con dos dedos y restablecer la vista con el botón de casa. El catálogo cambia al tocar la ubicación. Si hay Internet se cargan además los **límites estatales vectoriales** para poder seleccionar el estado tocando la superficie del polígono; si esa fuente externa falla, se mantiene el contorno de México con los puntos clicables de cada estado. Las ubicaciones de los puntos son orientativas y no describen límites oficiales.

## Desplegar en Azure sin comandos

1. Crea una cuenta en GitHub o inicia sesión en una existente.
2. Desde GitHub web, elige **New repository** y crea `yolotl-demo` (puede ser privado si tu cuenta y las autorizaciones lo permiten).
3. Elige **Add file > Upload files** y arrastra **los archivos y carpetas del ZIP ya descomprimido** a la raíz del repositorio. Confirma los cambios en la rama `main`.
4. En `https://portal.azure.com`, busca **Static Web Apps** y pulsa **Create**.
5. En **Basics**, selecciona tu suscripción (por ejemplo, Azure for Students), crea el grupo `RG-YOLOTL-DEMO`, indica nombre `yolotl-demo` (si no está disponible, usa otro), plan `Free` y origen `GitHub`.
6. Autoriza GitHub y selecciona tu cuenta, repositorio `yolotl-demo` y rama `main`.
7. En **Build Details**: **Build Presets = Custom**, **App location = /** (raíz), **Api location =** vacío, **Output location =** vacío. No se requiere API ni proceso de compilación.
8. Pulsa **Review + create > Create > Go to resource**.
9. En GitHub, sección **Actions**, verifica que el flujo termine exitosamente. Copia la URL que Azure muestra en **Overview** y ábrela con HTTPS.
10. Para un dominio comprado (opcional): en el recurso de Azure ve a **Custom domains > Add**, sigue la validación DNS (comúnmente CNAME para `www`) y espera la emisión automática del certificado.

Si la interfaz solicita un valor de salida al usar **Custom** sin compilación, sigue las opciones del portal de tu instancia para apuntar a la carpeta raíz del repositorio (p. ej. `.`); conserva `app_location: /` en el workflow. Azure puede modificar la disposición de estos campos.

### Nota importante sobre el certificado

Azure Static Web Apps ofrece gratuitamente HTTPS en su subdominio y certificados TLS administrados para dominios propios. **No necesitas generar, subir ni renovar manualmente un certificado para esta demostración**. El dominio comercial, si se compra, se paga aparte.

## Alcance y límites

- Las 160 preparaciones son una selección introductoria; deben validarse cultural y editorialmente antes de una publicación comercial definitiva.
- Las 96 tarjetas de restaurantes son **espacios ficticios claramente identificados**: no equivalen a una clasificación de calidad, ni anuncian afiliación.
- El pasaporte se genera **solo en el navegador**, no es un sistema de identidad, compra, verificación, registro, QR validado, seguridad antifraude ni descuento real.
- La aplicación no usa bases de datos y no almacena datos personales.
- Para operar un pasaporte real se requerirá backend, almacenamiento seguro, cuentas/roles, contratos con restaurantes y códigos de un solo uso validados en el servidor.

## Datos cartográficos y atribuciones

- El contorno base es una geometría del territorio mexicano de Natural Earth (dominio público), distribuida con countryinfo. Los marcadores de los 32 estados son ubicaciones orientativas.
- Opcionalmente, para límites estatales, el mapa interactivo consulta: https://raw.githubusercontent.com/louquillio/map-data/master/boundaries/mx/admin1.geojson
- Repositorio y procedencia: https://github.com/louquillio/map-data y https://github.com/louquillio/map-data/blob/master/ATTRIBUTION.md
- La procedencia declarada es `angelnmara/geojson` y límites derivados de INEGI. Para redistribución/comercialización futura, revisar los términos de la fuente y, cuando corresponda, preferir datos cartográficos con licencia expresamente compatible.

## Documentación de Azure

- Inicio desde portal: https://learn.microsoft.com/azure/static-web-apps/get-started-portal
- Dominios y TLS: https://learn.microsoft.com/azure/static-web-apps/custom-domain
- Dominios con registradores externos: https://learn.microsoft.com/azure/static-web-apps/custom-domain-external
