import * as Plot from "https://cdn.jsdelivr.net/npm/@observablehq/plot@0.6/+esm";
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

const BUMP_METRIC_CONFIG = {
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

const DOMINANCE_METRIC_CONFIG = {
  top3Share: {
    label: "Frecuencia en top 3",
    colorLabel: "% de temporadas en top 3",
    legend: true,
    legendTickFormat: (value) => `${Math.round(value * 100)}%`,
    value: (d) => d.Top3Share,
    display: (d) => `${Math.round(d.Top3Share * 100)}%`,
    cellText: (d) => d.Top3Share >= 0.35 ? `${Math.round(d.Top3Share * 100)}%` : ""
  },

  top5Share: {
    label: "Frecuencia en top 5",
    colorLabel: "% de temporadas en top 5",
    legend: true,
    legendTickFormat: (value) => `${Math.round(value * 100)}%`,
    value: (d) => d.Top5Share,
    display: (d) => `${Math.round(d.Top5Share * 100)}%`,
    cellText: (d) => d.Top5Share >= 0.4 ? `${Math.round(d.Top5Share * 100)}%` : ""
  },

  championShare: {
    label: "Temporadas campeón",
    colorLabel: "% de temporadas como campeón",
    legend: true,
    legendTickFormat: (value) => `${Math.round(value * 100)}%`,
    value: (d) => d.ChampionShare,
    display: (d) => `${Math.round(d.ChampionShare * 100)}%`,
    cellText: (d) => d.ChampionShare > 0 ? `${Math.round(d.ChampionShare * 100)}%` : ""
  },

  avgPerformance: {
    label: "Performance media",
    colorLabel: "Performance media",
    legend: true,
    legendTickFormat: (value) => `${Math.round(value * 100)}%`,
    value: (d) => d.AvgPerformance,
    display: (d) => `${(d.AvgPerformance * 100).toFixed(1)}%`,
    cellText: (d) => d.AvgPerformance >= 0.55 ? `${Math.round(d.AvgPerformance * 100)}%` : ""
  },

  avgPosition: {
    label: "Posición media",
    colorLabel: "Intensidad de dominio por posición media",
    legend: false,
    value: (d) => Number.isFinite(d.AvgPosition) ? 1 / d.AvgPosition : null,
    display: (d) => `${d.AvgPosition.toFixed(2)}.ª`,
    cellText: (d) => d.AvgPosition <= 5 ? d.AvgPosition.toFixed(1) : ""
  }
};

const SUCCESS_METRIC_CONFIG = {
  uniqueChampions: {
    label: "Campeones distintos",
    yLabel: "Número de campeones distintos",
    type: "count",
    description:
      "Cuantos más campeones distintos aparecen en una década, más abierto fue el reparto de títulos.",
    value: (d) => d.UniqueChampions,
    format: (value) => `${value} campeón(es) distinto(s)`
  },

  uniqueTop3Teams: {
    label: "Equipos distintos en top 3",
    yLabel: "Número de equipos distintos",
    type: "count",
    description:
      "Mide cuántos clubes diferentes consiguieron entrar en el top 3 durante una década.",
    value: (d) => d.UniqueTop3Teams,
    format: (value) => `${value} equipo(s) distinto(s)`
  },

  top3Concentration: {
    label: "Concentración del top 3",
    yLabel: "% de plazas de top 3",
    type: "share",
    description:
      "Mide qué porcentaje de todas las plazas de top 3 fueron ocupadas por los tres clubes más repetidos de cada década.",
    value: (d) => d.Top3Concentration,
    format: (value) => `${Math.round(value * 100)}%`
  },

  championConcentration: {
    label: "Concentración de títulos",
    yLabel: "% de títulos",
    type: "share",
    description:
      "Mide qué porcentaje de títulos ganó el equipo más campeón de cada década.",
    value: (d) => d.ChampionConcentration,
    format: (value) => `${Math.round(value * 100)}%`
  }
};

const CHANGE_METRIC_CONFIG = {
  Performance: {
    label: "Performance",
    description:
      "Performance mide el rendimiento conseguido respecto al máximo posible de puntos. Es la métrica más comparable entre temporadas.",
    unit: "puntos porcentuales",
    betterWhen: "higher",
    format: (value) => `${(value * 100).toFixed(1)}%`,
    formatChange: (value) => `${(value * 100).toFixed(1)} pp`
  },

  Position: {
    label: "Posición final",
    description:
      "En posición final, una recuperación significa acabar más arriba en la tabla; una caída significa terminar en una posición peor.",
    unit: "posiciones",
    betterWhen: "lower",
    format: (value) => `${value}.ª`,
    formatChange: (value) => `${value.toFixed(0)} posiciones`
  },

  Points: {
    label: "Puntos",
    description:
      "Los puntos muestran cambios brutos de rendimiento, aunque son menos comparables entre épocas con distinto número de partidos.",
    unit: "puntos",
    betterWhen: "higher",
    format: (value) => `${value} puntos`,
    formatChange: (value) => `${value.toFixed(0)} puntos`
  },

  WinRate: {
    label: "Porcentaje de victorias",
    description:
      "El porcentaje de victorias permite comparar la eficacia ganadora entre temporadas consecutivas.",
    unit: "puntos porcentuales",
    betterWhen: "higher",
    format: (value) => `${(value * 100).toFixed(1)}%`,
    formatChange: (value) => `${(value * 100).toFixed(1)} pp`
  }
};

export function renderBumpChart(data, options = {}) {
  const {
    container,
    selectedTeams = [],
    metric = "Position"
  } = options;

  const metricConfig = BUMP_METRIC_CONFIG[metric] ?? BUMP_METRIC_CONFIG.Position;

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
        title: (d) => formatBumpTooltip(d, metric, metricConfig)
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

export function renderDominanceHeatmap(data, options = {}) {
  const {
    container,
    metric = "top3Share",
    topN = 12
  } = options;

  const metricConfig =
    DOMINANCE_METRIC_CONFIG[metric] ?? DOMINANCE_METRIC_CONFIG.top3Share;

  const element =
    typeof container === "string"
      ? document.querySelector(container)
      : container;

  if (!element) {
    throw new Error("No se ha encontrado el contenedor del heatmap.");
  }

  element.innerHTML = "";

  const dominanceRows = buildDecadeDominanceRows(data);

  if (dominanceRows.length === 0) {
    element.innerHTML = `
      <p class="muted">
        No hay datos suficientes para construir el heatmap de décadas.
      </p>
    `;

    return null;
  }

  const teams = getTopDominanceTeams(dominanceRows, topN);
  const decades = Array.from(new Set(dominanceRows.map((d) => d.Decade)))
    .sort((a, b) => a - b);

  const rowsByKey = new Map(
    dominanceRows.map((row) => [`${row.Team}__${row.Decade}`, row])
  );

  const heatmapData = [];

  for (const team of teams) {
    for (const decade of decades) {
      const row = rowsByKey.get(`${team}__${decade}`);

      if (row) {
        const plotValue = metricConfig.value(row);

        heatmapData.push({
          ...row,
          DecadeLabel: `${decade}s`,
          PlotValue: Number.isFinite(plotValue) ? plotValue : null,
          DisplayText: metricConfig.cellText(row),
          Tooltip: formatDominanceTooltip(row, metricConfig)
        });
      } else {
        heatmapData.push({
          Team: team,
          Decade: decade,
          DecadeLabel: `${decade}s`,
          PlotValue: null,
          DisplayText: "",
          Tooltip: [
            `Equipo: ${team}`,
            `Década: ${decade}s`,
            "Sin participación en Primera División durante esta década."
          ].join("\n")
        });
      }
    }
  }

  const filledData = heatmapData.filter((d) => Number.isFinite(d.PlotValue));
  const textData = heatmapData.filter((d) => d.DisplayText);

  const width = Math.max(820, element.clientWidth || 950);
  const height = Math.max(430, 110 + teams.length * 32);

  const chart = Plot.plot({
    width,
    height,
    marginTop: 32,
    marginRight: 24,
    marginBottom: 60,
    marginLeft: 130,

    x: {
      label: "Década",
      domain: decades.map((decade) => `${decade}s`)
    },

    y: {
      label: null,
      domain: teams
    },

    color: {
      scheme: "blues",
      legend: metricConfig.legend,
      label: metricConfig.colorLabel,
      tickFormat: metricConfig.legendTickFormat
    },

    marks: [
      Plot.cell(heatmapData, {
        x: "DecadeLabel",
        y: "Team",
        fill: "#f4f1e8",
        stroke: "#ffffff",
        strokeWidth: 1,
        title: "Tooltip"
      }),

      Plot.cell(filledData, {
        x: "DecadeLabel",
        y: "Team",
        fill: "PlotValue",
        stroke: "#ffffff",
        strokeWidth: 1,
        title: "Tooltip"
      }),

      Plot.text(textData, {
        x: "DecadeLabel",
        y: "Team",
        text: "DisplayText",
        fill: "#1d1d1f",
        fontSize: 10,
        fontWeight: 700,
        title: "Tooltip"
      })
    ]
  });

  element.append(chart);

  return {
    teams: teams.length,
    decades: decades.length,
    metricLabel: metricConfig.label
  };
}

export function renderSuccessConcentrationChart(data, options = {}) {
  const {
    container,
    metric = "uniqueChampions"
  } = options;

  const metricConfig =
    SUCCESS_METRIC_CONFIG[metric] ?? SUCCESS_METRIC_CONFIG.uniqueChampions;

  const element =
    typeof container === "string"
      ? document.querySelector(container)
      : container;

  if (!element) {
    throw new Error("No se ha encontrado el contenedor del gráfico de concentración.");
  }

  element.innerHTML = "";

  const rows = buildDecadeConcentrationRows(data)
    .map((row) => ({
      ...row,
      DecadeLabel: `${row.Decade}s`,
      Value: metricConfig.value(row),
      Tooltip: formatSuccessTooltip(row, metricConfig)
    }))
    .filter((row) => Number.isFinite(row.Value));

  if (rows.length === 0) {
    element.innerHTML = `
      <p class="muted">
        No hay datos suficientes para construir el gráfico de concentración.
      </p>
    `;

    return null;
  }

  const width = Math.max(780, element.clientWidth || 920);
  const maxValue = Math.max(...rows.map((d) => d.Value));

  const yDomain =
    metricConfig.type === "share"
      ? [0, 1]
      : [0, Math.ceil(maxValue + 1)];

  const chart = Plot.plot({
    width,
    height: 440,
    marginTop: 32,
    marginRight: 32,
    marginBottom: 58,
    marginLeft: 72,

    x: {
      label: "Década",
      domain: rows.map((d) => d.DecadeLabel)
    },

    y: {
      label: metricConfig.yLabel,
      domain: yDomain,
      grid: true,
      tickFormat:
        metricConfig.type === "share"
          ? (value) => `${Math.round(value * 100)}%`
          : (value) => String(value)
    },

    marks: [
      Plot.ruleY([0]),

      Plot.barY(rows, {
        x: "DecadeLabel",
        y: "Value",
        fill: "#8b1e2d",
        fillOpacity: 0.82,
        title: "Tooltip"
      }),

      Plot.dot(rows, {
        x: "DecadeLabel",
        y: "Value",
        fill: "#1d1d1f",
        r: 3,
        title: "Tooltip"
      }),

      Plot.text(rows, {
        x: "DecadeLabel",
        y: "Value",
        text: (d) =>
          metricConfig.type === "share"
            ? `${Math.round(d.Value * 100)}%`
            : String(d.Value),
        dy: -10,
        fill: "#1d1d1f",
        fontSize: 11,
        fontWeight: 700
      })
    ]
  });

  element.append(chart);

  return {
    decades: rows.length,
    metricLabel: metricConfig.label,
    description: metricConfig.description
  };
}

export function renderHistoricalChangesChart(data, options = {}) {
  const {
    container,
    metric = "Performance",
    changeType = "recoveries",
    topN = 10
  } = options;

  const metricConfig =
    CHANGE_METRIC_CONFIG[metric] ?? CHANGE_METRIC_CONFIG.Performance;

  const element =
    typeof container === "string"
      ? document.querySelector(container)
      : container;

  if (!element) {
    throw new Error("No se ha encontrado el contenedor del gráfico de cambios.");
  }

  element.innerHTML = "";

  const allChanges = buildSeasonToSeasonChanges(data, metric, metricConfig);

  const selectedChanges = allChanges
    .filter((row) =>
      changeType === "recoveries"
        ? row.Improvement > 0
        : row.Fall > 0
    )
    .sort((a, b) =>
      changeType === "recoveries"
        ? b.Improvement - a.Improvement
        : b.Fall - a.Fall
    )
    .slice(0, topN)
    .map((row) => {
      const magnitude =
        changeType === "recoveries" ? row.Improvement : row.Fall;

      return {
        ...row,
        Magnitude: magnitude,
        SignedValue: changeType === "recoveries" ? magnitude : -magnitude,
        EventLabel: `${row.Team} · ${row.PreviousSeason} → ${row.CurrentSeason}`,
        ChangeLabel:
          changeType === "recoveries"
            ? `+${metricConfig.formatChange(magnitude)}`
            : `-${metricConfig.formatChange(magnitude)}`
      };
    })
    .reverse();

  if (selectedChanges.length === 0) {
    element.innerHTML = `
      <p class="muted">
        No hay datos suficientes para calcular cambios entre temporadas consecutivas.
      </p>
    `;

    return null;
  }

  const maxAbsValue = Math.max(
    ...selectedChanges.map((row) => Math.abs(row.SignedValue))
  );

  const xDomain =
    changeType === "recoveries"
      ? [0, maxAbsValue * 1.18]
      : [-maxAbsValue * 1.18, 0];

  const width = Math.max(820, element.clientWidth || 950);
  const height = Math.max(440, 120 + selectedChanges.length * 34);

  const chart = Plot.plot({
    width,
    height,
    marginTop: 32,
    marginRight: 110,
    marginBottom: 56,
    marginLeft: 260,

    x: {
      label:
        changeType === "recoveries"
          ? `Mejora en ${metricConfig.label}`
          : `Empeoramiento en ${metricConfig.label}`,
      domain: xDomain,
      grid: true,
      tickFormat: (value) =>
        metric === "Position"
          ? String(Math.abs(value))
          : metricConfig.formatChange(Math.abs(value))
    },

    y: {
      label: null
    },

    marks: [
      Plot.ruleX([0]),

      Plot.barX(selectedChanges, {
        x: "SignedValue",
        y: "EventLabel",
        fill: changeType === "recoveries" ? "#8b1e2d" : "#4a4a4a",
        fillOpacity: 0.84,
        title: "Tooltip"
      }),

      Plot.text(selectedChanges, {
        x: "SignedValue",
        y: "EventLabel",
        text: "ChangeLabel",
        dx: changeType === "recoveries" ? 8 : -8,
        textAnchor: changeType === "recoveries" ? "start" : "end",
        fill: "#1d1d1f",
        fontSize: 11,
        fontWeight: 700,
        title: "Tooltip"
      })
    ]
  });

  element.append(chart);

  return {
    cases: selectedChanges.length,
    metricLabel: metricConfig.label,
    changeTypeLabel:
      changeType === "recoveries" ? "Recuperaciones" : "Caídas",
    description: metricConfig.description
  };
}

export function renderRegularityScatterChart(data, options = {}) {
  const {
    container,
    minSeasons = 10,
    labelCount = 12
  } = options;

  const element =
    typeof container === "string"
      ? document.querySelector(container)
      : container;

  if (!element) {
    throw new Error("No se ha encontrado el contenedor del gráfico de regularidad.");
  }

  element.innerHTML = "";

  const allTeams = buildTeamRegularityRows(data);

  const rows = allTeams
    .filter((row) => row.Seasons >= minSeasons)
    .sort((a, b) => {
      return (
        a.AvgPosition - b.AvgPosition ||
        b.Seasons - a.Seasons ||
        a.PositionStdDev - b.PositionStdDev
      );
    });

  if (rows.length === 0) {
    element.innerHTML = `
      <p class="muted">
        No hay equipos suficientes para los filtros seleccionados.
      </p>
    `;

    return null;
  }

  const labels = getRegularityLabels(rows, labelCount);

  const maxAvgPosition = Math.max(...rows.map((d) => d.AvgPosition));
  const maxStdDev = Math.max(...rows.map((d) => d.PositionStdDev));

  const medianAvgPosition = median(rows.map((d) => d.AvgPosition));
  const medianStdDev = median(rows.map((d) => d.PositionStdDev));

  const width = Math.max(820, element.clientWidth || 960);

  const chart = Plot.plot({
    width,
    height: 560,
    marginTop: 36,
    marginRight: 40,
    marginBottom: 70,
    marginLeft: 78,

    x: {
      label: "Posición media histórica",
      domain: [1, Math.ceil(maxAvgPosition + 1)],
      grid: true,
      tickFormat: (value) => `${value}.ª`
    },

    y: {
      label: "Variabilidad de la posición",
      domain: [0, Math.ceil(maxStdDev + 1)],
      grid: true
    },

    color: {
      legend: true
    },

    marks: [
      Plot.ruleX([medianAvgPosition], {
        stroke: "#999999",
        strokeOpacity: 0.35,
        strokeDasharray: "4 4"
      }),

      Plot.ruleY([medianStdDev], {
        stroke: "#999999",
        strokeOpacity: 0.35,
        strokeDasharray: "4 4"
      }),

      Plot.dot(rows, {
        x: "AvgPosition",
        y: "PositionStdDev",
        r: (d) => Math.max(4, Math.sqrt(d.Seasons) * 1.55),
        fill: "Category",
        fillOpacity: 0.78,
        stroke: "#ffffff",
        strokeWidth: 1.1,
        title: "Tooltip"
      }),

      Plot.text(labels, {
        x: "AvgPosition",
        y: "PositionStdDev",
        text: "Team",
        dx: 8,
        dy: -8,
        fontSize: 11,
        fontWeight: 700,
        fill: "#1d1d1f",
        title: "Tooltip"
      })
    ]
  });

  element.append(chart);

  return {
    teams: rows.length,
    minSeasons,
    labelCount
  };
}

export function renderRivalryDecadeChart(data, options = {}) {
  const {
    container,
    teamA,
    teamB
  } = options;

  const element =
    typeof container === "string"
      ? document.querySelector(container)
      : container;

  if (!element) {
    throw new Error("No se ha encontrado el contenedor del gráfico de rivalidad por décadas.");
  }

  element.innerHTML = "";

  if (!data || data.length === 0) {
    element.innerHTML = `
      <p class="muted">
        No hay enfrentamientos suficientes para construir el gráfico por décadas.
      </p>
    `;

    return;
  }

  const outcomeOrder = [
    `Victorias ${teamA}`,
    "Empates",
    `Victorias ${teamB}`
  ];

  const rows = data.flatMap((row) => [
    {
      Decade: row.decade,
      DecadeLabel: row.decadeLabel,
      Outcome: `Victorias ${teamA}`,
      Count: row.winsTeamA,
      Tooltip: [
        `Década: ${row.decadeLabel}`,
        `Resultado: victorias de ${teamA}`,
        `Partidos: ${row.winsTeamA}`,
        `Total de enfrentamientos: ${row.matches}`
      ].join("\n")
    },
    {
      Decade: row.decade,
      DecadeLabel: row.decadeLabel,
      Outcome: "Empates",
      Count: row.draws,
      Tooltip: [
        `Década: ${row.decadeLabel}`,
        "Resultado: empates",
        `Partidos: ${row.draws}`,
        `Total de enfrentamientos: ${row.matches}`
      ].join("\n")
    },
    {
      Decade: row.decade,
      DecadeLabel: row.decadeLabel,
      Outcome: `Victorias ${teamB}`,
      Count: row.winsTeamB,
      Tooltip: [
        `Década: ${row.decadeLabel}`,
        `Resultado: victorias de ${teamB}`,
        `Partidos: ${row.winsTeamB}`,
        `Total de enfrentamientos: ${row.matches}`
      ].join("\n")
    }
  ]);

  const decades = data.map((row) => row.decadeLabel);
  const width = Math.max(760, element.clientWidth || 900);
  const maxMatches = Math.max(...data.map((row) => row.matches));

  const chart = Plot.plot({
    width,
    height: 420,
    marginTop: 34,
    marginRight: 24,
    marginBottom: 62,
    marginLeft: 62,

    x: {
      label: "Década",
      domain: decades
    },

    y: {
      label: "Número de enfrentamientos",
      domain: [0, Math.max(1, maxMatches + 2)],
      grid: true
    },

    color: {
      domain: outcomeOrder,
      range: ["#8b1e2d", "#c8b99a", "#30343b"],
      legend: true
    },

    marks: [
      Plot.ruleY([0]),

      Plot.barY(rows, {
        x: "DecadeLabel",
        y: "Count",
        fill: "Outcome",
        title: "Tooltip"
      }),

      Plot.text(data, {
        x: "decadeLabel",
        y: "matches",
        text: (d) => String(d.matches),
        dy: -8,
        fill: "#1d1d1f",
        fontSize: 11,
        fontWeight: 700
      })
    ]
  });

  element.append(chart);
}

export function renderCumulativeBalanceChart(data, options = {}) {
  const {
    container,
    teamA,
    teamB
  } = options;

  const element =
    typeof container === "string"
      ? document.querySelector(container)
      : container;

  if (!element) {
    throw new Error("No se ha encontrado el contenedor del gráfico de balance acumulado.");
  }

  element.innerHTML = "";

  if (!data || data.length === 0) {
    element.innerHTML = `
      <p class="muted">
        No hay enfrentamientos suficientes para construir el balance acumulado.
      </p>
    `;

    return;
  }

  const rows = prepareCumulativeBalanceRows(data, teamA, teamB);

  const minYear = Math.min(...rows.map((row) => row.seasonStartYear));
  const maxYear = Math.max(...rows.map((row) => row.seasonStartYear));
  const maxAbsBalance = Math.max(
    1,
    ...rows.map((row) => Math.abs(row.cumulativeBalance))
  );

  const width = Math.max(760, element.clientWidth || 900);

  const chart = Plot.plot({
    width,
    height: 420,
    marginTop: 34,
    marginRight: 32,
    marginBottom: 62,
    marginLeft: 68,

    x: {
      label: "Temporada",
      domain: [minYear - 1, maxYear + 1],
      ticks: 10,
      tickFormat: (value) => String(Math.round(value))
    },

    y: {
      label: `Balance acumulado (+ ${teamA} / − ${teamB})`,
      domain: [-maxAbsBalance - 1, maxAbsBalance + 1],
      grid: true
    },

    marks: [
      Plot.ruleY([0], {
        stroke: "#1d1d1f",
        strokeOpacity: 0.45,
        strokeDasharray: "4 4"
      }),

      Plot.areaY(rows, {
        x: "PlotX",
        y1: 0,
        y2: "cumulativeBalance",
        fill: "#8b1e2d",
        fillOpacity: 0.08
      }),

      Plot.lineY(rows, {
        x: "PlotX",
        y: "cumulativeBalance",
        stroke: "#8b1e2d",
        strokeWidth: 2.6
      }),

      Plot.dot(rows, {
        x: "PlotX",
        y: "cumulativeBalance",
        r: 3,
        fill: "#8b1e2d",
        stroke: "#ffffff",
        strokeWidth: 1,
        title: "Tooltip"
      })
    ]
  });

  element.append(chart);
}

export function renderNetworkGraph(networkData, options = {}) {
  const {
    container,
    resetButton = null,
    onLinkClick = null
  } = options;

  const element =
    typeof container === "string"
      ? document.querySelector(container)
      : container;

  if (!element) {
    throw new Error("No se ha encontrado el contenedor de la red.");
  }

  element.innerHTML = "";

  const nodes = (networkData?.nodes ?? []).map((node) => ({ ...node }));
  const links = (networkData?.links ?? []).map((link) => ({ ...link }));

  if (nodes.length === 0 || links.length === 0) {
    element.innerHTML = `
      <p class="muted" style="padding: 24px;">
        No hay suficientes nodos o enlaces para construir la red con los filtros actuales.
        Prueba a reducir el mínimo de enfrentamientos o el mínimo de temporadas.
      </p>
    `;

    return;
  }

  const width = Math.max(860, element.clientWidth || 960);
  const height = 620;

  const maxMatches = d3.max(links, (d) => d.matches) ?? 1;
  const minMatches = d3.min(links, (d) => d.matches) ?? 1;
  const maxSeasons = d3.max(nodes, (d) => d.seasonsPlayed) ?? 1;

  const linkWidth = d3
    .scaleSqrt()
    .domain([minMatches, maxMatches])
    .range([1.2, 7]);

  const nodeRadius = d3
    .scaleSqrt()
    .domain([1, maxSeasons])
    .range([5, 18]);

  const categoryColor = d3
    .scaleOrdinal()
    .domain(["dominante", "histórico", "regular", "episódico"])
    .range(["#8b1e2d", "#30343b", "#8a6f3d", "#777777"]);

  const tooltip = d3
    .select(element)
    .append("div")
    .attr("class", "network-tooltip");

  const svg = d3
    .select(element)
    .append("svg")
    .attr("viewBox", [0, 0, width, height])
    .attr("role", "img")
    .attr("aria-label", "Red de enfrentamientos históricos de LaLiga");

  const graphLayer = svg.append("g");

  const zoom = d3
    .zoom()
    .scaleExtent([0.45, 3])
    .on("zoom", (event) => {
      graphLayer.attr("transform", event.transform);
    });

  svg.call(zoom);

  const linkGroup = graphLayer
    .append("g")
    .attr("stroke-linecap", "round");

  const nodeGroup = graphLayer.append("g");
  const labelGroup = graphLayer.append("g");

  const link = linkGroup
    .selectAll("line")
    .data(links)
    .join("line")
    .attr("class", "network-link")
    .attr("stroke", "#8b1e2d")
    .attr("stroke-opacity", (d) => 0.18 + d.equilibrium * 0.42)
    .attr("stroke-width", (d) => linkWidth(d.matches))
    .on("mouseenter", (event, d) => {
      highlightLink(d, link, node, labels);
      showLinkTooltip(event, d, tooltip);
    })
    .on("mousemove", (event) => {
      moveTooltip(event, tooltip);
    })
    .on("mouseleave", () => {
      resetHighlight(link, node, labels);
      hideTooltip(tooltip);
    })
    .on("click", (event, d) => {
      event.stopPropagation();

      if (typeof onLinkClick === "function") {
        onLinkClick({
          ...d,
          source: getNetworkNodeId(d.source),
          target: getNetworkNodeId(d.target)
        });
      }
    });

  const node = nodeGroup
    .selectAll("circle")
    .data(nodes)
    .join("circle")
    .attr("class", "network-node")
    .attr("r", (d) => nodeRadius(d.seasonsPlayed))
    .attr("fill", (d) => categoryColor(d.category))
    .attr("fill-opacity", 0.88)
    .attr("stroke", "#ffffff")
    .attr("stroke-width", 1.3)
    .on("mouseenter", (event, d) => {
      highlightNode(d, links, link, node, labels);
      showNodeTooltip(event, d, tooltip);
    })
    .on("mousemove", (event) => {
      moveTooltip(event, tooltip);
    })
    .on("mouseleave", () => {
      resetHighlight(link, node, labels);
      hideTooltip(tooltip);
    })
    .call(
      d3
        .drag()
        .on("start", dragStarted)
        .on("drag", dragged)
        .on("end", dragEnded)
    );

  const labels = labelGroup
    .selectAll("text")
    .data(nodes)
    .join("text")
    .attr("class", "network-label")
    .attr("font-size", 11)
    .attr("font-weight", 700)
    .attr("fill", "#1d1d1f")
    .attr("text-anchor", "middle")
    .text((d) => d.team);

  const simulation = d3
    .forceSimulation(nodes)
    .force(
      "link",
      d3
        .forceLink(links)
        .id((d) => d.id)
        .distance((d) => Math.max(70, 165 - linkWidth(d.matches) * 8))
        .strength(0.22)
    )
    .force("charge", d3.forceManyBody().strength(-460))
    .force("center", d3.forceCenter(width / 2, height / 2))
    .force(
      "collision",
      d3.forceCollide().radius((d) => nodeRadius(d.seasonsPlayed) + 22)
    )
    .on("tick", ticked);

  const resetElement =
    typeof resetButton === "string"
      ? document.querySelector(resetButton)
      : resetButton;

  if (resetElement) {
    resetElement.onclick = () => {
      svg
        .transition()
        .duration(550)
        .call(zoom.transform, d3.zoomIdentity);
    };
  }

  function ticked() {
    link
      .attr("x1", (d) => d.source.x)
      .attr("y1", (d) => d.source.y)
      .attr("x2", (d) => d.target.x)
      .attr("y2", (d) => d.target.y);

    node
      .attr("cx", (d) => d.x)
      .attr("cy", (d) => d.y);

    labels
      .attr("x", (d) => d.x)
      .attr("y", (d) => d.y + nodeRadius(d.seasonsPlayed) + 14);
  }

  function dragStarted(event, d) {
    if (!event.active) {
      simulation.alphaTarget(0.25).restart();
    }

    d.fx = d.x;
    d.fy = d.y;
  }

  function dragged(event, d) {
    d.fx = event.x;
    d.fy = event.y;
  }

  function dragEnded(event, d) {
    if (!event.active) {
      simulation.alphaTarget(0);
    }

    d.fx = null;
    d.fy = null;
  }
}

function highlightNode(selectedNode, links, linkSelection, nodeSelection, labelSelection) {
  const connectedIds = new Set([selectedNode.id]);

  for (const link of links) {
    const sourceId = getNetworkNodeId(link.source);
    const targetId = getNetworkNodeId(link.target);

    if (sourceId === selectedNode.id || targetId === selectedNode.id) {
      connectedIds.add(sourceId);
      connectedIds.add(targetId);
    }
  }

  linkSelection
    .attr("stroke-opacity", (d) => {
      const sourceId = getNetworkNodeId(d.source);
      const targetId = getNetworkNodeId(d.target);

      return sourceId === selectedNode.id || targetId === selectedNode.id
        ? 0.8
        : 0.04;
    });

  nodeSelection
    .attr("fill-opacity", (d) => connectedIds.has(d.id) ? 0.95 : 0.18);

  labelSelection
    .attr("opacity", (d) => connectedIds.has(d.id) ? 1 : 0.16);
}

function highlightLink(selectedLink, linkSelection, nodeSelection, labelSelection) {
  const sourceId = getNetworkNodeId(selectedLink.source);
  const targetId = getNetworkNodeId(selectedLink.target);

  linkSelection
    .attr("stroke-opacity", (d) => {
      const currentSourceId = getNetworkNodeId(d.source);
      const currentTargetId = getNetworkNodeId(d.target);

      return currentSourceId === sourceId && currentTargetId === targetId
        ? 0.9
        : 0.05;
    });

  nodeSelection
    .attr("fill-opacity", (d) =>
      d.id === sourceId || d.id === targetId ? 0.95 : 0.18
    );

  labelSelection
    .attr("opacity", (d) =>
      d.id === sourceId || d.id === targetId ? 1 : 0.16
    );
}

function resetHighlight(linkSelection, nodeSelection, labelSelection) {
  linkSelection
    .attr("stroke-opacity", (d) => 0.18 + d.equilibrium * 0.42);

  nodeSelection.attr("fill-opacity", 0.88);
  labelSelection.attr("opacity", 1);
}

function showNodeTooltip(event, node, tooltip) {
  const avgPosition = Number.isFinite(node.avgPosition)
    ? `${node.avgPosition.toFixed(2)}.ª`
    : "Sin dato";

  tooltip
    .html(`
      <strong>${node.team}</strong>
      Temporadas: ${node.seasonsPlayed}<br>
      Partidos en matriz: ${node.totalMatchesInMatrix}<br>
      Posición media: ${avgPosition}<br>
      Títulos: ${node.titles}<br>
      Top 3: ${node.top3Count}<br>
      Categoría: ${node.category}
    `)
    .style("opacity", 1);

  moveTooltip(event, tooltip);
}

function showLinkTooltip(event, link, tooltip) {
  const source = getNetworkNodeId(link.source);
  const target = getNetworkNodeId(link.target);

  tooltip
    .html(`
      <strong>${source} vs ${target}</strong>
      Partidos: ${link.matches}<br>
      Victorias ${source}: ${link.winsSource}<br>
      Empates: ${link.draws}<br>
      Victorias ${target}: ${link.winsTarget}<br>
      Goles: ${link.goalsSource} - ${link.goalsTarget}<br>
      Equilibrio: ${formatNetworkPercent(link.equilibrium)}<br>
      Rivalry score: ${link.rivalryScore.toFixed(1)}
    `)
    .style("opacity", 1);

  moveTooltip(event, tooltip);
}

function moveTooltip(event, tooltip) {
  tooltip
    .style("left", `${event.offsetX}px`)
    .style("top", `${event.offsetY}px`);
}

function hideTooltip(tooltip) {
  tooltip.style("opacity", 0);
}

function getNetworkNodeId(value) {
  return typeof value === "object" ? value.id : value;
}

function formatNetworkPercent(value) {
  if (!Number.isFinite(value)) {
    return "Sin dato";
  }

  return `${Math.round(value * 100)}%`;
}

function prepareCumulativeBalanceRows(data, teamA, teamB) {
  const sortedRows = data
    .slice()
    .sort((a, b) => {
      if (a.seasonStartYear !== b.seasonStartYear) {
        return a.seasonStartYear - b.seasonStartYear;
      }

      return a.matchId.localeCompare(b.matchId, "es");
    });

  const rowsBySeason = new Map();

  for (const row of sortedRows) {
    if (!rowsBySeason.has(row.seasonStartYear)) {
      rowsBySeason.set(row.seasonStartYear, []);
    }

    rowsBySeason.get(row.seasonStartYear).push(row);
  }

  return sortedRows.map((row, index) => {
    const seasonRows = rowsBySeason.get(row.seasonStartYear) ?? [];
    const indexWithinSeason = seasonRows.indexOf(row);

    const offset =
      seasonRows.length > 1
        ? ((indexWithinSeason / (seasonRows.length - 1)) - 0.5) * 0.65
        : 0;

    const resultLabel =
      row.resultForTeamA === "win"
        ? `Victoria de ${teamA}`
        : row.resultForTeamA === "loss"
          ? `Victoria de ${teamB}`
          : "Empate";

    return {
      ...row,
      MatchNumber: index + 1,
      PlotX: row.seasonStartYear + offset,
      Tooltip: [
        `Temporada: ${row.Season}`,
        `${teamA} ${row.goalsTeamA} - ${row.goalsTeamB} ${teamB}`,
        `Resultado: ${resultLabel}`,
        `Balance acumulado: ${formatSignedChartNumber(row.cumulativeBalance)}`
      ].join("\n")
    };
  });
}

function formatSignedChartNumber(value) {
  if (!Number.isFinite(value)) {
    return "Sin dato";
  }

  if (value > 0) {
    return `+${value}`;
  }

  return String(value);
}

function formatBumpTooltip(d, metric, metricConfig) {
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

function formatDominanceTooltip(row, metricConfig) {
  const avgPerformance = Number.isFinite(row.AvgPerformance)
    ? `${(row.AvgPerformance * 100).toFixed(1)}%`
    : "Sin dato";

  return [
    `Equipo: ${row.Team}`,
    `Década: ${row.Decade}s`,
    `Métrica activa: ${metricConfig.label}`,
    `Valor: ${metricConfig.display(row)}`,
    `Temporadas disputadas: ${row.Seasons}`,
    `Posición media: ${row.AvgPosition.toFixed(2)}`,
    `Temporadas campeón: ${row.ChampionCount}`,
    `Temporadas en top 3: ${row.Top3Count}`,
    `Temporadas en top 5: ${row.Top5Count}`,
    `Performance media: ${avgPerformance}`
  ].join("\n");
}

function buildDecadeDominanceRows(data) {
  const grouped = new Map();

  for (const row of data) {
    if (
      !row.Team ||
      !Number.isFinite(row.Decade) ||
      !Number.isFinite(row.Position)
    ) {
      continue;
    }

    const key = `${row.Team}__${row.Decade}`;

    if (!grouped.has(key)) {
      grouped.set(key, {
        Team: row.Team,
        Decade: row.Decade,
        Seasons: 0,
        PositionSum: 0,
        PerformanceSum: 0,
        PerformanceCount: 0,
        ChampionCount: 0,
        Top3Count: 0,
        Top5Count: 0
      });
    }

    const group = grouped.get(key);

    group.Seasons += 1;
    group.PositionSum += row.Position;

    if (Number.isFinite(row.Performance)) {
      group.PerformanceSum += row.Performance;
      group.PerformanceCount += 1;
    }

    if (row.Position === 1) {
      group.ChampionCount += 1;
    }

    if (row.Position <= 3) {
      group.Top3Count += 1;
    }

    if (row.Position <= 5) {
      group.Top5Count += 1;
    }
  }

  return Array.from(grouped.values()).map((group) => {
    const avgPosition = group.PositionSum / group.Seasons;
    const avgPerformance =
      group.PerformanceCount > 0
        ? group.PerformanceSum / group.PerformanceCount
        : NaN;

    return {
      Team: group.Team,
      Decade: group.Decade,
      Seasons: group.Seasons,
      AvgPosition: avgPosition,
      AvgPerformance: avgPerformance,
      ChampionCount: group.ChampionCount,
      Top3Count: group.Top3Count,
      Top5Count: group.Top5Count,
      ChampionShare: group.ChampionCount / group.Seasons,
      Top3Share: group.Top3Count / group.Seasons,
      Top5Share: group.Top5Count / group.Seasons
    };
  });
}

function getTopDominanceTeams(rows, topN) {
  const byTeam = new Map();

  for (const row of rows) {
    if (!byTeam.has(row.Team)) {
      byTeam.set(row.Team, {
        Team: row.Team,
        Seasons: 0,
        PositionWeightedSum: 0,
        ChampionCount: 0,
        Top3Count: 0,
        Top5Count: 0
      });
    }

    const team = byTeam.get(row.Team);

    team.Seasons += row.Seasons;
    team.PositionWeightedSum += row.AvgPosition * row.Seasons;
    team.ChampionCount += row.ChampionCount;
    team.Top3Count += row.Top3Count;
    team.Top5Count += row.Top5Count;
  }

  return Array.from(byTeam.values())
    .map((team) => ({
      ...team,
      AvgPosition: team.PositionWeightedSum / team.Seasons
    }))
    .sort((a, b) => {
      return (
        b.ChampionCount - a.ChampionCount ||
        b.Top3Count - a.Top3Count ||
        b.Top5Count - a.Top5Count ||
        b.Seasons - a.Seasons ||
        a.AvgPosition - b.AvgPosition ||
        a.Team.localeCompare(b.Team, "es")
      );
    })
    .slice(0, topN)
    .map((team) => team.Team);
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

function buildDecadeConcentrationRows(data) {
  const grouped = new Map();

  for (const row of data) {
    if (
      !Number.isFinite(row.Decade) ||
      !Number.isFinite(row.Position) ||
      !row.Team
    ) {
      continue;
    }

    if (!grouped.has(row.Decade)) {
      grouped.set(row.Decade, {
        Decade: row.Decade,
        SeasonsSet: new Set(),
        ChampionCounts: new Map(),
        Top3Counts: new Map(),
        ChampionSlots: 0,
        Top3Slots: 0
      });
    }

    const group = grouped.get(row.Decade);

    if (Number.isFinite(row.SeasonStart)) {
      group.SeasonsSet.add(row.SeasonStart);
    }

    if (row.Position === 1) {
      group.ChampionSlots += 1;
      group.ChampionCounts.set(
        row.Team,
        (group.ChampionCounts.get(row.Team) ?? 0) + 1
      );
    }

    if (row.Position <= 3) {
      group.Top3Slots += 1;
      group.Top3Counts.set(
        row.Team,
        (group.Top3Counts.get(row.Team) ?? 0) + 1
      );
    }
  }

  return Array.from(grouped.values())
    .sort((a, b) => a.Decade - b.Decade)
    .map((group) => {
      const championEntries = Array.from(group.ChampionCounts.entries())
        .sort((a, b) => b[1] - a[1]);

      const top3Entries = Array.from(group.Top3Counts.entries())
        .sort((a, b) => b[1] - a[1]);

      const dominantChampion = championEntries[0]?.[0] ?? "Sin dato";
      const dominantChampionTitles = championEntries[0]?.[1] ?? 0;

      const top3MainTeams = top3Entries
        .slice(0, 3)
        .map(([team]) => team);

      const top3MainSlots = top3Entries
        .slice(0, 3)
        .reduce((sum, [, count]) => sum + count, 0);

      return {
        Decade: group.Decade,
        Seasons: group.SeasonsSet.size,

        UniqueChampions: group.ChampionCounts.size,
        UniqueTop3Teams: group.Top3Counts.size,

        ChampionSlots: group.ChampionSlots,
        Top3Slots: group.Top3Slots,

        DominantChampion: dominantChampion,
        DominantChampionTitles: dominantChampionTitles,

        Top3MainTeams: top3MainTeams,

        ChampionConcentration:
          group.ChampionSlots > 0
            ? dominantChampionTitles / group.ChampionSlots
            : NaN,

        Top3Concentration:
          group.Top3Slots > 0
            ? top3MainSlots / group.Top3Slots
            : NaN
      };
    });
}

function formatSuccessTooltip(row, metricConfig) {
  const top3Teams =
    row.Top3MainTeams.length > 0
      ? row.Top3MainTeams.join(", ")
      : "Sin dato";

  return [
    `Década: ${row.Decade}s`,
    `Métrica activa: ${metricConfig.label}`,
    `Valor: ${metricConfig.format(metricConfig.value(row))}`,
    `Temporadas analizadas: ${row.Seasons}`,
    `Campeones distintos: ${row.UniqueChampions}`,
    `Equipos distintos en top 3: ${row.UniqueTop3Teams}`,
    `Campeón más repetido: ${row.DominantChampion}`,
    `Títulos del campeón más repetido: ${row.DominantChampionTitles}`,
    `Tres clubes más presentes en top 3: ${top3Teams}`,
    `Plazas totales de top 3: ${row.Top3Slots}`
  ].join("\n");
}

function buildSeasonToSeasonChanges(data, metric, metricConfig) {
  const byTeam = new Map();

  for (const row of data) {
    if (
      !row.Team ||
      !Number.isFinite(row.SeasonStart) ||
      !Number.isFinite(row[metric])
    ) {
      continue;
    }

    if (!byTeam.has(row.Team)) {
      byTeam.set(row.Team, []);
    }

    byTeam.get(row.Team).push(row);
  }

  const changes = [];

  for (const [team, rows] of byTeam.entries()) {
    const sortedRows = rows
      .slice()
      .sort((a, b) => a.SeasonStart - b.SeasonStart);

    for (let index = 1; index < sortedRows.length; index += 1) {
      const previous = sortedRows[index - 1];
      const current = sortedRows[index];

      if (!areComparableConsecutiveSeasons(previous, current)) {
        continue;
      }

      const previousValue = previous[metric];
      const currentValue = current[metric];

      const rawChange = currentValue - previousValue;

      const improvement =
        metricConfig.betterWhen === "higher"
          ? rawChange
          : -rawChange;

      const fall =
        metricConfig.betterWhen === "higher"
          ? -rawChange
          : rawChange;

      changes.push({
        Team: team,
        PreviousSeason: previous.Season,
        CurrentSeason: current.Season,
        PreviousSeasonStart: previous.SeasonStart,
        CurrentSeasonStart: current.SeasonStart,
        PreviousValue: previousValue,
        CurrentValue: currentValue,
        RawChange: rawChange,
        Improvement: improvement,
        Fall: fall,
        Tooltip: formatChangeTooltip({
          team,
          previous,
          current,
          metric,
          metricConfig,
          improvement,
          fall
        })
      });
    }
  }

  return changes;
}

function areComparableConsecutiveSeasons(previous, current) {
  return current.SeasonStart - previous.SeasonStart === 1;
}

function formatChangeTooltip({
  team,
  previous,
  current,
  metric,
  metricConfig,
  improvement,
  fall
}) {
  const direction =
    improvement > 0
      ? "Recuperación"
      : fall > 0
        ? "Caída"
        : "Sin cambio";

  const magnitude = Math.max(improvement, fall, 0);

  return [
    `Equipo: ${team}`,
    `Cambio: ${direction}`,
    `Temporadas: ${previous.Season} → ${current.Season}`,
    `Métrica: ${metricConfig.label}`,
    `Valor anterior: ${metricConfig.format(previous[metric])}`,
    `Valor posterior: ${metricConfig.format(current[metric])}`,
    `Magnitud: ${metricConfig.formatChange(magnitude)}`,
    `Posición anterior: ${previous.Position}.ª`,
    `Posición posterior: ${current.Position}.ª`,
    `Puntos anteriores: ${previous.Points}`,
    `Puntos posteriores: ${current.Points}`
  ].join("\n");
}

function buildTeamRegularityRows(data) {
  const grouped = new Map();

  for (const row of data) {
    if (
      !row.Team ||
      !Number.isFinite(row.Position) ||
      !Number.isFinite(row.SeasonStart)
    ) {
      continue;
    }

    if (!grouped.has(row.Team)) {
      grouped.set(row.Team, {
        Team: row.Team,
        Positions: [],
        Performances: [],
        Points: [],
        SeasonsList: [],
        ChampionCount: 0,
        Top3Count: 0,
        Top5Count: 0
      });
    }

    const group = grouped.get(row.Team);

    group.Positions.push(row.Position);
    group.SeasonsList.push(row.SeasonStart);

    if (Number.isFinite(row.Performance)) {
      group.Performances.push(row.Performance);
    }

    if (Number.isFinite(row.Points)) {
      group.Points.push(row.Points);
    }

    if (row.Position === 1) {
      group.ChampionCount += 1;
    }

    if (row.Position <= 3) {
      group.Top3Count += 1;
    }

    if (row.Position <= 5) {
      group.Top5Count += 1;
    }
  }

  const baseRows = Array.from(grouped.values()).map((group) => {
    const seasons = group.Positions.length;
    const avgPosition = mean(group.Positions);
    const positionStdDev = standardDeviation(group.Positions);
    const avgPerformance = mean(group.Performances);
    const avgPoints = mean(group.Points);
    const firstSeason = Math.min(...group.SeasonsList);
    const lastSeason = Math.max(...group.SeasonsList);

    return {
      Team: group.Team,
      Seasons: seasons,
      AvgPosition: avgPosition,
      PositionStdDev: positionStdDev,
      AvgPerformance: avgPerformance,
      AvgPoints: avgPoints,
      FirstSeason: firstSeason,
      LastSeason: lastSeason,
      ChampionCount: group.ChampionCount,
      Top3Count: group.Top3Count,
      Top5Count: group.Top5Count
    };
  });

  const stdValues = baseRows.map((row) => row.PositionStdDev);
  const medianStd = median(stdValues);
  const highStd = quantile(stdValues, 0.75);

  return baseRows.map((row) => {
    const category = classifyTeamRegularity(row, medianStd, highStd);

    return {
      ...row,
      Category: category,
      Tooltip: formatRegularityTooltip(row, category)
    };
  });
}

function classifyTeamRegularity(row, medianStd, highStd) {
  if (row.Seasons < 5) {
    return "Episódico";
  }

  if (row.AvgPosition <= 5 && row.PositionStdDev <= medianStd) {
    return "Dominante regular";
  }

  if (row.AvgPosition <= 7) {
    return "Dominante con altibajos";
  }

  if (row.AvgPosition <= 10 && row.PositionStdDev <= medianStd) {
    return "Regular competitivo";
  }

  if (row.PositionStdDev >= highStd) {
    return "Irregular";
  }

  return "Zona media estable";
}

function getRegularityLabels(rows, labelCount) {
  if (labelCount <= 0) {
    return [];
  }

  return rows
    .slice()
    .sort((a, b) => {
      return (
        b.ChampionCount - a.ChampionCount ||
        b.Top3Count - a.Top3Count ||
        b.Top5Count - a.Top5Count ||
        b.Seasons - a.Seasons ||
        a.AvgPosition - b.AvgPosition
      );
    })
    .slice(0, labelCount);
}

function formatRegularityTooltip(row, category) {
  const avgPerformance = Number.isFinite(row.AvgPerformance)
    ? `${(row.AvgPerformance * 100).toFixed(1)}%`
    : "Sin dato";

  const avgPoints = Number.isFinite(row.AvgPoints)
    ? row.AvgPoints.toFixed(1)
    : "Sin dato";

  return [
    `Equipo: ${row.Team}`,
    `Categoría: ${category}`,
    `Temporadas disputadas: ${row.Seasons}`,
    `Periodo: ${row.FirstSeason} → ${row.LastSeason}`,
    `Posición media: ${row.AvgPosition.toFixed(2)}.ª`,
    `Variabilidad de posición: ${row.PositionStdDev.toFixed(2)}`,
    `Performance media: ${avgPerformance}`,
    `Puntos medios: ${avgPoints}`,
    `Títulos: ${row.ChampionCount}`,
    `Temporadas en top 3: ${row.Top3Count}`,
    `Temporadas en top 5: ${row.Top5Count}`
  ].join("\n");
}

function mean(values) {
  const validValues = values.filter(Number.isFinite);

  if (validValues.length === 0) {
    return NaN;
  }

  return validValues.reduce((sum, value) => sum + value, 0) / validValues.length;
}

function standardDeviation(values) {
  const validValues = values.filter(Number.isFinite);

  if (validValues.length <= 1) {
    return 0;
  }

  const avg = mean(validValues);

  const variance =
    validValues.reduce((sum, value) => {
      return sum + Math.pow(value - avg, 2);
    }, 0) / validValues.length;

  return Math.sqrt(variance);
}

function median(values) {
  return quantile(values, 0.5);
}

function quantile(values, q) {
  const validValues = values
    .filter(Number.isFinite)
    .slice()
    .sort((a, b) => a - b);

  if (validValues.length === 0) {
    return NaN;
  }

  const position = (validValues.length - 1) * q;
  const base = Math.floor(position);
  const rest = position - base;

  if (validValues[base + 1] !== undefined) {
    return validValues[base] + rest * (validValues[base + 1] - validValues[base]);
  }

  return validValues[base];
}
