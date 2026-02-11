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
  missedFactIds: [],
  /** Per-fact progress tracking: { [factId]: { seen, correct, wrong, lastSeen, lastResult } } */
  progress: {},
  /** Cumulative session history for stats dashboard */
  sessionHistory: [],
};

const els = {
  setupPanel: document.getElementById("setupPanel"),
  gamePanel: document.getElementById("gamePanel"),
  resultsPanel: document.getElementById("resultsPanel"),
  bankMeta: document.getElementById("bankMeta"),
  filterMeta: document.getElementById("filterMeta"),
  modeSelect: document.getElementById("modeSelect"),
  countSelect: document.getElementById("countSelect"),
  difficultySelect: document.getElementById("difficultySelect"),
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
  feedbackDetail: document.getElementById("feedbackDetail"),
  nextBtn: document.getElementById("nextBtn"),
  resultsSummary: document.getElementById("resultsSummary"),
  missedList: document.getElementById("missedList"),
  leaderboardWrap: document.getElementById("leaderboardWrap"),
  resultsLeaderboard: document.getElementById("resultsLeaderboard"),
  restartBtn: document.getElementById("restartBtn"),
  downloadMissedBtn: document.getElementById("downloadMissedBtn"),
  missedCountLabel: document.getElementById("missedCountLabel"),
  clearMissedBtn: document.getElementById("clearMissedBtn"),
  exportProgressBtn: document.getElementById("exportProgressBtn"),
  importProgressBtn: document.getElementById("importProgressBtn"),
  importProgressFile: document.getElementById("importProgressFile"),
  progressStatsLabel: document.getElementById("progressStatsLabel"),
  progressBar: document.getElementById("progressBar"),
  progressBarFill: document.getElementById("progressBarFill"),
  priorityModeToggle: document.getElementById("priorityModeToggle"),
};

/* ─────────────────────────────────────────────────────────────────────────────
 *  Progress Tracking System
 *
 *  Each fact gets a record: { seen, correct, wrong, lastSeen, lastResult }
 *  Priority score (lower = more urgent):
 *    - Unseen facts: 0
 *    - High-miss-rate & recent wrong: 10
 *    - Moderate miss-rate: 30
 *    - Seen but stale (>3 days): 50
 *    - Recently correct: 80 + accuracy bonus
 *  Stored in localStorage + exportable/importable as JSON file
 * ───────────────────────────────────────────────────────────────────────────── */

const PROGRESS_STORAGE_KEY = "pasha-progress-v1";
const SESSION_HISTORY_KEY = "pasha-sessions-v1";

function loadProgress() {
  try {
    const raw = localStorage.getItem(PROGRESS_STORAGE_KEY);
    if (raw) {
      state.progress = JSON.parse(raw);
    }
  } catch (e) {
    state.progress = {};
  }
  try {
    const raw = localStorage.getItem(SESSION_HISTORY_KEY);
    if (raw) {
      state.sessionHistory = JSON.parse(raw);
    }
  } catch (e) {
    state.sessionHistory = [];
  }
}

function saveProgress() {
  try {
    localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(state.progress));
    localStorage.setItem(SESSION_HISTORY_KEY, JSON.stringify(state.sessionHistory));
  } catch (e) {
    // localStorage full or disabled — file export still works
  }
  updateProgressDisplay();
}

function recordAnswer(factId, isCorrect) {
  if (!factId) return;
  if (!state.progress[factId]) {
    state.progress[factId] = { seen: 0, correct: 0, wrong: 0, lastSeen: 0, lastResult: "" };
  }
  const rec = state.progress[factId];
  rec.seen += 1;
  if (isCorrect) {
    rec.correct += 1;
    rec.lastResult = "correct";
  } else {
    rec.wrong += 1;
    rec.lastResult = "wrong";
  }
  rec.lastSeen = Date.now();
  saveProgress();
}

function getFactPriority(factId) {
  const rec = state.progress[factId];
  if (!rec || rec.seen === 0) return 0; // unseen — highest priority

  const accuracy = rec.correct / rec.seen;
  const daysSince = (Date.now() - rec.lastSeen) / (1000 * 60 * 60 * 24);
  const lastWrong = rec.lastResult === "wrong";

  // High miss rate + recently wrong
  if (accuracy < 0.4 && lastWrong) return 10;
  // Moderate miss rate
  if (accuracy < 0.6) return 30;
  // Stale — seen but not recently
  if (daysSince > 3) return 50;
  // Recently correct — lower priority
  return 80 + Math.min(accuracy * 20, 20);
}

function selectFactsByPriority(candidates, count) {
  // Sort by priority (lower = more urgent), shuffle within same tier
  const scored = candidates.map(f => ({
    fact: f,
    priority: getFactPriority(f.id),
    jitter: Math.random() * 5, // randomize within same priority band
  }));
  scored.sort((a, b) => (a.priority + a.jitter) - (b.priority + b.jitter));
  return scored.slice(0, count).map(s => s.fact);
}

function getProgressStats() {
  const totalFacts = state.facts.length;
  const tracked = Object.keys(state.progress);
  let seen = 0, mastered = 0, struggling = 0, unseen = 0;

  const factIds = new Set(state.facts.map(f => f.id));

  for (const fid of factIds) {
    const rec = state.progress[fid];
    if (!rec || rec.seen === 0) {
      unseen += 1;
      continue;
    }
    seen += 1;
    const accuracy = rec.correct / rec.seen;
    if (accuracy >= 0.8 && rec.seen >= 2) {
      mastered += 1;
    } else if (accuracy < 0.5 && rec.seen >= 2) {
      struggling += 1;
    }
  }

  return { totalFacts, seen, unseen, mastered, struggling, totalSessions: state.sessionHistory.length };
}

