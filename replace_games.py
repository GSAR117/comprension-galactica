import sys
import os

print("Starting replacement script...")

activities_path = r"C:\Users\ingen\OneDrive\Escritorio\Programa Gabriel APK\app compresion\js\activities.js"
app_path = r"C:\Users\ingen\OneDrive\Escritorio\Programa Gabriel APK\app compresion\js\app.js"

# Read activities.js
with open(activities_path, "r", encoding="utf-8") as f:
    act_content = f.read()

# Replacement definitions for activities.js
# 1. g2-l1-order
old_g2_l1 = """    {
      id: "g2-l1-order",
      type: "order",
      title: "La carrera del perro",
      instruction: "Ordena las palabras para formar la frase correcta.",
      words: ["El", "perro", "corre", "en", "el", "parque"],
    },"""

new_g2_l1 = """    {
      id: "g2-l1-order",
      type: "wordsearch",
      title: "Sopa de la carrera",
      instruction: "Encuentra las palabras de la carrera en el parque.",
      words: [
        { word: "PERRO", rows: [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4]] },
        { word: "PARQUE", rows: [[2, 0], [2, 1], [2, 2], [2, 3], [2, 4], [2, 5]] },
      ],
      grid: ["PERROXX", "XXXXXXX", "PARQUEX", "XXXXXXX", "XXXXXXX"],
    },"""

# 2. g2-l3-order
old_g2_l3 = """    {
      id: "g2-l3-order",
      type: "order",
      title: "Noche de estrellas",
      instruction: "Ordena las palabras para formar la frase correcta.",
      words: ["La", "luna", "brilla", "en", "la", "noche"],
    },"""

new_g2_l3 = """    {
      id: "g2-l3-order",
      type: "wordsearch",
      title: "Sopa de la noche",
      instruction: "Encuentra las palabras nocturnas en el panel.",
      words: [
        { word: "LUNA", rows: [[0, 0], [0, 1], [0, 2], [0, 3]] },
        { word: "NOCHE", rows: [[2, 0], [2, 1], [2, 2], [2, 3], [2, 4]] },
      ],
      grid: ["LUNAXXX", "XXXXXXX", "NOCHEXX", "XXXXXXX", "XXXXXXX"],
    },"""

# 3. g4-order
old_g4 = """    {
      id: "g4-order",
      type: "order",
      title: "Frase en orden",
      instruction: "Ordena las palabras para que tengan sentido.",
      words: ["Por", "la", "mañana", "iremos", "a", "la", "biblioteca"],
    },"""

new_g4 = """    {
      id: "g4-order",
      type: "wordsearch",
      title: "Sopa de biblioteca",
      instruction: "Encuentra palabras sobre la biblioteca en la cuadrícula.",
      words: [
        { word: "MAÑANA", rows: [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4], [0, 5]] },
        { word: "LIBRO", rows: [[2, 0], [2, 1], [2, 2], [2, 3], [2, 4]] },
      ],
      grid: ["MAÑANAXX", "XXXXXXXX", "LIBROXXX", "XXXXXXXX", "XXXXXXXX"],
    },"""

# 4. g4-l2-order
old_g4_l2 = """    {
      id: "g4-l2-order",
      type: "order",
      title: "Frase de cuentos",
      instruction: "Ordena las palabras correctamente.",
      words: ["El", "libro", "de", "cuentos", "es", "muy", "divertido"],
    },"""

new_g4_l2 = """    {
      id: "g4-l2-order",
      type: "wordsearch",
      title: "Sopa de cuentos",
      instruction: "Busca palabras de cuentos de hadas y aventuras.",
      words: [
        { word: "CUENTO", rows: [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4], [0, 5]] },
        { word: "LECTOR", rows: [[2, 0], [2, 1], [2, 2], [2, 3], [2, 4], [2, 5]] },
      ],
      grid: ["CUENTOXX", "XXXXXXXX", "LECTORXX", "XXXXXXXX", "XXXXXXXX"],
    },"""

# 5. g4-l3-order
old_g4_l3 = """    {
      id: "g4-l3-order",
      type: "order",
      title: "Orden en el espacio",
      instruction: "Ordena las palabras de la frase cósmica.",
      words: ["Las", "estrellas", "brillan", "en", "el", "cielo", "azul"],
    },"""

