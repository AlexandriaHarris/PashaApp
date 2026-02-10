const state = {
  facts: [],
  topicCounts: {},
  facetCounts: {},
  activeFacts: [],
  roundFacts: [],
  currentQuestion: null,
  index: 0,
  correct: 0,
  score: 0,
  streak: 0,
  missed: [],
  timedMode: false,
  timerId: null,
  timeLeft: 25,
  turnSeconds: 25,
  answerLocked: false,
  currentOpenEvidenceQuery: "",
  choicePools: {},
  kadooMode: false,
  kadooPlayers: [],
  kadooPlayerIndex: 0,
  pendingAdvance: "",
};

const els = {
  setupPanel: document.getElementById("setupPanel"),
  gamePanel: document.getElementById("gamePanel"),
  resultsPanel: document.getElementById("resultsPanel"),
  bankMeta: document.getElementById("bankMeta"),
  filterMeta: document.getElementById("filterMeta"),
  modeSelect: document.getElementById("modeSelect"),
  countSelect: document.getElementById("countSelect"),
  timedToggle: document.getElementById("timedToggle"),
  kadooToggle: document.getElementById("kadooToggle"),
  kadooConfig: document.getElementById("kadooConfig"),
  kadooPlayersInput: document.getElementById("kadooPlayersInput"),
  kadooSecondsSelect: document.getElementById("kadooSecondsSelect"),
  includeProseToggle: document.getElementById("includeProseToggle"),
  keywordFilter: document.getElementById("keywordFilter"),
  topicList: document.getElementById("topicList"),
  chapterList: document.getElementById("chapterList"),
  sectionList: document.getElementById("sectionList"),
  organSystemList: document.getElementById("organSystemList"),
  diseaseDomainList: document.getElementById("diseaseDomainList"),
  focusAreaList: document.getElementById("focusAreaList"),
  setupError: document.getElementById("setupError"),
  startBtn: document.getElementById("startBtn"),
  progressLabel: document.getElementById("progressLabel"),
  scoreLabel: document.getElementById("scoreLabel"),
  streakLabel: document.getElementById("streakLabel"),
  timerLabel: document.getElementById("timerLabel"),
  questionTopic: document.getElementById("questionTopic"),
  questionPrompt: document.getElementById("questionPrompt"),
  questionDetail: document.getElementById("questionDetail"),
  kadooPanel: document.getElementById("kadooPanel"),
  kadooTurnLabel: document.getElementById("kadooTurnLabel"),
  kadooScoreboard: document.getElementById("kadooScoreboard"),
  openEvidenceLink: document.getElementById("openEvidenceLink"),
  openEvidenceStatus: document.getElementById("openEvidenceStatus"),
  options: document.getElementById("options"),
  feedback: document.getElementById("feedback"),
  nextBtn: document.getElementById("nextBtn"),
  resultsSummary: document.getElementById("resultsSummary"),
  missedList: document.getElementById("missedList"),
  leaderboardWrap: document.getElementById("leaderboardWrap"),
  resultsLeaderboard: document.getElementById("resultsLeaderboard"),
  restartBtn: document.getElementById("restartBtn"),
  downloadMissedBtn: document.getElementById("downloadMissedBtn"),
};

const facetConfigs = {
  topic: {
    container: els.topicList,
    defaultChecked: true,
    required: true,
    label: "topic",
  },
  chapter: {
    container: els.chapterList,
    defaultChecked: true,
    required: true,
    label: "chapter",
  },
  section: {
    container: els.sectionList,
    defaultChecked: true,
    required: false,
    label: "section",
  },
  organSystems: {
    container: els.organSystemList,
    defaultChecked: false,
    required: false,
    label: "organ system",
  },
  diseaseDomains: {
    container: els.diseaseDomainList,
    defaultChecked: false,
    required: false,
    label: "disease domain",
  },
  focusAreas: {
    container: els.focusAreaList,
    defaultChecked: false,
    required: false,
    label: "focus area",
  },
};

