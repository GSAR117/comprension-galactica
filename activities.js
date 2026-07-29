/**
 * Actividades de comprensión lectora por grado
 * 1°: rimas y ritmo (voz alta, sin audio)
 * 2°: PDF en assets/segundo/pdf
 * 1°, 3°, 4°, 5°, 6°: lecturas integradas con preguntas
 */

const GRADE_LABELS = {
  1: "1° Primero",
  2: "2° Segundo",
  3: "3° Tercero",
  4: "4° Cuarto",
  5: "5° Quinto",
  6: "6° Sexto",
};

const CP_PER_CORRECT = {
  easy: 10,
  medium: 15,
  hard: 20,
};

/** Niveles especiales de juegos (5° heroica, 6° legendaria) */
const GAME_TIERS = {
  heroic: {
    id: "heroic",
    label: "Heroica",
    icon: "⚔️",
    cpHit: 18,
    cpComplete: 40,
    cpMission: 55,
    maxMistakes: 2,
  },
  legendary: {
    id: "legendary",
    label: "Legendaria",
    icon: "👑",
    cpHit: 25,
    cpComplete: 65,
    cpMission: 90,
    maxMistakes: 1,
    timerSec: 12,
  },
};

const GRADE_GAME_TIER = {
  5: "heroic",
  6: "legendary",
};

/** Recompensas por grado — type: toggle (activar/desactivar) | consumable (cargas) */
const REWARDS_BY_GRADE = {
  1: [
    { id: "g1-mascota", name: "Huevo Cósmico", desc: "Equípalo: te acompaña en el menú", cost: 30, icon: "🥚", type: "pet", effect: "pet-egg" },
    { id: "g1-traje", name: "Casco de Novato", desc: "Equípalo: protege tu cabeza en el espacio", cost: 40, icon: "🪖", type: "suit", effect: "suit-helmet" },
    { id: "g1-pistas", name: "Pistas Mágicas x3", desc: "En preguntas: elimina 2 respuestas incorrectas", cost: 45, icon: "💡", type: "consumable", effect: "hint", amount: 3, repeatable: true },
  ],
  2: [
    { id: "g2-mascota", name: "Gato Espacial", desc: "Equípalo: un felino astronauta", cost: 50, icon: "🐱", type: "pet", effect: "pet-cat" },
    { id: "g2-traje", name: "Traje Neón", desc: "Equípalo: brilla en la oscuridad", cost: 55, icon: "👨‍🚀", type: "suit", effect: "suit-neon" },
    { id: "g2-vidas", name: "Vidas Extra x3", desc: "Úsalas en juegos de memoria", cost: 35, icon: "❤️", type: "consumable", effect: "extra-life", amount: 3, repeatable: true },
    { id: "g2-pistas", name: "Pistas Mágicas x3", desc: "Elimina respuestas falsas", cost: 45, icon: "💡", type: "consumable", effect: "hint", amount: 3, repeatable: true },
  ],
  3: [
    { id: "g3-mascota", name: "Perro Robot", desc: "Equípalo: mascota mecánica", cost: 70, icon: "🐶", type: "pet", effect: "pet-dog" },
    { id: "g3-traje", name: "Propulsores Jet", desc: "Equípalo: vuela más rápido", cost: 60, icon: "🚀", type: "suit", effect: "suit-jetpack" },
    { id: "g3-pistas", name: "Pistas Mágicas x3", desc: "Elimina 2 respuestas incorrectas", cost: 45, icon: "💡", type: "consumable", effect: "hint", amount: 3, repeatable: true },
  ],
  4: [
    { id: "g4-mascota", name: "Alien Amistoso", desc: "Equípalo: un amigo de otro planeta", cost: 90, icon: "👽", type: "pet", effect: "pet-alien" },
    { id: "g4-traje", name: "Capa Cósmica", desc: "Equípalo: capa que flota sin gravedad", cost: 80, icon: "🦸", type: "suit", effect: "suit-cape" },
    { id: "g4-vidas", name: "Vidas Extra x3", desc: "Para juegos de destreza", cost: 35, icon: "❤️", type: "consumable", effect: "extra-life", amount: 3, repeatable: true },
  ],
  5: [
    { id: "g5-mascota", name: "Dragón Estelar", desc: "Equípalo: el rey del espacio", cost: 120, icon: "🐉", type: "pet", effect: "pet-dragon" },
    { id: "g5-escudo", name: "Escudo Heroico x2", desc: "Perdona 1 error en juegos heroicos", cost: 60, icon: "🛡️", type: "consumable", effect: "heroic-shield", amount: 2, repeatable: true },
    { id: "g5-pistas", name: "Pistas Mágicas x3", desc: "Elimina respuestas falsas", cost: 50, icon: "💡", type: "consumable", effect: "hint", amount: 3, repeatable: true },
  ],
  6: [
    { id: "g6-traje", name: "Corona Legendaria", desc: "Equípalo: te conviertes en la leyenda", cost: 150, icon: "👑", type: "suit", effect: "suit-crown" },
    { id: "g6-tiempo", name: "Reloj Legendario x2", desc: "+8 s en juegos con cronómetro", cost: 70, icon: "⏱️", type: "consumable", effect: "time-boost", amount: 2, repeatable: true },
    { id: "g6-pistas", name: "Pistas Mágicas x3", desc: "Para las lecturas más difíciles", cost: 55, icon: "💡", type: "consumable", effect: "hint", amount: 3, repeatable: true },
  ],
};

function getAllRewards() {
  return Object.values(REWARDS_BY_GRADE).flat();
}

function getRewardsForGrade(grade) {
  return REWARDS_BY_GRADE[grade] || [];
}

/**
 * Rimas y ritmo — solo 1° (sustituto de canciones, sin audio)
 * Practica lectura en voz alta, rimas, trabalenguas y comprensión oral
 */
const RITMO_PRIMERO = [
  {
    id: "rima-sol",
    title: "Rima del sol",
    tipo: "rima",
    text: `El sol sale, el sol entra,
brilla fuerte en la ventana.
El día empieza con alegría,
¡lee en voz alta esta poesía!`,
    instruction: "Lee la rima dos veces en voz alta. Luego responde.",
    questions: [
      { q: "¿Qué hace el sol en la rima?", options: ["Sale y brilla", "Se esconde para siempre", "Cocina sopa"], correct: 0, difficulty: "easy" },
      { q: "¿Dónde brilla el sol?", options: ["En la ventana", "Debajo de la cama", "En el refrigerador"], correct: 0, difficulty: "easy" },
    ],
  },
  {
    id: "rima-gato",
    title: "Rima del gatito",
    tipo: "rima",
    text: `Gatito gris, gatito feliz,
juega con un ovillo de lana.
Salta, corre y se echa a dormir,
soñando con la mañana.`,
    instruction: "Lee con ritmo, como si fuera un poema. ¿Entendiste?",
    questions: [
      { q: "¿Con qué juega el gatito?", options: ["Con un ovillo de lana", "Con un carro", "Con un libro"], correct: 0, difficulty: "easy" },
      { q: "¿Cómo está el gatito al inicio?", options: ["Feliz", "Triste", "Enojado"], correct: 0, difficulty: "easy" },
    ],
  },
  {
    id: "trabalengua-1",
    title: "Trabalengua espacial",
    tipo: "trabalengua",
    text: `Tres tristes tigres tragan trigo en un trigal.
Repítelo despacio, luego otra vez más rápido.`,
    instruction: "Lee despacio primero. Después responde.",
    questions: [
      { q: "¿Qué comen los tigres en el trabalengua?", options: ["Trigo", "Pizza", "Helado"], correct: 0, difficulty: "easy" },
      { q: "¿Cuántos tigres hay?", options: ["Tres", "Uno", "Diez"], correct: 0, difficulty: "easy" },
    ],
  },
  {
    id: "eco-lectura",
    title: "Lectura en eco",
    tipo: "eco",
    text: `Maestra lee: «Buenos días, niños».
Tú lees: «Buenos días, niños».
Maestra lee: «Hoy vamos a leer juntos».
Tú lees: «Hoy vamos a leer juntos».`,
    instruction: "Imagina que repites después de la maestra. Lee las cuatro líneas en voz alta.",
    questions: [
      { q: "¿Qué dice la maestra al inicio?", options: ["Buenos días, niños", "Adiós", "A dormir"], correct: 0, difficulty: "easy" },
      { q: "¿Qué van a hacer hoy según el texto?", options: ["Leer juntos", "Nadar", "No hacer nada"], correct: 0, difficulty: "easy" },
    ],
  },
  {
    id: "silabas",
    title: "Cuenta las sílabas",
    tipo: "silabas",
    text: `Palabras para palmear:
ca-sa (2 sílabas)
pe-lo-ta (3 sílabas)
mar-i-po-sa (4 sílabas)
Lee cada palabra y palmotea una vez por sílaba.`,
    instruction: "Palmotea al leer cada parte. Luego contesta.",
    questions: [
      { q: "¿Cuántas sílabas tiene «pelota»?", options: ["3", "1", "5"], correct: 0, difficulty: "easy" },
      { q: "¿Cuántas sílabas tiene «casa»?", options: ["2", "4", "6"], correct: 0, difficulty: "easy" },
      { q: "¿Cuántas sílabas tiene «mariposa»?", options: ["4", "2", "1"], correct: 0, difficulty: "medium" },
    ],
  },
];