new_g4_l3 = """    {
      id: "g4-l3-order",
      type: "wordsearch",
      title: "Sopa del cielo",
      instruction: "Encuentra palabras del cielo cósmico.",
      words: [
        { word: "ESTRELLA", rows: [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6], [0, 7]] },
        { word: "CIELO", rows: [[2, 0], [2, 1], [2, 2], [2, 3], [2, 4]] },
      ],
      grid: ["ESTRELLA", "XXXXXXXX", "CIELOXXX", "XXXXXXXX", "XXXXXXXX"],
    },"""

# 6. g5-order-heroic
old_g5_l1 = """    {
      id: "g5-order-heroic",
      type: "order",
      tier: "heroic",
      title: "Orden del explorador",
      instruction: "Forma la frase correcta. Hay palabras trampa: si las tocas, cuenta como error.",
      words: [
        "Los",
        "científicos",
        "analizan",
        "los",
        "datos",
        "antes",
        "de",
        "publicar",
        "sus",
        "conclusiones",
      ],
      decoys: ["dormir", "ayer", "verde", "rápido"],
    },"""

new_g5_l1 = """    {
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
    },"""

# 7. g5-l2-order-heroic
old_g5_l2 = """    {
      id: "g5-l2-order-heroic",
      type: "order",
      tier: "heroic",
      title: "Sistemas del espacio",
      instruction: "Ordena la frase espacial esquivando las palabras trampa.",
      words: [
        "El",
        "sistema",
        "solar",
        "está",
        "formado",
        "por",
        "ocho",
        "planetas",
      ],
      decoys: ["comer", "lápiz", "noche", "cantar"],
    },"""

new_g5_l2 = """    {
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
    },"""

# 8. g5-l3-order-heroic
old_g5_l3 = """    {
      id: "g5-l3-order-heroic",
      type: "order",
      tier: "heroic",
      title: "Procesos naturales",
      instruction: "Forma la frase sobre las plantas esquivando las trampas.",
      words: [
        "Las",
        "plantas",
        "producen",
        "su",
        "propio",
        "alimento",
        "con",
        "la",
        "fotosíntesis",
      ],
      decoys: ["saltar", "ventana", "zapato", "avión"],
    },"""

new_g5_l3 = """    {
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
    },"""

# 9. g6-l3-order-legendary
old_g6_l3 = """    {
      id: "g6-l3-order-legendary",
      type: "order",
      tier: "legendary",
      title: "Teorías físicas",
      instruction: "Ordena el texto científico esquivando palabras trampa en modo 👑 Legendario.",
      words: [
        "La",
        "relatividad",
        "general",
        "explica",
        "la",
        "fuerza",
        "de",
        "gravedad",
        "en",
        "el",
        "espacio",
      ],
      decoys: ["comer", "correr", "avión", "lápiz"],
    },"""

new_g6_l3 = """    {
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
    },"""

# Helper to normalize line endings and whitespace
def normalize(s):
    return "\n".join([line.strip() for line in s.splitlines() if line.strip()])

# Perform replacements in activities.js
reps = [
    (old_g2_l1, new_g2_l1, "g2-l1-order"),
    (old_g2_l3, new_g2_l3, "g2-l3-order"),
    (old_g4, new_g4, "g4-order"),
    (old_g4_l2, new_g4_l2, "g4-l2-order"),
    (old_g4_l3, new_g4_l3, "g4-l3-order"),
    (old_g5_l1, new_g5_l1, "g5-order-heroic"),
    (old_g5_l2, new_g5_l2, "g5-l2-order-heroic"),
    (old_g5_l3, new_g5_l3, "g5-l3-order-heroic"),
    (old_g6_l3, new_g6_l3, "g6-l3-order-legendary")
]

modified = act_content
for old, new, tag in reps:
    # Try exact match first
    if old in modified:
        modified = modified.replace(old, new)
        print(f"Replaced {tag} (Exact match)")
    else:
        # Try finding normalized or fallback match
        norm_old = normalize(old)
        # We can try a substring matching for unique lines
        lines = old.strip().splitlines()
        first_line = lines[0].strip()
        last_line = lines[-1].strip()
        print(f"Exact match for {tag} failed. Searching by first/last line...")
        # Since these are JSON-like objects, we can look for id: tag
        start_str = f'id: "{tag}",'
        pos = modified.find(start_str)
        if pos != -1:
            # find start brace before it
            brace_start = modified.rfind('{', 0, pos)
            # find matching closing brace after it
            brace_end = modified.find('},', pos)
            if brace_end != -1:
                brace_end += 2  # include closing brace and comma
                old_text = modified[brace_start:brace_end]
                modified = modified.replace(old_text, new)
                print(f"Replaced {tag} by matching braces")
            else:
                print(f"ERROR: Could not find closing brace for {tag}")
        else:
            print(f"ERROR: Could not find id: {tag} in activities.js")

