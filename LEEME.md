# Portfolio — Carballo Nelson

Para ver la web en tu PC haz doble clic en **`VER-WEB.bat`** (la abre en el navegador como si estuviera publicada,
y así los videos de YouTube se reproducen). Deja abierta la ventanita negra mientras la miras.
Si abres `index.html` directo con doble clic también funciona, pero YouTube no deja reproducir sus videos ahí.

## Cómo añadir tu trabajo (3 pasos)

1. **Suelta tus archivos** en la carpeta `contenido/`:

   | Qué | Dónde | Notas |
   |---|---|---|
   | Miniaturas | `contenido/miniaturas/` | Usa subcarpetas como categorías: `miniaturas/gaming/`, `miniaturas/vlogs/`… Se crean los filtros solos. |
   | Videos horizontales | `contenido/videos/` | `.mp4` (H.264). Si pones una imagen con el **mismo nombre** (`mi-video.jpg`), se usa como portada. |
   | Shorts / Reels | `contenido/videos/shorts/` | Se muestran en formato vertical. |
   | Videos de YouTube | `contenido/videos/youtube.txt` | Un link por línea. Opcional: `link \| Título \| Categoría`. Los `/shorts/` salen en vertical. |
   | Antes y después | `contenido/antes-despues/` | Pares con el mismo nombre: `gamer-antes.jpg` y `gamer-despues.jpg`. |
   | Showreel | `contenido/showreel/` | Un video. O pega un link de YouTube en `contenido/perfil.js` → `showreel`. |
   | Canales de creadores | `contenido/canales.txt` | Un link de canal por línea. El script trae nombre, suscriptores y foto. Los suscriptores se actualizan cada vez que lo ejecutas. |

2. **Doble clic en `ACTUALIZAR-GALERIA.bat`**. Escanea las carpetas, regenera `contenido/galeria.js` y crea versiones livianas de tus imágenes en `contenido/_web/` (no la borres: es la que usa la web para cargar rápido).

3. **Recarga la web (F5).**

> El título de cada miniatura sale del nombre del archivo (`hice-lo-imposible.jpg` → "Hice lo imposible").
> Si quieres cambiar títulos, descripciones o marcar una como `"destacada": true` (sale primero), edita
> `contenido/galeria.js`: el script **conserva tus cambios** cuando lo vuelves a ejecutar.

## Tus datos

Edita `contenido/perfil.js` (el script nunca lo toca): email, WhatsApp, Discord, Instagram, TikTok, X, YouTube,
estadísticas de la portada, herramientas, habilidades de la tarjeta de jugador, servicios, bio, cualidades y tu frase de promesa.
Tu foto de "Sobre mí" está en `img/nelson-carballo.jpg` (reemplázala por otra cuadrada con el mismo nombre si quieres cambiarla).
**Revisa los números de ejemplo y pon los tuyos reales.**

El formulario de contacto abre el correo del visitante con el mensaje ya armado hacia tu `email`
(o WhatsApp si no hay email).

## El personaje

Está dibujado píxel a píxel en `js/sprite.js` y su recorrido está en `js/personaje.js` (lista `STOPS`:
dónde se para, qué pose hace y qué dice). Los visitantes pueden ocultarlo con el botón 🎮 del menú.

## Publicar

Sube la carpeta entera a cualquier hosting estático (Netlify, Vercel, GitHub Pages, Hostinger…).
No hace falta subir `ACTUALIZAR-GALERIA.bat` ni este archivo.
Los videos de YouTube a veces no se reproducen al abrir la web con doble clic desde tu PC;
una vez publicada en internet funcionan normal.
