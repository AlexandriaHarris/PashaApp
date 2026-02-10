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
  answerLocked: false,
  currentOpenEvidenceQuery: "",
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
  openEvidenceLink: document.getElementById("openEvidenceLink"),
  openEvidenceStatus: document.getElementById("openEvidenceStatus"),
  options: document.getElementById("options"),
  feedback: document.getElementById("feedback"),
  nextBtn: document.getElementById("nextBtn"),
  resultsSummary: document.getElementById("resultsSummary"),
  missedList: document.getElementById("missedList"),
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
  } else if (question.mode === "prose-statement") {
    lines.push(`Statement focus: ${question.fact.term}`);
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

function sortFacetEntries(counts) {
  return Object.entries(counts || {}).sort((left, right) => {
    if (right[1] !== left[1]) {
      return right[1] - left[1];
    }
    return left[0].localeCompare(right[0]);
  });
}

function normalizeFactShape(rawFact) {
  const topic = rawFact.topic || "Unspecified";
  const chapter =
    rawFact.chapter ||
    (rawFact.chapterNumber && rawFact.chapterTitle
      ? `Chapter ${rawFact.chapterNumber}: ${rawFact.chapterTitle}`
      : topic);

  const organSystems = Array.isArray(rawFact.organSystems) ? rawFact.organSystems : [];
  const diseaseDomains = Array.isArray(rawFact.diseaseDomains)
    ? rawFact.diseaseDomains
    : Array.isArray(rawFact.clinicalDomains)
    ? rawFact.clinicalDomains
    : [];
  const focusAreas = Array.isArray(rawFact.focusAreas) ? rawFact.focusAreas : [];

  const searchText = [
    rawFact.term || "",
    rawFact.definition || "",
    topic,
    chapter,
    rawFact.section || "",
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
    section: rawFact.section || "",
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

function renderFacetList(container, counts, defaultChecked) {
  container.innerHTML = "";
  const entries = sortFacetEntries(counts);

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

  renderFacetList(els.sectionList, sectionCounts, true);

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

function updateHud() {
  els.progressLabel.textContent = `Question ${state.index + 1} / ${state.roundFacts.length}`;
  els.scoreLabel.textContent = `Score ${state.score}`;
  els.streakLabel.textContent = `Streak ${state.streak}`;
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

  els.timerLabel.hidden = false;
  state.timeLeft = 25;
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

function buildQuestion(fact, mode) {
  if (fact.sourceType === "prose") {
    const preferred = state.activeFacts.filter(
      (other) =>
        other.id !== fact.id && other.sourceType === "prose" && other.topic === fact.topic
    );
    const fallbackProse = state.activeFacts.filter(
      (other) =>
        other.id !== fact.id && other.sourceType === "prose" && other.topic !== fact.topic
    );
    const fallbackAny = state.activeFacts.filter(
      (other) => other.id !== fact.id && other.sourceType !== "prose"
    );
    const pool = shuffle([...preferred, ...fallbackProse, ...fallbackAny]);

    const options = [{ value: fact.definition, correct: true }];
    const used = new Set([normalizeChoice(fact.definition)]);

    for (const candidate of pool) {
      const value = candidate.definition;
      if (!value || value.length < 16) {
        continue;
      }
      const normalized = normalizeChoice(value);
      if (used.has(normalized)) {
        continue;
      }
      options.push({ value, correct: false });
      used.add(normalized);
      if (options.length === 4) {
        break;
      }
    }

    if (options.length < 4) {
      return null;
    }

    return {
      fact,
      mode: "prose-statement",
      prompt: "Which statement is most accurate?",
      detail: fact.term ? `Focus: ${trimForDisplay(fact.term, 140)}` : "Choose one statement.",
      options: shuffle(options),
    };
  }

  const correctValue = mode === "term-to-definition" ? fact.definition : fact.term;
  const useValueFromFact =
    mode === "term-to-definition"
      ? (otherFact) => otherFact.definition
      : (otherFact) => otherFact.term;

  const preferred = state.activeFacts.filter(
    (other) => other.id !== fact.id && other.topic === fact.topic
  );
  const fallback = state.activeFacts.filter(
    (other) => other.id !== fact.id && other.topic !== fact.topic
  );
  const pool = shuffle([...preferred, ...fallback]);

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

  const prompt =
    mode === "term-to-definition"
      ? `Best definition for "${fact.term}"?`
      : "Which term matches this description?";

  const detail =
    mode === "term-to-definition"
      ? "Choose the best matching definition."
      : trimForDisplay(fact.definition, 280);

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
  const fact = state.roundFacts[state.index];
  const selectedMode =
    els.modeSelect.value === "mixed"
      ? Math.random() > 0.5
        ? "term-to-definition"
        : "definition-to-term"
      : els.modeSelect.value;

  const question = buildQuestionWithFallback(fact, selectedMode);
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

  if (isCorrect) {
    state.correct += 1;
    state.streak += 1;
    const points = 10 + Math.min(state.streak * 2, 24);
    state.score += points;
    els.feedback.textContent = `Correct. +${points} points`;
    els.feedback.className = "feedback correct";
  } else {
    state.streak = 0;
    const selectedValue = isTimeout
      ? "(time expired)"
      : selectedOption
      ? selectedOption.value
      : "(none)";
    const correctOption = state.currentQuestion.options.find((option) => option.correct);

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
        : miss.mode === "prose-statement"
        ? "Correct Statement"
        : "Correct Term";
    const termLabel = miss.mode === "prose-statement" ? "Statement Focus" : "Term";
    const definitionLabel = miss.mode === "prose-statement" ? "Source Statement" : "Definition";
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
  const total = state.roundFacts.length;
  const percent = total > 0 ? Math.round((state.correct / total) * 100) : 0;
  els.resultsSummary.textContent = `Score ${state.score}. Accuracy ${state.correct}/${total} (${percent}%). Missed ${state.missed.length}.`;
  renderMissed();
  showPanel("results");
}

function startRound() {
  els.setupError.textContent = "";

  const filtered = applyFilters(true);
  if (filtered.error) {
    els.setupError.textContent = filtered.error;
    return;
  }

  state.activeFacts = filtered.facts;
  if (state.activeFacts.length < 4) {
    els.setupError.textContent =
      "Need at least 4 facts after filtering to build multiple-choice questions.";
    return;
  }

  const requestedCount = Number(els.countSelect.value);
  const roundSize = Math.min(requestedCount, state.activeFacts.length);
  state.roundFacts = shuffle(state.activeFacts).slice(0, roundSize);
  state.index = 0;
  state.correct = 0;
  state.score = 0;
  state.streak = 0;
  state.missed = [];
  state.timedMode = els.timedToggle.checked;

  showPanel("game");
  renderQuestion();
}

function gotoNextQuestion() {
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
    lines.push(`Chapter: ${miss.chapter || ""}`);
    lines.push(`Topic: ${miss.topic}`);
    lines.push(
      `${miss.mode === "prose-statement" ? "Statement Focus" : "Term"}: ${miss.term}`
    );
    lines.push(
      `${miss.mode === "prose-statement" ? "Source Statement" : "Definition"}: ${
        miss.definition
      }`
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
  const incomingFacetCounts = bank.facetCounts || {};

  state.facetCounts = {
    topic: incomingFacetCounts.topic || bank.topicCounts || fallbackFacetCounts.topic,
    chapter: incomingFacetCounts.chapter || fallbackFacetCounts.chapter,
    section: incomingFacetCounts.section || fallbackFacetCounts.section || {},
    organSystems:
      incomingFacetCounts.organSystems || fallbackFacetCounts.organSystems || {},
    diseaseDomains:
      incomingFacetCounts.diseaseDomains ||
      incomingFacetCounts.clinicalDomains ||
      fallbackFacetCounts.diseaseDomains ||
      {},
    focusAreas: incomingFacetCounts.focusAreas || fallbackFacetCounts.focusAreas || {},
  };

  const sourceTypeCounts = bank.sourceTypeCounts || {};
  const colonCount = sourceTypeCounts.colon || 0;
  const proseCount = sourceTypeCounts.prose || 0;
  const chapterCount = Object.keys(state.facetCounts.chapter || {}).length;
  els.bankMeta.textContent = `${state.facts.length} facts across ${chapterCount} chapters (${colonCount} keyed + ${proseCount} prose).`;

  Object.entries(facetConfigs).forEach(([key, config]) => {
    renderFacetList(config.container, state.facetCounts[key] || {}, config.defaultChecked);
  });

  refreshSectionFacet(false);
  updateFilterMeta();
}

els.startBtn.addEventListener("click", startRound);
els.nextBtn.addEventListener("click", gotoNextQuestion);
els.restartBtn.addEventListener("click", () => {
  clearTimer();
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
