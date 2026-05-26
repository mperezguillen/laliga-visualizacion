# Ciclos de poder en LaLiga

Visualización interactiva sobre la evolución histórica del poder competitivo en LaLiga española desde la temporada 1929-30 hasta la temporada 2019-20.

El proyecto analiza casi un siglo de competición desde una perspectiva histórica y relacional. El objetivo no es solo identificar qué equipos ganaron más, sino comprender cómo se formaron los ciclos de dominio, qué trayectorias se rompieron y qué rivalidades ayudaron a definir el equilibrio competitivo de la competición.

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