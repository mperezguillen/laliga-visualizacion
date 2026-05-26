import {
  loadLaligaData,
  transformMatrixToMatches,
  validateMatrixTransformation,
  aggregateHeadToHead,
  aggregateRivalryByDecade,
  buildCumulativeBalance
} from "./data-processing.js";
import {
  renderBumpChart,
  renderDominanceHeatmap,
  renderSuccessConcentrationChart,
  renderHistoricalChangesChart,
  renderRegularityScatterChart,
  renderRivalryDecadeChart,
  renderCumulativeBalanceChart
} from "./charts.js";

const state = {
  data: [],
  matches: [],
  selectedTeams: [],
  selectedMetric: "Position",
  startYear: null,
  endYear: null,
  dominanceMetric: "top3Share",
  dominanceTopN: 12,
  successMetric: "uniqueChampions",
  changeType: "recoveries",
  changeMetric: "Performance",
  changeTopN: 10,
  regularityMinSeasons: 10,
  regularityLabelCount: 12,
  rivalryTeamA: null,
  rivalryTeamB: null
};

init();

async function init() {
  try {
    const data = await loadLaligaData("./data/laliga.csv");
    const matches = transformMatrixToMatches(data);

    state.data = data;
    state.matches = matches;
    state.selectedTeams = getDefaultTeams(data);

    const years = getAvailableYears(data);
    state.startYear = years[0];
    state.endYear = years[years.length - 1];

    console.log("Datos de LaLiga cargados:", data);
    console.table(data.slice(0, 10));

    console.log("Partidos transformados desde matriz:", matches);
    console.table(matches.slice(0, 20));

    const matrixValidation = validateMatrixTransformation(data, matches);
    console.log("Validación de matriz por temporada:");
    console.table(matrixValidation);

    const realMadrid = findTeamByAlias(data, "Real Madrid");
    const barcelona = findTeamByAlias(data, "Barcelona");

    if (realMadrid && barcelona) {
      const madridBarca = aggregateHeadToHead(
        matches,
        realMadrid,
        barcelona
      );

      console.log(`Resumen ${realMadrid} vs ${barcelona}:`);
      console.log(madridBarca);

      console.log("Por décadas:");
      console.table(
        aggregateRivalryByDecade(matches, realMadrid, barcelona)
      );

      console.log("Balance acumulado:");
      console.table(
        buildCumulativeBalance(matches, realMadrid, barcelona).slice(-20)
      );

      const examples = matches.filter((d) =>
        d.Season === "1928-29" &&
        (
          (d.teamA === realMadrid && d.teamB === barcelona) ||
          (d.teamA === barcelona && d.teamB === realMadrid)
        )
      );

      console.log(`Ejemplo concreto ${realMadrid} vs ${barcelona} en 1928-29:`);
      console.table(examples);
    } else {
      console.warn("No se han encontrado Real Madrid y/o Barcelona en el dataset.");
    }

    setupTeamSelector(data);
    setupMetricSelector();
    setupSeasonSelectors(data);
    setupQuickCompareButtons(data);
    setupDominanceControls();
    setupSuccessControls();
    setupChangesControls();
    setupRegularityControls();
    setupRivalryControls(data);
    updateStatus();

    render();

    window.addEventListener("resize", debounce(render, 150));
  } catch (error) {
    console.error(error);

    const status = document.querySelector("#chart-status");
    const chart = document.querySelector("#bump-chart");

    if (status) {
      status.textContent = "Error al cargar el CSV.";
    }

    if (chart) {
      chart.innerHTML = `
        <p class="muted">
          No se ha podido cargar el archivo <code>data/laliga.csv</code>.
          Revisa que el fichero existe y que estás ejecutando la web desde un servidor local.
        </p>
      `;
    }
  }
}

function setupTeamSelector(data) {
  const selector = document.querySelector("#team-select");

  if (!selector) {
    return;
  }

  const teams = getTeams(data);

  selector.innerHTML = "";

  for (const team of teams) {
    const option = document.createElement("option");
    option.value = team;
    option.textContent = team;
    option.selected = state.selectedTeams.includes(team);
    selector.append(option);
  }

  selector.addEventListener("change", () => {
    state.selectedTeams = Array.from(selector.selectedOptions).map(
      (option) => option.value
    );

    render();
  });
}