/** Lecturas por grado (solo texto y preguntas) */
const READINGS = {
  1: [
    {
      id: "r1-1",
      title: "Mi gato Tito",
      text: "Tito es mi gato. Tito es gris. A Tito le gusta jugar. Tito juega con una bola.",
      questions: [
        { q: "¿Quién es Tito?", options: ["Un gato", "Un perro", "Un niño"], correct: 0, difficulty: "easy" },
        { q: "¿De qué color es Tito?", options: ["Gris", "Blanco", "Negro"], correct: 0, difficulty: "easy" },
        { q: "¿Con qué juega Tito?", options: ["Una bola", "Un zapato", "Una rama"], correct: 0, difficulty: "easy" },
      ],
    },
    {
      id: "r1-2",
      title: "El sol y la flor",
      text: "Sale el sol. El sol es amarillo. El sol calienta la flor. La flor es bonita.",
      questions: [
        { q: "¿Qué sale?", options: ["El sol", "La lluvia", "El viento"], correct: 0, difficulty: "easy" },
        { q: "¿De qué color es el sol?", options: ["Amarillo", "Verde", "Rojo"], correct: 0, difficulty: "easy" },
        { q: "¿Cómo es la flor?", options: ["Bonita", "Grande", "Azul"], correct: 0, difficulty: "easy" },
      ],
    },
    {
      id: "r1-3",
      title: "Oso y miel",
      text: "El oso ve la miel. La miel es dulce. Al oso le gusta la miel. El oso come feliz.",
      questions: [
        { q: "¿Qué ve el oso?", options: ["La miel", "Una flor", "Un río"], correct: 0, difficulty: "easy" },
        { q: "¿Cómo es la miel?", options: ["Dulce", "Salada", "Agria"], correct: 0, difficulty: "easy" },
        { q: "¿Quién come feliz?", options: ["El oso", "El gato", "El pájaro"], correct: 0, difficulty: "easy" },
      ],
    },
  ],
  2: [
    {
      id: "r2-1",
      title: "La mariposa y el libro",
      text: `En segundo grado, Rosa llevó un libro de animales a la escuela. En el recreo vio una mariposa naranja en una flor. Abrió su libro y encontró un dibujo igual. Leyó en voz baja: «Las mariposas beben néctar de las flores». Su amiga Diego escuchó y dijo: «¡Tu libro explica lo que vemos!». Rosa sonrió y marcó la página con una hoja.`,
      questions: [
        { q: "¿Qué llevó Rosa a la escuela?", options: ["Un libro de animales", "Un balón", "Una pizza"], correct: 0, difficulty: "easy" },
        { q: "¿Qué vio Rosa en el recreo?", options: ["Una mariposa naranja", "Un carro", "Un pez"], correct: 0, difficulty: "easy" },
        { q: "¿Qué decía el libro sobre las mariposas?", options: ["Beben néctar de las flores", "Viven en el mar", "No vuelan"], correct: 0, difficulty: "medium" },
      ],
    },
    {
      id: "r2-2",
      title: "El cuento de las sílabas",
      text: `La maestra escribió en el pizarrón: ca-sa, pe-lo-ta, li-bro. Pidió a la clase que palmoteara cada sílaba. Martín leyó «li-bro» y abrió el suyo. La maestra dijo: «Leer es unir sílabas con calma». Al final del día, Martín leyó tres palabras nuevas sin ayuda.`,
      questions: [
        { q: "¿Qué pidió la maestra sobre las sílabas?", options: ["Palmotear cada sílaba", "Borrarlas", "No leerlas"], correct: 0, difficulty: "easy" },
        { q: "¿Qué abrió Martín después de leer «li-bro»?", options: ["Su libro", "La ventana", "Nada"], correct: 0, difficulty: "easy" },
        { q: "¿Cuántas palabras nuevas leyó Martín al final?", options: ["Tres", "Ninguna", "Cien"], correct: 0, difficulty: "medium" },
      ],
    },
    {
      id: "r2-3",
      title: "La sorpresa del kiosco",
      text: `Javier encontró un folleto en el kiosco de la esquina. Tenía un cuento corto y tres preguntas al final. Lo compró con sus monedas y lo leyó en el banco del parque. Respondió las preguntas y se las enseñó a su mamá. Ella dijo: «Leer en el parque también cuenta». Javier guardó el folleto en su mochila.`,
      questions: [
        { q: "¿Dónde encontró Javier el folleto?", options: ["En el kiosco", "En la luna", "En el mar"], correct: 0, difficulty: "easy" },
        { q: "¿Dónde lo leyó?", options: ["En el banco del parque", "En la cocina", "En el baño"], correct: 0, difficulty: "easy" },
        { q: "¿Qué dijo mamá?", options: ["Leer en el parque también cuenta", "No leas más", "Quema el folleto"], correct: 0, difficulty: "medium" },
      ],
    },
  ],
  3: [
    {
      id: "r3-1",
      title: "El misterio de la cueva",
      text: `Un día soleado, Marcos y su perro Toby paseaban por el bosque que quedaba cerca de su casa. De pronto, Toby comenzó a ladrar y corrió hacia unos arbustos muy espesos. Marcos lo siguió con curiosidad y descubrió la entrada de una cueva oscura y profunda.
Aunque sentía un poco de miedo, encendió la linterna de su reloj y entró lentamente. Las paredes de la cueva estaban cubiertas de extraños dibujos que parecían estrellas y animales antiguos. Al fondo, encontró un cofre de madera cubierto de polvo.
Al abrirlo, no halló oro ni joyas, sino un montón de libros viejos con tapas de cuero. Marcos comprendió que el verdadero tesoro era el conocimiento y las historias que esos libros guardaban.`,
      questions: [
        { q: "¿Quién acompañaba a Marcos en su paseo?", options: ["Su perro Toby", "Su mejor amigo", "Su hermano mayor", "Nadie, iba solo"], correct: 0, difficulty: "easy" },
        { q: "¿Qué encontró Marcos al fondo de la cueva?", options: ["Un cofre con libros viejos", "Un tesoro de oro y diamantes", "Un mapa misterioso", "Un animal salvaje"], correct: 0, difficulty: "easy" },
        { q: "¿Por qué crees que Marcos consideró los libros como un verdadero tesoro?", options: ["Porque valoraba el conocimiento y las historias", "Porque pensaba venderlos y hacerse rico", "Porque no sabía leer y quería aprender", "Porque eran libros mágicos que daban poderes"], correct: 0, difficulty: "medium" },
        { q: "¿Qué elemento usó Marcos para iluminar la cueva?", options: ["La linterna de su reloj", "Una antorcha de madera", "El flash de su teléfono", "Una vela que llevaba consigo"], correct: 0, difficulty: "medium" }
      ]
    },
    {
      id: "r3-2",
      title: "La invención del papel",
      text: `Hace muchísimo tiempo, antes de que existiera el papel, las personas escribían sobre piedras, hojas de árboles, huesos e incluso caparazones de tortuga. Era muy difícil guardar la información de esta manera.
Un hombre llamado Cai Lun, que vivía en la antigua China, observó a las avispas construyendo sus nidos. Se dio cuenta de que masticaban madera y la mezclaban con su saliva para hacer un material parecido al cartón.
Inspirado por esto, Cai Lun mezcló cortezas de árboles, restos de tela y redes de pesca viejas con mucha agua. Luego, dejó secar la mezcla al sol sobre una malla fina. Así nació la primera hoja de papel, un invento que cambió la historia del mundo para siempre, pues facilitó la escritura de los libros.`,
      questions: [
        { q: "¿Sobre qué escribían las personas antes del papel?", options: ["Piedras, hojas, huesos y caparazones", "Solo sobre arena y madera", "Papiro y pergamino", "Pizarras de tiza"], correct: 0, difficulty: "easy" },
        { q: "¿Quién inventó el papel y dónde vivía?", options: ["Cai Lun en la antigua China", "Un rey en Egipto", "Un científico en Europa", "Un monje en Japón"], correct: 0, difficulty: "easy" },
        { q: "¿Qué animal inspiró la invención del papel?", options: ["Las avispas", "Las abejas", "Las arañas", "Las hormigas"], correct: 0, difficulty: "medium" },
        { q: "¿Por qué el papel cambió la historia del mundo?", options: ["Porque facilitó la escritura de los libros", "Porque se usó para construir casas", "Porque era muy costoso y valioso", "Porque se convirtió en la moneda oficial"], correct: 0, difficulty: "hard" }
      ]
    },
    {
      id: "r3-3",
      title: "El robot jardinero",
      text: `En la ciudad de Tecno-Sol, los árboles estaban desapareciendo porque a la gente se le olvidaba regarlos. Un inventor llamado Leo decidió crear a 'Verdín', un pequeño robot equipado con ruedas, sensores de humedad y un tanque de agua en la espalda.
La misión de Verdín era recorrer los parques y medir qué plantas necesitaban agua. Cuando encontraba una flor marchita, la regaba suavemente y le cantaba una canción electrónica para animarla.
Pronto, la ciudad entera se llenó de colores y las plantas volvieron a crecer fuertes. Los niños aprendieron de Verdín y comenzaron a ayudarlo, descubriendo que cuidar la naturaleza era más divertido que jugar con pantallas todo el día.`,
      questions: [
        { q: "¿Por qué estaban desapareciendo los árboles en Tecno-Sol?", options: ["Porque a la gente se le olvidaba regarlos", "Porque un monstruo se los comía", "Porque había una terrible sequía", "Porque los talaban para hacer edificios"], correct: 0, difficulty: "easy" },
        { q: "¿Qué hacía Verdín cuando encontraba una flor marchita?", options: ["La regaba y le cantaba una canción", "La arrancaba para limpiar el parque", "Llamaba al inventor Leo por radio", "Le echaba fertilizante químico"], correct: 0, difficulty: "medium" },
        { q: "¿Qué aprendieron los niños gracias al robot?", options: ["Que cuidar la naturaleza es muy divertido", "A construir sus propios robots jardineros", "Que el agua de la ciudad estaba contaminada", "Que las pantallas son malas para los ojos"], correct: 0, difficulty: "hard" },
        { q: "¿Con qué herramientas estaba equipado Verdín?", options: ["Ruedas, sensores de humedad y un tanque de agua", "Piernas metálicas, manguera y podadora", "Cámara, micrófono y panel solar", "Alas, regadera y tijeras"], correct: 0, difficulty: "medium" }
      ]
    }
  ],
  4: [
    {
      id: "r4-1",
      title: "El viaje del agua",
      text: `El ciclo del agua es un proceso asombroso que mantiene con vida a nuestro planeta. Todo comienza con la evaporación, cuando el calor del sol convierte el agua de los mares, ríos y lagos en vapor invisible que sube hacia el cielo.
A medida que el vapor asciende, el aire frío hace que se condense, formando minúsculas gotas de agua que se agrupan y crean las nubes que vemos flotar. Cuando estas gotas se vuelven demasiado pesadas para sostenerse en el aire, ocurre la precipitación.
La precipitación puede caer en forma de lluvia, nieve o granizo, devolviendo el agua a la tierra. Parte de esta agua se filtra en el suelo, alimentando las raíces de las plantas y formando ríos subterráneos, mientras que el resto fluye nuevamente hacia los océanos para comenzar el ciclo una vez más.`,
      questions: [
        { q: "¿Qué elemento es fundamental para iniciar la evaporación?", options: ["El calor del sol", "La fuerza del viento", "La gravedad terrestre", "El movimiento de las mareas"], correct: 0, difficulty: "medium" },
        { q: "¿Qué es la condensación en el ciclo del agua?", options: ["El vapor que se convierte en nubes", "El agua que cae como lluvia", "El agua que se filtra en la tierra", "El hielo que se derrite en las montañas"], correct: 0, difficulty: "medium" },
        { q: "¿Qué formas puede tomar la precipitación?", options: ["Lluvia, nieve o granizo", "Vapor, humo o niebla", "Ríos, lagos o mares", "Rocío, escarcha o humedad"], correct: 0, difficulty: "easy" },
        { q: "¿Por qué es tan importante el agua que se filtra en el suelo?", options: ["Porque alimenta las raíces de las plantas y forma ríos subterráneos", "Porque hace que el suelo sea más blando para excavar", "Porque evita que los océanos se desborden", "Porque refresca la temperatura del planeta"], correct: 0, difficulty: "hard" }
      ]
    },
    {
      id: "r4-2",
      title: "Los guardianes de la biblioteca",
      text: `La biblioteca del pueblo ocultaba un gran secreto: a medianoche, los personajes de los libros cobraban vida. Piratas, astronautas y princesas salían de sus páginas para limpiar el polvo de las estanterías y ordenar los libros que los niños habían dejado tirados durante el día.
Un viernes por la noche, el bibliotecario olvidó cerrar la ventana. Una ráfaga de viento entró repentinamente y mezcló las páginas de varios cuentos. ¡Era un desastre! Un dragón quedó atrapado en una nave espacial y un detective apareció en un bosque de hadas.
Trabajando en equipo, los personajes tuvieron que leer rápidamente fragmentos de las historias para devolver a cada uno a su libro original antes de que saliera el sol. Gracias a la valentía del caballero Arturo y la inteligencia de la científica Marie, lograron organizar el caos justo a tiempo.`,
      questions: [
        { q: "¿Qué secreto ocultaba la biblioteca del pueblo?", options: ["Los personajes de los libros cobraban vida a medianoche", "Había un tesoro escondido bajo el piso", "El bibliotecario era un mago disfrazado", "Los libros se escribían solos por la noche"], correct: 0, difficulty: "easy" },
        { q: "¿Qué causó el caos entre los cuentos?", options: ["Una ráfaga de viento por una ventana abierta", "Un hechizo mal pronunciado por el dragón", "Un niño que rompió los libros sin querer", "Un ladrón que intentó robar las historias"], correct: 0, difficulty: "medium" },
        { q: "¿Cómo lograron solucionar el problema los personajes?", options: ["Leyendo fragmentos de historias y trabajando en equipo", "Llamando al bibliotecario para que los ayudara", "Usando la magia del hada madrina del bosque", "Pegando las páginas con cinta adhesiva"], correct: 0, difficulty: "hard" },
        { q: "¿Quiénes fueron fundamentales para organizar el caos?", options: ["El caballero Arturo y la científica Marie", "El dragón y el detective", "Las princesas y los astronautas", "Los piratas y los niños del pueblo"], correct: 0, difficulty: "medium" }
      ]
    },
    {
      id: "r4-3",
      title: "El enigma de las abejas",
      text: `Las abejas son insectos fascinantes y trabajadores que desempeñan un papel crucial en nuestro ecosistema mediante la polinización. Sin ellas, muchas de las frutas y verduras que comemos diariamente no podrían crecer.
Dentro de una colmena, existe una organización perfecta. La abeja reina es la encargada de poner los huevos. Los zánganos son los machos que acompañan a la reina. Pero las verdaderas heroínas son las abejas obreras, quienes construyen los panales hexagonales, cuidan a las crías, defienden la colmena y salen a recolectar el néctar de las flores.
Cuando una abeja obrera encuentra una buena fuente de alimento, regresa a la colmena y realiza una danza especial, moviéndose en forma de ocho. Los ángulos y la duración de este baile les indican a sus compañeras la dirección exacta y la distancia a la que se encuentran las flores.`,
      questions: [
        { q: "¿Por qué son fundamentales las abejas para nosotros?", options: ["Porque polinizan las plantas que nos dan frutas y verduras", "Porque producen miel deliciosa para nuestros desayunos", "Porque son los únicos insectos que se organizan en sociedad", "Porque defienden los bosques de otras plagas peligrosas"], correct: 0, difficulty: "medium" },
        { q: "¿Cuál es la función principal de la abeja reina?", options: ["Poner los huevos para la colmena", "Recolectar néctar y polen", "Defender la colmena de intrusos", "Construir los panales hexagonales"], correct: 0, difficulty: "easy" },
        { q: "¿Cómo se comunican las abejas obreras para indicar dónde hay comida?", options: ["Realizando una danza en forma de ocho", "Emitiendo zumbidos de diferentes tonos", "Dejando un rastro de olor en el aire", "Dibujando mapas en los panales"], correct: 0, difficulty: "medium" },
        { q: "¿Qué información transmiten a través de su baile especial?", options: ["La dirección exacta y la distancia de las flores", "El color y el tamaño de las flores", "La cantidad de néctar que encontraron", "El peligro que hay en el camino"], correct: 0, difficulty: "hard" }
      ]
    }
  ],
  5: [
    {
      id: "r5-1",
      title: "El misterio de los jeroglíficos",
      text: `Durante miles de años, la antigua escritura egipcia, conocida como jeroglíficos, fue un enigma indescifrable para el mundo. Los eruditos y arqueólogos que exploraban los templos y tumbas del río Nilo quedaban maravillados por los hermosos símbolos grabados en piedra, pero nadie entendía su significado, creyendo que eran meras decoraciones o símbolos mágicos.
Todo cambió en 1799 con el descubrimiento de la Piedra de Rosetta. Esta pesada losa de basalto negro contenía un mismo decreto escrito en tres sistemas diferentes: jeroglíficos en la parte superior, escritura demótica (el idioma cotidiano egipcio) en el medio, y griego antiguo en la base. Como los historiadores sabían leer griego, por fin tenían una clave para traducir el mensaje.
El lingüista francés Jean-François Champollion dedicó años de su vida a estudiar la piedra. En 1822, descubrió que los jeroglíficos no representaban solo ideas completas, sino también sonidos individuales, similar a un alfabeto. Este brillante descubrimiento abrió la puerta para comprender tres mil años de historia faraónica, revelando secretos de la medicina, la religión y la vida diaria del antiguo Egipto.`,
      questions: [
        { q: "¿Qué eran los jeroglíficos antes de 1799?", options: ["Un enigma indescifrable para el mundo", "El alfabeto usado por los comerciantes griegos", "Un idioma hablado solo por los reyes", "Un sistema de números matemáticos egipcios"], correct: 0, difficulty: "easy" },
        { q: "¿Por qué la Piedra de Rosetta fue crucial para los historiadores?", options: ["Porque contenía el mismo texto en griego antiguo, que sí sabían leer", "Porque era la piedra más grande y pesada encontrada en Egipto", "Porque revelaba la ubicación de la tumba de un faraón famoso", "Porque fue descubierta por el famoso Jean-François Champollion"], correct: 0, difficulty: "hard" },
        { q: "¿Cuál fue el gran descubrimiento de Champollion sobre los jeroglíficos?", options: ["Que también representaban sonidos individuales, como un alfabeto", "Que solo eran símbolos mágicos sin un significado real", "Que estaban escritos al revés, de derecha a izquierda", "Que se escribieron usando tinta invisible que aparecía con fuego"], correct: 0, difficulty: "medium" },
        { q: "¿Qué tres escrituras contenía la Piedra de Rosetta?", options: ["Jeroglíficos, escritura demótica y griego antiguo", "Jeroglíficos, latín y árabe", "Escritura demótica, hebreo y griego antiguo", "Símbolos cuneiformes, jeroglíficos y latín"], correct: 0, difficulty: "medium" }
      ]
    },
    {
      id: "r5-2",
      title: "La expedición a la Antártida",
      text: `La Antártida es el continente más frío, seco y ventoso de nuestro planeta. Es un desierto de hielo donde las temperaturas pueden descender a menos de 80 grados bajo cero. A pesar de estas condiciones extremas, alberga una impresionante diversidad de vida adaptada al frío, como pingüinos emperador, focas de Weddell y microorganismos que sobreviven bajo los glaciares.
En 1911, dos exploradores, el noruego Roald Amundsen y el británico Robert Falcon Scott, iniciaron una dramática carrera para ser los primeros seres humanos en alcanzar el Polo Sur. Amundsen optó por usar perros de trineo y esquíes, mientras que Scott prefirió llevar ponis siberianos y vehículos motorizados que rápidamente fallaron en el hielo intenso.
Amundsen llegó primero, plantando la bandera noruega el 14 de diciembre. Scott y su equipo llegaron más de un mes después, encontrando la tienda de su rival. Trágicamente, Scott y sus hombres perecieron en el viaje de regreso debido al agotamiento y el frío extremo. Hoy en día, la Antártida no es escenario de carreras, sino un inmenso laboratorio internacional donde científicos de todo el mundo estudian el clima y protegen este frágil ecosistema.`,
      questions: [
        { q: "¿Cómo se describe a la Antártida en el texto?", options: ["Como el continente más frío, seco y ventoso del planeta", "Como un vasto océano congelado sin tierra debajo", "Como el hogar exclusivo de los osos polares", "Como un continente lluvioso y con densa vegetación"], correct: 0, difficulty: "easy" },
        { q: "¿Por qué la expedición de Amundsen fue más exitosa que la de Scott?", options: ["Porque usó perros de trineo y esquíes, adaptados al terreno", "Porque tenía un mapa secreto que le dio ventaja", "Porque los vehículos motorizados de Amundsen funcionaron perfectamente", "Porque el equipo de Scott decidió rendirse a mitad del camino"], correct: 0, difficulty: "hard" },
        { q: "¿Qué animales se mencionan como habitantes adaptados de la Antártida?", options: ["Pingüinos emperador y focas de Weddell", "Osos polares y zorros árticos", "Ballenas jorobadas y lobos marinos", "Gaviotas y morsas colmilludas"], correct: 0, difficulty: "medium" },
        { q: "¿Qué uso principal se le da a la Antártida en la actualidad?", options: ["Es un laboratorio internacional para estudiar el clima", "Es un campo de entrenamiento militar para invierno", "Es un centro turístico de deportes extremos", "Es una zona minera para extraer carbón y oro"], correct: 0, difficulty: "medium" }
      ]
    },
    {
      id: "r5-3",
      title: "El poder del cerebro plástico",
      text: `Durante mucho tiempo, la ciencia creyó que el cerebro humano era como una máquina rígida que dejaba de desarrollarse al llegar a la adultez. Sin embargo, en las últimas décadas, los neurocientíficos han descubierto un concepto fascinante: la neuroplasticidad. Esto significa que nuestro cerebro es como la plastilina; puede cambiar, moldearse y adaptarse a lo largo de toda nuestra vida.
Cada vez que aprendes algo nuevo, ya sea tocar la guitarra, hablar otro idioma o resolver un problema de matemáticas, tu cerebro crea nuevas conexiones entre sus células, llamadas neuronas. Cuanto más practicas, más fuertes y rápidas se vuelven estas conexiones, creando autopistas de información en tu cabeza. 
Este descubrimiento nos enseña que la inteligencia no es algo fijo con lo que nacemos. El esfuerzo, la curiosidad y enfrentar desafíos difíciles son los ejercicios que fortalecen nuestra mente. Incluso cuando nos equivocamos, nuestro cerebro está aprendiendo y creando nuevas rutas, demostrando que los errores son, en realidad, escalones hacia el crecimiento intelectual.`,
      questions: [
        { q: "¿Qué es la neuroplasticidad según el texto?", options: ["La capacidad del cerebro para cambiar y adaptarse toda la vida", "La ciencia que estudia cómo fabricar cerebros artificiales", "El endurecimiento del cerebro cuando llegamos a la adultez", "El proceso por el cual olvidamos las cosas que aprendemos"], correct: 0, difficulty: "medium" },
        { q: "¿Qué sucede en el cerebro cuando practicamos una habilidad repetidamente?", options: ["Las conexiones entre las neuronas se vuelven más fuertes y rápidas", "El cerebro aumenta considerablemente de tamaño", "Las células viejas mueren para dejar espacio a las nuevas", "Se borra información antigua para almacenar la nueva"], correct: 0, difficulty: "hard" },
        { q: "¿Cómo considera el texto a los errores durante el aprendizaje?", options: ["Como escalones hacia el crecimiento intelectual", "Como pruebas de que no somos buenos para una tarea", "Como daños permanentes en nuestras conexiones neuronales", "Como obstáculos que debemos evitar a toda costa"], correct: 0, difficulty: "medium" },
        { q: "¿Qué creía la ciencia en el pasado acerca del cerebro humano?", options: ["Que era rígido y dejaba de desarrollarse en la adultez", "Que funcionaba exactamente igual que una computadora moderna", "Que estaba formado por un solo músculo gigante", "Que tenía una cantidad limitada de información que podía guardar"], correct: 0, difficulty: "easy" }
      ]
    }
  ],
  6: [
    {
      id: "r6-1",
      title: "La inteligencia artificial y nuestro futuro",
      text: `La Inteligencia Artificial (IA) ha pasado de ser un tema de ciencia ficción a una herramienta cotidiana que usamos sin darnos cuenta. Desde los algoritmos que te recomiendan qué video ver a continuación, hasta los asistentes de voz en los teléfonos inteligentes y los programas capaces de detectar enfermedades antes que un médico humano, la IA está transformando radicalmente la sociedad. En términos simples, la IA consiste en entrenar computadoras alimentándolas con gigantescas cantidades de datos para que aprendan a reconocer patrones y tomar decisiones por sí mismas, un proceso conocido como aprendizaje automático (machine learning).
Sin embargo, este rápido avance tecnológico plantea importantes debates éticos. Un sector de los expertos argumenta que la IA impulsará un salto sin precedentes en el bienestar humano: automatizará trabajos peligrosos, resolverá complejos problemas climáticos y personalizará la educación escolar al ritmo de cada alumno. Por otro lado, diversos analistas expresan preocupación profunda. Señalan que la dependencia de los algoritmos podría generar pérdida masiva de empleos tradicionales y que, si estos sistemas se programan con datos sesgados, podrían amplificar injusticias sociales y tomar decisiones discriminatorias que afecten la vida de las personas.
Ante esta encrucijada, el verdadero desafío para las futuras generaciones no será simplemente entender cómo programar estas máquinas, sino cómo regularlas. Los gobiernos y los creadores de tecnología tienen la responsabilidad de garantizar que la inteligencia artificial se desarrolle bajo normas estrictas de transparencia y ética, asegurando que esta poderosa herramienta trabaje al servicio de la humanidad y no en su contra.`,
      questions: [
        { q: "¿Qué es el 'aprendizaje automático' (machine learning) según el texto?", options: ["Entrenar computadoras con datos para que aprendan patrones y tomen decisiones", "La capacidad de las máquinas para reparar sus propios componentes físicos", "Un programa escolar diseñado para enseñar programación básica a los niños", "El uso de robots para reemplazar el trabajo manual en las fábricas de ensamblaje"], correct: 0, difficulty: "medium" },
        { q: "¿Cuál es uno de los principales riesgos éticos mencionados respecto a la Inteligencia Artificial?", options: ["Que algoritmos entrenados con datos sesgados amplifiquen injusticias sociales", "Que las máquinas desarrollen emociones y se rebelen contra sus creadores", "Que consuman demasiada energía eléctrica y provoquen apagones mundiales", "Que eliminen por completo la necesidad de estudiar en las escuelas"], correct: 0, difficulty: "hard" },
        { q: "En el contexto de la lectura, ¿qué significa la palabra 'sesgados'?", options: ["Que tienen prejuicios o falta de objetividad", "Que son extremadamente rápidos y eficientes", "Que están incompletos o dañados físicamente", "Que provienen de fuentes oficiales del gobierno"], correct: 0, difficulty: "hard" },
        { q: "¿Cuál afirma el texto que es el verdadero desafío para las futuras generaciones?", options: ["Aprender cómo regular y establecer normas éticas para estas máquinas", "Memorizar todos los lenguajes de programación existentes en la actualidad", "Prohibir el avance de la inteligencia artificial antes de que sea tarde", "Reemplazar a los médicos y maestros humanos con robots avanzados"], correct: 0, difficulty: "medium" },
        { q: "Identifica cuál de las siguientes afirmaciones es una opinión y no un hecho presentado en el texto:", options: ["'La IA impulsará un salto sin precedentes en el bienestar humano'", "'La IA se usa en los asistentes de voz de los teléfonos inteligentes'", "'La IA consiste en entrenar computadoras con gigantescas cantidades de datos'", "'La IA es capaz de recomendar videos a los usuarios'"], correct: 0, difficulty: "hard" }
      ]
    },
    {
      id: "r6-2",
      title: "El misterio de los agujeros negros",
      text: `El universo está lleno de fenómenos incomprensibles, pero pocos capturan tanto la imaginación como los agujeros negros. Fueron predichos teóricamente por las ecuaciones de la relatividad de Albert Einstein en 1915, aunque el propio Einstein dudaba de que pudieran existir en la realidad. Un agujero negro se forma cuando una estrella masiva agota su combustible nuclear y colapsa sobre sí misma bajo el inmenso peso de su propia gravedad. El resultado es un punto en el espacio infinitamente pequeño y denso, conocido como singularidad.
Lo que hace a los agujeros negros verdaderamente aterradores e intrigantes es su 'horizonte de eventos', una frontera invisible que marca el punto de no retorno. La fuerza gravitacional en esta región es tan monstruosa que ni siquiera la luz, que viaja a 300,000 kilómetros por segundo, puede escapar de ella. Es por esto que los llamamos 'negros', ya que no reflejan ni emiten luz perceptible. Durante décadas, los astrónomos solo podían deducir su existencia observando cómo su inmensa gravedad afectaba el movimiento de las estrellas cercanas y los gases circundantes.
Sin embargo, la historia de la astronomía cambió para siempre en 2019. Gracias al Telescopio del Horizonte de Sucesos (EHT, por sus siglas en inglés), que en realidad era una red global de telescopios sincronizados trabajando como uno solo del tamaño de la Tierra, la humanidad obtuvo la primera imagen de un agujero negro supermasivo en el centro de la galaxia M87. Esta hazaña tecnológica no solo confirmó las teorías de hace más de un siglo, sino que demostró que el esfuerzo colaborativo internacional puede desentrañar los secretos más oscuros del cosmos.`,
      questions: [
        { q: "¿Cómo se origina, según el texto, un agujero negro?", options: ["Por el colapso gravitacional de una estrella masiva al agotar su combustible", "Por el choque a alta velocidad de dos planetas de gran tamaño", "Por la explosión de luz en el centro de una galaxia recién nacida", "Por la acumulación lenta de polvo espacial durante miles de millones de años"], correct: 0, difficulty: "medium" },
        { q: "¿Qué es el 'horizonte de eventos'?", options: ["La frontera invisible que marca el punto de no retorno de la gravedad", "La explosión final que destruye la estrella antes de colapsar", "El nombre de la red de telescopios que tomó la fotografía", "El límite del universo conocido por los astrónomos modernos"], correct: 0, difficulty: "easy" },
        { q: "Antes del 2019, ¿cómo sabían los científicos que los agujeros negros estaban ahí si no emitían luz?", options: ["Observando cómo su gravedad afectaba a las estrellas y gases cercanos", "Escuchando los sonidos emitidos desde el centro de la galaxia", "Calculando el tiempo que tardaba la luz en desaparecer", "Enviando sondas espaciales para que los chocaran intencionalmente"], correct: 0, difficulty: "hard" },
        { q: "¿Qué hizo posible obtener la primera imagen de un agujero negro en 2019?", options: ["Una red global de telescopios sincronizados actuando como uno solo", "El envío de un telescopio superpotente más allá de nuestro sistema solar", "El descubrimiento de una lente espacial gigante inventada por Einstein", "Un programa de inteligencia artificial que dibujó el agujero matemáticamente"], correct: 0, difficulty: "medium" },
        { q: "¿Qué actitud tenía Albert Einstein respecto a los agujeros negros?", options: ["Dudaba de que realmente existieran en la realidad, a pesar de sus ecuaciones", "Estaba completamente seguro de su existencia y dedicó su vida a fotografiarlos", "Creía que solo existían en galaxias lejanas, pero no en la nuestra", "Afirmaba que eran portales hacia otras dimensiones en el tiempo"], correct: 0, difficulty: "hard" }
      ]
    }
  ]
};

