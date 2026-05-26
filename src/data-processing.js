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

  const sNo = toNumber(getFirstAvailableValue(row, [
    "S. No.",
    "S.No.",
    "S No",
    "SNo",
    "No"
  ]));

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

    SNo: sNo,
    Team: team,

    Position: position,
    Played: played,
    Won: won,
    Draw: draw,
    Lost: lost,
    Points: points,
    WinRate: winRate,
    LossRate: lossRate,
    Performance: performance,

    MatrixResults: getMatrixResults(row)
  };
}

export function transformMatrixToMatches(data, options = {}) {
  const { deduplicateMirroredFixtures = false } = options;

  const matches = [];
  const seenMatchIds = new Set();
  const seenSeasonPairs = new Set();

  const rowsBySeason = groupBy(data, (row) => row.Season);

  for (const [season, seasonRows] of rowsBySeason.entries()) {
    const teamsBySNo = new Map();

    for (const row of seasonRows) {
      if (Number.isFinite(row.SNo) && row.Team) {
        teamsBySNo.set(String(row.SNo), row.Team);
      }
    }

    for (const row of seasonRows) {
      if (!row.Team || !Number.isFinite(row.SNo)) {
        continue;
      }

      const matrixResults = row.MatrixResults ?? {};

      for (const [rivalSNoKey, rawScore] of Object.entries(matrixResults)) {
        const rivalSNo = Number(rivalSNoKey);

        if (!Number.isFinite(rivalSNo) || rivalSNo === row.SNo) {
          continue;
        }

        const rivalTeam = teamsBySNo.get(String(rivalSNo));

        if (!rivalTeam) {
          continue;
        }

        const parsedScore = parseScore(rawScore);

        if (!parsedScore) {
          continue;
        }

        const matchId = makeMatchId(season, row.SNo, rivalSNo);

        if (seenMatchIds.has(matchId)) {
          continue;
        }

        const pairId = makePairId(row.Team, rivalTeam);
        const seasonPairId = `${season}__${pairId}`;
        const isDuplicate = seenSeasonPairs.has(seasonPairId);

        if (deduplicateMirroredFixtures && isDuplicate) {
          continue;
        }

        seenMatchIds.add(matchId);
        seenSeasonPairs.add(seasonPairId);

        const resultForTeamA = getResult(parsedScore.goalsA, parsedScore.goalsB);
        const resultForTeamB = invertResult(resultForTeamA);

        matches.push({
          Season: row.Season,
          seasonStartYear: row.SeasonStart,
          decade: row.Decade,

          teamA: row.Team,
          teamB: rivalTeam,

          homeTeam: row.Team,
          awayTeam: rivalTeam,

          goalsA: parsedScore.goalsA,
          goalsB: parsedScore.goalsB,

          resultForTeamA,
          resultForTeamB,

          pointsForTeamA: getPoints(resultForTeamA),
          pointsForTeamB: getPoints(resultForTeamB),

          goalDiffForTeamA: parsedScore.goalsA - parsedScore.goalsB,
          goalDiffForTeamB: parsedScore.goalsB - parsedScore.goalsA,

          matchId,
          pairId,

          samePairAlreadySeenThisSeason: isDuplicate,
          sourceRow: row.SNo,
          sourceColumn: rivalSNo,
          rawScore
        });
      }
    }
  }

  return matches.sort((a, b) => {
    if (a.seasonStartYear !== b.seasonStartYear) {
      return a.seasonStartYear - b.seasonStartYear;
    }

    return a.matchId.localeCompare(b.matchId, "es");
  });
}