function setupMetricSelector() {
  const selector = document.querySelector("#metric-select");

  if (!selector) {
    return;
  }

  selector.value = state.selectedMetric;

  selector.addEventListener("change", () => {
    state.selectedMetric = selector.value;
    render();
  });
}

function setupSeasonSelectors(data) {
  const startSelector = document.querySelector("#start-season");
  const endSelector = document.querySelector("#end-season");

  if (!startSelector || !endSelector) {
    return;
  }

  const years = getAvailableYears(data);

  startSelector.innerHTML = "";
  endSelector.innerHTML = "";

  for (const year of years) {
    const startOption = document.createElement("option");
    startOption.value = year;
    startOption.textContent = year;

    const endOption = document.createElement("option");
    endOption.value = year;
    endOption.textContent = year;

    startSelector.append(startOption);
    endSelector.append(endOption);
  }

  startSelector.value = state.startYear;
  endSelector.value = state.endYear;

  startSelector.addEventListener("change", () => {
    state.startYear = Number(startSelector.value);

    if (state.startYear > state.endYear) {
      state.endYear = state.startYear;
      endSelector.value = state.endYear;
    }

    render();
  });

  endSelector.addEventListener("change", () => {
    state.endYear = Number(endSelector.value);

    if (state.endYear < state.startYear) {
      state.startYear = state.endYear;
      startSelector.value = state.startYear;
    }

    render();
  });
}

function setupQuickCompareButtons(data) {
  const buttons = document.querySelectorAll(".quick-compare");
  const resetButton = document.querySelector("#reset-selection");

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      const aliases = button.dataset.teams.split("|");

      state.selectedTeams = aliases
        .map((alias) => findTeamByAlias(data, alias))
        .filter(Boolean);

      state.selectedTeams = Array.from(new Set(state.selectedTeams));

      syncTeamSelector();
      render();
    });
  });

  if (resetButton) {
    resetButton.addEventListener("click", () => {
      state.selectedTeams = getDefaultTeams(data);
      syncTeamSelector();
      render();
    });
  }
}

function setupDominanceControls() {
  const metricSelector = document.querySelector("#dominance-metric-select");
  const teamCountSelector = document.querySelector("#dominance-team-count");

  if (metricSelector) {
    metricSelector.value = state.dominanceMetric;

    metricSelector.addEventListener("change", () => {
      state.dominanceMetric = metricSelector.value;
      render();
    });
  }

  if (teamCountSelector) {
    teamCountSelector.value = String(state.dominanceTopN);

    teamCountSelector.addEventListener("change", () => {
      state.dominanceTopN = Number(teamCountSelector.value);
      render();
    });
  }
}

function updateDominanceStatus(summary) {
  const status = document.querySelector("#dominance-status");

  if (!status || !summary) {
    return;
  }

  status.textContent =
    `${summary.teams} equipos · ` +
    `${summary.decades} décadas · ` +
    `${summary.metricLabel}`;
}

function setupSuccessControls() {
  const metricSelector = document.querySelector("#success-metric-select");

  if (!metricSelector) {
    return;
  }

  metricSelector.value = state.successMetric;

  metricSelector.addEventListener("change", () => {
    state.successMetric = metricSelector.value;
    render();
  });
}

function setupChangesControls() {
  const changeTypeSelector = document.querySelector("#change-type-select");
  const changeMetricSelector = document.querySelector("#change-metric-select");
  const changeCountSelector = document.querySelector("#change-count-select");

  if (changeTypeSelector) {
    changeTypeSelector.value = state.changeType;

    changeTypeSelector.addEventListener("change", () => {
      state.changeType = changeTypeSelector.value;
      render();
    });
  }

  if (changeMetricSelector) {
    changeMetricSelector.value = state.changeMetric;

    changeMetricSelector.addEventListener("change", () => {
      state.changeMetric = changeMetricSelector.value;
      render();
    });
  }

  if (changeCountSelector) {
    changeCountSelector.value = String(state.changeTopN);

    changeCountSelector.addEventListener("change", () => {
      state.changeTopN = Number(changeCountSelector.value);
      render();
    });
  }
}

