import * as Plot from "https://cdn.jsdelivr.net/npm/@observablehq/plot@0.6/+esm";

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
