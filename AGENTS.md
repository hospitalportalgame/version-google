# HOSPITAL PORTAL — Instrucciones para agentes (Antigravity y Codex)

Este archivo es leído automáticamente por Codex y por Antigravity (`AGENTS.md` en la raíz).
Es el **único** archivo de reglas de agente del proyecto: no crear copias en `.agents/rules/`,
`GEMINI.md`, `CLAUDE.md` ni otros archivos redundantes; ampliar este si hace falta.

El contexto funcional del juego (dirección actual, archivos relevantes, criterios clínicos y de
validación) está en [`TRASPASO_ANTIGRAVITY.md`](TRASPASO_ANTIGRAVITY.md). Leerlo antes de modificar
el juego. Estas reglas lo complementan; no lo reemplazan.

## Ubicación y forma de trabajo

- Proyecto único: `C:\Users\Usuario\Desktop\KIDF BASE\HOSPITAL_PORTAL_DIA1_PROYECTO_VSCODE`.
  Trabajar directamente sobre los archivos autorizados de este proyecto.
- No duplicar ni clonar el proyecto para hacer pruebas; no crear proyectos paralelos.
- Procedimiento obligatorio: **un cambio → una prueba → aprobación del usuario** antes de seguir.
- No instalar ni desinstalar dependencias sin autorización explícita.

## Respaldos

- No crear respaldos masivos ni copias completas de carpetas sin autorización del usuario.
- Si un cambio puntual requiere respaldo, copiar solo los archivos afectados, indicarlo en el
  informe y borrarlo cuando el usuario apruebe el cambio.
- `backups/` contiene instantáneas locales históricas: no añadir contenido sin autorización.

## Navegador y pruebas automatizadas

- No guardar perfiles de Chromium/Edge dentro del proyecto (nada de `scratch/chrome_profile_*`
  ni `--user-data-dir` apuntando al proyecto).
- Preferir `chromium.launch()` + `browser.newContext()` (perfil efímero que Playwright crea en
  `%TEMP%` y elimina al cerrar). Si se necesita `--user-data-dir`, crearlo con
  `fs.mkdtempSync(path.join(os.tmpdir(), 'hp-'))` y borrarlo en un bloque `finally`
  (`fs.rmSync(dir, { recursive: true, force: true })`) para que se limpie aunque la prueba falle.
- Toda prueba de navegador debe usar `--mute-audio` y almacenamiento aislado; nunca usar ni
  alterar el perfil o las partidas guardadas del usuario.
- Reutilizar los scripts de regresión existentes (p. ej. `scratch/test_val_10c3.cjs`) antes de
  escribir uno nuevo. No crear varios scripts que hagan lo mismo: ampliar o parametrizar el
  existente.
- Scripts de un solo uso (diagnósticos puntuales): ubicarlos fuera del proyecto (directorio
  temporal o scratch del agente) o eliminarlos al cerrar la fase.

## Capturas y evidencias

- No acumular capturas de pantalla ni vídeos. Conservar solo las evidencias necesarias para
  depurar un fallo o validar un cambio.
- Guardar las evidencias en el directorio de artefactos del agente o en el directorio temporal
  del sistema, no en `assets/`, `src/` ni la raíz del proyecto.
- Eliminar las capturas intermedias cuando el usuario apruebe el cambio.

## Qué no tocar sin autorización

- Personajes, escenas, animaciones, sonido, guardados y arquitectura del juego.
- Recursos de producción en `assets/`, código en `src/`, `styles/`, `index.html`, `vite/`.
- Reglas existentes de `.gitignore` (solo añadir exclusiones justificadas).
