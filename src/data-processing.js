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

export function buildNetworkData(matches, options = {}) {
  const {
    teamStatsData = [],
    decade = "all",
    startYear = null,
    endYear = null,
    minMatches = 40,
    topNTeams = 20,
    minSeasons = 10,
    onlyBalanced = false,
    equilibriumThreshold = 0.55
  } = options;

  const filteredMatches = matches.filter((match) => {
    if (!Number.isFinite(match.seasonStartYear)) {
      return false;
    }

    if (decade !== "all" && match.decade !== Number(decade)) {
      return false;
    }

    if (Number.isFinite(startYear) && match.seasonStartYear < startYear) {
      return false;
    }

    if (Number.isFinite(endYear) && match.seasonStartYear > endYear) {
      return false;
    }

    return true;
  });

  const teamStats = buildTeamNetworkStats(teamStatsData, filteredMatches);

  const candidateTeams = Array.from(teamStats.values())
    .filter((team) => team.seasonsPlayed >= minSeasons)
    .sort((a, b) => {
      return (
        b.seasonsPlayed - a.seasonsPlayed ||
        b.totalMatchesInMatrix - a.totalMatchesInMatrix ||
        b.top3Count - a.top3Count ||
        a.avgPosition - b.avgPosition ||
        a.team.localeCompare(b.team, "es")
      );
    })
    .slice(0, topNTeams);

  const visibleTeamNames = new Set(candidateTeams.map((team) => team.team));

  const pairStats = new Map();

  for (const match of filteredMatches) {
    if (!visibleTeamNames.has(match.teamA) || !visibleTeamNames.has(match.teamB)) {
      continue;
    }

    const [source, target] = getCanonicalTeamPair(match.teamA, match.teamB);
    const pairKey = `${source}__${target}`;

    if (!pairStats.has(pairKey)) {
      pairStats.set(pairKey, {
        source,
        target,
        matches: 0,
        winsSource: 0,
        draws: 0,
        winsTarget: 0,
        goalsSource: 0,
        goalsTarget: 0,
        goalDiffSource: 0,
        seasons: new Set(),
        decades: new Set()
      });
    }

    const pair = pairStats.get(pairKey);

    const sourceIsMatchTeamA = match.teamA === source;

    const goalsSource = sourceIsMatchTeamA ? match.goalsA : match.goalsB;
    const goalsTarget = sourceIsMatchTeamA ? match.goalsB : match.goalsA;

    const resultForSource = getResult(goalsSource, goalsTarget);

    pair.matches += 1;
    pair.goalsSource += goalsSource;
    pair.goalsTarget += goalsTarget;
    pair.goalDiffSource += goalsSource - goalsTarget;

    if (Number.isFinite(match.seasonStartYear)) {
      pair.seasons.add(match.seasonStartYear);
    }

    if (Number.isFinite(match.decade)) {
      pair.decades.add(match.decade);
    }

    if (resultForSource === "win") {
      pair.winsSource += 1;
    } else if (resultForSource === "loss") {
      pair.winsTarget += 1;
    } else {
      pair.draws += 1;
    }
  }

  let links = Array.from(pairStats.values())
    .map((pair) => {
      const balance = Math.abs(pair.winsSource - pair.winsTarget);

      const equilibrium =
        pair.matches > 0
          ? 1 - balance / pair.matches
          : 0;

      const dominance =
        pair.matches > 0
          ? (pair.winsSource - pair.winsTarget) / pair.matches
          : 0;

      const rivalryScore = pair.matches * equilibrium;

      return {
        source: pair.source,
        target: pair.target,

        matches: pair.matches,
        winsSource: pair.winsSource,
        draws: pair.draws,
        winsTarget: pair.winsTarget,

        goalsSource: pair.goalsSource,
        goalsTarget: pair.goalsTarget,
        goalDiffSource: pair.goalDiffSource,

        balance,
        dominance,
        equilibrium,
        intensity: pair.matches,
        rivalryScore,

        seasonsCount: pair.seasons.size,
        decadesCount: pair.decades.size,

        pairId: `${normalizeKey(pair.source)}__${normalizeKey(pair.target)}`
      };
    })
    .filter((link) => link.matches >= minMatches)
    .filter((link) => {
      if (!onlyBalanced) {
        return true;
      }

      return link.equilibrium >= equilibriumThreshold;
    })
    .sort((a, b) => {
      return (
        b.rivalryScore - a.rivalryScore ||
        b.matches - a.matches ||
        b.equilibrium - a.equilibrium
      );
    });

  const connectedTeams = new Set();

  for (const link of links) {
    connectedTeams.add(link.source);
    connectedTeams.add(link.target);
  }

  const nodes = candidateTeams
    .filter((team) => connectedTeams.has(team.team))
    .map((team) => ({
      id: team.team,
      team: team.team,
      seasonsPlayed: team.seasonsPlayed,
      appearances: team.seasonsPlayed,
      totalMatchesInMatrix: team.totalMatchesInMatrix,
      avgPosition: team.avgPosition,
      titles: team.titles,
      top3Count: team.top3Count,
      top5Count: team.top5Count,
      category: team.category
    }));

  links = links.filter((link) => {
    return connectedTeams.has(link.source) && connectedTeams.has(link.target);
  });

  return {
    nodes,
    links,
    summary: {
      totalMatchesInput: matches.length,
      filteredMatches: filteredMatches.length,
      visibleTeamsBeforeLinkFilter: candidateTeams.length,
      visibleTeamsAfterLinkFilter: nodes.length,
      visibleLinks: links.length,
      minMatches,
      topNTeams,
      minSeasons,
      decade,
      onlyBalanced,
      equilibriumThreshold
    }
  };
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

function buildTeamNetworkStats(teamStatsData, matches) {
  const stats = new Map();

  for (const row of teamStatsData) {
    if (!row.Team) {
      continue;
    }

    if (!stats.has(row.Team)) {
      stats.set(row.Team, {
        team: row.Team,
        seasons: new Set(),
        positions: [],
        titles: 0,
        top3Count: 0,
        top5Count: 0,
        totalMatchesInMatrix: 0
      });
    }

    const team = stats.get(row.Team);

    if (Number.isFinite(row.SeasonStart)) {
      team.seasons.add(row.SeasonStart);
    }

    if (Number.isFinite(row.Position)) {
      team.positions.push(row.Position);

      if (row.Position === 1) {
        team.titles += 1;
      }

      if (row.Position <= 3) {
        team.top3Count += 1;
      }

      if (row.Position <= 5) {
        team.top5Count += 1;
      }
    }
  }

  for (const match of matches) {
    ensureNetworkTeam(stats, match.teamA);
    ensureNetworkTeam(stats, match.teamB);

    stats.get(match.teamA).totalMatchesInMatrix += 1;
    stats.get(match.teamB).totalMatchesInMatrix += 1;
  }

  for (const team of stats.values()) {
    team.seasonsPlayed = team.seasons.size;
    team.avgPosition = meanNetworkValue(team.positions);
    team.category = classifyNetworkTeam(team);
  }

  return stats;
}

function ensureNetworkTeam(stats, teamName) {
  if (!teamName || stats.has(teamName)) {
    return;
  }

  stats.set(teamName, {
    team: teamName,
    seasons: new Set(),
    positions: [],
    titles: 0,
    top3Count: 0,
    top5Count: 0,
    totalMatchesInMatrix: 0,
    seasonsPlayed: 0,
    avgPosition: NaN,
    category: "episódico"
  });
}

function classifyNetworkTeam(team) {
  if (team.titles >= 10 || team.top3Count >= 25) {
    return "dominante";
  }

  if (team.seasonsPlayed >= 50) {
    return "histórico";
  }

  if (team.seasonsPlayed >= 20) {
    return "regular";
  }

  return "episódico";
}

function meanNetworkValue(values) {
  const validValues = values.filter(Number.isFinite);

  if (validValues.length === 0) {
    return NaN;
  }

  return validValues.reduce((sum, value) => sum + value, 0) / validValues.length;
}

function getCanonicalTeamPair(teamA, teamB) {
  return [teamA, teamB].sort((a, b) => a.localeCompare(b, "es"));
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