export function aggregateHeadToHead(matches, teamA, teamB) {
  const selectedMatches = getHeadToHeadMatches(matches, teamA, teamB);

  const summary = {
    teamA,
    teamB,
    totalMatches: selectedMatches.length,
    winsTeamA: 0,
    draws: 0,
    winsTeamB: 0,
    goalsTeamA: 0,
    goalsTeamB: 0,
    goalDiffTeamA: 0,
    pointsTeamA: 0,
    pointsTeamB: 0,
    matches: selectedMatches
  };

  for (const match of selectedMatches) {
    const view = orientMatch(match, teamA, teamB);

    summary.goalsTeamA += view.goalsTeamA;
    summary.goalsTeamB += view.goalsTeamB;
    summary.goalDiffTeamA += view.goalsTeamA - view.goalsTeamB;
    summary.pointsTeamA += view.pointsTeamA;
    summary.pointsTeamB += view.pointsTeamB;

    if (view.resultForTeamA === "win") {
      summary.winsTeamA += 1;
    } else if (view.resultForTeamA === "loss") {
      summary.winsTeamB += 1;
    } else {
      summary.draws += 1;
    }
  }

  const decadeRows = aggregateRivalryByDecade(matches, teamA, teamB);

  summary.bestDecadeForTeamA = getBestDecade(decadeRows, "teamA");
  summary.bestDecadeForTeamB = getBestDecade(decadeRows, "teamB");

  return summary;
}

export function aggregateRivalryByDecade(matches, teamA, teamB) {
  const selectedMatches = getHeadToHeadMatches(matches, teamA, teamB);
  const groups = new Map();

  for (const match of selectedMatches) {
    if (!Number.isFinite(match.decade)) {
      continue;
    }

    if (!groups.has(match.decade)) {
      groups.set(match.decade, {
        decade: match.decade,
        decadeLabel: `${match.decade}s`,
        teamA,
        teamB,
        matches: 0,
        winsTeamA: 0,
        draws: 0,
        winsTeamB: 0,
        goalsTeamA: 0,
        goalsTeamB: 0,
        balanceTeamA: 0
      });
    }

    const group = groups.get(match.decade);
    const view = orientMatch(match, teamA, teamB);

    group.matches += 1;
    group.goalsTeamA += view.goalsTeamA;
    group.goalsTeamB += view.goalsTeamB;

    if (view.resultForTeamA === "win") {
      group.winsTeamA += 1;
      group.balanceTeamA += 1;
    } else if (view.resultForTeamA === "loss") {
      group.winsTeamB += 1;
      group.balanceTeamA -= 1;
    } else {
      group.draws += 1;
    }
  }

  return Array.from(groups.values()).sort((a, b) => a.decade - b.decade);
}

export function buildCumulativeBalance(matches, teamA, teamB) {
  let balance = 0;

  return getHeadToHeadMatches(matches, teamA, teamB)
    .map((match) => {
      const view = orientMatch(match, teamA, teamB);

      if (view.resultForTeamA === "win") {
        balance += 1;
      } else if (view.resultForTeamA === "loss") {
        balance -= 1;
      }

      return {
        ...view,
        cumulativeBalance: balance
      };
    });
}

export function validateMatrixTransformation(data, matches) {
  const dataBySeason = groupBy(data, (row) => row.Season);
  const matchesBySeason = groupBy(matches, (match) => match.Season);

  return Array.from(dataBySeason.entries())
    .sort((a, b) => parseSeasonStart(a[0]) - parseSeasonStart(b[0]))
    .map(([season, seasonRows]) => {
      const matrixCells = seasonRows.reduce((sum, row) => {
        return sum + Object.keys(row.MatrixResults ?? {}).length;
      }, 0);

      const transformedMatches = matchesBySeason.get(season)?.length ?? 0;

      const expectedMatchesFromTable =
        seasonRows.reduce((sum, row) => {
          return Number.isFinite(row.Played) ? sum + row.Played : sum;
        }, 0) / 2;

      const status =
        Math.abs(transformedMatches - expectedMatchesFromTable) < 0.001
          ? "OK: matriz compatible con partidos reales"
          : "Revisar: número de partidos no cuadra con Played";

      return {
        Season: season,
        teams: seasonRows.length,
        matrixCells,
        transformedMatches,
        expectedMatchesFromTable,
        status
      };
    });
}