/** Lecturas especiales (todos los grados) */
const SEASONAL_READINGS = {
  1: [
    {
      id: "sp-dia-libro-1",
      title: "El libro de Tito",
      text: "Tito tiene un libro. El libro es rojo. Tito lee en el patio. Mamá ve a Tito y sonríe.",
      questions: [
        { q: "¿Qué tiene Tito?", options: ["Un libro", "Un carro", "Un perro"], correct: 0, difficulty: "easy" },
        { q: "¿De qué color es el libro?", options: ["Rojo", "Azul", "Verde"], correct: 0, difficulty: "easy" },
        { q: "¿Dónde lee Tito?", options: ["En el patio", "En la cama", "En el techo"], correct: 0, difficulty: "easy" },
      ],
    },
    {
      id: "sp-primavera-1",
      title: "La flor y el sol",
      text: "Sale el sol en la mañana. Una flor crece bonita. La flor es amarilla. Las abejas vuelan felices.",
      questions: [
        { q: "¿Qué crece bonita?", options: ["Una flor", "Un árbol", "Una casa"], correct: 0, difficulty: "easy" },
        { q: "¿De qué color es la flor?", options: ["Amarilla", "Roja", "Azul"], correct: 0, difficulty: "easy" },
        { q: "¿Quién vuela feliz?", options: ["Las abejas", "Los gatos", "Los perros"], correct: 0, difficulty: "easy" },
      ],
    },
  ],
  default: [
    {
      id: "sp-dia-libro",
      title: "Especial: Día del libro",
      text: `En el Día del libro, la escuela decoró el patio con estrellas de papel. Cada niño trajo un cuento favorito. Al mediodía, formaron un círculo y leyeron en voz baja. La directora dijo: «Un libro es un amigo que te acompaña en cualquier planeta». Al final, intercambiaron recomendaciones escribiendo el título en una tarjeta.`,
      questions: [
        { q: "¿Qué decoró el patio?", options: ["Estrellas de papel", "Peces", "Carros"], correct: 0, difficulty: "easy" },
        { q: "¿Qué dijo la directora?", options: ["Un libro es un amigo que te acompaña", "No hay que leer", "Solo leer una vez"], correct: 0, difficulty: "medium" },
        { q: "¿Qué hicieron al final?", options: ["Intercambiaron recomendaciones", "Quemaron libros", "No hicieron nada"], correct: 0, difficulty: "medium" },
      ],
    },
    {
      id: "sp-primavera",
      title: "Especial: Cuento de primavera",
      text: `En primavera, la clase plantó semillas en vasos reciclados. Cada vaso tenía una etiqueta con el nombre del alumno. Leyeron las instrucciones del sobre: regar poco, poner al sol, esperar con paciencia. A las tres semanas brotaron las plantas. El maestro escribió en el pizarrón: «Leer instrucciones ayuda a cuidar la vida».`,
      questions: [
        { q: "¿Qué plantó la clase?", options: ["Semillas en vasos", "Piedras", "Juguetes"], correct: 0, difficulty: "easy" },
        { q: "¿Qué decían las instrucciones?", options: ["Regar poco y poner al sol", "No regar nunca", "Enterrar los vasos"], correct: 0, difficulty: "medium" },
        { q: "¿Qué escribió el maestro?", options: ["Leer instrucciones ayuda a cuidar la vida", "No leas", "Las plantas no crecen"], correct: 0, difficulty: "hard" },
      ],
    },
  ]
};

