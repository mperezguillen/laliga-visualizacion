import * as Plot from "https://cdn.jsdelivr.net/npm/@observablehq/plot@0.6/+esm";

export function renderBumpChart(data, options = {}) {
  const {
    container,
    selectedTeams = []
  } = options;

  const element =
    typeof container === "string"
      ? document.querySelector(container)
      : container;

  if (!element) {
    throw new Error("No se ha encontrado el contenedor del gráfico.");
  }

  element.innerHTML = "";

  const selectedData = data.filter((d) => selectedTeams.includes(d.Team));
  const backgroundData = data.filter((d) => !selectedTeams.includes(d.Team));

  if (selectedData.length === 0) {
    element.innerHTML = `
      <p class="muted">
        Selecciona al menos un equipo para mostrar el gráfico.
      </p>
    `;
    return;
  }

  const maxPosition = Math.max(...data.map((d) => d.Position));
  const minSeason = Math.min(...data.map((d) => d.SeasonStart));
  const maxSeason = Math.max(...data.map((d) => d.SeasonStart));

  const width = Math.max(720, element.clientWidth || 900);

  const chart = Plot.plot({
    width,
    height: 520,
    marginTop: 30,
    marginRight: 30,
    marginBottom: 48,
    marginLeft: 54,

    x: {
      label: "Temporada",
      domain: [minSeason, maxSeason],
      tickFormat: (d) => String(d),
      ticks: 10
    },

    y: {
      label: "Posición final",
      domain: [maxPosition, 1],
      ticks: [1, 3, 5, 10, 15, 20]
    },

    color: {
      legend: true
    },

    marks: [
      Plot.ruleY([1], {
        stroke: "#8b1e2d",
        strokeOpacity: 0.35,
        strokeDasharray: "4 4"
      }),

      Plot.lineY(backgroundData, {
        x: "SeasonStart",
        y: "Position",
        z: "Team",
        stroke: "#999999",
        strokeWidth: 1,
        strokeOpacity: 0.08
      }),

      Plot.lineY(selectedData, {
        x: "SeasonStart",
        y: "Position",
        z: "Team",
        stroke: "Team",
        strokeWidth: 2.8
      }),

      Plot.dot(selectedData, {
        x: "SeasonStart",
        y: "Position",
        fill: "Team",
        r: 3,
        title: formatTooltip
      })
    ]
  });

  element.append(chart);
}

function formatTooltip(d) {
  const performance = Number.isFinite(d.Performance)
    ? `${(d.Performance * 100).toFixed(1)}%`
    : "Sin dato";

  return [
    `Equipo: ${d.Team}`,
    `Temporada: ${d.Season}`,
    `Posición: ${d.Position}`,
    `Puntos: ${Number.isFinite(d.Points) ? d.Points : "Sin dato"}`,
    `Performance: ${performance}`
  ].join("\n");
}