function setupRegularityControls() {
  const minSeasonsSelector = document.querySelector("#regularity-min-seasons");
  const labelCountSelector = document.querySelector("#regularity-label-count");

  if (minSeasonsSelector) {
    minSeasonsSelector.value = String(state.regularityMinSeasons);

    minSeasonsSelector.addEventListener("change", () => {
      state.regularityMinSeasons = Number(minSeasonsSelector.value);
      render();
    });
  }

  if (labelCountSelector) {
    labelCountSelector.value = String(state.regularityLabelCount);

    labelCountSelector.addEventListener("change", () => {
      state.regularityLabelCount = Number(labelCountSelector.value);
      render();
    });
  }
}

function updateRegularityStatus(summary) {
  const status = document.querySelector("#regularity-status");

  if (!status || !summary) {
    return;
  }

  status.textContent =
    `${summary.teams} equipos · ` +
    `mínimo ${summary.minSeasons} temporada(s) · ` +
    `${summary.labelCount} etiquetas`;
}

function updateChangesStatus(summary) {
  const status = document.querySelector("#changes-status");
  const description = document.querySelector("#change-metric-description");

  if (status && summary) {
    status.textContent =
      `${summary.cases} casos · ` +
      `${summary.changeTypeLabel} · ` +
      `${summary.metricLabel}`;
  }

  if (description && summary) {
    description.textContent = summary.description;
  }
}

function getFilteredData() {
  return state.data.filter((d) => {
    return (
      Number.isFinite(d.SeasonStart) &&
      d.SeasonStart >= state.startYear &&
      d.SeasonStart <= state.endYear
    );
  });
}

function updateSuccessStatus(summary) {
  const status = document.querySelector("#success-status");
  const description = document.querySelector("#success-metric-description");

  if (status && summary) {
    status.textContent =
      `${summary.decades} décadas · ${summary.metricLabel}`;
  }

  if (description && summary) {
    description.textContent = summary.description;
  }
}

function render() {
  const filteredData = getFilteredData();

  renderBumpChart(filteredData, {
    container: "#bump-chart",
    selectedTeams: state.selectedTeams,
    metric: state.selectedMetric
  });

  const dominanceSummary = renderDominanceHeatmap(state.data, {
    container: "#dominance-heatmap",
    metric: state.dominanceMetric,
    topN: state.dominanceTopN
  });

  const successSummary = renderSuccessConcentrationChart(state.data, {
    container: "#success-concentration-chart",
    metric: state.successMetric
  });

  const changesSummary = renderHistoricalChangesChart(state.data, {
    container: "#historical-changes-chart",
    metric: state.changeMetric,
    changeType: state.changeType,
    topN: state.changeTopN
  });

  const regularitySummary = renderRegularityScatterChart(state.data, {
    container: "#regularity-scatter-chart",
    minSeasons: state.regularityMinSeasons,
    labelCount: state.regularityLabelCount
  });

  updateStatus(filteredData);
  updateDominanceStatus(dominanceSummary);
  updateSuccessStatus(successSummary);
  updateChangesStatus(changesSummary);
  updateRegularityStatus(regularitySummary);
  renderRivalrySection();
}

function updateStatus(data = state.data) {
  const status = document.querySelector("#chart-status");

  if (!status) {
    return;
  }

  const seasons = Array.from(new Set(data.map((d) => d.Season)));
  const teams = Array.from(new Set(data.map((d) => d.Team)));

  status.textContent =
    `${data.length} registros · ` +
    `${seasons.length} temporadas · ` +
    `${teams.length} equipos · ` +
    `${state.selectedTeams.length} seleccionado(s)`;
}

function syncTeamSelector() {
  const selector = document.querySelector("#team-select");

  if (!selector) {
    return;
  }

  for (const option of selector.options) {
    option.selected = state.selectedTeams.includes(option.value);
  }
}

function getDefaultTeams(data) {
  const preferredNames = [
    "Real Madrid",
    "Barcelona",
    "Atlético Madrid",
    "Athletic Club",
    "Valencia",
    "Sevilla"
  ];

  return preferredNames
    .map((name) => findTeamByAlias(data, name))
    .filter(Boolean)
    .filter((team, index, array) => array.indexOf(team) === index)
    .slice(0, 5);
}

function findTeamByAlias(data, alias) {
  const teams = getTeams(data);
  const normalizedAlias = normalizeText(alias);

  let match = teams.find((team) => normalizeText(team) === normalizedAlias);

  if (match) {
    return match;
  }

  match = teams.find((team) =>
    normalizeText(team).includes(normalizedAlias)
  );

  if (match) {
    return match;
  }

  match = teams.find((team) =>
    normalizedAlias.includes(normalizeText(team))
  );

  return match ?? null;
}

