# Comprensión Galáctica

App de **comprensión lectora** para niños de **1° a 6°** de primaria, con diseño futurista, puntos CP (Comprensión Puntos) y tienda de recompensas.

## Generar APK para Android

Para empaquetar la app en un **APK** (con los cambios que tengas en este momento):

1. **Primera vez:** instala [Node.js](https://nodejs.org) y [Android Studio](https://developer.android.com/studio).
2. Haz doble clic en **`generar-apk.bat`**.
3. El APK queda en **`apk-salida/`**.

Instrucciones completas: **`BUILD-APK.md`**.

## Cómo abrir

1. Abre `index.html` con doble clic, o
2. Con Live Server en VS Code / Cursor, o
3. Desde la terminal en esta carpeta:
   ```bash
   npx --yes serve .
   ```
   Luego entra a `http://localhost:3000`

## Tus materiales

| Grado | Carpeta | Qué poner |
|-------|---------|-----------|
| **2°** | `assets/segundo/pdf/` | Archivos PDF |
| **5°** | raíz o `assets/quinto/` | Video `5to año.mp4` |

Archivos PDF en `js/assets.js`:

- **PDF 2°:** segundo grado de primaria.pdf  

Los grados **1°, 3°, 4°, 5° y 6°** usan lecturas con texto y preguntas integradas en la app. **5°** además tiene el módulo **Video** (`5to año.mp4`).

## Secciones

- **Inicio animado** — cohete, planetas y botón «Despegar»
- **Alumnos** — perfil propio con CP, progreso y recompensas
- **Lectura** — textos y preguntas (1°–6°); PDF opcional en 2° al terminar
- **Juegos** — memoria, sílabas, sopa de letras, modos heroico/legendario
- **Video** (solo 5°) — reproduce `5to año` sin quitar lecturas ni juegos
- **Especiales** — lecturas de temporada (Día del libro, primavera)
- **Mi semana** 📊 — resumen semanal + medallas
- **Opciones** ⚙️ — fuente amigable, alto contraste, voz
- **Modo maestro** 🔒 — PIN 2024 por defecto; ver alumnos y reiniciar progreso
- **PWA** — instalable desde el navegador (`manifest.json` + service worker)

## Puntos CP y recompensas

- Respuestas correctas: **10–20 CP** según dificultad
- Terminar **Rimas y ritmo**: **+20 CP**
- **Tienda por grado**: 🎁 en el menú del grado o en la pantalla de **Grados**
- **Activar / usar**:
  - **Activar / Desactivar** — confeti, texto grande, modo aurora, mascota, etc.
  - **💡 Pistas** — botón en preguntas de lectura (elimina 2 incorrectas)
  - **❤️ Vidas** — se usan solas en memoria
  - **🛡️ Escudo heroico** (5°) — perdona 1 error en juegos heroicos
  - **⏱️ Reloj legendario** (6°) — botón +8 s en juegos con cronómetro
  - **Guías de juego** — pistas en Clasifica, columnas, hecho/opinión (activar primero)

El progreso se guarda en el navegador (`localStorage`), **por alumno**.

### Alumnos
- Tras «Despegar», elige un explorador o crea **Nuevo alumno**.
- Cada alumno tiene sus propios CP y recompensas.
- Un **alumno nuevo** siempre empieza con **0 CP** y **sin recompensas** en el inventario.
- Puedes volver a la lista de alumnos con el botón 👤 en la pantalla de grados.

## Estructura

```
app compresion/
├── index.html
├── css/app.css
├── js/
│   ├── app.js
│   ├── activities.js
│   └── assets.js
└── assets/
    └── segundo/pdf/
```

¡Coloca tu PDF de 2° en la carpeta y recarga la página!
