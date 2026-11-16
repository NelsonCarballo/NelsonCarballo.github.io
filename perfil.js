/* =========================================================================
   PERFIL — tus datos. Edita este archivo con cualquier editor de texto.
   (El script ACTUALIZAR-GALERIA.bat NUNCA toca este archivo.)

   Reglas rápidas:
   - Los textos van entre comillas: "así".
   - Si dejas un campo vacío ("") simplemente no se muestra.
   ========================================================================= */
window.PERFIL = {
  nombre: "Carballo Nelson",
  disponible: true, // true = "DISPONIBLE" / false = "AGENDA LLENA"

  // Showreel: pega un link de YouTube (ej: "https://youtu.be/XXXXXXXXXXX")
  // o la ruta de un video local (ej: "contenido/showreel/showreel.mp4").
  // Si lo dejas vacío y pones un video dentro de contenido/showreel/,
  // el script lo detecta solo.
  showreel: "",

  // Sobre mí (cada texto es un párrafo)
  bio: [
    "Soy Nelson, editor de video y diseñador de miniaturas para YouTube. Convierto tus grabaciones en videos que entretienen: que la gente haga clic, se quede hasta el final y quiera ver el siguiente.",
    "Trato cada canal como si fuera mío. Cuido el ritmo, el sonido y cada detalle de la miniatura para que tu contenido se vea profesional y crezca, video a video."
  ],

  // Cualidades
  cualidades: [
    { icono: "schedule", titulo: "Entrega con responsabilidad", texto: "Respeto los plazos: tu video llega a tiempo para publicarlo." },
    { icono: "favorite", titulo: "Cada cliente importa", texto: "Me adapto a tu estilo y a lo que necesites: tiempo, calidad, velocidad, a tu gusto." }
  ],

  // Frase destacada debajo de las cualidades (puedes usar <b>negrita</b>)
  promesa: "No solo pagas un servicio: también te garantizo <b>hacerte perder el menor tiempo posible</b>.",

  // Números de la portada (cámbialos por los tuyos reales)
  stats: [
    { valor: "3h–48h", etiqueta: "Entrega de miniaturas" },
    { valor: "16:9 + 9:16", etiqueta: "Largo y vertical" },
    { valor: "100%", etiqueta: "Remoto" }
  ],

  // Orden de la galería de miniaturas (vista "Todas")
  // - intercalarCreadores: primero una de cada creador, luego se reparten sin repetir creador seguido.
  //   (el creador sale del nombre del archivo: "borja-288aa.jpg" -> borja)
  // - posiciones: fija miniaturas de una categoría en ciertos lugares (1 = la primera).
  ordenMiniaturas: {
    intercalarCreadores: true,
    posiciones: [
      { categoria: "Gaming", lugares: [3, 4] }
    ]
  },

  // Tarjeta final del carrusel de canales (pon cantidad: 0 para ocultarla)
  canalesOcultos: { cantidad: 14, texto: "Ocultos por contrato" },

  // Herramientas que usas
  herramientas: ["Premiere Pro", "After Effects", "Photoshop"],

  // Barras de la tarjeta de "jugador" (0 a 100)
  habilidades: [
    { nombre: "Miniaturas", nivel: 95 },
    { nombre: "Edición", nivel: 90 },
    { nombre: "Motion graphics", nivel: 75 },
    { nombre: "Color", nivel: 80 },
    { nombre: "Velocidad", nivel: 88 }
  ],

  // Servicios (icono = nombre de https://fonts.google.com/icons)
  servicios: [
    {
      icono: "photo_library",
      titulo: "Miniaturas de alto CTR",
      texto: "Miniaturas que destacan en el feed y cuentan la historia del video en un vistazo.",
      items: ["Recorte e iluminación", "Texto legible en móvil", "Variantes para test A/B"]
    },
    {
      icono: "movie_edit",
      titulo: "Edición largo formato",
      texto: "Videos de YouTube con ritmo, ganchos y diseño sonoro que mantienen a la gente mirando.",
      items: ["Cortes dinámicos", "SFX, música y zooms", "Corrección de color"]
    },
    {
      icono: "smartphone",
      titulo: "Shorts, Reels y TikTok",
      texto: "Clips verticales listos para viralizar, sacados de tus videos largos o grabados para eso.",
      items: ["Subtítulos animados", "Formato 9:16", "Ganchos en 2 segundos"]
    },
    {
      icono: "lightbulb",
      titulo: "Tu mano derecha creativa",
      texto: "También participo en la creación de contenido: te ayudo a pensar las ideas y a llevarlas a cabo, de principio a fin.",
      items: ["Ideas para videos y Shorts", "Títulos, ganchos y guiones", "Ejecución junto a ti"]
    }
  ],

  // Garantías / condiciones que aparecen en Contacto
  garantias: [
    { titulo: "⚡ Entrega rápida", texto: "Miniaturas en 3h–48h. Videos según duración y calidad." },
    { titulo: "🔁 Revisiones", texto: "Ajustamos hasta que quede como lo imaginaste." },
    { titulo: "🤝 Confiabilidad", texto: "Comunicación clara y plazos que se cumplen." },
    { titulo: "⏱️ Tu tiempo vale", texto: "Te hago perder el menor tiempo posible." }
  ],

  // Formulario de contacto: los mensajes llegan directo a este correo (servicio gratuito FormSubmit).
  // La PRIMERA vez que alguien envíe el formulario te llega un correo de FormSubmit para activarlo: ábrelo y toca "Activate".
  // Después de activarlo, FormSubmit te da un código (ej: "a1b2c3d4...") que puedes poner aquí en lugar del correo
  // para que tu email no quede visible en el código de la web.
  formulario: {
    formsubmit: "soycharlywty@gmail.com"
  },

  // Contacto (deja "" lo que no uses; se muestran solo los que completes)
  contacto: {
    email: "soycharlywty@gmail.com",       // ej: "tucorreo@gmail.com"  (también lo usa el formulario)
    whatsapp: "5491135625287",    // ej: "5491112345678" (con código de país, sin + ni espacios)
    discord: "",     // ej: "nelson_edits"  (al hacer clic se copia el usuario)
    instagram: "",   // ej: "nelson.edits"
    tiktok: "",      // ej: "nelson.edits"
    x: "",           // ej: "nelson_edits"
    youtube: ""      // ej: "https://youtube.com/@tucanal"
  }
};