function getTeams(data) {
  return Array.from(new Set(data.map((d) => d.Team))).sort((a, b) =>
    a.localeCompare(b, "es")
  );
}

function getAvailableYears(data) {
  return Array.from(new Set(data.map((d) => d.SeasonStart)))
    .filter(Number.isFinite)
    .sort((a, b) => a - b);
}

function normalizeText(text) {
  return String(text)
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

function debounce(callback, delay) {
  let timeoutId;

  return (...args) => {
    clearTimeout(timeoutId);

    timeoutId = setTimeout(() => {
      callback(...args);
    }, delay);
  };
}

function setupRivalryControls(data) {
  const teamASelector = document.querySelector("#rivalry-team-a");
  const teamBSelector = document.querySelector("#rivalry-team-b");
  const presetButtons = document.querySelectorAll(".rivalry-preset");

  if (!teamASelector || !teamBSelector) {
    return;
  }

  const teams = getTeams(data);

  teamASelector.innerHTML = "";
  teamBSelector.innerHTML = "";

  for (const team of teams) {
    const optionA = document.createElement("option");
    optionA.value = team;
    optionA.textContent = team;

    const optionB = document.createElement("option");
    optionB.value = team;
    optionB.textContent = team;

    teamASelector.append(optionA);
    teamBSelector.append(optionB);
  }

  const defaultTeamA =
    findTeamByAlias(data, "Real Madrid") ??
    teams[0] ??
    null;

  const defaultTeamB =
    findTeamByAlias(data, "Barcelona") ??
    teams.find((team) => team !== defaultTeamA) ??
    null;

  state.rivalryTeamA = defaultTeamA;
  state.rivalryTeamB = defaultTeamB;

  syncRivalrySelectors();

  teamASelector.addEventListener("change", () => {
    const selectedTeam = teamASelector.value;

    if (selectedTeam === state.rivalryTeamB) {
      state.rivalryTeamB = teams.find((team) => team !== selectedTeam) ?? null;
    }

    state.rivalryTeamA = selectedTeam;
    syncRivalrySelectors();
    render();
  });

  teamBSelector.addEventListener("change", () => {
    const selectedTeam = teamBSelector.value;

    if (selectedTeam === state.rivalryTeamA) {
      state.rivalryTeamA = teams.find((team) => team !== selectedTeam) ?? null;
    }

    state.rivalryTeamB = selectedTeam;
    syncRivalrySelectors();
    render();
  });

  presetButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const [teamAAlias, teamBAlias] = button.dataset.teams.split("|");

      const teamA = findTeamByAlias(data, teamAAlias);
      const teamB = findTeamByAlias(data, teamBAlias);

      if (!teamA || !teamB || teamA === teamB) {
        const message = document.querySelector("#rivalry-message");

        if (message) {
          message.textContent =
            "No se ha podido encontrar esa rivalidad en el dataset.";
        }

        return;
      }

      state.rivalryTeamA = teamA;
      state.rivalryTeamB = teamB;

      syncRivalrySelectors();
      render();
    });
  });
}

function syncRivalrySelectors() {
  const teamASelector = document.querySelector("#rivalry-team-a");
  const teamBSelector = document.querySelector("#rivalry-team-b");

  if (teamASelector && state.rivalryTeamA) {
    teamASelector.value = state.rivalryTeamA;
  }

  if (teamBSelector && state.rivalryTeamB) {
    teamBSelector.value = state.rivalryTeamB;
  }
}