/** Logros automáticos */
const ACHIEVEMENTS = [
  { id: "ach-first-read", name: "Primer viaje", icon: "🚀", desc: "Completa tu primera lectura", cpReward: 50, check: (m) => m.stats.readingsDone >= 1 },
  { id: "ach-five-read", name: "Explorador lector", icon: "📚", desc: "Completa 5 lecturas", cpReward: 80, consumableReward: { effect: "hint", amount: 3 }, check: (m) => m.stats.readingsDone >= 5 },
  { id: "ach-first-game", name: "Jugador espacial", icon: "🎮", desc: "Completa un juego", cpReward: 40, check: (m) => m.stats.gamesDone >= 1 },
  { id: "ach-ten-correct", name: "Racha lectora", icon: "🔥", desc: "10 respuestas correctas", cpReward: 60, consumableReward: { effect: "extra-life", amount: 3 }, check: (m) => m.stats.correct >= 10 },
  { id: "ach-streak-3", name: "Constancia", icon: "⭐", desc: "Racha de 3 días", cpReward: 70, check: (m) => m.streak.count >= 3 },
  { id: "ach-streak-7", name: "Super explorador", icon: "🌟", desc: "Racha de 7 días", cpReward: 100, consumableReward: { effect: "heroic-shield", amount: 2 }, check: (m) => m.streak.count >= 7 },
  { id: "ach-seasonal", name: "Coleccionista especial", icon: "🌸", desc: "Completa las lecturas especiales", cpReward: 80, check: (m) => m.completed.seasonal.length >= 2 },
  { id: "ach-grade6", name: "Lector legendario", icon: "👑", desc: "Completa 3 lecturas de 6°", cpReward: 120, consumableReward: { effect: "time-boost", amount: 2 }, check: (m) => (m.completed.readings["6"] || []).length >= 3 },
];