# Write activities.js back
with open(activities_path, "w", encoding="utf-8") as f:
    f.write(modified)
print("activities.js updated.")

# Read app.js
with open(app_path, "r", encoding="utf-8") as f:
    app_content = f.read()

# Replacement pairs for app.js description lists
app_reps = [
    (
        '{ num: 1, name: "Ordenar y Buscar", desc: "La carrera del perro, Frutas galácticas y Espacio estelar." }',
        '{ num: 1, name: "Ordenar y Buscar", desc: "Sopa de la carrera, Frutas galácticas y Espacio estelar." }'
    ),
    (
        '{ num: 3, name: "Columnas y Frases", desc: "Parejas opuestas, Noche de estrellas y Viaje espacial." }',
        '{ num: 3, name: "Columnas y Frases", desc: "Parejas opuestas, Sopa de la noche y Viaje espacial." }'
    ),
    (
        '{ num: 1, name: "Estructuras y Columnas", desc: "Frase en orden, Une las columnas y Sopa de letras espacial." }',
        '{ num: 1, name: "Estructuras y Columnas", desc: "Sopa de biblioteca, Une las columnas y Sopa de letras espacial." }'
    ),
    (
        '{ num: 2, name: "Guardianes de la Frase", desc: "Frase de cuentos, Parejas de opuestos y Sopa de libros." }',
        '{ num: 2, name: "Guardianes de la Frase", desc: "Sopa de cuentos, Parejas de opuestos y Sopa de libros." }'
    ),
    (
        '{ num: 3, name: "Misión Ortografía", desc: "Clasificación por acento, Orden en el espacio y Búsqueda estelar." }',
        '{ num: 3, name: "Misión Ortografía", desc: "Clasificación por acento, Sopa del cielo y Búsqueda estelar." }'
    ),
    (
        '{ num: 1, name: "Desafíos Heroicos", desc: "Rayos de la verdad, Orden del explorador y Sopa heroica en modo ⚔️ Heroico." }',
        '{ num: 1, name: "Desafíos Heroicos", desc: "Rayos de la verdad, Sopa del explorador y Sopa heroica en modo ⚔️ Heroico." }'
    ),
    (
        '{ num: 2, name: "Escudo del Saber", desc: "Estrategias de lectura, Sistemas del espacio y Sopa de la Antártida." }',
        '{ num: 2, name: "Escudo del Saber", desc: "Estrategias de lectura, Sopa del sistema solar y Sopa de la Antártida." }'
    ),
    (
        '{ num: 3, name: "Misión Científica", desc: "Hecho contra opinión, Procesos naturales y Método Científico." }',
        '{ num: 3, name: "Misión Científica", desc: "Hecho contra opinión, Sopa de la fotosíntesis y Método Científico." }'
    ),
    (
        '{ num: 3, name: "Enigmas de la Galaxia", desc: "Categorías gramaticales avanzadas, Teorías físicas y Pioneros espaciales." }',
        '{ num: 3, name: "Enigmas de la Galaxia", desc: "Categorías gramaticales avanzadas, Sopa de teorías físicas y Pioneros espaciales." }'
    )
]

modified_app = app_content
for old, new in app_reps:
    if old in modified_app:
        modified_app = modified_app.replace(old, new)
        print(f"Updated description in app.js: '{old[:40]}...'")
    else:
        # Try a flexible replacement if double/single quotes differ
        normalized_old = old.replace('"', "'")
        normalized_modified = modified_app.replace('"', "'")
        if normalized_old in normalized_modified:
            # Perform direct replace using normalized strings or manual search
            print(f"Normalized match found for description. Replacing...")
            # We can search with flexible matching
            start_pos = modified_app.find(old.split("desc:")[0])
            if start_pos != -1:
                end_pos = modified_app.find("}", start_pos)
                if end_pos != -1:
                    target_chunk = modified_app[start_pos:end_pos+1]
                    # Create replacement chunk
                    modified_app = modified_app.replace(target_chunk, new)
                    print(f"Replaced flexible: {new[:40]}")
        else:
            print(f"WARNING: Could not find description in app.js: '{old[:40]}...'")

# Write app.js back
with open(app_path, "w", encoding="utf-8") as f:
    f.write(modified_app)
print("app.js updated.")