function renderRivalrySection() {
  const title = document.querySelector("#rivalry-title");
  const status = document.querySelector("#rivalry-status");
  const message = document.querySelector("#rivalry-message");
  const summaryContainer = document.querySelector("#rivalry-summary");

  if (
    !title ||
    !status ||
    !summaryContainer ||
    !state.rivalryTeamA ||
    !state.rivalryTeamB
  ) {
    return;
  }

  if (state.rivalryTeamA === state.rivalryTeamB) {
    title.textContent = "Selecciona dos equipos distintos";
    status.textContent = "Rivalidad no válida";
    summaryContainer.innerHTML = "";

    if (message) {
      message.textContent = "El Equipo A y el Equipo B no pueden ser el mismo.";
    }

    return;
  }

  const summary = aggregateHeadToHead(
    state.matches,
    state.rivalryTeamA,
    state.rivalryTeamB
  );

  const decadeRows = aggregateRivalryByDecade(
    state.matches,
    state.rivalryTeamA,
    state.rivalryTeamB
  );

  const cumulativeRows = buildCumulativeBalance(
    state.matches,
    state.rivalryTeamA,
    state.rivalryTeamB
  );

  title.textContent = `${state.rivalryTeamA} vs ${state.rivalryTeamB}`;

  status.textContent =
    `${summary.totalMatches} enfrentamientos · ` +
    `${decadeRows.length} década(s)`;

  if (message) {
    message.textContent =
      summary.totalMatches < 10
        ? "Hay pocos enfrentamientos para esta pareja; interpreta el resultado con cautela."
        : "";
  }

  renderRivalrySummaryCards(summary);

  renderRivalryDecadeChart(decadeRows, {
    container: "#rivalry-decade-chart",
    teamA: state.rivalryTeamA,
    teamB: state.rivalryTeamB
  });

  renderCumulativeBalanceChart(cumulativeRows, {
    container: "#rivalry-balance-chart",
    teamA: state.rivalryTeamA,
    teamB: state.rivalryTeamB
  });

  console.log(`Rivalidad ${state.rivalryTeamA} vs ${state.rivalryTeamB}`);
  console.log("Resumen:", summary);
  console.log("Agregado por década:");
  console.table(decadeRows);
  console.log("Balance acumulado:");
  console.table(cumulativeRows);
}

function renderRivalrySummaryCards(summary) {
  const container = document.querySelector("#rivalry-summary");

  if (!container) {
    return;
  }

  const bestDecadeForTeamA = formatBestDecadeLabel(
    summary.bestDecadeForTeamA,
    summary.teamA
  );

  const bestDecadeForTeamB = formatBestDecadeLabel(
    summary.bestDecadeForTeamB,
    summary.teamB
  );

  container.innerHTML = `
    <article class="summary-card">
      <p class="summary-card__label">Enfrentamientos</p>
      <p class="summary-card__value">${summary.totalMatches}</p>
      <p class="summary-card__note">Partidos encontrados en la matriz.</p>
    </article>

    <article class="summary-card">
      <p class="summary-card__label">Victorias ${summary.teamA}</p>
      <p class="summary-card__value">${summary.winsTeamA}</p>
      <p class="summary-card__note">${summary.pointsTeamA} puntos directos.</p>
    </article>

    <article class="summary-card">
      <p class="summary-card__label">Empates</p>
      <p class="summary-card__value">${summary.draws}</p>
      <p class="summary-card__note">Partidos sin ganador.</p>
    </article>

    <article class="summary-card">
      <p class="summary-card__label">Victorias ${summary.teamB}</p>
      <p class="summary-card__value">${summary.winsTeamB}</p>
      <p class="summary-card__note">${summary.pointsTeamB} puntos directos.</p>
    </article>

    <article class="summary-card">
      <p class="summary-card__label">Goles ${summary.teamA}</p>
      <p class="summary-card__value">${summary.goalsTeamA}</p>
      <p class="summary-card__note">Marcados en enfrentamientos directos.</p>
    </article>

    <article class="summary-card">
      <p class="summary-card__label">Goles ${summary.teamB}</p>
      <p class="summary-card__value">${summary.goalsTeamB}</p>
      <p class="summary-card__note">Marcados en enfrentamientos directos.</p>
    </article>

    <article class="summary-card">
      <p class="summary-card__label">Diferencia de goles</p>
      <p class="summary-card__value">${formatSignedNumber(summary.goalDiffTeamA)}</p>
      <p class="summary-card__note">Desde la perspectiva de ${summary.teamA}.</p>
    </article>

    <article class="summary-card">
      <p class="summary-card__label">Décadas favorables</p>
      <p class="summary-card__value">${bestDecadeForTeamA}</p>
      <p class="summary-card__note">${bestDecadeForTeamB}</p>
    </article>
  `;
}

function formatBestDecadeLabel(row, team) {
  if (!row) {
    return "Sin dato";
  }

  return `${team}: ${row.decade}s`;
}

function formatSignedNumber(value) {
  if (!Number.isFinite(value)) {
    return "Sin dato";
  }

  if (value > 0) {
    return `+${value}`;
  }

  return String(value);
}
