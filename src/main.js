import { loadLaligaData } from "./data-processing.js";
import {
  renderBumpChart,
  renderDominanceHeatmap,
  renderSuccessConcentrationChart
} from "./charts.js";

const state = {
  data: [],
  selectedTeams: [],
  selectedMetric: "Position",
  startYear: null,
  endYear: null,
  dominanceMetric: "top3Share",
  dominanceTopN: 12,
  successMetric: "uniqueChampions"
};

init();

async function init() {
  try {
    const data = await loadLaligaData("./data/laliga.csv");

    state.data = data;
    state.selectedTeams = getDefaultTeams(data);

    const years = getAvailableYears(data);
    state.startYear = years[0];
    state.endYear = years[years.length - 1];

    console.log("Datos de LaLiga cargados:", data);
    console.table(data.slice(0, 10));

    setupTeamSelector(data);
    setupMetricSelector();
    setupSeasonSelectors(data);
    setupQuickCompareButtons(data);
    setupDominanceControls();
    setupSuccessControls();
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
          No se ha podido cargar el archivo <code>data/laliga_clean.csv</code>.
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

  updateStatus(filteredData);
  updateDominanceStatus(dominanceSummary);
  updateSuccessStatus(successSummary);
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
