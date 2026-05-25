import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

export async function loadLaligaData(csvPath) {
  const rows = await d3.csv(csvPath, normalizeRow);

  return rows
    .filter((d) => d.Season && d.Team && Number.isFinite(d.Position))
    .sort((a, b) => {
      if (a.SeasonStart !== b.SeasonStart) {
        return a.SeasonStart - b.SeasonStart;
      }

      return a.Position - b.Position;
    });
}

function normalizeRow(row) {
  const season = getFirstAvailableValue(row, ["Season", "Temporada"]);

  const team = getFirstAvailableValue(row, [
    "Home \\ Away",
    "Home / Away",
    "Home Away",
    "Team",
    "Club",
    "Equipo"
  ]);

  const played = toNumber(getFirstAvailableValue(row, ["Played", "PJ"]));
  const won = toNumber(getFirstAvailableValue(row, ["Won", "W", "Victorias"]));
  const draw = toNumber(getFirstAvailableValue(row, ["Draw", "D", "Empates"]));
  const lost = toNumber(getFirstAvailableValue(row, ["Lost", "L", "Derrotas"]));

  const pointsFromCsv = toNumber(getFirstAvailableValue(row, ["Points", "Pts"]));
  const points = Number.isFinite(pointsFromCsv)
    ? pointsFromCsv
    : won * 3 + draw;

  const position = toNumber(getFirstAvailableValue(row, ["Position", "Posición"]));

  const winRate = toNumber(getFirstAvailableValue(row, ["WinRate", "Win Rate"]));
  const lossRate = toNumber(getFirstAvailableValue(row, ["LossRate", "Loss Rate"]));

  const performanceFromCsv = toNumber(
    getFirstAvailableValue(row, ["Performance", "Rendimiento"])
  );

  const performance = Number.isFinite(performanceFromCsv)
    ? performanceFromCsv
    : Number.isFinite(points) && Number.isFinite(played) && played > 0
      ? points / (played * 3)
      : NaN;

  const seasonStart = parseSeasonStart(season);

  return {
    Season: season,
    SeasonStart: seasonStart,
    Decade: Number.isFinite(seasonStart)
      ? Math.floor(seasonStart / 10) * 10
      : null,
    Team: team,
    Position: position,
    Played: played,
    Won: won,
    Draw: draw,
    Lost: lost,
    Points: points,
    WinRate: winRate,
    LossRate: lossRate,
    Performance: performance
  };
}

function getFirstAvailableValue(row, possibleNames) {
  for (const name of possibleNames) {
    if (row[name] !== undefined && row[name] !== null && row[name] !== "") {
      return String(row[name]).trim();
    }
  }

  return "";
}

function toNumber(value) {
  if (value === undefined || value === null || value === "") {
    return NaN;
  }

  return Number(String(value).replace(",", "."));
}

function parseSeasonStart(season) {
  if (!season) {
    return NaN;
  }

  const match = String(season).match(/\d{4}|\d{2}/);

  if (!match) {
    return NaN;
  }

  const firstNumber = match[0];

  if (firstNumber.length === 4) {
    return Number(firstNumber);
  }

  return Number(`19${firstNumber}`);
}