function shuffle(items) {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function normalizeChoice(text) {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

function trimForDisplay(text, maxLength = 210) {
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.slice(0, maxLength - 1).trimEnd()}…`;
}

function maybeUndoubleWord(word) {
  if (word.length < 6 || word.length % 2 !== 0) {
    return word;
  }

  for (let index = 0; index < word.length; index += 2) {
    if (word[index].toLowerCase() !== word[index + 1].toLowerCase()) {
      return word;
    }
  }

  let out = "";
  for (let index = 0; index < word.length; index += 2) {
    out += word[index];
  }
  return out;
}

function normalizeOcrDoubledSegments(text) {
  return String(text || "").replace(/[A-Za-z]{6,}/g, (segment) => maybeUndoubleWord(segment));
}

function stripShorthandMarkers(text) {
  return String(text || "")
    .replace(/\b(?:DDxx|RRxx|DDx|RRx)\b/gi, "")
    .replace(/\b(?:DD|RR)\b\s*[:\-]/gi, "")
    .replace(/\(\s*(?:DD|RR)[^)]+\)/gi, "")
    .replace(/\s*;\s*;\s*/g, "; ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function buildOpenEvidenceQuery(question) {
  const lines = [];
  lines.push("Explain this ENT inservice review question and the best answer.");

  if (question.fact.chapter) {
    lines.push(`Chapter: ${question.fact.chapter}`);
  }
  if (question.fact.topic) {
    lines.push(`Topic: ${question.fact.topic}`);
  }
  if (question.fact.section) {
    lines.push(`Section: ${question.fact.section}`);
  }

  lines.push(`Question: ${question.prompt}`);

  if (question.mode === "term-to-definition") {
    lines.push(`Key term: ${question.fact.term}`);
  } else if (question.mode === "definition-to-term") {
    lines.push(`Clinical stem: ${question.fact.definition}`);
  } else if (question.mode === "cloze-typed" || question.mode === "cloze-term") {
    lines.push(`Cloze stem: ${question.detail}`);
  }

  lines.push("Choices:");
  question.options.forEach((option, index) => {
    const label = String.fromCharCode(65 + index);
    lines.push(`${label}. ${option.value}`);
  });

  lines.push(
    "Please identify the best answer, explain why, and briefly mention why other options are less likely."
  );

  return lines.join("\n");
}

function buildOpenEvidenceUrl(queryText) {
  const maxUrlQueryLength = 1100;
  const clipped = queryText.length > maxUrlQueryLength ? queryText.slice(0, maxUrlQueryLength) : queryText;
  return `https://www.openevidence.com/?q=${encodeURIComponent(clipped)}`;
}

function updateOpenEvidenceLink(question) {
  const query = buildOpenEvidenceQuery(question);
  state.currentOpenEvidenceQuery = query;
  els.openEvidenceLink.href = buildOpenEvidenceUrl(query);
  els.openEvidenceStatus.textContent = "";
}

function showPanel(panel) {
  els.setupPanel.hidden = panel !== "setup";
  els.gamePanel.hidden = panel !== "game";
  els.resultsPanel.hidden = panel !== "results";
}

function countSingleValue(values) {
  const counts = {};
  values.forEach((value) => {
    if (!value) {
      return;
    }
    counts[value] = (counts[value] || 0) + 1;
  });
  return counts;
}

function countArrayValues(arrayValues) {
  const counts = {};
  arrayValues.forEach((list) => {
    (list || []).forEach((value) => {
      if (!value) {
        return;
      }
      counts[value] = (counts[value] || 0) + 1;
    });
  });
  return counts;
}

function sortFacetEntries(counts, facetKey) {
  const entries = Object.entries(counts || {});

  if (facetKey === "chapter") {
    return entries.sort((left, right) => {
      const leftMatch = left[0].match(/^Chapter\\s+(\\d+)\\s*:/i);
      const rightMatch = right[0].match(/^Chapter\\s+(\\d+)\\s*:/i);
      const leftNumber = leftMatch ? Number(leftMatch[1]) : null;
      const rightNumber = rightMatch ? Number(rightMatch[1]) : null;

      if (leftNumber !== null && rightNumber !== null && leftNumber !== rightNumber) {
        return leftNumber - rightNumber;
      }
      if (leftNumber !== null && rightNumber === null) {
        return -1;
      }
      if (leftNumber === null && rightNumber !== null) {
        return 1;
      }

      return left[0].localeCompare(right[0], undefined, {
        sensitivity: "base",
        numeric: true,
      });
    });
  }

  return entries.sort((left, right) =>
    left[0].localeCompare(right[0], undefined, { sensitivity: "base", numeric: true })
  );
}

function normalizeFactShape(rawFact) {
  const sanitizeText = (value) => normalizeOcrDoubledSegments(stripShorthandMarkers(value));

  const topic = sanitizeText(rawFact.topic || "Unspecified");
  const chapter =
    sanitizeText(rawFact.chapter) ||
    (rawFact.chapterNumber && rawFact.chapterTitle
      ? `Chapter ${rawFact.chapterNumber}: ${sanitizeText(rawFact.chapterTitle)}`
      : topic);

  const term = sanitizeText(rawFact.term || "");
  const definition = sanitizeText(rawFact.definition || "");
  const section = sanitizeText(rawFact.section || "");

  const organSystems = Array.isArray(rawFact.organSystems)
    ? rawFact.organSystems.map((value) => sanitizeText(value))
    : [];
  const diseaseDomains = Array.isArray(rawFact.diseaseDomains)
    ? rawFact.diseaseDomains.map((value) => sanitizeText(value))
    : Array.isArray(rawFact.clinicalDomains)
    ? rawFact.clinicalDomains.map((value) => sanitizeText(value))
    : [];
  const focusAreas = Array.isArray(rawFact.focusAreas)
    ? rawFact.focusAreas.map((value) => sanitizeText(value))
    : [];

  const searchText = [
    term,
    definition,
    topic,
    chapter,
    section,
    organSystems.join(" "),
    diseaseDomains.join(" "),
    focusAreas.join(" "),
  ]
    .join(" ")
    .toLowerCase();

  return {
    ...rawFact,
    topic,
    chapter,
    section,
    term,
    definition,
    organSystems,
    diseaseDomains,
    focusAreas,
    searchText,
  };
}

function computeFacetCountsFromFacts(facts) {
  return {
    topic: countSingleValue(facts.map((fact) => fact.topic)),
    chapter: countSingleValue(facts.map((fact) => fact.chapter)),
    section: countSingleValue(facts.map((fact) => fact.section)),
    organSystems: countArrayValues(facts.map((fact) => fact.organSystems)),
    diseaseDomains: countArrayValues(facts.map((fact) => fact.diseaseDomains)),
    focusAreas: countArrayValues(facts.map((fact) => fact.focusAreas)),
  };
}

function renderFacetList(container, counts, defaultChecked, facetKey = "") {
  container.innerHTML = "";
  const entries = sortFacetEntries(counts, facetKey);

  if (!entries.length) {
    const empty = document.createElement("p");
    empty.className = "muted";
    empty.textContent = "No items";
    container.appendChild(empty);
    return;
  }

  entries.forEach(([value, count]) => {
    const wrapper = document.createElement("label");
    wrapper.className = "facet-item";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = value;
    checkbox.checked = defaultChecked;

    const text = document.createElement("span");
    text.textContent = value;

    const countText = document.createElement("span");
    countText.className = "facet-count";
    countText.textContent = `${count} facts`;

    const stack = document.createElement("div");
    stack.appendChild(text);
    stack.appendChild(countText);

    wrapper.appendChild(checkbox);
    wrapper.appendChild(stack);
    container.appendChild(wrapper);
  });
}

function selectedValues(container) {
  return Array.from(container.querySelectorAll("input[type='checkbox']:checked")).map(
    (input) => input.value
  );
}

function selectedValuesSet(container) {
  return new Set(selectedValues(container));
}

function allFacetValuesSet(counts) {
  return new Set(Object.keys(counts || {}));
}

function setFacetSelection(containerId, mode) {
  const container = document.getElementById(containerId);
  if (!container) {
    return;
  }
  const checkedValue = mode === "all";
  container
    .querySelectorAll("input[type='checkbox']")
    .forEach((input) => (input.checked = checkedValue));
}

function getSelections() {
  return {
    topic: selectedValues(els.topicList),
    chapter: selectedValues(els.chapterList),
    section: selectedValues(els.sectionList),
    organSystems: selectedValues(els.organSystemList),
    diseaseDomains: selectedValues(els.diseaseDomainList),
    focusAreas: selectedValues(els.focusAreaList),
    keyword: (els.keywordFilter.value || "").trim().toLowerCase(),
  };
}

function isSubsetFacetSelection(container, selectedValuesForFacet) {
  const total = container.querySelectorAll("input[type='checkbox']").length;
  return total > 0 && selectedValuesForFacet.length > 0 && selectedValuesForFacet.length < total;
}

function refreshSectionFacet(preserveSelection) {
  const previousTotal = els.sectionList.querySelectorAll("input[type='checkbox']").length;
  const previousSelection = selectedValues(els.sectionList);
  const previousSelectedSet = selectedValuesSet(els.sectionList);
  const hadAllSelected = previousTotal > 0 && previousSelection.length === previousTotal;

  const topicSelection = selectedValues(els.topicList);
  const chapterSelection = selectedValues(els.chapterList);

  const matchingFacts = state.facts.filter(
    (fact) =>
      (!topicSelection.length || topicSelection.includes(fact.topic)) &&
      (!chapterSelection.length || chapterSelection.includes(fact.chapter))
  );

  const sectionCounts = countSingleValue(matchingFacts.map((fact) => fact.section).filter(Boolean));
  let selectedSet = null;

  if (!preserveSelection || previousTotal === 0) {
    selectedSet = allFacetValuesSet(sectionCounts);
  } else if (hadAllSelected || previousSelection.length === 0) {
    selectedSet = allFacetValuesSet(sectionCounts);
  } else {
    selectedSet = new Set(
      [...previousSelectedSet].filter((sectionValue) =>
        Object.prototype.hasOwnProperty.call(sectionCounts, sectionValue)
      )
    );
  }

  renderFacetList(els.sectionList, sectionCounts, true, "section");

  if (selectedSet) {
    els.sectionList.querySelectorAll("input[type='checkbox']").forEach((input) => {
      input.checked = selectedSet.has(input.value);
    });
  }
}

function listIncludesAny(left, right) {
  if (!right.length) {
    return true;
  }
  return right.some((value) => left.includes(value));
}

function applyFilters(requirePrimaryFacets) {
  const selections = getSelections();

  if (requirePrimaryFacets) {
    if (!selections.topic.length) {
      return {
        error: "Select at least one topic.",
        facts: [],
        selections,
      };
    }
    if (!selections.chapter.length) {
      return {
        error: "Select at least one chapter.",
        facts: [],
        selections,
      };
    }
  }

  let filtered = state.facts.filter(
    (fact) =>
      (!selections.topic.length || selections.topic.includes(fact.topic)) &&
      (!selections.chapter.length || selections.chapter.includes(fact.chapter)) &&
      (!selections.section.length || selections.section.includes(fact.section))
  );

  if (selections.organSystems.length) {
    filtered = filtered.filter((fact) => listIncludesAny(fact.organSystems, selections.organSystems));
  }

  if (selections.diseaseDomains.length) {
    filtered = filtered.filter((fact) =>
      listIncludesAny(fact.diseaseDomains, selections.diseaseDomains)
    );
  }

  if (selections.focusAreas.length) {
    filtered = filtered.filter((fact) => listIncludesAny(fact.focusAreas, selections.focusAreas));
  }

  if (selections.keyword) {
    filtered = filtered.filter((fact) => fact.searchText.includes(selections.keyword));
  }

  return {
    error: "",
    facts: filtered,
    selections,
  };
}

function updateFilterMeta() {
  const { facts, selections } = applyFilters(false);

  const activeFacets = [];
  if (isSubsetFacetSelection(els.sectionList, selections.section)) {
    activeFacets.push(`${selections.section.length} section`);
  }
  if (selections.organSystems.length) {
    activeFacets.push(`${selections.organSystems.length} organ system`);
  }
  if (selections.diseaseDomains.length) {
    activeFacets.push(`${selections.diseaseDomains.length} disease domain`);
  }
  if (selections.focusAreas.length) {
    activeFacets.push(`${selections.focusAreas.length} focus area`);
  }
  if (selections.keyword) {
    activeFacets.push(`keyword "${selections.keyword}"`);
  }

  if (activeFacets.length === 0) {
    els.filterMeta.textContent = `${facts.length} facts match current chapter/topic/section selection.`;
    return;
  }

  els.filterMeta.textContent = `${facts.length} facts match active filters (${activeFacets.join(", "
  )}).`;
}

function parseKadooPlayers(rawValue) {
  const seen = new Set();
  return String(rawValue || "")
    .split(/[,|\n]/)
    .map((name) => name.trim())
    .filter(Boolean)
    .filter((name) => {
      const key = normalizeChoice(name);
      if (!key || seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    })
    .map((name, index) => ({
      id: `p${index + 1}`,
      name: trimForDisplay(name, 28),
      score: 0,
      correct: 0,
      missed: 0,
    }));
}

function isKadooEnabled() {
  return Boolean(els.kadooToggle && els.kadooToggle.checked);
}

function syncKadooConfigVisibility() {
  const enabled = isKadooEnabled();
  if (els.kadooConfig) {
    els.kadooConfig.hidden = !enabled;
  }
  if (els.timedToggle) {
    if (enabled) {
      els.timedToggle.checked = true;
      els.timedToggle.disabled = true;
    } else {
      els.timedToggle.disabled = false;
    }
  }
}

function getCurrentKadooPlayer() {
  return state.kadooPlayers[state.kadooPlayerIndex] || null;
}

function getKadooLeaderboard() {
  return [...state.kadooPlayers].sort((left, right) => {
    if (right.score !== left.score) {
      return right.score - left.score;
    }
    if (right.correct !== left.correct) {
      return right.correct - left.correct;
    }
    return left.name.localeCompare(right.name, undefined, { sensitivity: "base" });
  });
}

function renderKadooScoreboard(container, activePlayerId = "") {
  if (!container) {
    return;
  }
  container.innerHTML = "";
  const leaderboard = getKadooLeaderboard();
  leaderboard.forEach((player, index) => {
    const row = document.createElement("div");
    row.className = "kadoo-row";
    if (activePlayerId && player.id === activePlayerId) {
      row.classList.add("active");
    }

    const name = document.createElement("span");
    name.className = "kadoo-name";
    name.textContent = `${index + 1}. ${player.name}`;

    const stats = document.createElement("span");
    stats.className = "kadoo-stats";
    stats.textContent = `${player.score} pts · ${player.correct} correct · ${player.missed} missed`;

    row.appendChild(name);
    row.appendChild(stats);
    container.appendChild(row);
  });
}

function updateHud() {
  els.progressLabel.textContent = `Question ${state.index + 1} / ${state.roundFacts.length}`;
  if (!state.kadooMode) {
    els.scoreLabel.textContent = `Score ${state.score}`;
    els.streakLabel.textContent = `Streak ${state.streak}`;
    if (els.kadooPanel) {
      els.kadooPanel.hidden = true;
    }
    return;
  }

  const currentPlayer = getCurrentKadooPlayer();
  const leader = getKadooLeaderboard()[0];
  els.scoreLabel.textContent = leader
    ? `Leader ${leader.name}: ${leader.score} pts`
    : "Leader: -";
  els.streakLabel.textContent = currentPlayer
    ? `Current Player: ${currentPlayer.name}`
    : "Current Player: -";

  if (els.kadooPanel) {
    els.kadooPanel.hidden = false;
  }
  if (els.kadooTurnLabel) {
    els.kadooTurnLabel.textContent = currentPlayer
      ? `Turn ${state.kadooPlayerIndex + 1}/${state.kadooPlayers.length}: ${currentPlayer.name}`
      : "";
  }
  renderKadooScoreboard(els.kadooScoreboard, currentPlayer ? currentPlayer.id : "");
}

function clearTimer() {
  if (state.timerId) {
    clearInterval(state.timerId);
    state.timerId = null;
  }
}

function startTimer() {
  clearTimer();
  if (!state.timedMode) {
    els.timerLabel.hidden = true;
    return;
  }

  const startingSeconds = Number(state.turnSeconds) || 25;
  els.timerLabel.hidden = false;
  state.timeLeft = startingSeconds;
  els.timerLabel.textContent = `Time ${state.timeLeft}s`;
  els.timerLabel.classList.toggle("low", state.timeLeft <= 7);

  state.timerId = setInterval(() => {
    state.timeLeft -= 1;
    els.timerLabel.textContent = `Time ${state.timeLeft}s`;
    els.timerLabel.classList.toggle("low", state.timeLeft <= 7);

    if (state.timeLeft <= 0) {
      clearTimer();
      finalizeQuestion(null, true);
    }
  }, 1000);
}

function hasExplanatoryVerb(text) {
  return /\b(is|are|was|were|has|have|contains?|consists?|includes?|forms?|occurs?|results?|causes?|provides?|presents?|treated|diagnosed|evaluated|associated|indicates?)\b/i.test(
    text || ""
  );
}

const GENERIC_HEADING_TERMS = new Set([
  "approach",
  "background",
  "classification",
  "clinical features",
  "clinical presentation",
  "complication",
  "complications",
  "contraindication",
  "contraindications",
  "diagnosis",
  "differential diagnosis",
  "disadvantage",
  "disadvantages",
  "epidemiology",
  "etiology",
  "evaluation",
  "follow up",
  "history",
  "imaging",
  "indication",
  "indications",
  "introduction",
  "investigation",
  "management",
  "overview",
  "pathogenesis",
  "pathophysiology",
  "pearls",
  "pitfalls",
  "prevention",
  "prognosis",
  "risk factors",
  "signs and symptoms",
  "staging",
  "summary",
  "symptoms",
  "treatment",
  "workup",
]);

function normalizeHeadingKey(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isGenericHeadingTerm(term) {
  const normalized = normalizeHeadingKey(term);
  if (!normalized) {
    return true;
  }
  if (GENERIC_HEADING_TERMS.has(normalized)) {
    return true;
  }
  if (/^(advantages?|disadvantages?|complications?|indications?|contraindications?)$/.test(normalized)) {
    return true;
  }
  return false;
}

function buildFactContextLabel(fact) {
  const seen = new Set();
  const parts = [];

  [fact.section, fact.topic, fact.chapter].forEach((rawPart) => {
    const part = (rawPart || "").trim();
    if (!part) {
      return;
    }
    const key = normalizeChoice(part);
    if (seen.has(key)) {
      return;
    }
    seen.add(key);
    parts.push(part);
  });

  return trimForDisplay(parts.join(" • "), 140);
}

function withQuestionContext(fact, mainText, trailingText = "") {
  const parts = [];
  const context = buildFactContextLabel(fact);
  if (context) {
    parts.push(`Context: ${context}`);
  }
  if (mainText) {
    parts.push(mainText);
  }
  if (trailingText) {
    parts.push(trailingText);
  }
  return parts.join("\n\n");
}

function isNoisyShorthandTerm(term) {
  const normalized = (term || "").trim();
  if (!normalized) {
    return true;
  }

  if (/\b(?:RRxx|DDxx|RRxX|DDxX|RRx|DDx|Rx|Dx)\b/i.test(normalized)) {
    return true;
  }

  if (/;/.test(normalized)) {
    return true;
  }

  if (/^[a-z].*[;,]/.test(normalized)) {
    return true;
  }

  if (!/[aeiou]/i.test(normalized) && normalized.length > 4) {
    return true;
  }

  return false;
}

function isPlayableFact(fact) {
  if (!fact || !fact.term || !fact.definition) {
    return false;
  }

  const term = fact.term.trim();
  const definition = fact.definition.trim();
  if (term.length < 2 || term.length > 110) {
    return false;
  }
  if (definition.length < 12 || definition.length > 420) {
    return false;
  }
  if (!/[A-Za-z]/.test(term) || !/[A-Za-z]/.test(definition)) {
    return false;
  }
  if (isNoisyShorthandTerm(term)) {
    return false;
  }
  if (/^\d+(?:[-–]\d+)?$/.test(term)) {
    return false;
  }
  if ((term.match(/[,;:()]/g) || []).length >= 4) {
    return false;
  }
  if (definition.split(/\s+/).length < 4) {
    return false;
  }
  if (/\.\s*\.\s*\./.test(term) || /\.\s*\.\s*\./.test(definition)) {
    return false;
  }
  return true;
}

function isRelevantProseFact(fact) {
  if (!fact || fact.sourceType !== "prose") {
    return true;
  }

  if (!isPlayableFact(fact)) {
    return false;
  }

  const typedTokens = findTypedTokens(`${fact.term} ${fact.definition}`).filter(
    (token) => token.type !== "count"
  );
  if (typedTokens.length > 0) {
    return true;
  }

  const term = (fact.term || "").trim();
  if (!term || term.length > 70) {
    return false;
  }
  if (isGenericHeadingTerm(term)) {
    return false;
  }

  const words = term.split(/\s+/);
  if (words.length > 7) {
    return false;
  }

  if (/\b(is|are|was|were|may|can|occurs?|results?|causes?)\b/i.test(term)) {
    return false;
  }

  if ((term.match(/[,;:()]/g) || []).length >= 2) {
    return false;
  }

  return /^[A-Za-z0-9][A-Za-z0-9'()/\s.-]*$/.test(term);
}

function buildPeerPool(fact) {
  const sameSection = state.activeFacts.filter(
    (other) => other.id !== fact.id && other.topic === fact.topic && other.section === fact.section
  );
  const sameTopic = state.activeFacts.filter(
    (other) =>
      other.id !== fact.id &&
      other.topic === fact.topic &&
      !(other.section === fact.section && other.topic === fact.topic)
  );
  const sameChapter = state.activeFacts.filter(
    (other) =>
      other.id !== fact.id &&
      other.chapter === fact.chapter &&
      other.topic !== fact.topic
  );
  const everythingElse = state.activeFacts.filter(
    (other) => other.id !== fact.id && other.chapter !== fact.chapter
  );

  return shuffle([...sameSection, ...sameTopic, ...sameChapter, ...everythingElse]);
}

function normalizeTokenValue(value) {
  return value.replace(/\s+/g, " ").trim();
}

function findTypedTokens(text) {
  if (!text) {
    return [];
  }

  const patterns = [
    { type: "percentage", regex: /\b\d+(?:\.\d+)?(?:\s*[–-]\s*\d+(?:\.\d+)?)?\s*%/g },
    { type: "cranial-nerve", regex: /\bCN\s*[IVX]{1,4}\b/gi },
    {
      type: "stage",
      regex: /\b(?:T[0-4](?:[a-c])?|N[0-3](?:[a-c])?|M[0-1]|G[1-4]|Stage\s*[IVX]+|Type\s*\d+)\b/gi,
    },
    {
      type: "gene-marker",
      regex: /\b(?:p16|PD-L1|HMB-45|MITF|MART-1|BRAF|RET|NTRK|PTEN|EGFR|VEGF|CD\d{1,3}|Ig[A-Z]|IL-\d+|TNF-?[A-Za-z0-9]+|[A-Z]{2,6}\d{0,2})\b/g,
    },
    {
      type: "measurement",
      regex: /\b\d+(?:\.\d+)?\s?(?:mm|cm|mL|mg|g|dB|Hz|kHz|years?|weeks?|months?|days?|hours?)\b/gi,
    },
    { type: "count", regex: /\b\d+\b/g },
  ];

  const tokens = [];
  const occupiedRanges = [];

  patterns.forEach(({ type, regex }) => {
    regex.lastIndex = 0;
    let match = regex.exec(text);
    while (match) {
      const value = normalizeTokenValue(match[0]);
      const start = match.index;
      const end = start + match[0].length;

      const overlaps = occupiedRanges.some(
        (range) => start < range.end && end > range.start
      );
      if (!overlaps && value.length >= 2) {
        tokens.push({ type, value, start, end });
        occupiedRanges.push({ start, end });
      }

      match = regex.exec(text);
    }
  });

  tokens.sort((left, right) => left.start - right.start);
  return tokens;
}

function buildChoicePools(facts) {
  const pools = {
    percentage: new Set(),
    "cranial-nerve": new Set(),
    stage: new Set(),
    "gene-marker": new Set(),
    measurement: new Set(),
    count: new Set(),
  };

  facts.forEach((fact) => {
    findTypedTokens(`${fact.term} ${fact.definition}`).forEach((token) => {
      if (pools[token.type]) {
        pools[token.type].add(token.value);
      }
    });
  });

  return pools;
}

function pickTypedDistractors(type, correctValue, neededCount = 3) {
  const sourcePool = Array.from(state.choicePools[type] || []);
  const normalizedCorrect = normalizeChoice(correctValue);
  const candidates = sourcePool.filter(
    (value) => normalizeChoice(value) !== normalizedCorrect
  );
  return shuffle(candidates).slice(0, neededCount);
}

function formatTypeLabel(type) {
  const labelMap = {
    percentage: "percentage",
    "cranial-nerve": "cranial nerve",
    stage: "stage/grade",
    "gene-marker": "gene/marker",
    measurement: "measurement",
    count: "number",
  };
  return labelMap[type] || "value";
}

function replaceRangeWithBlank(text, start, end) {
  return `${text.slice(0, start)}_____${text.slice(end)}`;
}

function buildTypedClozeQuestion(fact) {
  if (!hasExplanatoryVerb(fact.definition) && fact.definition.split(/\s+/).length < 8) {
    return null;
  }

  const anchors = findTypedTokens(fact.definition).filter((token) => token.type !== "count");
  for (const anchor of anchors) {
    const distractors = pickTypedDistractors(anchor.type, anchor.value, 3);
    if (distractors.length < 3) {
      continue;
    }

    const clozeDefinition = replaceRangeWithBlank(fact.definition, anchor.start, anchor.end);
    const options = shuffle([
      { value: anchor.value, correct: true },
      ...distractors.map((value) => ({ value, correct: false })),
    ]);
    const questionTerm = trimForDisplay(fact.term, 92);
    const contextLabel = buildFactContextLabel(fact);
    const hasGenericFocusTerm = isGenericHeadingTerm(questionTerm);
    const prompt = hasGenericFocusTerm
      ? `What ${formatTypeLabel(anchor.type)} correctly completes this statement${
          contextLabel ? ` in ${contextLabel}` : ""
        }?`
      : `What ${formatTypeLabel(anchor.type)} correctly completes this statement about "${questionTerm}"?`;

    return {
      fact,
      mode: "cloze-typed",
      prompt,
      detail: withQuestionContext(
        fact,
        clozeDefinition,
        `Pick the best ${formatTypeLabel(anchor.type)}.`
      ),
      options,
    };
  }

  return null;
}

function buildTermClozeQuestion(fact) {
  const correctTerm = fact.term.trim();
  if (!correctTerm || correctTerm.length < 2) {
    return null;
  }
  if (!hasExplanatoryVerb(fact.definition)) {
    return null;
  }

  const stopWords = new Set([
    "of",
    "the",
    "and",
    "in",
    "to",
    "for",
    "with",
    "without",
    "by",
    "on",
    "at",
    "from",
  ]);

  const getHeadWord = (termValue) => {
    const tokens = termValue
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, " ")
      .split(/\s+/)
      .filter(Boolean)
      .filter((token) => !stopWords.has(token));
    return tokens.length ? tokens[tokens.length - 1] : "";
  };

  const isGoodTermForCloze = (termValue) => {
    const cleaned = termValue.trim();
    if (cleaned.length < 2 || cleaned.length > 70) {
      return false;
    }
    if (isGenericHeadingTerm(cleaned)) {
      return false;
    }
    if (isNoisyShorthandTerm(cleaned)) {
      return false;
    }
    const words = cleaned.split(/\s+/);
    if (words.length > 8) {
      return false;
    }
    if (/\b(is|are|was|were|may|can|occurs?|results?|causes?)\b/i.test(cleaned)) {
      return false;
    }
    if ((cleaned.match(/[,;:()]/g) || []).length >= 2) {
      return false;
    }
    return /^[A-Za-z0-9][A-Za-z0-9'()/\s.-]*$/.test(cleaned);
  };

  if (!isGoodTermForCloze(correctTerm)) {
    return null;
  }

  const correctHeadWord = getHeadWord(correctTerm);
  const peerPool = buildPeerPool(fact);
  const options = [{ value: correctTerm, correct: true }];
  const used = new Set([normalizeChoice(correctTerm)]);
  const termWordCount = correctTerm.split(/\s+/).length;
  const strictPool = [];
  const relaxedPool = [];

  for (const peer of peerPool) {
    const candidate = (peer.term || "").trim();
    if (!isGoodTermForCloze(candidate)) {
      continue;
    }

    const normalized = normalizeChoice(candidate);
    if (used.has(normalized)) {
      continue;
    }

    const candidateWords = candidate.split(/\s+/).length;
    if (Math.abs(candidateWords - termWordCount) > 4) {
      continue;
    }
    if (Math.abs(candidate.length - correctTerm.length) > 35) {
      continue;
    }

    const candidateHeadWord = getHeadWord(candidate);
    if (correctHeadWord && candidateHeadWord && candidateHeadWord === correctHeadWord) {
      strictPool.push(candidate);
    } else {
      relaxedPool.push(candidate);
    }
  }

  for (const pool of [strictPool, relaxedPool]) {
    for (const candidate of pool) {
      const normalized = normalizeChoice(candidate);
      if (used.has(normalized)) {
        continue;
      }
      options.push({ value: candidate, correct: false });
      used.add(normalized);
      if (options.length === 4) {
        break;
      }
    }
    if (options.length === 4) {
      break;
    }
  }

  if (options.length < 4) {
    return null;
  }

  const contextLabel = buildFactContextLabel(fact);

  return {
    fact,
    mode: "cloze-term",
    prompt: contextLabel
      ? `Which term correctly completes this fact in ${contextLabel}?`
      : "Which term correctly completes this fact?",
    detail: withQuestionContext(fact, fact.definition, "Answer: _____"),
    options: shuffle(options),
  };
}

function buildQuestion(fact, mode) {
  if (mode === "cloze") {
    return buildTypedClozeQuestion(fact) || buildTermClozeQuestion(fact);
  }
  if (mode === "definition-to-term" && isGenericHeadingTerm(fact.term)) {
    return null;
  }

  const correctValue = mode === "term-to-definition" ? fact.definition : fact.term;
  const useValueFromFact =
    mode === "term-to-definition"
      ? (otherFact) => otherFact.definition
      : (otherFact) => otherFact.term;

  const pool = buildPeerPool(fact);

  const options = [
    {
      value: correctValue,
      correct: true,
    },
  ];
  const used = new Set([normalizeChoice(correctValue)]);

  for (const candidate of pool) {
    const value = useValueFromFact(candidate);
    const normalized = normalizeChoice(value);
    if (used.has(normalized)) {
      continue;
    }
    if (!value || value.length < 3) {
      continue;
    }
    if (mode === "definition-to-term" && isGenericHeadingTerm(value)) {
      continue;
    }
    options.push({
      value,
      correct: false,
    });
    used.add(normalized);
    if (options.length === 4) {
      break;
    }
  }

  if (options.length < 4) {
    return null;
  }

  const contextLabel = buildFactContextLabel(fact);
  const prompt =
    mode === "term-to-definition"
      ? isGenericHeadingTerm(fact.term) && contextLabel
        ? `Best definition for "${fact.term}" in ${contextLabel}?`
        : `Best definition for "${fact.term}"?`
      : "Which term matches this description?";

  const detail =
    mode === "term-to-definition"
      ? withQuestionContext(fact, "Choose the best matching definition.")
      : withQuestionContext(fact, trimForDisplay(fact.definition, 280));

  return {
    fact,
    mode,
    prompt,
    detail,
    options: shuffle(options),
  };
}

function buildQuestionWithFallback(baseFact, mode) {
  const firstTry = buildQuestion(baseFact, mode);
  if (firstTry) {
    return firstTry;
  }

  const alternatives = shuffle(
    state.activeFacts.filter((candidate) => candidate.id !== baseFact.id)
  ).slice(0, 30);

  for (const candidate of alternatives) {
    const attempt = buildQuestion(candidate, mode);
    if (attempt) {
      return attempt;
    }
  }

  return null;
}

function renderQuestion() {
  state.answerLocked = false;
  state.pendingAdvance = "";
  const fact = state.roundFacts[state.index];
  let question = null;
  const canReuseKadooQuestion =
    state.kadooMode &&
    state.kadooPlayerIndex > 0 &&
    state.currentQuestion &&
    state.currentQuestion.fact &&
    state.currentQuestion.fact.id === fact.id;

  if (canReuseKadooQuestion) {
    question = state.currentQuestion;
  } else {
    let selectedMode = els.modeSelect.value;
    if (selectedMode === "mixed") {
      const roll = Math.random();
      if (roll < 0.55) {
        selectedMode = "cloze";
      } else if (roll < 0.78) {
        selectedMode = "term-to-definition";
      } else {
        selectedMode = "definition-to-term";
      }
    }

    question = buildQuestionWithFallback(fact, selectedMode);
  }
  if (!question) {
    els.setupError.textContent =
      "Not enough distinct facts to generate options. Widen filters and retry.";
    showPanel("setup");
    return;
  }

  state.currentQuestion = question;

  els.feedback.textContent = "";
  els.feedback.className = "feedback";
  els.nextBtn.hidden = true;
  els.options.innerHTML = "";

  const tagParts = [question.fact.chapter, question.fact.topic];
  if (question.fact.focusAreas && question.fact.focusAreas.length) {
    tagParts.push(question.fact.focusAreas.slice(0, 2).join(" / "));
  }

  els.questionTopic.textContent = tagParts.filter(Boolean).join(" • ");
  els.questionPrompt.textContent = question.prompt;
  els.questionDetail.textContent = question.detail;
  updateOpenEvidenceLink(question);

  question.options.forEach((option, optionIndex) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "option-btn";
    const label = String.fromCharCode(65 + optionIndex);
    button.textContent = `${label}. ${trimForDisplay(option.value)}`;
    button.addEventListener("click", () => {
      finalizeQuestion(option, false);
    });
    els.options.appendChild(button);
  });

  updateHud();
  startTimer();
}

function finalizeQuestion(selectedOption, isTimeout) {
  if (state.answerLocked) {
    return;
  }
  state.answerLocked = true;
  clearTimer();

  const isCorrect = Boolean(selectedOption && selectedOption.correct && !isTimeout);
  const selectedValue = isTimeout
    ? "(time expired)"
    : selectedOption
    ? selectedOption.value
    : "(none)";
  const correctOption = state.currentQuestion.options.find((option) => option.correct);
  const optionButtons = Array.from(els.options.querySelectorAll("button"));
  optionButtons.forEach((button, index) => {
    button.disabled = true;
    const option = state.currentQuestion.options[index];
    if (option.correct) {
      button.classList.add("correct");
    } else if (selectedOption && option.value === selectedOption.value) {
      button.classList.add("wrong");
    }
  });

  if (state.kadooMode) {
    const player = getCurrentKadooPlayer();
    const playerName = player ? player.name : "Player";

    if (player) {
      if (isCorrect) {
        const points = 100 + Math.max(0, state.timeLeft) * 4;
        player.score += points;
        player.correct += 1;
        els.feedback.textContent = `${playerName}: Correct. +${points} points.`;
        els.feedback.className = "feedback correct";
      } else {
        player.missed += 1;
        els.feedback.textContent = isTimeout
          ? `${playerName}: Time expired.`
          : `${playerName}: Incorrect.`;
        els.feedback.className = "feedback wrong";

        state.missed.push({
          player: playerName,
          topic: state.currentQuestion.fact.topic,
          chapter: state.currentQuestion.fact.chapter,
          term: state.currentQuestion.fact.term,
          definition: state.currentQuestion.fact.definition,
          selected: selectedValue,
          correct: correctOption ? correctOption.value : "",
          mode: state.currentQuestion.mode,
          sourceType: state.currentQuestion.fact.sourceType || "unknown",
        });
      }
    }

    const hasMorePlayers = state.kadooPlayerIndex < state.kadooPlayers.length - 1;
    if (hasMorePlayers) {
      const nextPlayer = state.kadooPlayers[state.kadooPlayerIndex + 1];
      state.pendingAdvance = "next-player";
      els.nextBtn.hidden = false;
      els.nextBtn.textContent = nextPlayer
        ? `Next Player: ${nextPlayer.name}`
        : "Next Player";
    } else {
      const hasMoreQuestions = state.index < state.roundFacts.length - 1;
      state.pendingAdvance = hasMoreQuestions ? "next-question" : "finish-round";
      els.nextBtn.hidden = false;
      els.nextBtn.textContent = hasMoreQuestions ? "Next Question" : "See Results";
    }

    updateHud();
    return;
  }

  if (isCorrect) {
    state.correct += 1;
    state.streak += 1;
    const points = 10 + Math.min(state.streak * 2, 24);
    state.score += points;
    els.feedback.textContent = `Correct. +${points} points`;
    els.feedback.className = "feedback correct";
  } else {
    state.streak = 0;

    state.missed.push({
      topic: state.currentQuestion.fact.topic,
      chapter: state.currentQuestion.fact.chapter,
      term: state.currentQuestion.fact.term,
      definition: state.currentQuestion.fact.definition,
      selected: selectedValue,
      correct: correctOption ? correctOption.value : "",
      mode: state.currentQuestion.mode,
      sourceType: state.currentQuestion.fact.sourceType || "unknown",
    });

    els.feedback.textContent = isTimeout ? "Time expired." : "Incorrect.";
    els.feedback.className = "feedback wrong";
  }

  updateHud();
  els.nextBtn.hidden = false;
  els.nextBtn.textContent =
    state.index >= state.roundFacts.length - 1 ? "See Results" : "Next Question";
}

function renderMissed() {
  els.missedList.innerHTML = "";
  if (state.missed.length === 0) {
    const cleanCard = document.createElement("div");
    cleanCard.className = "missed-card";
    const noMissText = document.createElement("p");
    noMissText.textContent = "No misses this round.";
    cleanCard.appendChild(noMissText);
    els.missedList.appendChild(cleanCard);
    return;
  }

  const addLine = (parent, label, value) => {
    const paragraph = document.createElement("p");
    const strong = document.createElement("strong");
    strong.textContent = `${label}: `;
    paragraph.appendChild(strong);
    paragraph.appendChild(document.createTextNode(value));
    parent.appendChild(paragraph);
  };

  state.missed.forEach((miss) => {
    const card = document.createElement("article");
    card.className = "missed-card";
    const answerLabel =
      miss.mode === "term-to-definition"
        ? "Correct Definition"
        : miss.mode === "cloze-typed"
        ? "Correct Value"
        : miss.mode === "cloze-term"
        ? "Correct Term"
        : "Correct Term";
    const termLabel = miss.mode === "cloze-typed" ? "Fact Term" : "Term";
    const definitionLabel =
      miss.mode === "cloze-typed" || miss.mode === "cloze-term" ? "Cloze Stem" : "Definition";
    if (miss.player) {
      addLine(card, "Player", miss.player);
    }
    addLine(card, "Chapter", miss.chapter || "");
    addLine(card, "Topic", miss.topic);
    addLine(card, termLabel, miss.term);
    addLine(card, definitionLabel, trimForDisplay(miss.definition, 280));
    addLine(card, answerLabel, trimForDisplay(miss.correct, 180));
    addLine(card, "Your Answer", trimForDisplay(miss.selected, 180));
    els.missedList.appendChild(card);
  });
}

function finishRound() {
  if (state.kadooMode) {
    const totalTurns = state.roundFacts.length * state.kadooPlayers.length;
    const totalCorrect = state.kadooPlayers.reduce((sum, player) => sum + player.correct, 0);
    const percent = totalTurns > 0 ? Math.round((totalCorrect / totalTurns) * 100) : 0;
    const leaderboard = getKadooLeaderboard();
    const winner = leaderboard[0];
    els.resultsSummary.textContent = winner
      ? `Winner: ${winner.name} (${winner.score} pts). Group accuracy ${totalCorrect}/${totalTurns} (${percent}%). Missed ${state.missed.length}.`
      : `Group accuracy ${totalCorrect}/${totalTurns} (${percent}%).`;
    if (els.leaderboardWrap) {
      els.leaderboardWrap.hidden = false;
    }
    renderKadooScoreboard(els.resultsLeaderboard, "");
  } else {
    const total = state.roundFacts.length;
    const percent = total > 0 ? Math.round((state.correct / total) * 100) : 0;
    els.resultsSummary.textContent = `Score ${state.score}. Accuracy ${state.correct}/${total} (${percent}%). Missed ${state.missed.length}.`;
    if (els.leaderboardWrap) {
      els.leaderboardWrap.hidden = true;
    }
  }
  renderMissed();
  showPanel("results");
}

function startRound() {
  els.setupError.textContent = "";
  state.kadooMode = isKadooEnabled();
  state.kadooPlayers = [];
  state.kadooPlayerIndex = 0;
  state.pendingAdvance = "";

  if (state.kadooMode) {
    const players = parseKadooPlayers(els.kadooPlayersInput ? els.kadooPlayersInput.value : "");
    if (players.length < 2) {
      els.setupError.textContent =
        "Kadoo mode needs at least 2 players. Add comma-separated names.";
      return;
    }
    state.kadooPlayers = players;
  }

  const filtered = applyFilters(true);
  if (filtered.error) {
    els.setupError.textContent = filtered.error;
    return;
  }

  const includeProse = Boolean(els.includeProseToggle.checked);
  state.activeFacts = filtered.facts.filter(
    (fact) =>
      isPlayableFact(fact) &&
      (fact.sourceType !== "prose" || (includeProse && isRelevantProseFact(fact)))
  );
  if (state.activeFacts.length < 4) {
    els.setupError.textContent =
      "Need at least 4 clean facts after filtering to build multiple-choice questions.";
    return;
  }
  state.choicePools = buildChoicePools(state.activeFacts);

  const requestedCount = Number(els.countSelect.value);
  const roundSize = Math.min(requestedCount, state.activeFacts.length);
  state.roundFacts = shuffle(state.activeFacts).slice(0, roundSize);
  state.index = 0;
  state.correct = 0;
  state.score = 0;
  state.streak = 0;
  state.missed = [];
  state.timedMode = state.kadooMode ? true : els.timedToggle.checked;
  state.turnSeconds = state.kadooMode
    ? Number(els.kadooSecondsSelect ? els.kadooSecondsSelect.value : 20) || 20
    : 25;

  showPanel("game");
  renderQuestion();
}

function gotoNextQuestion() {
  if (state.kadooMode) {
    if (state.pendingAdvance === "next-player") {
      state.kadooPlayerIndex += 1;
      renderQuestion();
      return;
    }
    if (state.pendingAdvance === "next-question") {
      state.index += 1;
      state.kadooPlayerIndex = 0;
      renderQuestion();
      return;
    }
    if (state.pendingAdvance === "finish-round") {
      finishRound();
      return;
    }
    return;
  }

  if (state.index >= state.roundFacts.length - 1) {
    finishRound();
    return;
  }
  state.index += 1;
  renderQuestion();
}

function downloadMissedFacts() {
  if (state.missed.length === 0) {
    return;
  }
  const lines = [];
  lines.push("Pasha Inservice Arena - Missed Facts");
  lines.push(`Generated: ${new Date().toLocaleString()}`);
  lines.push("");
  state.missed.forEach((miss, index) => {
    lines.push(`Item ${index + 1}`);
    if (miss.player) {
      lines.push(`Player: ${miss.player}`);
    }
    lines.push(`Chapter: ${miss.chapter || ""}`);
    lines.push(`Topic: ${miss.topic}`);
    lines.push(
      `${miss.mode === "cloze-typed" ? "Fact Term" : "Term"}: ${miss.term}`
    );
    lines.push(
      `${miss.mode === "cloze-typed" || miss.mode === "cloze-term" ? "Cloze Stem" : "Definition"}: ${miss.definition}`
    );
    lines.push(`Your Answer: ${miss.selected}`);
    lines.push(`Correct: ${miss.correct}`);
    lines.push("");
  });
  const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "pasha-missed-facts.txt";
  anchor.click();
  URL.revokeObjectURL(url);
}

function init() {
  const bank = window.PASHA_QUESTION_BANK;
  if (!bank || !Array.isArray(bank.facts)) {
    els.setupError.textContent =
      "Question bank not found. Run: node scripts/buildQuestionBank.js";
    els.startBtn.disabled = true;
    return;
  }

  state.facts = bank.facts.map(normalizeFactShape);

  if (!state.facts.length) {
    els.setupError.textContent = "Question bank is empty. Rebuild from source files.";
    els.startBtn.disabled = true;
    return;
  }

  const fallbackFacetCounts = computeFacetCountsFromFacts(state.facts);
  state.facetCounts = {
    topic: fallbackFacetCounts.topic || {},
    chapter: fallbackFacetCounts.chapter || {},
    section: fallbackFacetCounts.section || {},
    organSystems: fallbackFacetCounts.organSystems || {},
    diseaseDomains: fallbackFacetCounts.diseaseDomains || {},
    focusAreas: fallbackFacetCounts.focusAreas || {},
  };

  const sourceTypeCounts = bank.sourceTypeCounts || {};
  const colonCount = sourceTypeCounts.colon || 0;
  const proseCount = sourceTypeCounts.prose || 0;
  const chapterCount = Object.keys(state.facetCounts.chapter || {}).length;
  els.bankMeta.textContent = `${state.facts.length} facts across ${chapterCount} chapters (${colonCount} keyed + ${proseCount} prose).`;

  Object.entries(facetConfigs).forEach(([key, config]) => {
    renderFacetList(config.container, state.facetCounts[key] || {}, config.defaultChecked, key);
  });

  refreshSectionFacet(false);
  updateFilterMeta();
  syncKadooConfigVisibility();
}

els.startBtn.addEventListener("click", startRound);
els.nextBtn.addEventListener("click", gotoNextQuestion);
els.restartBtn.addEventListener("click", () => {
  clearTimer();
  state.pendingAdvance = "";
  state.kadooPlayerIndex = 0;
  showPanel("setup");
});
els.downloadMissedBtn.addEventListener("click", downloadMissedFacts);

els.topicList.addEventListener("change", () => {
  refreshSectionFacet(true);
  updateFilterMeta();
});

els.chapterList.addEventListener("change", () => {
  refreshSectionFacet(true);
  updateFilterMeta();
});

[els.sectionList, els.organSystemList, els.diseaseDomainList, els.focusAreaList].forEach(
  (container) => {
    container.addEventListener("change", () => {
      updateFilterMeta();
    });
  }
);

els.keywordFilter.addEventListener("input", () => {
  updateFilterMeta();
});

if (els.kadooToggle) {
  els.kadooToggle.addEventListener("change", () => {
    syncKadooConfigVisibility();
  });
}

els.openEvidenceLink.addEventListener("click", () => {
  if (!state.currentOpenEvidenceQuery) {
    return;
  }

  if (!navigator.clipboard || !navigator.clipboard.writeText) {
    els.openEvidenceStatus.textContent =
      "Opened OpenEvidence. Copy the question stem manually if it does not auto-fill.";
    return;
  }

  navigator.clipboard
    .writeText(state.currentOpenEvidenceQuery)
    .then(() => {
      els.openEvidenceStatus.textContent =
        "Opened OpenEvidence and copied query text to clipboard.";
    })
    .catch(() => {
      els.openEvidenceStatus.textContent =
        "Opened OpenEvidence. Clipboard copy failed; paste from the question card.";
    });
});

document.querySelectorAll("[data-facet-target]").forEach((button) => {
  button.addEventListener("click", () => {
    const target = button.getAttribute("data-facet-target");
    const mode = button.getAttribute("data-facet-mode");
    setFacetSelection(target, mode);
    if (target === "topicList" || target === "chapterList") {
      refreshSectionFacet(true);
    }
    updateFilterMeta();
  });
});

init();