function updateProgressDisplay() {
  const stats = getProgressStats();
  if (els.progressStatsLabel) {
    const pct = stats.totalFacts > 0 ? Math.round((stats.seen / stats.totalFacts) * 100) : 0;
    els.progressStatsLabel.textContent =
      `${stats.seen}/${stats.totalFacts} seen (${pct}%) · ${stats.mastered} mastered · ${stats.struggling} struggling · ${stats.totalSessions} sessions`;
  }
  if (els.progressBarFill && stats.totalFacts > 0) {
    const seenPct = (stats.seen / stats.totalFacts) * 100;
    const masteredPct = (stats.mastered / stats.totalFacts) * 100;
    els.progressBarFill.style.width = `${seenPct}%`;
    els.progressBarFill.setAttribute("data-mastered", `${Math.round(masteredPct)}%`);
  }
  // Show/hide clear missed button based on whether there are missed facts
  if (els.clearMissedBtn) {
    els.clearMissedBtn.hidden = state.missedFactIds.length === 0;
  }
}

function exportProgressToFile() {
  const payload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    progress: state.progress,
    missedFactIds: state.missedFactIds,
    sessionHistory: state.sessionHistory,
  };
  const json = JSON.stringify(payload, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  const dateStr = new Date().toISOString().slice(0, 10);
  anchor.download = `pasha-progress-${dateStr}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function importProgressFromFile(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const payload = JSON.parse(e.target.result);
      if (!payload || typeof payload.progress !== "object") {
        alert("Invalid progress file. Expected a Pasha progress JSON export.");
        return;
      }
      // Merge strategy: keep the higher seen/correct/wrong counts, most recent lastSeen
      const imported = payload.progress || {};
      for (const [fid, rec] of Object.entries(imported)) {
        if (!state.progress[fid]) {
          state.progress[fid] = rec;
        } else {
          const existing = state.progress[fid];
          existing.seen = Math.max(existing.seen, rec.seen);
          existing.correct = Math.max(existing.correct, rec.correct);
          existing.wrong = Math.max(existing.wrong, rec.wrong);
          existing.lastSeen = Math.max(existing.lastSeen, rec.lastSeen);
          if (rec.lastSeen > existing.lastSeen) {
            existing.lastResult = rec.lastResult;
          }
        }
      }
      // Merge missed fact IDs
      if (Array.isArray(payload.missedFactIds)) {
        const missedSet = new Set(state.missedFactIds);
        payload.missedFactIds.forEach(id => missedSet.add(id));
        state.missedFactIds = [...missedSet];
      }
      // Append session history
      if (Array.isArray(payload.sessionHistory)) {
        const existingTimestamps = new Set(state.sessionHistory.map(s => s.timestamp));
        payload.sessionHistory.forEach(s => {
          if (!existingTimestamps.has(s.timestamp)) {
            state.sessionHistory.push(s);
          }
        });
      }
      saveProgress();
      saveMissedFactIds();
      updateProgressDisplay();
      updateMissedCountLabel();
      alert(`Progress imported successfully. ${Object.keys(imported).length} fact records merged.`);
    } catch (err) {
      alert("Error reading file: " + err.message);
    }
  };
  reader.readAsText(file);
}

function recordSessionEnd() {
  const entry = {
    timestamp: Date.now(),
    date: new Date().toISOString(),
    totalQuestions: state.roundFacts.length,
    correct: state.correct,
    missed: state.missed.length,
    score: state.score,
    mode: els.modeSelect ? els.modeSelect.value : "unknown",
    difficulty: els.difficultySelect ? els.difficultySelect.value : "standard",
  };
  state.sessionHistory.push(entry);
  saveProgress();
}

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
  return `https://www.openevidence.com/`;
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
    siblingIds: Array.isArray(rawFact.siblingIds) ? rawFact.siblingIds : [],
    relatedIds: Array.isArray(rawFact.relatedIds) ? rawFact.relatedIds : [],
    qualityTier: rawFact.qualityTier || "medium",
    parentSection: rawFact.parentSection || "",
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

  els.filterMeta.textContent = `${facts.length} facts match active filters (${activeFacets.join(", ")}).`;
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

/** Return just the main text — context goes in the topic tag, not in the detail */
function withQuestionContext(fact, mainText, trailingText = "") {
  const parts = [];
  if (mainText) parts.push(mainText);
  if (trailingText) parts.push(trailingText);
  return parts.join("\n\n");
}

function isNoisyShorthandTerm(term) {
  const normalized = (term || "").trim();
  if (!normalized) {
    return true;
  }

  // Medical abbreviation patterns (SSx, DDx, Rx, Dx, etc.)
  if (/\b(?:RRxx|DDxx|RRxX|DDxX|RRx|DDx|Rx|Dx|S?Sx|SSxx?|HHx|NNx)\b/i.test(normalized)) {
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

  // Figure references
  if (/^(In\s+)?Figure\s/i.test(normalized)) {
    return true;
  }

  // OCR garbage: double letters + numbers like "NN00", "SS00"
  if (/^[A-Z]{2}\d{2}\b/.test(normalized)) {
    return true;
  }

  // Pure numeric-prefix terms like "1100 Weeks", "20 Minutes"
  if (/^\d{2,}\s+\w+$/i.test(normalized)) {
    return true;
  }

  return false;
}

function isUsefulTerm(term) {
  const t = (term || "").trim();
  if (!t || t.length <= 2) return false;

  // Medical abbreviations
  if (/^(S?Sx|DDx?|Tx|Dx|Rx|Hx|PE|Labs?|H&N|HH&N|S\/Sx|HH&&NN)$/i.test(t)) return false;
  if (/\b(Associated\s+S?Sx)\b/i.test(t)) return false;

  // OCR junk
  if (/&&|\/\/|\|\||~~|##/.test(t)) return false;

  // Pure numbers or roman numerals
  if (/^\d+$/.test(t)) return false;
  if (/^[IVX]+\s*[A-Z]?[A-Z]?$/i.test(t) && t.length < 6) return false;

  // Frequency/ordinal labels: "Most Common", "Second Most Common", etc.
  if (/^(most|least|second|third|fourth|first|uncommon|common|rare)\b/i.test(t)) return false;
  if (/\b(most common|least common)\b/i.test(t) && t.split(/\s+/).length <= 4) return false;

  // Dangling parentheses or brackets
  const opens = (t.match(/\(/g) || []).length;
  const closes = (t.match(/\)/g) || []).length;
  if (opens !== closes) return false;

  // Starts with lowercase article/preposition (indicates sentence fragment)
  if (/^(the|a|an|in|of|for|with|after|before|during|if|or|and|but|not|no|to|at|by|on|from)\s/i.test(t) && t[0] === t[0].toLowerCase()) return false;

  // Sentence-fragment: 7+ words with a verb
  const words = t.split(/\s+/);
  if (words.length >= 7 && /\b(is|are|was|were|has|have|occurs?|results?|causes?|includes?|presents?|may|can|does|do)\b/i.test(t)) return false;

  // Too many commas (it's a list, not a term)
  if ((t.match(/,/g) || []).length >= 3) return false;

  // Contextualized heading that's still generic (e.g. "Fibula — Common Uses", "BPPV — Complications")
  if (/\s*[—–-]\s*(Common Uses|Advantages|Disadvantages|Complications|Causes|Types|Indications|Contraindications|Treatment|Management|Workup|SSx|S?Symptoms|Signs|Labs|Imaging|Prevention|Prognosis|Evaluation|Overview|Classification|Pathogenesis|Pathophysiology|Etiology|Clinical Features|Clinical Presentation|Diagnosis|Epidemiology|Risk Factors|Staging|Physical Exam|Differential|Background|Summary|Introduction|History|Follow.?up|Pearls|Pitfalls)$/i.test(t)) return false;

  // Figure references
  if (/^(In\s+)?Figure\s/i.test(t)) return false;

  // Double-hyphen OCR artifacts
  if (/--/.test(t)) return false;

  // Pure time durations
  if (/^\d[\d–-]*\s*(weeks?|days?|months?|years?|hours?|minutes?)$/i.test(t)) return false;

  return true;
}

function isClozeEligible(fact) {
  if (!fact || !fact.term || !fact.definition) return false;
  if (!isUsefulTerm(fact.term.trim())) return false;

  const def = fact.definition.trim();
  // Must have an explanatory verb (actual prose, not a list)
  if (!hasExplanatoryVerb(def)) return false;
  // Must be real prose, not a bare comma-list
  const commas = (def.match(/,/g) || []).length;
  const words = def.split(/\s+/).length;
  if (commas >= 3 && words < 12) return false;
  // Must have enough content for a meaningful question
  if (words < 8) return false;
  // Reject dangling references
  if (/\(see\s+(also\s+)?p\.?\s*$|\(see\s*$/.test(def)) return false;
  return true;
}

/** Trim a definition to its first meaningful clause for use as an option label */
function trimDefinitionForOption(text, maxLen = 80) {
  let t = (text || "").trim();
  // Strip trailing dangling refs
  t = t.replace(/[;,]\s*see\s+(also\s+)?p\.?.*$/i, "").trim();
  t = t.replace(/\s*\(see\s+(also\s+)?p[^)]*\)?\s*$/i, "").trim();
  // Strip leading page references
  t = t.replace(/^\(see\s+(pp?\.\s*)?[\d–-]+\)\s*/i, "").trim();

  // Helper: check parentheses are balanced in a string
  function parensBalanced(s) {
    let depth = 0;
    for (const ch of s) {
      if (ch === "(") depth++;
      if (ch === ")") depth--;
      if (depth < 0) return false;
    }
    return depth === 0;
  }

  // Try to cut at first sentence/clause boundary (only if parens balanced)
  const cutPoints = [/[.;!?]\s/, /;\s/, /,\s(?=[a-z])/i];
  for (const pattern of cutPoints) {
    const match = pattern.exec(t);
    if (match && match.index >= 20 && match.index <= maxLen) {
      let result = t.slice(0, match.index + 1).trim();
      result = result.replace(/[,;:\s]+$/, "").trim();
      if (result.length >= 15 && parensBalanced(result)) return result;
    }
  }
  // Hard trim if still too long
  if (t.length > maxLen) {
    const spaceIdx = t.lastIndexOf(" ", maxLen);
    let result = t.slice(0, spaceIdx > 20 ? spaceIdx : maxLen).trim();
    // Clean trailing dangling words and punctuation
    result = result.replace(/\s+(or|and|the|a|of|in|to|for|with)\s*$/i, "").trim();
    result = result.replace(/[,;:\s]+$/, "").trim();
    // If we cut inside a parenthesis, trim back to before it
    if (!parensBalanced(result)) {
      const lastOpen = result.lastIndexOf("(");
      if (lastOpen > 15) {
        result = result.slice(0, lastOpen).trim().replace(/[,;:\s]+$/, "").trim();
      }
    }
    if (result.length >= 15) return result;
  }
  // Clean any trailing punctuation on short text too
  t = t.replace(/[,;:\s]+$/, "").trim();
  // Final safety: if unbalanced parens, trim back to before the open paren
  if (!parensBalanced(t)) {
    const lastOpen = t.lastIndexOf("(");
    if (lastOpen > 10) {
      t = t.slice(0, lastOpen).trim().replace(/[,;:\s]+$/, "").trim();
    }
  }
  return t;
}

/** Check if a definition is clean enough to show as an option */
function isCleanDefinition(def) {
  const t = (def || "").trim();
  if (t.length < 10) return false;
  // Reject truncated text ending mid-word or with dangling punctuation
  if (/[,;:\(]\s*$/.test(t)) return false;
  // Reject trailing "or", "and", "the", etc.
  if (/\b(or|and|the|a|of|in|to|for|with)\s*$/i.test(t)) return false;
  // Reject pure references
  if (/^see\s/i.test(t)) return false;
  // Reject figure references
  if (/^(In\s+)?Figure\s/i.test(t)) return false;
  // Reject page references
  if (/^\(see\s+(pp?\.\s*)?/i.test(t)) return false;
  // Reject unbalanced parentheses (truncated mid-expression)
  const opens = (t.match(/\(/g) || []).length;
  const closes = (t.match(/\)/g) || []).length;
  if (opens !== closes) return false;
  // Must have at least some alphabetic content
  if (!/[a-z]{3,}/i.test(t)) return false;
  // Reject definitions that are too short to be meaningful
  if (t.split(/\s+/).length < 3) return false;
  return true;
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
  if (definition.length < 12 || definition.length > 320) {
    return false;
  }
  if (!/[A-Za-z]/.test(term) || !/[A-Za-z]/.test(definition)) {
    return false;
  }
  if (isNoisyShorthandTerm(term)) {
    return false;
  }
  if (!isUsefulTerm(term)) {
    return false;
  }
  if (/^\d+(?:[-–]\d+)?$/.test(term)) {
    return false;
  }
  if ((term.match(/[,;:()]/g) || []).length >= 4) {
    return false;
  }
  const definitionWords = definition.split(/\s+/);
  if (definitionWords.length < 4 || definitionWords.length > 56) {
    return false;
  }
  const commaCount = (definition.match(/,/g) || []).length;
  if (definition.length > 200 && !/[.;!?]/.test(definition) && commaCount >= 4) {
    return false;
  }
  if (/\.\s*\.\s*\./.test(term) || /\.\s*\.\s*\./.test(definition)) {
    return false;
  }
  // Reject circular terms: where the term is essentially just the definition restated
  const termNorm = term.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
  const defNorm = definition.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
  if (defNorm.startsWith(termNorm) && termNorm.length > 10) {
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

function buildSmartPeerPool(fact) {
  const siblings = fact.siblingIds && fact.siblingIds.length > 0
    ? state.activeFacts.filter(f => fact.siblingIds.includes(f.id))
    : [];

  const sameOrganAndLength = fact.organSystems && fact.organSystems.length > 0
    ? state.activeFacts.filter(
        f =>
          f.id !== fact.id &&
          !siblings.some(s => s.id === f.id) &&
          f.organSystems &&
          f.organSystems.some(org => fact.organSystems.includes(org)) &&
          Math.abs((f.term || "").length - (fact.term || "").length) <= 20
      )
    : [];

  const sameDiseaseDomain = fact.diseaseDomains && fact.diseaseDomains.length > 0
    ? state.activeFacts.filter(
        f =>
          f.id !== fact.id &&
          !siblings.some(s => s.id === f.id) &&
          !sameOrganAndLength.some(s => s.id === f.id) &&
          f.diseaseDomains &&
          f.diseaseDomains.some(dd => fact.diseaseDomains.includes(dd))
      )
    : [];

  const sameTopic = state.activeFacts.filter(
    (f) =>
      f.id !== fact.id &&
      !siblings.some(s => s.id === f.id) &&
      !sameOrganAndLength.some(s => s.id === f.id) &&
      !sameDiseaseDomain.some(s => s.id === f.id) &&
      f.topic === fact.topic
  );

  const fallback = state.activeFacts.filter(
    (f) =>
      f.id !== fact.id &&
      !siblings.some(s => s.id === f.id) &&
      !sameOrganAndLength.some(s => s.id === f.id) &&
      !sameDiseaseDomain.some(s => s.id === f.id) &&
      !sameTopic.some(s => s.id === f.id)
  );

  return shuffle([...siblings, ...sameOrganAndLength, ...sameDiseaseDomain, ...sameTopic, ...fallback]);
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

function extractMeasurementUnit(value) {
  const match = String(value || "").match(
    /\b(mm|cm|mL|mg|g|dB|Hz|kHz|years?|weeks?|months?|days?|hours?)\b/i
  );
  return match ? match[1].toLowerCase() : "";
}

function pickTypedDistractors(type, correctValue, neededCount = 3) {
  const sourcePool = Array.from(state.choicePools[type] || []);
  const normalizedCorrect = normalizeChoice(correctValue);
  let candidates = sourcePool.filter(
    (value) => normalizeChoice(value) !== normalizedCorrect
  );

  if (type === "measurement") {
    const correctUnit = extractMeasurementUnit(correctValue);
    if (correctUnit) {
      const sameUnitCandidates = candidates.filter(
        (value) => extractMeasurementUnit(value) === correctUnit
      );
      if (sameUnitCandidates.length >= neededCount) {
        candidates = sameUnitCandidates;
      }
    }
  }

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

function expandTypedAnchorRange(definition, anchor) {
  if (!definition || !anchor) {
    return { start: 0, end: 0 };
  }

  let start = anchor.start;
  let end = anchor.end;
  if (!["measurement", "percentage", "count"].includes(anchor.type)) {
    return { start, end };
  }

  const prefix = definition.slice(Math.max(0, anchor.start - 16), anchor.start);
  const rangePrefixMatch = prefix.match(/(\d+(?:\.\d+)?)\s*[–-]\s*$/);
  if (rangePrefixMatch) {
    start = anchor.start - rangePrefixMatch[0].length;
  }

  return { start, end };
}

function findLeftBoundary(text, from, pattern) {
  for (let index = from - 1; index >= 0; index -= 1) {
    if (pattern.test(text[index])) {
      return index + 1;
    }
  }
  return 0;
}

function findRightBoundary(text, from, pattern) {
  for (let index = from; index < text.length; index += 1) {
    if (pattern.test(text[index])) {
      return index;
    }
  }
  return text.length;
}

function buildFocusedClozeDefinition(definition, anchor) {
  const text = String(definition || "").trim();
  if (!text) {
    return "";
  }

  const expanded = expandTypedAnchorRange(text, anchor);
  let start = findLeftBoundary(text, expanded.start, /[.!?]/);
  let end = findRightBoundary(text, expanded.end, /[.!?]/);

  if (end - start < 48 || end - start > 220) {
    start = findLeftBoundary(text, expanded.start, /[.;,:]/);
    end = findRightBoundary(text, expanded.end, /[.;,:]/);
  }

  if (end - start < 36 || end - start > 240) {
    const windowHalf = 105;
    start = Math.max(0, expanded.start - windowHalf);
    end = Math.min(text.length, expanded.end + windowHalf);

    while (start > 0 && /\S/.test(text[start - 1])) {
      start -= 1;
    }
    while (end < text.length && /\S/.test(text[end])) {
      end += 1;
    }
  }

  const relativeStart = Math.max(0, expanded.start - start);
  const relativeEnd = Math.max(relativeStart + 1, expanded.end - start);
  let cloze = replaceRangeWithBlank(text.slice(start, end), relativeStart, relativeEnd)
    .replace(/\s+/g, " ")
    .trim();

  if (start > 0) {
    cloze = `... ${cloze}`;
  }
  if (end < text.length) {
    cloze = `${cloze} ...`;
  }

  return cloze;
}

function isHighQualityTypedStem(stem) {
  const text = String(stem || "").trim();
  if (!text) {
    return false;
  }
  const words = text.split(/\s+/);
  if (words.length < 7 || words.length > 45) {
    return false;
  }
  if ((text.match(/,/g) || []).length > 5 && !/[.;!?]/.test(text)) {
    return false;
  }
  return true;
}

/* ═══════════════════════════════════════════════════════════════════════════════
 *  QUESTION BUILDERS — Clean, readable flashcard-style questions
 *
 *  Every option MUST pass isUsefulTerm() before it can appear as a choice.
 *  Prompts are short and direct. Context goes in the topic tag, not the prompt.
 * ═══════════════════════════════════════════════════════════════════════════════ */

function isGoodOptionTerm(term) {
  const t = (term || "").trim();
  if (!t || t.length < 3 || t.length > 70) return false;
  if (!isUsefulTerm(t)) return false;
  if (isGenericHeadingTerm(t)) return false;
  if (isNoisyShorthandTerm(t)) return false;
  // Reject things that look like sentence fragments
  if (/\b(is|are|was|were|may|can)\b/i.test(t) && t.split(/\s+/).length > 4) return false;
  // Must start with a capital or digit (proper term, not a fragment)
  if (!/^[A-Z0-9(]/.test(t)) return false;
  // Max 7 words for clean option labels
  if (t.split(/\s+/).length > 7) return false;
  // Reject "Other SSx", "Recurrent SSx", "GERD SSx" patterns
  if (/\bS?Sx\b/i.test(t)) return false;
  // Reject terms with em-dash heading suffixes that slipped through
  if (/\s*[—–]\s*(Pathogenesis|Pathophysiology|Etiology|Diagnosis|Epidemiology|Clinical|Risk|Staging)\b/i.test(t)) return false;
  // Reject OCR double-hyphen artifacts ("Long--Term", "Thin--Skinned")
  if (/--/.test(t)) return false;
  // Reject pure time durations ("5-6 weeks", "2-3 days", "1100 Weeks")
  if (/^\d[\d–-]*\s*(weeks?|days?|months?|years?|hours?|minutes?|seconds?)$/i.test(t)) return false;
  // Reject overly generic single words that aren't specific medical terms
  if (t.split(/\s+/).length === 1 && /^(Syndrome|Mouth|Food|Pharynx|Chronic|Volume|Serology|Recovery|Stage|Type|Phase|Group|Grade|Class|Level|Other|None|Unknown|Normal|Abnormal|Mild|Moderate|Severe|Acute|Early|Late|Primary|Secondary|Boundaries|Features|Histopathology|Embryology|Anatomy|Pathology|Physiology|Pathogens|Treatment|Evaluation|Apnea|Complications|Advantages|Disadvantages|Indications|Contraindications|Prognosis|Etiology|Epidemiology|Workup|Prevention|Overview|Summary|Background|Introduction|History|Imaging|Signs|Symptoms|Diagnosis|Technique|Cardiovascular|Cerebrovascular|Congenital|Bacterial|Viral|Fungal|Medications|Observation|Contents|Keratotic|Latency|Rollover|Downward|NOTE|Bleach|Eyes|Risks|Lip|Palate|Postoperative|Systemic|Idiopathic|Contributing|Allografts|Mechanism|Bleeding|Segmental|Laryngeal|Neurologic|Otologic|Neck|Fractures|Angiography|Ultrasound|Vasculature|Audiogram|Peak|Location|Considerations|Function|Procedure|Longitudinal|Phases|Web|Audiometry|Ring|Image|Planning|Superficial|Catarrhal|Parotid|Subtypes)$/i.test(t)) return false;
  // Reject generic heading-style multi-word terms
  if (/^(Anterior Boundary|Posterior Boundary|Lateral Boundary|Medial Boundary|Superior Boundary|Inferior Boundary|Radiographic Findings|Clinical Findings|Physical Findings|Lab Findings|Best Students|Volume at Adult|Address Secondary|Risks of Bad Outcome|Contributing Factors|Epithelial Component|Stromal Component|Lymphocytic Predominance|Six Different|Genetic factors|Granulomatous Disease|Types and Pathophysiology|Types and Treatment|Side Effects|Mechanism of Action|Embryologic Pathology|Positioning Testing|EEG Changes|Innate Immunity)$/i.test(t)) return false;
  // Reject terms starting with percentages or numbers followed by text descriptions
  if (/^\d+%\s/.test(t)) return false;
  // Reject Grade I/II/III/IV style terms
  if (/^Grade\s+[IVX\d]+$/i.test(t)) return false;
  // Reject Type I/II/III/IV style terms (too ambiguous without context)
  if (/^Type\s+[IVX\d]+$/i.test(t)) return false;
  // Reject "Other ___" generic terms
  if (/^Other\s/i.test(t) && t.split(/\s+/).length <= 3) return false;
  // Reject "Associated ___" generic terms
  if (/^Associated\s/i.test(t) && t.split(/\s+/).length <= 3) return false;
  // Reject parenthetical fragments like "(pediatrics)"
  if (/^\(/.test(t)) return false;
  // Min 2 real characters (not just abbreviations)
  if (t.length < 4 && !/[aeiou]/i.test(t)) return false;
  return true;
}

function pickCleanTermDistractors(fact, count = 3) {
  const pool = buildSmartPeerPool(fact);
  const correctNorm = normalizeChoice(fact.term);
  const used = new Set([correctNorm]);
  const result = [];
  for (const peer of pool) {
    const t = (peer.term || "").trim();
    const norm = normalizeChoice(t);
    if (used.has(norm)) continue;
    if (!isGoodOptionTerm(t)) continue;
    // Similar word count to correct term (within 3)
    if (Math.abs(t.split(/\s+/).length - fact.term.split(/\s+/).length) > 3) continue;
    used.add(norm);
    result.push(t);
    if (result.length >= count) break;
  }
  return result;
}

function buildTypedClozeQuestion(fact) {
  if (!isClozeEligible(fact)) return null;

  const anchors = findTypedTokens(fact.definition).filter((t) => t.type !== "count");
  for (const anchor of anchors) {
    const distractors = pickTypedDistractors(anchor.type, anchor.value, 3);
    if (distractors.length < 3) continue;

    const stem = buildFocusedClozeDefinition(fact.definition, anchor);
    if (!isHighQualityTypedStem(stem)) continue;

    const options = shuffle([
      { value: anchor.value, correct: true },
      ...distractors.map((v) => ({ value: v, correct: false })),
    ]);

    const term = fact.term.trim();
    const prompt = isGenericHeadingTerm(term)
      ? `Fill in the blank:`
      : `"${trimForDisplay(term, 60)}" — fill in the blank:`;

    return {
      fact,
      mode: "cloze-typed",
      prompt,
      detail: stem,
      options,
    };
  }
  return null;
}

function buildTermClozeQuestion(fact) {
  if (!isClozeEligible(fact)) return null;
  const correctTerm = fact.term.trim();
  if (!isGoodOptionTerm(correctTerm)) return null;

  const distractors = pickCleanTermDistractors(fact, 3);
  if (distractors.length < 3) return null;

  const options = shuffle([
    { value: correctTerm, correct: true },
    ...distractors.map((t) => ({ value: t, correct: false })),
  ]);

  const detail = trimDefinitionForOption(fact.definition, 200);
  // Require enough detail text for a meaningful question
  if (detail.split(/\s+/).length < 5) return null;

  return {
    fact,
    mode: "cloze-term",
    prompt: "What term is being described?",
    detail,
    options,
  };
}

function buildDifferentiationQuestion(fact) {
  if (!fact.siblingIds || fact.siblingIds.length < 3) return null;
  const correctTerm = fact.term.trim();
  if (!isGoodOptionTerm(correctTerm)) return null;
  if (!hasExplanatoryVerb(fact.definition)) return null;
  // Require substantial definitions for question detail
  if (fact.definition.trim().split(/\s+/).length < 6) return null;

  const correctNorm = normalizeChoice(correctTerm);
  const usedNorms = new Set([correctNorm]);
  const siblings = shuffle(state.activeFacts
    .filter(f => fact.siblingIds.includes(f.id) && isGoodOptionTerm(f.term.trim())));

  const distractors = [];
  for (const s of siblings) {
    const norm = normalizeChoice(s.term.trim());
    if (usedNorms.has(norm)) continue;
    usedNorms.add(norm);
    distractors.push(s.term.trim());
    if (distractors.length >= 3) break;
  }
  if (distractors.length < 3) return null;

  const options = shuffle([
    { value: correctTerm, correct: true },
    ...distractors.map(t => ({ value: t, correct: false })),
  ]);

  return {
    fact,
    mode: "differentiation",
    prompt: "Which of these matches the description?",
    detail: trimDefinitionForOption(fact.definition, 200),
    options: options.slice(0, 4),
  };
}

function buildAssociationQuestion(fact) {
  if (!fact.parentSection) return null;
  const def = fact.definition.trim();
  if (!def || def.length < 35 || def.split(/\s+/).length < 6) return null;
  const correctTerm = fact.term.trim();
  if (!isGoodOptionTerm(correctTerm)) return null;

  const correctNorm = normalizeChoice(correctTerm);
  const usedNorms = new Set([correctNorm]);
  const peers = shuffle(state.activeFacts.filter(
    f => f.id !== fact.id &&
      f.parentSection === fact.parentSection &&
      isGoodOptionTerm(f.term.trim())
  ));

  const distractors = [];
  for (const p of peers) {
    const norm = normalizeChoice(p.term.trim());
    if (usedNorms.has(norm)) continue;
    usedNorms.add(norm);
    distractors.push(p.term.trim());
    if (distractors.length >= 3) break;
  }
  if (distractors.length < 3) return null;

  const options = shuffle([
    { value: correctTerm, correct: true },
    ...distractors.map(t => ({ value: t, correct: false })),
  ]);

  return {
    fact,
    mode: "association",
    prompt: "Which condition does this describe?",
    detail: trimDefinitionForOption(def, 200),
    options: options.slice(0, 4),
  };
}

function buildQuestion(fact, mode) {
  if (mode === "cloze") {
    return buildTypedClozeQuestion(fact) || buildTermClozeQuestion(fact);
  }
  if (mode === "differentiation") {
    return buildDifferentiationQuestion(fact);
  }
  if (mode === "association") {
    return buildAssociationQuestion(fact);
  }

  // term-to-definition and definition-to-term
  if (!isGoodOptionTerm(fact.term.trim())) return null;

  if (mode === "term-to-definition") {
    // Show the term, pick the right definition (trimmed to readable length)
    if (!isCleanDefinition(fact.definition)) return null;
    const correctDef = trimDefinitionForOption(fact.definition, 90);
    // Validate the trimmed version too
    if (!isCleanDefinition(correctDef)) return null;

    const pool = buildSmartPeerPool(fact);
    const options = [{ value: correctDef, correct: true }];
    const used = new Set([normalizeChoice(correctDef)]);

    for (const peer of pool) {
      if (!isCleanDefinition(peer.definition)) continue;
      const trimmed = trimDefinitionForOption(peer.definition, 90);
      // Validate trimmed version passes clean check
      if (!isCleanDefinition(trimmed)) continue;
      const norm = normalizeChoice(trimmed);
      if (used.has(norm)) continue;
      if (trimmed.length < 15) continue;
      options.push({ value: trimmed, correct: false });
      used.add(norm);
      if (options.length === 4) break;
    }
    if (options.length < 4) return null;

    return {
      fact,
      mode: "term-to-definition",
      prompt: `What is "${trimForDisplay(fact.term, 60)}"?`,
      detail: "",
      options: shuffle(options),
    };
  }

  // definition-to-term
  if (fact.definition.split(/\s+/).length < 5) return null;
  if (!hasExplanatoryVerb(fact.definition) && fact.definition.split(/\s+/).length < 8) return null;

  const distractors = pickCleanTermDistractors(fact, 3);
  if (distractors.length < 3) return null;

  const options = shuffle([
    { value: fact.term.trim(), correct: true },
    ...distractors.map((t) => ({ value: t, correct: false })),
  ]);

  return {
    fact,
    mode: "definition-to-term",
    prompt: "What term matches this description?",
    detail: trimDefinitionForOption(fact.definition, 200),
    options,
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

function loadMissedFactIds() {
  try {
    const stored = localStorage.getItem("pasha-missed-facts");
    if (stored) {
      state.missedFactIds = JSON.parse(stored);
    }
  } catch (e) {
    state.missedFactIds = [];
  }
  updateMissedCountLabel();
}

function saveMissedFactIds() {
  try {
    localStorage.setItem("pasha-missed-facts", JSON.stringify(state.missedFactIds));
  } catch (e) {
    // ignore localStorage errors
  }
  updateMissedCountLabel();
}

function updateMissedCountLabel() {
  if (els.missedCountLabel) {
    els.missedCountLabel.textContent = state.missedFactIds.length
      ? `${state.missedFactIds.length} missed facts in storage`
      : "No missed facts saved";
  }
}

function selectFactsWithBias(candidates, missedIds, percentage = 30) {
  const totalCount = candidates.length;
  const missedCount = Math.ceil((totalCount * percentage) / 100);
  const missed = candidates.filter(f => missedIds.includes(f.id));
  const regular = candidates.filter(f => !missedIds.includes(f.id));

  const selectedMissed = shuffle(missed).slice(0, missedCount);
  const remaining = totalCount - selectedMissed.length;
  const selectedRegular = shuffle(regular).slice(0, remaining);

  return shuffle([...selectedMissed, ...selectedRegular]);
}

function selectByDifficulty(candidates, difficulty) {
  if (difficulty === "easy") {
    const high = candidates.filter(f => f.qualityTier === "high");
    const medium = candidates.filter(f => f.qualityTier === "medium");
    const easy70 = shuffle(high).slice(0, Math.ceil(candidates.length * 0.7));
    const easy30 = shuffle(medium).slice(0, candidates.length - easy70.length);
    return shuffle([...easy70, ...easy30]);
  }

  if (difficulty === "standard") {
    const high = candidates.filter(f => f.qualityTier === "high");
    const medium = candidates.filter(f => f.qualityTier === "medium");
    const low = candidates.filter(f => f.qualityTier === "low");

    const highCount = Math.ceil(candidates.length * 0.4);
    const mediumCount = Math.ceil(candidates.length * 0.4);
    const lowCount = candidates.length - highCount - mediumCount;

    const selected = [
      ...shuffle(high).slice(0, highCount),
      ...shuffle(medium).slice(0, mediumCount),
      ...shuffle(low).slice(0, lowCount),
    ];
    return shuffle(selected);
  }

  if (difficulty === "hard") {
    return shuffle(candidates);
  }

  return shuffle(candidates);
}

function selectQuestionMode(difficulty) {
  if (difficulty === "hard") {
    const roll = Math.random();
    if (roll < 0.6) {
      return "differentiation";
    } else if (roll < 0.75) {
      return "cloze";
    } else if (roll < 0.9) {
      return "association";
    } else {
      return "term-to-definition";
    }
  }

  if (els.modeSelect.value === "cloze") {
    return "cloze";
  }
  if (els.modeSelect.value === "differentiation") {
    return "differentiation";
  }
  if (els.modeSelect.value === "association") {
    return "association";
  }
  if (els.modeSelect.value === "term-to-definition") {
    return "term-to-definition";
  }
  if (els.modeSelect.value === "definition-to-term") {
    return "definition-to-term";
  }
  if (els.modeSelect.value === "mixed-smart") {
    const roll = Math.random();
    if (roll < 0.4) {
      return "cloze";
    } else if (roll < 0.65) {
      return "differentiation";
    } else if (roll < 0.85) {
      return "association";
    } else {
      return "term-to-definition";
    }
  }

  return "cloze";
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
    const difficulty = els.difficultySelect ? els.difficultySelect.value : "standard";
    let selectedMode = selectQuestionMode(difficulty);

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
  if (els.feedbackDetail) {
    els.feedbackDetail.innerHTML = "";
  }
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

function renderFeedbackDetail(question, isCorrect) {
  if (!els.feedbackDetail) {
    return;
  }

  if (isCorrect) {
    els.feedbackDetail.innerHTML = "";
    return;
  }

  const fact = question.fact;
  let html = "";

  html += `<div style="margin-bottom: 12px; padding: 10px; background: #f5f5f5; border-radius: 4px;">`;
  html += `<strong>${escapeHtml(fact.term)}</strong><br/>`;
  html += `<em>${escapeHtml(trimForDisplay(fact.definition, 180))}</em>`;
  html += `</div>`;

  if (fact.siblingIds && fact.siblingIds.length > 0) {
    const siblings = state.activeFacts.filter(f => fact.siblingIds.includes(f.id));
    if (siblings.length > 0) {
      const siblingsToShow = shuffle(siblings).slice(0, 3);
      html += `<div style="font-size: 0.9em; color: #666;">`;
      html += `<strong>Don't confuse with:</strong><br/>`;
      html += siblingsToShow.map(s => `• ${escapeHtml(s.term)}`).join("<br/>");
      html += `</div>`;
    }
  }

  els.feedbackDetail.innerHTML = html;
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
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

  // Record progress for every answer
  recordAnswer(state.currentQuestion.fact.id, isCorrect);

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
        renderFeedbackDetail(state.currentQuestion, true);
      } else {
        player.missed += 1;
        els.feedback.textContent = isTimeout
          ? `${playerName}: Time expired.`
          : `${playerName}: Incorrect.`;
        els.feedback.className = "feedback wrong";
        renderFeedbackDetail(state.currentQuestion, false);

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

        if (state.currentQuestion.fact.id) {
          if (!state.missedFactIds.includes(state.currentQuestion.fact.id)) {
            state.missedFactIds.push(state.currentQuestion.fact.id);
          }
        }
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
    renderFeedbackDetail(state.currentQuestion, true);
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

    if (state.currentQuestion.fact.id) {
      if (!state.missedFactIds.includes(state.currentQuestion.fact.id)) {
        state.missedFactIds.push(state.currentQuestion.fact.id);
      }
    }

    els.feedback.textContent = isTimeout ? "Time expired." : "Incorrect.";
    els.feedback.className = "feedback wrong";
    renderFeedbackDetail(state.currentQuestion, false);
  }

  saveMissedFactIds();
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
  recordSessionEnd();
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
  const usePriority = els.priorityModeToggle && els.priorityModeToggle.checked;
  let selectedFacts;

  if (usePriority) {
    // Priority mode: unseen first, then struggling, then stale, then mastered
    selectedFacts = selectFactsByPriority(state.activeFacts, requestedCount);
  } else {
    selectedFacts = shuffle(state.activeFacts).slice(0, requestedCount);
  }

  const difficulty = els.difficultySelect ? els.difficultySelect.value : "standard";
  selectedFacts = selectByDifficulty(selectedFacts, difficulty);

  if (!usePriority && state.missedFactIds.length > 0) {
    selectedFacts = selectFactsWithBias(selectedFacts, state.missedFactIds, 30);
  }

  const roundSize = Math.min(selectedFacts.length, state.activeFacts.length);
  state.roundFacts = selectedFacts.slice(0, roundSize);
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
  loadMissedFactIds();
  loadProgress();
  updateProgressDisplay();
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

if (els.clearMissedBtn) {
  els.clearMissedBtn.addEventListener("click", () => {
    state.missedFactIds = [];
    saveMissedFactIds();
  });
}

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
      "Opened OpenEvidence. Copy the question from the card above and paste it into search.";
    return;
  }

  navigator.clipboard
    .writeText(state.currentOpenEvidenceQuery)
    .then(() => {
      els.openEvidenceStatus.textContent =
        "Query copied to clipboard. Paste it into the OpenEvidence search bar.";
    })
    .catch(() => {
      els.openEvidenceStatus.textContent =
        "Opened OpenEvidence. Copy the question from the card above and paste it into search.";
    });
});

if (els.exportProgressBtn) {
  els.exportProgressBtn.addEventListener("click", exportProgressToFile);
}
const exportBtn2 = document.getElementById("exportProgressBtn2");
if (exportBtn2) {
  exportBtn2.addEventListener("click", exportProgressToFile);
}
if (els.importProgressBtn && els.importProgressFile) {
  els.importProgressBtn.addEventListener("click", () => els.importProgressFile.click());
  els.importProgressFile.addEventListener("change", (e) => {
    if (e.target.files && e.target.files[0]) {
      importProgressFromFile(e.target.files[0]);
      e.target.value = "";
    }
  });
}

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
