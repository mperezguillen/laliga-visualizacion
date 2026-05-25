import * as Plot from "https://cdn.jsdelivr.net/npm/@observablehq/plot@0.6/+esm";

const METRIC_CONFIG = {
  Position: {
    label: "Posición final",
    inverted: true,
    format: (value) => `${value}.ª posición`,
    tickFormat: (value) => String(value)
  },

  Points: {
    label: "Puntos",
    inverted: false,
    format: (value) => `${value} puntos`,
    tickFormat: (value) => String(value)
  },

  WinRate: {
    label: "Porcentaje de victorias",
    inverted: false,
    format: (value) => `${(value * 100).toFixed(1)}%`,
    tickFormat: (value) => `${Math.round(value * 100)}%`
  },

  Performance: {
    label: "Performance",
    inverted: false,
    format: (value) => `${(value * 100).toFixed(1)}%`,
    tickFormat: (value) => `${Math.round(value * 100)}%`
  }
};

export function renderBumpChart(data, options = {}) {
  const {
    container,
    selectedTeams = [],
    metric = "Position"
  } = options;

  const metricConfig = METRIC_CONFIG[metric] ?? METRIC_CONFIG.Position;

  const element =
    typeof container === "string"
      ? document.querySelector(container)
      : container;

  if (!element) {
    throw new Error("No se ha encontrado el contenedor del gráfico.");
  }

  element.innerHTML = "";

  const validData = data.filter((d) => Number.isFinite(d[metric]));

  const selectedData = validData.filter((d) => selectedTeams.includes(d.Team));
  const backgroundData = validData.filter((d) => !selectedTeams.includes(d.Team));

  if (selectedData.length === 0) {
    element.innerHTML = `
      <p class="muted">
        Selecciona al menos un equipo para mostrar el gráfico.
      </p>
    `;
    return;
  }

  const selectedWithSegments = addLineSegments(selectedData);
  const backgroundWithSegments = addLineSegments(backgroundData);
  const labels = getLastPointByTeam(selectedData, metric);

  const minSeason = Math.min(...validData.map((d) => d.SeasonStart));
  const maxSeason = Math.max(...validData.map((d) => d.SeasonStart));

  const yValues = validData.map((d) => d[metric]);
  const minY = Math.min(...yValues);
  const maxY = Math.max(...yValues);

  const yDomain = metricConfig.inverted
    ? [maxY, minY]
    : [Math.min(0, minY), maxY];

  const width = Math.max(760, element.clientWidth || 900);

  const chart = Plot.plot({
    width,
    height: 540,
    marginTop: 32,
    marginRight: 150,
    marginBottom: 52,
    marginLeft: 60,

    x: {
      label: "Temporada",
      domain: [minSeason, maxSeason],
      tickFormat: (d) => String(d),
      ticks: 10
    },

    y: {
      label: metricConfig.label,
      domain: yDomain,
      tickFormat: metricConfig.tickFormat,
      grid: true
    },

    color: {
      legend: true
    },

    marks: [
      metric === "Position"
        ? Plot.ruleY([1], {
            stroke: "#8b1e2d",
            strokeOpacity: 0.35,
            strokeDasharray: "4 4"
          })
        : null,

      Plot.lineY(backgroundWithSegments, {
        x: "SeasonStart",
        y: metric,
        z: "Segment",
        stroke: "#999999",
        strokeWidth: 1,
        strokeOpacity: 0.07
      }),

      Plot.lineY(selectedWithSegments, {
        x: "SeasonStart",
        y: metric,
        z: "Segment",
        stroke: "Team",
        strokeWidth: 2.8
      }),

      Plot.dot(selectedData, {
        x: "SeasonStart",
        y: metric,
        fill: "Team",
        r: 3,
        title: (d) => formatTooltip(d, metric, metricConfig)
      }),

      Plot.text(labels, {
        x: "SeasonStart",
        y: metric,
        text: "Team",
        fill: "Team",
        dx: 8,
        fontSize: 12,
        fontWeight: 700,
        textAnchor: "start"
      })
    ].filter(Boolean)
  });

  element.append(chart);
}

function formatTooltip(d, metric, metricConfig) {
  const metricValue = Number.isFinite(d[metric])
    ? metricConfig.format(d[metric])
    : "Sin dato";

  const performance = Number.isFinite(d.Performance)
    ? `${(d.Performance * 100).toFixed(1)}%`
    : "Sin dato";

  const winRate = Number.isFinite(d.WinRate)
    ? `${(d.WinRate * 100).toFixed(1)}%`
    : "Sin dato";

  return [
    `Equipo: ${d.Team}`,
    `Temporada: ${d.Season}`,
    `${metricConfig.label}: ${metricValue}`,
    `Posición: ${Number.isFinite(d.Position) ? d.Position : "Sin dato"}`,
    `Puntos: ${Number.isFinite(d.Points) ? d.Points : "Sin dato"}`,
    `WinRate: ${winRate}`,
    `Performance: ${performance}`
  ].join("\n");
}

function getLastPointByTeam(data, metric) {
  const byTeam = new Map();

  for (const row of data) {
    if (!Number.isFinite(row[metric])) {
      continue;
    }

    const current = byTeam.get(row.Team);

    if (!current || row.SeasonStart > current.SeasonStart) {
      byTeam.set(row.Team, row);
    }
  }

  return Array.from(byTeam.values());
}

function addLineSegments(data) {
  const byTeam = new Map();

  for (const row of data) {
    if (!byTeam.has(row.Team)) {
      byTeam.set(row.Team, []);
    }

    byTeam.get(row.Team).push(row);
  }

  const result = [];

  for (const [team, rows] of byTeam.entries()) {
    const sortedRows = rows
      .slice()
      .sort((a, b) => a.SeasonStart - b.SeasonStart);

    let segmentIndex = 0;
    let previousSeason = null;

    for (const row of sortedRows) {
      if (
        previousSeason !== null &&
        row.SeasonStart - previousSeason > 1
      ) {
        segmentIndex += 1;
      }

      result.push({
        ...row,
        Segment: `${team}-${segmentIndex}`
      });

      previousSeason = row.SeasonStart;
    }
  }

  return result;
}