function getMatrixResults(row) {
  const matrixResults = {};

  for (const [columnName, value] of Object.entries(row)) {
    const key = String(columnName).trim();

    if (!/^\d+$/.test(key)) {
      continue;
    }

    const rawValue =
      value === undefined || value === null
        ? ""
        : String(value).trim();

    if (!parseScore(rawValue)) {
      continue;
    }

    matrixResults[key] = rawValue;
  }

  return matrixResults;
}

function getHeadToHeadMatches(matches, teamA, teamB) {
  return matches
    .filter((match) => {
      return (
        (match.teamA === teamA && match.teamB === teamB) ||
        (match.teamA === teamB && match.teamB === teamA)
      );
    })
    .sort((a, b) => {
      if (a.seasonStartYear !== b.seasonStartYear) {
        return a.seasonStartYear - b.seasonStartYear;
      }

      return a.matchId.localeCompare(b.matchId, "es");
    });
}

function orientMatch(match, teamA, teamB) {
  const isAlreadyOriented = match.teamA === teamA && match.teamB === teamB;

  const goalsTeamA = isAlreadyOriented ? match.goalsA : match.goalsB;
  const goalsTeamB = isAlreadyOriented ? match.goalsB : match.goalsA;

  const resultForTeamA = getResult(goalsTeamA, goalsTeamB);
  const resultForTeamB = invertResult(resultForTeamA);

  return {
    Season: match.Season,
    seasonStartYear: match.seasonStartYear,
    decade: match.decade,

    teamA,
    teamB,

    goalsTeamA,
    goalsTeamB,

    resultForTeamA,
    resultForTeamB,

    pointsTeamA: getPoints(resultForTeamA),
    pointsTeamB: getPoints(resultForTeamB),

    goalDiffTeamA: goalsTeamA - goalsTeamB,

    originalTeamA: match.teamA,
    originalTeamB: match.teamB,
    matchId: match.matchId,
    rawScore: match.rawScore
  };
}

function parseScore(value) {
  if (value === undefined || value === null) {
    return null;
  }

  const cleanValue = String(value)
    .trim()
    .replace(/[–—]/g, "-");

  const match = cleanValue.match(/^(\d+)\s*-\s*(\d+)$/);

  if (!match) {
    return null;
  }

  return {
    goalsA: Number(match[1]),
    goalsB: Number(match[2])
  };
}

function getResult(goalsFor, goalsAgainst) {
  if (goalsFor > goalsAgainst) {
    return "win";
  }

  if (goalsFor < goalsAgainst) {
    return "loss";
  }

  return "draw";
}

function invertResult(result) {
  if (result === "win") {
    return "loss";
  }

  if (result === "loss") {
    return "win";
  }

  return "draw";
}

function getPoints(result) {
  if (result === "win") {
    return 3;
  }

  if (result === "draw") {
    return 1;
  }

  return 0;
}

function getBestDecade(rows, side) {
  if (rows.length === 0) {
    return null;
  }

  return rows
    .slice()
    .sort((a, b) => {
      const valueA = side === "teamA" ? a.balanceTeamA : -a.balanceTeamA;
      const valueB = side === "teamA" ? b.balanceTeamA : -b.balanceTeamA;

      return valueB - valueA || b.matches - a.matches || a.decade - b.decade;
    })[0];
}

function makeMatchId(season, teamASNo, teamBSNo) {
  return `${season}__${teamASNo}_vs_${teamBSNo}`.replace(/\s+/g, "_");
}

function makePairId(teamA, teamB) {
  return [normalizeKey(teamA), normalizeKey(teamB)]
    .sort((a, b) => a.localeCompare(b, "es"))
    .join("__");
}

function normalizeKey(value) {
  return String(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function groupBy(values, keyGetter) {
  const groups = new Map();

  for (const value of values) {
    const key = keyGetter(value);

    if (!groups.has(key)) {
      groups.set(key, []);
    }

    groups.get(key).push(value);
  }

  return groups;
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