/** Preguntas genéricas tras leer PDF (solo 2°) */
const PDF_FOLLOWUP_QUESTIONS = {
  2: [
    { q: "Después de leer, ¿qué debemos hacer primero?", options: ["Contar lo que entendimos", "Rasgar la hoja", "No pensar"], correct: 0, difficulty: "easy" },
    { q: "Si no entendemos una palabra, ¿qué podemos hacer?", options: ["Buscar su significado", "Dejar de leer para siempre", "Inventar sin leer"], correct: 0, difficulty: "easy" },
    { q: "¿Para qué leemos en segundo grado?", options: ["Para aprender y disfrutar", "Para no aprender", "Solo para dibujar"], correct: 0, difficulty: "medium" },
  ],
};

/**
 * Juegos interactivos por grado (memoria, emparejar, ordenar, etc.)
 */
const GAMES = {
  1: [
    // Nivel 1: Inicio de Letras
    {
      id: "g1-mem",
      type: "memory",
      title: "Memoria de palabras",
      instruction: "Encuentra los pares iguales. Toca dos cartas por turno.",
      pairs: [
        ["🐱", "gato"],
        ["🌞", "sol"],
        ["📚", "libro"],
        ["🏠", "casa"],
      ],
    },
    {
      id: "g1-match",
      type: "match",
      title: "Empareja imagen y palabra",
      instruction: "Toca un emoji y después la palabra que le corresponde.",
      pairs: [
        ["🐶", "perro"],
        ["🌙", "luna"],
        ["🍎", "manzana"],
        ["⭐", "estrella"],
      ],
    },
    {
      id: "g1-arcade-1",
      type: "arcade-catch",
      title: "Misión Espacial: Las Vocales",
      instruction: "Atrapa las vocales y esquiva las demás letras usando los controles.",
      targets: ["A", "E", "I", "O", "U"],
      decoys: ["M", "P", "S", "L", "T", "R"],
      target: 8
    },
    {
      id: "g1-syll",
      type: "syllables",
      title: "Arma la palabra",
      instruction: "Toca las sílabas en orden para formar la palabra.",
      rounds: [
        { word: "gato", parts: ["ga", "to"] },
        { word: "casa", parts: ["ca", "sa"] },
        { word: "pelota", parts: ["pe", "lo", "ta"] },
        { word: "zapato", parts: ["za", "pa", "to"] },
      ],
    },
    // Nivel 2: Palabras en Órbita
    {
      id: "g1-l2-mem",
      type: "memory",
      title: "Memoria cósmica",
      instruction: "Encuentra los pares de palabras.",
      pairs: [
        ["🐟", "pez"],
        ["🌸", "flor"],
        ["🪑", "mesa"],
        ["🐻", "oso"],
      ],
    },
    {
      id: "g1-l2-match",
      type: "match",
      title: "Empareja en órbita",
      instruction: "Une cada imagen con su nombre.",
      pairs: [
        ["🦁", "león"],
        ["🌹", "rosa"],
        ["🍍", "piña"],
        ["☁️", "nube"],
      ],
    },
    {
      id: "g1-l2-syll",
      type: "syllables",
      title: "Arma la palabra II",
      instruction: "Une las sílabas correspondientes.",
      rounds: [
        { word: "sopa", parts: ["so", "pa"] },
        { word: "pato", parts: ["pa", "to"] },
        { word: "lápiz", parts: ["lá", "piz"] },
        { word: "regalo", parts: ["re", "ga", "lo"] },
      ],
    },
    // Nivel 3: Sonidos y Dibujos
    {
      id: "g1-l3-mem",
      type: "memory",
      title: "Memoria de sonidos",
      instruction: "Busca los pares iguales.",
      pairs: [
        ["🐸", "rana"],
        ["✋", "mano"],
        ["🍇", "uva"],
        ["🚂", "tren"],
      ],
    },
    {
      id: "g1-l3-match",
      type: "match",
      title: "Une sonidos",
      instruction: "Une cada dibujo con su palabra.",
      pairs: [
        ["🐸", "rana"],
        ["✋", "mano"],
        ["🍇", "uva"],
        ["🚂", "tren"],
      ],
    },
    {
      id: "g1-l3-syll",
      type: "syllables",
      title: "Arma la palabra III",
      instruction: "Ordena las sílabas.",
      rounds: [
        { word: "taza", parts: ["ta", "za"] },
        { word: "boca", parts: ["bo", "ca"] },
        { word: "piñata", parts: ["pi", "ña", "ta"] },
      ],
    },
    // Nivel 4: Despegue Lector
    {
      id: "g1-l4-mem",
      type: "memory",
      title: "Memoria del despegue",
      instruction: "Encuentra los pares iguales.",
      pairs: [
        ["☀️", "sol"],
        ["🧂", "sal"],
        ["🌊", "mar"],
        ["🍞", "pan"],
      ],
    },
    {
      id: "g1-l4-match",
      type: "match",
      title: "Empareja y vuela",
      instruction: "Relaciona cada emoji con su palabra.",
      pairs: [
        ["🚢", "bote"],
        ["🛼", "patín"],
        ["🍦", "helado"],
        ["🧀", "queso"],
      ],
    },
    {
      id: "g1-l4-syll",
      type: "syllables",
      title: "Arma la palabra IV",
      instruction: "Arma las últimas palabras.",
      rounds: [
        { word: "coche", parts: ["co", "che"] },
        { word: "goma", parts: ["go", "ma"] },
        { word: "cometa", parts: ["co", "me", "ta"] },
      ],
    },
  ],
  2: [
    // Nivel 1: Ordenar y Buscar
    {
      id: "g2-l1-order",
      type: "wordsearch",
      title: "Sopa de la carrera",
      instruction: "Encuentra las palabras de la carrera en el parque.",
      words: [
        { word: "PERRO", rows: [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4]] },
        { word: "PARQUE", rows: [[2, 0], [2, 1], [2, 2], [2, 3], [2, 4], [2, 5]] },
      ],
      grid: ["PERROXX", "XXXXXXX", "PARQUEX", "XXXXXXX", "XXXXXXX"],
    },
    {
      id: "g2-l1-odd",
      type: "odd",
      title: "Frutas galácticas",
      instruction: "Toca la palabra que NO pertenece al grupo.",
      sets: [
        { items: ["manzana", "plátano", "lápiz", "naranja"], odd: "lápiz", hint: "Los demás son frutas" },
      ],
    },
    {
      id: "g2-l1-ws",
      type: "wordsearch",
      title: "Espacio estelar",
      instruction: "Encuentra las palabras ocultas en la cuadrícula.",
      words: [
        { word: "SOL", rows: [[0, 0], [0, 1], [0, 2]] },
        { word: "LUNA", rows: [[1, 0], [1, 1], [1, 2], [1, 3]] },
      ],
      grid: ["SOLXX", "LUNAX", "XXXXX", "XXXXX", "XXXXX"],
    },
    // Nivel 2: Sílabas y Categorías
    {
      id: "g2-l2-syll",
      type: "syllables",
      title: "Construcción cósmica",
      instruction: "Une las sílabas en orden para formar palabras del espacio.",
      rounds: [
        { word: "planeta", parts: ["pla", "ne", "ta"] },
        { word: "estrella", parts: ["es", "tre", "lla"] },
      ],
    },
    {
      id: "g2-l2-cat",
      type: "categorize",
      title: "El almacén espacial",
      instruction: "Clasifica cada palabra en su contenedor correcto.",
      categories: [
        { id: "comida", label: "🍎 Comida", words: ["pan", "sopa", "leche"] },
        { id: "ropa", label: "👕 Ropa", words: ["saco", "bota", "gorra"] },
      ],
    },
    {
      id: "g2-l2-odd",
      type: "odd",
      title: "Animales y naves",
      instruction: "Toca la palabra que NO pertenece al grupo de animales.",
      sets: [
        { items: ["perro", "gato", "pez", "avión"], odd: "avión", hint: "Los demás son animales reales" },
      ],
    },
    // Nivel 3: Columnas y Frases
    {
      id: "g2-l3-cols",
      type: "columns",
      title: "Parejas opuestas",
      instruction: "Une cada palabra con su contrario (antónimo).",
      pairs: [
        { left: "caliente", right: "frío" },
        { left: "alto", right: "bajo" },
        { left: "luz", right: "oscuridad" },
      ],
    },
    {
      id: "g2-l3-order",
      type: "wordsearch",
      title: "Sopa de la noche",
      instruction: "Encuentra las palabras nocturnas en el panel.",
      words: [
        { word: "LUNA", rows: [[0, 0], [0, 1], [0, 2], [0, 3]] },
        { word: "NOCHE", rows: [[2, 0], [2, 1], [2, 2], [2, 3], [2, 4]] },
      ],
      grid: ["LUNAXXX", "XXXXXXX", "NOCHEXX", "XXXXXXX", "XXXXXXX"],
    },
    {
      id: "g2-l3-syll",
      type: "syllables",
      title: "Viaje espacial",
      instruction: "Une las sílabas para armar los vehículos espaciales.",
      rounds: [
        { word: "cohete", parts: ["co", "he", "te"] },
        { word: "nave", parts: ["na", "ve"] },
      ],
    },
    // Nivel 4: Misión Final
    {
      id: "g2-l4-cols",
      type: "columns",
      title: "Palabras gemelas",
      instruction: "Une las palabras que significan lo mismo (sinónimos).",
      pairs: [
        { left: "rápido", right: "veloz" },
        { left: "bonito", right: "hermoso" },
        { left: "caminar", right: "andar" },
      ],
    },
    {
      id: "g2-l4-cat",
      type: "categorize",
      title: "Biósfera galáctica",
      instruction: "Clasifica las palabras según correspondan.",
      categories: [
        { id: "animal", label: "🦁 Animales", words: ["león", "mono", "oso"] },
        { id: "planta", label: "🌲 Plantas", words: ["pino", "rosa", "roble"] },
      ],
    },
    {
      id: "g2-l4-ws",
      type: "wordsearch",
      title: "Misión despegue",
      instruction: "Encuentra las dos últimas palabras para despegar.",
      words: [
        { word: "VIAJE", rows: [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4]] },
        { word: "NAVE", rows: [[2, 0], [2, 1], [2, 2], [2, 3]] },
      ],
      grid: ["VIAJEX", "XXXXXX", "NAVEXX", "XXXXXX", "XXXXXX"],
    },
  ],
  3: [
    // Nivel 1: Conceptos y Clasificación
    {
      id: "g3-cat",
      type: "categorize",
      title: "Clasifica",
      instruction: "Toca una palabra y luego la categoría correcta.",
      categories: [
        { id: "animal", label: "🐾 Animales", words: ["perro", "gato", "pez"] },
        { id: "planta", label: "🌿 Plantas", words: ["árbol", "flor", "pasto"] },
      ],
    },
    {
      id: "g3-odd",
      type: "odd",
      title: "El intruso",
      instruction: "Toca la palabra que NO va con las demás.",
      sets: [
        { items: ["rojo", "azul", "verde", "silla"], odd: "silla", hint: "Los demás son colores" },
        { items: ["perro", "gato", "sol", "pájaro"], odd: "sol", hint: "El sol no es un animal" },
      ],
    },
    {
      id: "g3-ws",
      type: "wordsearch",
      title: "Búsqueda terrestre",
      instruction: "Encuentra las palabras en la cuadrícula.",
      words: [
        { word: "TALLO", rows: [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4]] },
        { word: "FLOR", rows: [[2, 0], [2, 1], [2, 2], [2, 3]] },
      ],
      grid: ["TALLO", "XXXXX", "FLORX", "XXXXX", "XXXXX"],
    },
    // Nivel 2: Exploradores de Palabras
    {
      id: "g3-l2-cat",
      type: "categorize",
      title: "Alimentos sanos",
      instruction: "Clasifica cada palabra en su contenedor.",
      categories: [
        { id: "fruta", label: "🍎 Frutas", words: ["pera", "kiwi", "uva"] },
        { id: "verdura", label: "🥕 Verduras", words: ["papa", "apio", "cebolla"] },
      ],
    },
    {
      id: "g3-l2-odd",
      type: "odd",
      title: "El intruso II",
      instruction: "Toca el intruso en el grupo.",
      sets: [
        { items: ["avión", "barco", "carro", "manzana"], odd: "manzana", hint: "La manzana no es un transporte" },
      ],
    },
    {
      id: "g3-l2-ws",
      type: "wordsearch",
      title: "Ríos y mares",
      instruction: "Encuentra las palabras en la cuadrícula.",
      words: [
        { word: "MAR", rows: [[0, 0], [0, 1], [0, 2]] },
        { word: "RIO", rows: [[1, 0], [1, 1], [1, 2]] },
      ],
      grid: ["MARXX", "RIOXX", "XXXXX", "XXXXX", "XXXXX"],
    },
    // Nivel 3: El Espacio de Sinónimos
    {
      id: "g3-l3-cols",
      type: "columns",
      title: "Parejas de opuestos",
      instruction: "Une cada palabra con su contrario.",
      pairs: [
        { left: "lindo", right: "feo" },
        { left: "abrir", right: "cerrar" },
        { left: "dormir", right: "despertar" },
      ],
    },
    {
      id: "g3-l3-odd",
      type: "odd",
      title: "El intruso de cuatro patas",
      instruction: "Identifica al intruso.",
      sets: [
        { items: ["perro", "lobo", "zorro", "mesa"], odd: "mesa", hint: "La mesa no es un animal" },
      ],
    },
    {
      id: "g3-l3-ws",
      type: "wordsearch",
      title: "Fenómenos del cielo",
      instruction: "Encuentra las palabras.",
      words: [
        { word: "CIELO", rows: [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4]] },
        { word: "NUBE", rows: [[2, 0], [2, 1], [2, 2], [2, 3]] },
      ],
      grid: ["CIELO", "XXXXX", "NUBEX", "XXXXX", "XXXXX"],
    },
    // Nivel 4: Misión Cosmos
    {
      id: "g3-l4-cols",
      type: "columns",
      title: "Parejas de sinónimos",
      instruction: "Une las palabras que significan lo mismo.",
      pairs: [
        { left: "veloz", right: "rápido" },
        { left: "contento", right: "feliz" },
        { left: "saltar", right: "brincar" },
      ],
    },
    {
      id: "g3-l4-cat",
      type: "categorize",
      title: "Útiles y diversión",
      instruction: "Clasifica según el grupo.",
      categories: [
        { id: "juguete", label: "🪀 Juguetes", words: ["trompo", "yoyo", "muñeca"] },
        { id: "util", label: "✏️ Útiles", words: ["lápiz", "regla", "goma"] },
      ],
    },
    {
      id: "g3-l4-ws",
      type: "wordsearch",
      title: "Misión Cosmos",
      instruction: "Encuentra las palabras ocultas.",
      words: [
        { word: "COSMOS", rows: [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4], [0, 5]] },
        { word: "VIAJE", rows: [[2, 0], [2, 1], [2, 2], [2, 3], [2, 4]] },
      ],
      grid: ["COSMOS", "XXXXXX", "VIAJEX", "XXXXXX", "XXXXXX", "XXXXXX"],
    },
  ],
  4: [
    // Nivel 1: Estructuras y Columnas
    {
      id: "g4-order",
      type: "wordsearch",
      title: "Sopa de biblioteca",
      instruction: "Encuentra palabras sobre la biblioteca en la cuadrícula.",
      words: [
        { word: "MAÑANA", rows: [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4], [0, 5]] },
        { word: "LIBRO", rows: [[2, 0], [2, 1], [2, 2], [2, 3], [2, 4]] },
      ],
      grid: ["MAÑANAXX", "XXXXXXXX", "LIBROXXX", "XXXXXXXX", "XXXXXXXX"],
    },
    {
      id: "g4-columns",
      type: "columns",
      title: "Une las columnas",
      instruction: "Toca un elemento de la izquierda y su pareja de la derecha.",
      pairs: [
        { left: "feliz", right: "contento" },
        { left: "triste", right: "apenado" },
        { left: "rápido", right: "veloz" },
        { left: "grande", right: "enorme" },
      ],
    },
    {
      id: "g4-ws",
      type: "wordsearch",
      title: "Sopa espacial",
      instruction: "Encuentra las palabras tocando las letras en orden.",
      words: [
        { word: "SOL", rows: [[0, 0], [0, 1], [0, 2]] },
        { word: "MAR", rows: [[1, 0], [1, 1], [1, 2]] },
      ],
      grid: ["SOLXX", "MARXX", "LUNAX", "XXCXX", "XXEXX"],
    },
    // Nivel 2: Guardianes de la Frase
    {
      id: "g4-l2-order",
      type: "wordsearch",
      title: "Sopa de cuentos",
      instruction: "Busca palabras de cuentos de hadas y aventuras.",
      words: [
        { word: "CUENTO", rows: [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4], [0, 5]] },
        { word: "LECTOR", rows: [[2, 0], [2, 1], [2, 2], [2, 3], [2, 4], [2, 5]] },
      ],
      grid: ["CUENTOXX", "XXXXXXXX", "LECTORXX", "XXXXXXXX", "XXXXXXXX"],
    },
    {
      id: "g4-l2-columns",
      type: "columns",
      title: "Parejas de opuestos",
      instruction: "Une cada palabra con su contrario.",
      pairs: [
        { left: "limpio", right: "sucio" },
        { left: "mojado", right: "seco" },
        { left: "grueso", right: "delgado" },
        { left: "dulce", right: "amargo" },
      ],
    },
    {
      id: "g4-l2-ws",
      type: "wordsearch",
      title: "Sopa de libros",
      instruction: "Busca las palabras del mundo de los libros.",
      words: [
        { word: "LIBRO", rows: [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4]] },
        { word: "PAGINA", rows: [[2, 0], [2, 1], [2, 2], [2, 3], [2, 4], [2, 5]] },
      ],
      grid: ["LIBROX", "XXXXXX", "PAGINA", "XXXXXX", "XXXXXX", "XXXXXX"],
    },
    // Nivel 3: Misión Ortografía
    {
      id: "g4-l3-cat",
      type: "categorize",
      title: "Clasificación por acento",
      instruction: "Clasifica cada palabra según sea aguda o grave.",
      categories: [
        { id: "aguda", label: "🔺 Agudas", words: ["sofá", "café", "cajón"] },
        { id: "grave", label: "🟩 Graves", words: ["árbol", "lápiz", "mesa"] },
      ],
    },
    {
      id: "g4-l3-order",
      type: "wordsearch",
      title: "Sopa del cielo",
      instruction: "Encuentra palabras del cielo cósmico.",
      words: [
        { word: "ESTRELLA", rows: [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6], [0, 7]] },
        { word: "CIELO", rows: [[2, 0], [2, 1], [2, 2], [2, 3], [2, 4]] },
      ],
      grid: ["ESTRELLA", "XXXXXXXX", "CIELOXXX", "XXXXXXXX", "XXXXXXXX"],
    },
    {
      id: "g4-l3-ws",
      type: "wordsearch",
      title: "Búsqueda estelar",
      instruction: "Busca las palabras espaciales en la cuadrícula.",
      words: [
        { word: "PLANETA", rows: [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6]] },
        { word: "ASTRO", rows: [[2, 0], [2, 1], [2, 2], [2, 3], [2, 4]] },
      ],
      grid: ["PLANETA", "XXXXXXX", "ASTROXX", "XXXXXXX", "XXXXXXX", "XXXXXXX", "XXXXXXX"],
    },
    // Nivel 4: Exploración Planetaria
    {
      id: "g4-l4-cat",
      type: "categorize",
      title: "Clase de gramática",
      instruction: "Separa los nombres o sustantivos de las acciones o verbos.",
      categories: [
        { id: "sustantivo", label: "👤 Sustantivos", words: ["perro", "mesa", "niño"] },
        { id: "verbo", label: "🏃 Verbos", words: ["correr", "cantar", "saltar"] },
      ],
    },
    {
      id: "g4-l4-columns",
      type: "columns",
      title: "Asociación de profesiones",
      instruction: "Une cada profesión con su lugar de trabajo.",
      pairs: [
        { left: "maestro", right: "escuela" },
        { left: "doctor", right: "hospital" },
        { left: "cocinero", right: "cocina" },
        { left: "piloto", right: "avión" },
      ],
    },
    {
      id: "g4-l4-ws",
      type: "wordsearch",
      title: "Misión Espacio",
      instruction: "Encuentra las palabras finales.",
      words: [
        { word: "COHETE", rows: [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4], [0, 5]] },
        { word: "ESPACIO", rows: [[2, 0], [2, 1], [2, 2], [2, 3], [2, 4], [2, 5], [2, 6]] },
      ],
      grid: ["COHETE*", "XXXXXXX", "ESPACIO", "XXXXXXX", "XXXXXXX", "XXXXXXX", "XXXXXXX"],
    },
  ],
  5: [
    // Nivel 1: Desafíos Heroicos
    {
      id: "g5-tf-heroic",
      type: "truefalse",
      tier: "heroic",
      title: "Rayos de la verdad",
      instruction: "Modo ⚔️ HEROICO: frases más difíciles. Puedes fallar solo 2 veces en todo el juego.",
      statements: [
        { text: "Un párrafo puede tener idea principal e ideas secundarias.", answer: true },
        { text: "Toda opinión de un personaje en un cuento es un hecho real.", answer: false },
        { text: "Inferir significa sacar conclusiones con pistas del texto.", answer: true },
        { text: "Resumir es copiar el texto palabra por palabra siempre.", answer: false },
        { text: "Un adverbio puede modificar a un verbo.", answer: true },
        { text: "No hace falta releer si la primera lectura no se entendió.", answer: false },
      ],
    },
    {
      id: "g5-order-heroic",
      type: "wordsearch",
      tier: "heroic",
      title: "Sopa del explorador",
      instruction: "Modo ⚔️ HEROICO: Busca las palabras científicas en el panel.",
      words: [
        { word: "CIENCIA", rows: [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6]] },
        { word: "DATOS", rows: [[2, 0], [2, 1], [2, 2], [2, 3], [2, 4]] },
      ],
      grid: ["CIENCIAX", "XXXXXXXX", "DATOSXXX", "XXXXXXXX", "XXXXXXXX"],
    },
    {
      id: "g5-ws",
      type: "wordsearch",
      title: "Sopa heroica",
      instruction: "Toca las letras en orden para encontrar cada palabra.",
      words: [
        { word: "DATO", rows: [[0, 0], [0, 1], [0, 2], [0, 3]] },
        { word: "LEER", rows: [[2, 0], [2, 1], [2, 2], [2, 3]] },
      ],
      grid: ["DATOXX", "XXXXXX", "LEERXX", "XXXORX", "XXXXXX"],
    },
    // Nivel 2: Escudo del Saber
    {
      id: "g5-l2-tf-heroic",
      type: "truefalse",
      tier: "heroic",
      title: "Estrategias de lectura",
      instruction: "Modo ⚔️ HEROICO: determina si los enunciados de lectura son verdaderos.",
      statements: [
        { text: "El resumen debe incluir mis opiniones personales del tema.", answer: false },
        { text: "La idea principal expresa el mensaje más importante del texto.", answer: true },
        { text: "Un adjetivo califica o describe a un sustantivo.", answer: true },
        { text: "El título de una lectura nunca tiene relación con su contenido.", answer: false },
      ],
    },
    {
      id: "g5-l2-order-heroic",
      type: "wordsearch",
      tier: "heroic",
      title: "Sopa del sistema solar",
      instruction: "Modo ⚔️ HEROICO: Busca los términos del espacio.",
      words: [
        { word: "SOLAR", rows: [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4]] },
        { word: "PLANETA", rows: [[2, 0], [2, 1], [2, 2], [2, 3], [2, 4], [2, 5], [2, 6]] },
      ],
      grid: ["SOLARXXX", "XXXXXXXX", "PLANETAX", "XXXXXXXX", "XXXXXXXX"],
    },
    {
      id: "g5-l2-ws",
      type: "wordsearch",
      title: "Sopa de la Antártida",
      instruction: "Encuentra las palabras clave sobre el continente helado.",
      words: [
        { word: "GLACIAR", rows: [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6]] },
        { word: "CLIMA", rows: [[2, 0], [2, 1], [2, 2], [2, 3], [2, 4]] },
      ],
      grid: ["GLACIAR", "XXXXXXX", "CLIMAXX", "XXXXXXX", "XXXXXXX"],
    },
    // Nivel 3: Misión Científica
    {
      id: "g5-l3-cat-heroic",
      type: "categorize",
      tier: "heroic",
      title: "Hecho contra opinión",
      instruction: "Clasifica con cuidado. En el modo ⚔️ Heroico debes pensar de manera crítica.",
      categories: [
        {
          id: "hecho",
          label: "📋 Hecho real",
          words: ["El sol es una estrella", "El agua es H2O", "La Tierra es redonda"],
        },
        {
          id: "opinion",
          label: "💭 Opinión personal",
          words: ["El clima frío es el mejor", "Los gatos son más lindos", "Leer es aburrido"],
        },
      ],
    },
    {
      id: "g5-l3-order-heroic",
      type: "wordsearch",
      tier: "heroic",
      title: "Sopa de la fotosíntesis",
      instruction: "Modo ⚔️ HEROICO: Encuentra los términos de los procesos vegetales.",
      words: [
        { word: "PLANTAS", rows: [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6]] },
        { word: "HOJA", rows: [[2, 0], [2, 1], [2, 2], [2, 3]] },
      ],
      grid: ["PLANTASX", "XXXXXXXX", "HOJAXXXX", "XXXXXXXX", "XXXXXXXX"],
    },
    {
      id: "g5-l3-ws",
      type: "wordsearch",
      title: "Método Científico",
      instruction: "Busca las palabras asociadas con la investigación.",
      words: [
        { word: "CIENCIA", rows: [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6]] },
        { word: "METODO", rows: [[2, 0], [2, 1], [2, 2], [2, 3], [2, 4], [2, 5]] },
      ],
      grid: ["CIENCIA", "XXXXXXX", "METODOX", "XXXXXXX", "XXXXXXX"],
    },
    // Nivel 4: Héroes Lectores
    {
      id: "g5-l4-tf-heroic",
      type: "truefalse",
      tier: "heroic",
      title: "Gramática espacial",
      instruction: "Responde verdadero o falso en el modo ⚔️ Heroico.",
      statements: [
        { text: "El sujeto es la persona o animal que realiza la acción en la oración.", answer: true },
        { text: "Un sinónimo es una palabra con significado totalmente opuesto.", answer: false },
        { text: "Inferir es buscar pistas y leer entre líneas un texto.", answer: true },
        { text: "Los textos informativos tienen el propósito de divertir con chistes.", answer: false },
      ],
    },
    {
      id: "g5-l4-columns-heroic",
      type: "columns",
      tier: "heroic",
      title: "Vocabulario de nivel superior",
      instruction: "Une cada palabra avanzada con su sinónimo correcto.",
      pairs: [
        { left: "persistente", right: "constante" },
        { left: "adverso", right: "contrario" },
        { left: "nocivo", right: "dañino" },
        { left: "idóneo", right: "adecuado" },
      ],
    },
    {
      id: "g5-l4-ws",
      type: "wordsearch",
      title: "Exploración Cósmica",
      instruction: "Encuentra las palabras del universo.",
      words: [
        { word: "UNIVERSO", rows: [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6], [0, 7]] },
        { word: "GALAXIA", rows: [[2, 0], [2, 1], [2, 2], [2, 3], [2, 4], [2, 5], [2, 6]] },
      ],
      grid: ["UNIVERSO", "XXXXXXXX", "GALAXIAX", "XXXXXXXX", "XXXXXXXX"],
    },
  ],
  6: [
    // Nivel 1: Misiones Legendarias
    {
      id: "g6-columns-leg",
      type: "columns",
      tier: "legendary",
      title: "Puente de sinónimos legendarios",
      instruction: "Modo 👑 LEGENDARIO: 12 segundos por cada par. Sinónimos difíciles. Solo 1 error permitido.",
      pairs: [
        { left: "perspicaz", right: "astuto" },
        { left: "ubícuo", right: "omnipresente" },
        { left: "efímero", right: "pasajero" },
        { left: "meticuloso", right: "cuidadoso" },
        { left: "paradigma", right: "modelo" },
        { left: "conciso", right: "breve" },
      ],
    },
    {
      id: "g6-cat-leg",
      type: "categorize",
      tier: "legendary",
      title: "Hecho u opinión — misión final",
      instruction: "Modo 👑 LEGENDARIO: clasifica con cuidado. Algunas frases son trampas. Máximo 1 error.",
      categories: [
        {
          id: "hecho",
          label: "📋 Hecho (comprobable)",
          words: [
            "La Tierra orbita alrededor del Sol",
            "El agua hierve a 100 °C al nivel del mar",
            "Los verbos indican acción o estado",
            "México es un país de América",
            "Un triángulo tiene tres lados",
          ],
        },
        {
          id: "opinion",
          label: "💭 Opinión (subjetiva)",
          words: [
            "Esta novela es la mejor del mundo",
            "Los martes son el peor día",
            "El chocolate negro es más rico que el blanco",
            "Leer poesía es aburrido",
            "Mi maestro es el más inteligente",
          ],
        },
      ],
    },
    {
      id: "g6-ws",
      type: "wordsearch",
      title: "Sopa legendaria",
      instruction: "Encuentra las palabras en la cuadrícula en modo 👑 Legendario.",
      words: [
        { word: "HECHO", rows: [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4]] },
        { word: "TEXTO", rows: [[2, 0], [2, 1], [2, 2], [2, 3], [2, 4]] },
      ],
      grid: ["HECHO", "XXXXX", "TEXTO", "XXXXX", "XXXXX"],
    },
    // Nivel 2: Leyendas de la Lectura
    {
      id: "g6-l2-tf-legendary",
      type: "truefalse",
      tier: "legendary",
      title: "Enigmas de la relatividad",
      instruction: "Modo 👑 LEGENDARIO: evalúa si las afirmaciones científicas y literarias son verdaderas.",
      statements: [
        { text: "El horizonte de eventos en un agujero negro es el punto de no retorno gravitacional.", answer: true },
        { text: "Un texto de opinión científica prescinde totalmente de argumentos razonados.", answer: false },
        { text: "El Telescopio del Sucesos tomó la primera imagen real de un agujero negro en 2019.", answer: true },
        { text: "Albert Einstein estaba plenamente seguro de la existencia física de los agujeros negros.", answer: false },
      ],
    },
    {
      id: "g6-l2-columns-legendary",
      type: "columns",
      tier: "legendary",
      title: "Sinónimos avanzados del cosmos",
      instruction: "Modo 👑 LEGENDARIO: relaciona cada vocablo con su sinónimo formal.",
      pairs: [
        { left: "efímero", right: "pasajero" },
        { left: "trivial", right: "común" },
        { left: "superfluo", right: "innecesario" },
        { left: "intrínseco", right: "esencial" },
      ],
    },
    {
      id: "g6-l2-ws",
      type: "wordsearch",
      title: "Física estelar",
      instruction: "Busca las palabras en el panel.",
      words: [
        { word: "GRAVEDAD", rows: [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6], [0, 7]] },
        { word: "COLAPSO", rows: [[2, 0], [2, 1], [2, 2], [2, 3], [2, 4], [2, 5], [2, 6]] },
      ],
      grid: ["GRAVEDAD", "XXXXXXXX", "COLAPSOX", "XXXXXXXX", "XXXXXXXX"],
    },
    // Nivel 3: Enigmas de la Galaxia
    {
      id: "g6-l3-cat-legendary",
      type: "categorize",
      tier: "legendary",
      title: "Categorías gramaticales avanzadas",
      instruction: "Modo 👑 LEGENDARIO: separa los nombres propios de los sustantivos comunes.",
      categories: [
        {
          id: "propio",
          label: "🏷️ Nombre Propio",
          words: ["México", "Einstein", "Rosetta", "Patagonia", "Valeria"],
        },
        {
          id: "comun",
          label: "📦 Sustantivo Común",
          words: ["río", "estrella", "libro", "mapa", "telescopio"],
        },
      ],
    },
    {
      id: "g6-l3-order-legendary",
      type: "wordsearch",
      tier: "legendary",
      title: "Sopa de teorías físicas",
      instruction: "Modo 👑 LEGENDARIO: Encuentra palabras sobre teorías de la física.",
      words: [
        { word: "FUERZA", rows: [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4], [0, 5]] },
        { word: "ESPACIO", rows: [[2, 0], [2, 1], [2, 2], [2, 3], [2, 4], [2, 5], [2, 6]] },
      ],
      grid: ["FUERZAXX", "XXXXXXXX", "ESPACIOX", "XXXXXXXX", "XXXXXXXX"],
    },
    {
      id: "g6-l3-ws",
      type: "wordsearch",
      title: "Pioneros espaciales",
      instruction: "Encuentra los apellidos de científicos insignes.",
      words: [
        { word: "EINSTEIN", rows: [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6], [0, 7]] },
        { word: "ROSETTA", rows: [[2, 0], [2, 1], [2, 2], [2, 3], [2, 4], [2, 5], [2, 6]] },
      ],
      grid: ["EINSTEIN", "XXXXXXXX", "ROSETTAX", "XXXXXXXX", "XXXXXXXX"],
    },
    // Nivel 4: Corona Lector
    {
      id: "g6-l4-tf-legendary",
      type: "truefalse",
      tier: "legendary",
      title: "Lógica computacional y IA",
      instruction: "Modo 👑 LEGENDARIO: determina la veracidad de los enunciados sobre IA y textos.",
      statements: [
        { text: "Los algoritmos de inteligencia artificial están exentos de sesgos humanos.", answer: false },
        { text: "Un texto expositivo tiene el fin de informar de manera objetiva.", answer: true },
        { text: "La coherencia textual es la relación lógica entre las ideas de un escrito.", answer: true },
        { text: "El veredicto del jurado en un debate es siempre un hecho científico.", answer: false },
      ],
    },
    {
      id: "g6-l4-columns-legendary",
      type: "columns",
      tier: "legendary",
      title: "Léxico de excelencia",
      instruction: "Modo 👑 LEGENDARIO: asocia cada vocablo con su definición o sinónimo.",
      pairs: [
        { left: "verosímil", right: "creíble" },
        { left: "utópico", right: "ideal" },
        { left: "escéptico", right: "dudoso" },
        { left: "implícito", right: "tácito" },
      ],
    },
    {
      id: "g6-l4-ws",
      type: "wordsearch",
      title: "Misión Suprema",
      instruction: "Encuentra las dos últimas palabras legendarias.",
      words: [
        { word: "LEYENDA", rows: [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6]] },
        { word: "CORONA", rows: [[2, 0], [2, 1], [2, 2], [2, 3], [2, 4], [2, 5]] },
      ],
      grid: ["LEYENDA", "XXXXXXX", "CORONAX", "XXXXXXX", "XXXXXXX"],
    },
  ],
};



window.APP_DATA = {
  GRADE_LABELS,
  CP_PER_CORRECT,
  GAME_TIERS,
  GRADE_GAME_TIER,
  REWARDS_BY_GRADE,
  getAllRewards,
  getRewardsForGrade,
  RITMO_PRIMERO,
  READINGS,
  SEASONAL_READINGS,
  ACHIEVEMENTS,
  PDF_FOLLOWUP_QUESTIONS,
  GAMES,
};
