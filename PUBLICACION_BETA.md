# Preparación de la beta web controlada

Este documento describe pasos pendientes; no implica que exista un repositorio remoto ni un despliegue.

## Distribución estática

En un checkout limpio, ejecutar `node scripts/build-public-static.cjs dist`. El destino `dist` no debe existir: el empaquetador no sobrescribe ni elimina directorios. También sigue admitiendo un destino nuevo fuera del proyecto. No sustituir este comando por `vite build`.

El empaquetador publica `index.html` y los recursos autorizados de `src/`, `styles/` y `assets/`, más un manifiesto. Excluye pruebas y metadatos internos definidos en su lista de exclusión. Antes de publicar, revisar el manifiesto y los archivos reales; una lista blanca no garantiza por sí sola que su contenido carezca de datos sensibles.

## GitHub privado

1. Revisar los archivos que se incluirán y los secretos o datos personales antes del primer commit. `.gitignore` no elimina archivos existentes ni deja de seguir archivos ya registrados.
2. Configurar la identidad de Git apropiada y, cuando se autorice, inicializar Git en el proyecto, revisar `git status`, agregar los archivos necesarios y crear el primer commit.
3. Crear en GitHub un repositorio privado vacío, sin añadir archivos iniciales que compliquen la primera sincronización. Conectar el repositorio local y subir la rama elegida únicamente cuando se autorice. Véase la [guía de GitHub](https://docs.github.com/en/get-started/start-your-journey/creating-a-repository-for-your-project-on-github).

## Cloudflare Pages

Conectar el repositorio privado mediante la [integración con Git](https://developers.cloudflare.com/pages/get-started/git-integration/) solo después de recibir autorización. Usar:

- Framework preset: **None**.
- Directorio raíz: raíz del repositorio (vacío o `/`).
- Build command: `node scripts/build-public-static.cjs dist`.
- Build output directory: `dist`.
- Variables de entorno: `NODE_VERSION=22.23.4` y `SKIP_DEPENDENCY_INSTALL=1`.

La versión indicada figura en la [imagen de compilación de Pages](https://developers.cloudflare.com/pages/configuration/build-image/); validar el primer build real, ya que la prueba local se realizó en Windows y no sustituye una compilación en Cloudflare. El límite gratuito documentado es de 20.000 archivos por sitio y 25 MiB por archivo; consultar los [límites vigentes](https://developers.cloudflare.com/pages/platform/limits/) antes de publicar.

## Acceso a la beta

Un repositorio privado no protege la URL publicada. Configurar Cloudflare Zero Trust Access para limitar el acceso a los participantes autorizados y proteger por separado todos los hostnames de producción y de previsualización. La opción de Pages para activar una política de acceso protege las previsualizaciones; no debe suponerse que protege automáticamente la URL de producción. Consultar [previsualizaciones](https://developers.cloudflare.com/pages/configuration/preview-deployments/) y [limitaciones conocidas](https://developers.cloudflare.com/pages/platform/known-issues/).

Antes de invitar a jugadores, comprobar cada hostname desde una sesión autorizada y otra sin autenticar, así como revisar límites de uso y comportamiento de guardados en el nuevo origen. No compartir una URL hasta verificar su protección.
