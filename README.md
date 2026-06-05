# Ciclos de poder en LaLiga

Visualización interactiva sobre la evolución histórica del poder competitivo en LaLiga española desde la temporada 1929-30 hasta la temporada 2019-20.

El proyecto analiza casi un siglo de competición desde una perspectiva histórica y relacional. El objetivo no es solo identificar qué equipos ganaron más, sino comprender cómo se formaron los ciclos de dominio, qué trayectorias se rompieron y qué rivalidades ayudaron a definir el equilibrio competitivo de la competición.

## Visualización publicada

La visualización está disponible públicamente en GitHub Pages:

```text
https://mperezguillen.github.io/laliga-visualizacion/
```

El repositorio público del proyecto se encuentra en:

```text
https://github.com/mperezguillen/laliga-visualizacion
```

## Objetivo narrativo

La visualización se centra en analizar los ciclos de poder de LaLiga combinando tres perspectivas:

1. La evolución temporal de los equipos.
2. El dominio competitivo por épocas.
3. Las relaciones directas entre clubes a través de sus enfrentamientos históricos.

La matriz de resultados del dataset permite ir más allá de la clasificación final y estudiar el poder competitivo como una red de rivalidades, resistencias y enfrentamientos directos.

## Preguntas principales

1. ¿Cómo evolucionaron las posiciones de los grandes equipos?
2. ¿Qué clubes dominaron cada década?
3. ¿Qué caídas y recuperaciones rompieron la continuidad histórica?
4. ¿Cómo cambiaron las rivalidades directas entre equipos?
5. ¿Qué relaciones competitivas forman la red histórica de LaLiga?

## Dataset

El proyecto utiliza un dataset histórico de LaLiga española que contiene temporadas desde 1929-30 hasta 2019-20.

Cada fila representa un equipo en una temporada e incluye información como:

- temporada;
- equipo;
- posición final;
- partidos jugados;
- victorias, empates y derrotas;
- puntos;
- métricas derivadas de rendimiento;
- matriz de resultados entre equipos.

El dataset no incluye las temporadas 1936-37, 1937-38 y 1938-39, correspondientes al periodo de la Guerra Civil española.

Archivo utilizado por la aplicación:

```text
data/laliga_cleaned.csv
```

## Tecnologías utilizadas

- HTML5
- CSS3
- JavaScript
- D3.js
- Observable Plot
- GitHub Pages

## Ejecución en local

Para ejecutar la visualización en local, clonar el repositorio y lanzar un servidor web desde la raíz del proyecto:

```bash
python -m http.server 8000
```

Después, abrir en el navegador:

```text
http://localhost:8000
```

Es importante ejecutar la web mediante un servidor local y no abriendo directamente `index.html`, ya que la carga de archivos CSV puede dar problemas por restricciones del navegador.

## Estructura del proyecto

```text
.
├── index.html
├── css/
│   └── styles.css
├── src/
│   ├── main.js
│   ├── charts.js
│   └── data-processing.js
├── data/
│   └── laliga_cleaned.csv
├── assets/
│   └── screenshots/
├── scripts/
│   └── review_team_names.py
├── README.md
└── LICENSE
```

## Declaración de uso de inteligencia artificial

Para la realización de este proyecto se ha empleado ChatGPT como herramienta de apoyo durante el proceso de desarrollo. Su uso ha estado orientado principalmente a la asistencia en la implementación y revisión de código HTML, CSS y JavaScript.

La herramienta también se ha utilizado como apoyo en tareas de depuración, documentación y preparación de materiales auxiliares. En todos los casos, las propuestas generadas han sido revisadas, modificadas y validadas por el autor.

Las decisiones relativas al enfoque analítico, la selección de las visualizaciones finales, la interpretación de los datos, la narrativa del proyecto y la entrega definitiva corresponden al autor del trabajo.
