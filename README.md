# HOSPITAL PORTAL — DÍA 1

RPG médico narrativo de simulación clínica en hepatología con estética pixel art.

## Estructura del Proyecto

- `index.html`: Portada oficial, cinemática de introducción (`intro-hospital.mp4`), entorno del hospital y consultorio.
- `styles/juego.css`: Sistema de diseño, paneles, cuaderno clínico, layout responsivo y tipografía.
- `src/`:
  - `src/clinica/dia1/`:
    - `casos.js`: Datos clínicos oficiales de los pacientes (Martín, Sofía, Elena, Diego, Rosa, etc.).
    - `dialogos.js`: Árbol de interrogatorio, respuestas y preguntas dirigidas.
    - `catalogo-estudios.js`: Estudios de laboratorio, serología e imágenes.
    - `opciones-decision.js`: Alternativas de conducta diagnóstica y terapéutica.
    - `razonamiento*.js`: Lógica y justificación clínica por caso.
    - `retroalimentacion-docente.js`: Explicaciones pedagógicas post-consulta.
    - `simulaciones.js`: Catálogo de diagnósticos y pronósticos.
  - `src/graficos/`: Motor de renderizado Canvas pixel art, mobiliario y sprites.
  - `src/jornadas/dia1/`:
    - `juego.js`: Bucle de juego principal, controles, colisiones y eventos.
    - `interfaz-clinica.js`: Pestañas de historia clínica, pedidos y toma de decisiones.
  - `src/motor/`: Movimiento, colisiones y persistencia de guardado.
  - `src/sistemas/`: Examen físico en camilla, economía del hospital, llegada y sonido ambiente.
- `assets/`: Escenarios, escenas, sprites pixel art, audios y cinemática MP4.

## Cómo Ejecutar el Juego

1. En la terminal del proyecto, ejecuta:
   ```bash
   npm run dev
   ```
2. Abre tu navegador en `http://localhost:8080/`.
