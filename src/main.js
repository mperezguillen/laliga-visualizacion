import { loadLaligaData } from "./data-processing.js";
import { renderBumpChart } from "./charts.js";

const state = {
  data: [],
  selectedTeams: []
};

init();

async function init() {
  try {
    const data = await loadLaligaData("./data/laliga.csv");

    state.data = data;
    state.selectedTeams = getDefaultTeams(data);

    console.log("Datos de LaLiga cargados:", data);
    console.table(data.slice(0, 10));

    setupTeamSelector(data);
    updateStatus(data);
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

  const teams = Array.from(new Set(data.map((d) => d.Team))).sort((a, b) =>
    a.localeCompare(b, "es")
  );

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

function render() {
  renderBumpChart(state.data, {
    container: "#bump-chart",
    selectedTeams: state.selectedTeams
  });

  const status = document.querySelector("#chart-status");

  if (status) {
    status.textContent = `${state.selectedTeams.length} equipo(s) seleccionado(s)`;
  }
}

function updateStatus(data) {
  const status = document.querySelector("#chart-status");

  if (!status) {
    return;
  }

  const seasons = Array.from(new Set(data.map((d) => d.Season)));
  const teams = Array.from(new Set(data.map((d) => d.Team)));

  status.textContent = `${data.length} registros · ${seasons.length} temporadas · ${teams.length} equipos`;
}

function getDefaultTeams(data) {
  const teams = Array.from(new Set(data.map((d) => d.Team)));

  const preferredNames = [
    "Real Madrid",
    "FC Barcelona",
    "Barcelona",
    "Atlético Madrid",
    "Atletico Madrid",
    "Athletic Club",
    "Valencia",
    "Sevilla"
  ];

  const selected = [];

  for (const preferred of preferredNames) {
    const match = teams.find((team) =>
      normalizeText(team).includes(normalizeText(preferred))
    );

    if (match && !selected.includes(match)) {
      selected.push(match);
    }
  }

  return selected.slice(0, 5);
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
