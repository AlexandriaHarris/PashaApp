const STORAGE_KEY = "question-evidence-checker-v1";
const MAX_RENDERED_QUESTIONS = 300;
const MAX_QUERY_LENGTH = 1500;

const STATUS_LABELS = {
  unreviewed: "Unreviewed",
  verified: "Verified",
  revise: "Needs Revision",
  unclear: "Unclear",
};

const SAMPLE_DATA = {
  questions: [
    {
      id: "ent_sample_001",
      category: "Otology",
      subcategory: "Hearing Loss",
      stem: "A 68-year-old with sudden unilateral sensorineural hearing loss presents 24 hours after onset.",
      leadIn: "What is the best immediate treatment?",
      options: [
        "Observation and audiogram in one month",
        "High-dose oral corticosteroids",
        "Topical antibiotic drops",
        "Routine vestibular suppressants only",
      ],
      correctIndex: 1,
      explanation:
        "Sudden sensorineural hearing loss should be treated promptly with corticosteroids, ideally within 2 weeks, with earlier treatment generally associated with better outcomes.",
      references: [
        "AAO-HNSF Clinical Practice Guideline: Sudden Hearing Loss (Update)",
        "Cummings Otolaryngology, latest edition",
      ],
    },
  ],
};

const state = {
  questions: [],
  selectedId: "",
  bankKey: "",
  reviews: {},
};

const els = {
  jsonInput: document.getElementById("jsonInput"),
  fileInput: document.getElementById("fileInput"),
  importBtn: document.getElementById("importBtn"),
  sampleBtn: document.getElementById("sampleBtn"),
  clearBtn: document.getElementById("clearBtn"),
  exportJsonBtn: document.getElementById("exportJsonBtn"),
  exportCsvBtn: document.getElementById("exportCsvBtn"),
  importStatus: document.getElementById("importStatus"),
  totalChip: document.getElementById("totalChip"),
  verifiedChip: document.getElementById("verifiedChip"),
  reviseChip: document.getElementById("reviseChip"),
  unclearChip: document.getElementById("unclearChip"),
  unreviewedChip: document.getElementById("unreviewedChip"),
  searchInput: document.getElementById("searchInput"),
  statusFilter: document.getElementById("statusFilter"),
  listMeta: document.getElementById("listMeta"),
  questionList: document.getElementById("questionList"),
  emptyState: document.getElementById("emptyState"),
  detailView: document.getElementById("detailView"),
  questionMeta: document.getElementById("questionMeta"),
  questionPrompt: document.getElementById("questionPrompt"),
  questionOptions: document.getElementById("questionOptions"),
  questionExplanation: document.getElementById("questionExplanation"),
  questionReferences: document.getElementById("questionReferences"),
  queryEditor: document.getElementById("queryEditor"),
  resetPromptBtn: document.getElementById("resetPromptBtn"),
  openEvidenceBtn: document.getElementById("openEvidenceBtn"),
  openAnswerCheckBtn: document.getElementById("openAnswerCheckBtn"),
  openPubMedBtn: document.getElementById("openPubMedBtn"),
  copyPromptBtn: document.getElementById("copyPromptBtn"),
  queryStatus: document.getElementById("queryStatus"),
  claimList: document.getElementById("claimList"),
  reviewStatus: document.getElementById("reviewStatus"),
  reviewConfidence: document.getElementById("reviewConfidence"),
  reviewCitations: document.getElementById("reviewCitations"),
  reviewNotes: document.getElementById("reviewNotes"),
  saveReviewBtn: document.getElementById("saveReviewBtn"),
  reviewMeta: document.getElementById("reviewMeta"),
};

function toStringSafe(value) {
  if (value === null || value === undefined) {
    return "";
  }
  return String(value).trim();
}

function ensureArray(value) {
  if (Array.isArray(value)) {
    return value;
  }
  if (value === null || value === undefined) {
    return [];
  }
  return [value];
}

function normalizeOption(option) {
  if (typeof option === "string") {
    return option.trim();
  }
  if (!option || typeof option !== "object") {
    return "";
  }
  return toStringSafe(option.text || option.label || option.value || option.option);
}

function inferCorrectIndex(raw, options) {
  if (Number.isFinite(raw.correctIndex)) {
    const value = Number(raw.correctIndex);
    return value >= 0 && value < options.length ? value : 0;
  }

  if (Array.isArray(raw.options)) {
    const objectCorrectIndex = raw.options.findIndex((option) => option && option.isCorrect === true);
    if (objectCorrectIndex >= 0) {
      return objectCorrectIndex;
    }
  }

  const rawCorrect = toStringSafe(raw.correctAnswer || raw.answer || raw.correct || "");
  if (rawCorrect) {
    const optionMatch = options.findIndex((option) => normalizeSpace(option) === normalizeSpace(rawCorrect));
    if (optionMatch >= 0) {
      return optionMatch;
    }
    const letter = rawCorrect.toUpperCase();
    if (/^[A-D]$/.test(letter)) {
      const index = letter.charCodeAt(0) - 65;
      if (index >= 0 && index < options.length) {
        return index;
      }
    }
  }

  return 0;
}

function normalizeSpace(text) {
  return toStringSafe(text).replace(/\s+/g, " ").toLowerCase();
}

function normalizeQuestion(raw, index) {
  const stem = toStringSafe(raw.stem || raw.question || raw.prompt || raw.title);
  const leadIn = toStringSafe(raw.leadIn || raw.leadin || raw.ask);
  const prompt = [stem, leadIn].filter(Boolean).join(" ").trim() || stem || leadIn;

  const options = ensureArray(raw.options || raw.answers || raw.choices)
    .map(normalizeOption)
    .filter(Boolean);

  const explanation = toStringSafe(raw.explanation || raw.rationale || raw.notes);

  const references = ensureArray(raw.references || raw.citations || raw.sources)
    .map((ref) => toStringSafe(ref))
    .filter(Boolean);

  const id = toStringSafe(raw.id || raw.questionId || raw.slug) || `q_${index + 1}`;

  return {
    id,
    category: toStringSafe(raw.category),
    subcategory: toStringSafe(raw.subcategory),
    difficulty: toStringSafe(raw.difficulty),
    stem,
    leadIn,
    prompt,
    options,
    correctIndex: inferCorrectIndex(raw, options),
    explanation,
    references,
    raw,
    searchBlob: [
      id,
      prompt,
      explanation,
      options.join(" "),
      toStringSafe(raw.keyPoint),
      toStringSafe(raw.category),
      toStringSafe(raw.subcategory),
    ]
      .join(" ")
      .toLowerCase(),
  };
}

function extractQuestionArray(parsed) {
  if (Array.isArray(parsed)) {
    return parsed;
  }
  if (parsed && typeof parsed === "object") {
    if (Array.isArray(parsed.questions)) {
      return parsed.questions;
    }
    if (Array.isArray(parsed.items)) {
      return parsed.items;
    }
    if (Array.isArray(parsed.data)) {
      return parsed.data;
    }
  }
  return [];
}

function simpleHash(text) {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash +=
      (hash << 1) +
      (hash << 4) +
      (hash << 7) +
      (hash << 8) +
      (hash << 24);
  }
  return (hash >>> 0).toString(16);
}

function buildBankKey(questions) {
  const signature = questions
    .slice(0, 150)
    .map((q) => `${q.id}|${q.prompt.slice(0, 120)}`)
    .join("||");
  return `bank-${questions.length}-${simpleHash(signature)}`;
}

function questionStorageKey(questionId) {
  return `${state.bankKey}::${questionId}`;
}

function loadStoredReviews() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {};
    }
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (_err) {
    return {};
  }
}

function saveStoredReviews() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.reviews));
  } catch (_err) {
    // Ignore localStorage write issues to keep app usable in restricted contexts.
  }
}

function getReview(questionId) {
  const key = questionStorageKey(questionId);
  return (
    state.reviews[key] || {
      status: "unreviewed",
      confidence: "",
      citations: "",
      notes: "",
      checkedAt: "",
    }
  );
}

function setReview(questionId, patch) {
  const key = questionStorageKey(questionId);
  const current = getReview(questionId);
  state.reviews[key] = {
    ...current,
    ...patch,
  };
  saveStoredReviews();
}

function statusClass(status) {
  if (status === "verified") {
    return "ok";
  }
  if (status === "revise") {
    return "warn";
  }
  if (status === "unclear") {
    return "alert";
  }
  return "muted";
}

function trimForDisplay(text, max = 126) {
  const value = toStringSafe(text);
  if (value.length <= max) {
    return value;
  }
  return `${value.slice(0, max - 1).trimEnd()}...`;
}

function buildPromptLines(question) {
  const lines = [];
  lines.push("Verify this learning question using open, citable evidence.");
  lines.push("");
  if (question.category) {
    lines.push(`Category: ${question.category}`);
  }
  if (question.subcategory) {
    lines.push(`Subcategory: ${question.subcategory}`);
  }
  if (question.difficulty) {
    lines.push(`Difficulty: ${question.difficulty}`);
  }
  lines.push(`Question ID: ${question.id}`);
  lines.push("");
  lines.push(`Question: ${question.prompt || question.stem}`);
  lines.push("Options:");
  question.options.forEach((option, index) => {
    const label = String.fromCharCode(65 + index);
    lines.push(`${label}. ${option}`);
  });
  if (question.options.length) {
    const correctText = question.options[question.correctIndex] || "";
    lines.push(`Current keyed answer: ${correctText}`);
  }
  if (question.explanation) {
    lines.push(`Current explanation: ${question.explanation}`);
  }
  lines.push("");
  lines.push("Tasks:");
  lines.push("1) Identify the best answer.");
  lines.push("2) State whether the current explanation is accurate, incomplete, or incorrect.");
  lines.push("3) Provide 2-4 citations from open/authoritative sources with publication year.");
  lines.push("4) If outdated, rewrite the explanation concisely.");
  return lines;
}

function buildAnswerOnlyPrompt(question) {
  const lines = [];
  lines.push("Determine the single best answer for this question and justify briefly.");
  lines.push(`Question: ${question.prompt || question.stem}`);
  lines.push("Options:");
  question.options.forEach((option, index) => {
    const label = String.fromCharCode(65 + index);
    lines.push(`${label}. ${option}`);
  });
  lines.push("Provide the best answer and why alternatives are less likely.");
  return lines.join("\n");
}

function buildOpenEvidenceUrl(queryText) {
  const clipped = queryText.length > MAX_QUERY_LENGTH ? queryText.slice(0, MAX_QUERY_LENGTH) : queryText;
  return `https://www.openevidence.com/?q=${encodeURIComponent(clipped)}`;
}

function buildPubMedQuery(question) {
  const bestAnswer = question.options[question.correctIndex] || "";
  const tokens = [question.prompt, bestAnswer]
    .join(" ")
    .replace(/[^\w\s-]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length >= 4)
    .slice(0, 16);
  return tokens.join(" ");
}

function buildPubMedUrl(queryText) {
  return `https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(queryText)}`;
}

function splitIntoClaims(text) {
  const rawSentences =
    toStringSafe(text)
      .replace(/\s+/g, " ")
      .match(/[^.!?]+[.!?]?/g) || [];

  return rawSentences
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length >= 24)
    .filter((sentence) => /\b(is|are|was|were|increases?|decreases?|associated|causes?|treated|recommended|should|typically|often)\b/i.test(sentence))
    .slice(0, 8);
}

function setImportStatus(message, tone = "muted") {
  els.importStatus.textContent = message;
  els.importStatus.className = `status ${tone}`;
}

function setQueryStatus(message, tone = "muted") {
  els.queryStatus.textContent = message;
  els.queryStatus.className = `status ${tone}`;
}

function setReviewStatusMessage(message, tone = "muted") {
  els.reviewMeta.textContent = message;
  els.reviewMeta.className = `status ${tone}`;
}

function getSelectedQuestion() {
  if (!state.selectedId) {
    return null;
  }
  return state.questions.find((question) => question.id === state.selectedId) || null;
}

function getFilteredQuestions() {
  const search = normalizeSpace(els.searchInput.value);
  const selectedStatus = els.statusFilter.value;
  return state.questions.filter((question) => {
    if (search && !question.searchBlob.includes(search)) {
      return false;
    }

    if (selectedStatus === "all") {
      return true;
    }

    const review = getReview(question.id);
    return (review.status || "unreviewed") === selectedStatus;
  });
}

function renderSummary() {
  const counts = {
    total: state.questions.length,
    verified: 0,
    revise: 0,
    unclear: 0,
    unreviewed: 0,
  };

  state.questions.forEach((question) => {
    const status = getReview(question.id).status || "unreviewed";
    if (status === "verified") {
      counts.verified += 1;
    } else if (status === "revise") {
      counts.revise += 1;
    } else if (status === "unclear") {
      counts.unclear += 1;
    } else {
      counts.unreviewed += 1;
    }
  });

  els.totalChip.textContent = `Total: ${counts.total}`;
  els.verifiedChip.textContent = `Verified: ${counts.verified}`;
  els.reviseChip.textContent = `Needs Revision: ${counts.revise}`;
  els.unclearChip.textContent = `Unclear: ${counts.unclear}`;
  els.unreviewedChip.textContent = `Unreviewed: ${counts.unreviewed}`;
}

function renderQuestionList() {
  els.questionList.innerHTML = "";
  const filtered = getFilteredQuestions();

  if (!state.questions.length) {
    els.listMeta.textContent = "Import questions to begin.";
    return;
  }

  let displayItems = filtered;
  if (filtered.length > MAX_RENDERED_QUESTIONS) {
    displayItems = filtered.slice(0, MAX_RENDERED_QUESTIONS);
    els.listMeta.textContent = `${filtered.length} matched. Showing first ${MAX_RENDERED_QUESTIONS}. Narrow with search/filter for full navigation.`;
  } else {
    els.listMeta.textContent = `${filtered.length} matched question${filtered.length === 1 ? "" : "s"}.`;
  }

  if (!displayItems.length) {
    const empty = document.createElement("p");
    empty.className = "muted";
    empty.textContent = "No questions match current filters.";
    els.questionList.appendChild(empty);
    return;
  }

  displayItems.forEach((question, index) => {
    const review = getReview(question.id);
    const status = review.status || "unreviewed";

    const button = document.createElement("button");
    button.type = "button";
    button.className = "question-item";
    if (state.selectedId === question.id) {
      button.classList.add("active");
    }
    button.dataset.questionId = question.id;

    const topRow = document.createElement("div");
    topRow.className = "question-item-top";

    const idLabel = document.createElement("span");
    idLabel.className = "question-id";
    idLabel.textContent = `${index + 1}. ${question.id}`;

    const statusLabel = document.createElement("span");
    statusLabel.className = `badge-${statusClass(status)}`;
    statusLabel.textContent = STATUS_LABELS[status] || STATUS_LABELS.unreviewed;

    topRow.appendChild(idLabel);
    topRow.appendChild(statusLabel);

    const summary = document.createElement("p");
    summary.className = "question-summary";
    summary.textContent = trimForDisplay(question.prompt || question.stem || "Untitled question");

    button.appendChild(topRow);
    button.appendChild(summary);
    els.questionList.appendChild(button);
  });
}

function renderReferences(question) {
  els.questionReferences.innerHTML = "";
  if (!question.references.length) {
    const item = document.createElement("li");
    item.className = "muted";
    item.textContent = "No references provided.";
    els.questionReferences.appendChild(item);
    return;
  }

  question.references.forEach((reference) => {
    const item = document.createElement("li");
    item.textContent = reference;
    els.questionReferences.appendChild(item);
  });
}

function renderOptions(question) {
  els.questionOptions.innerHTML = "";
  if (!question.options.length) {
    const item = document.createElement("li");
    item.className = "muted";
    item.textContent = "No answer options found in this record.";
    els.questionOptions.appendChild(item);
    return;
  }

  question.options.forEach((option, index) => {
    const item = document.createElement("li");
    if (index === question.correctIndex) {
      item.classList.add("correct-option");
    }
    const label = String.fromCharCode(65 + index);
    item.textContent = `${label}. ${option}`;
    els.questionOptions.appendChild(item);
  });
}

function renderClaimList(question) {
  els.claimList.innerHTML = "";
  const claims = splitIntoClaims(question.explanation);

  if (!claims.length) {
    const empty = document.createElement("p");
    empty.className = "muted";
    empty.textContent = "No claim-level sentences detected in this explanation.";
    els.claimList.appendChild(empty);
    return;
  }

  claims.forEach((claim, index) => {
    const card = document.createElement("article");
    card.className = "claim-card";

    const claimText = document.createElement("p");
    claimText.className = "claim-text";
    claimText.textContent = `${index + 1}. ${claim}`;

    const actions = document.createElement("div");
    actions.className = "button-row";

    const openEvidenceBtn = document.createElement("button");
    openEvidenceBtn.type = "button";
    openEvidenceBtn.className = "ghost tiny";
    openEvidenceBtn.dataset.claimAction = "openevidence";
    openEvidenceBtn.dataset.claim = claim;
    openEvidenceBtn.textContent = "OpenEvidence";

    const openPubMedBtn = document.createElement("button");
    openPubMedBtn.type = "button";
    openPubMedBtn.className = "ghost tiny";
    openPubMedBtn.dataset.claimAction = "pubmed";
    openPubMedBtn.dataset.claim = claim;
    openPubMedBtn.textContent = "PubMed";

    const copyBtn = document.createElement("button");
    copyBtn.type = "button";
    copyBtn.className = "ghost tiny";
    copyBtn.dataset.claimAction = "copy";
    copyBtn.dataset.claim = claim;
    copyBtn.textContent = "Copy";

    actions.appendChild(openEvidenceBtn);
    actions.appendChild(openPubMedBtn);
    actions.appendChild(copyBtn);

    card.appendChild(claimText);
    card.appendChild(actions);
    els.claimList.appendChild(card);
  });
}

function renderReviewForm(question) {
  const review = getReview(question.id);
  els.reviewStatus.value = review.status || "unreviewed";
  els.reviewConfidence.value = review.confidence === "" ? "" : review.confidence;
  els.reviewCitations.value = review.citations || "";
  els.reviewNotes.value = review.notes || "";

  if (review.checkedAt) {
    setReviewStatusMessage(`Last saved: ${new Date(review.checkedAt).toLocaleString()}`);
  } else {
    setReviewStatusMessage("No saved review yet.");
  }
}

function renderDetail() {
  const question = getSelectedQuestion();
  if (!question) {
    els.emptyState.hidden = false;
    els.detailView.hidden = true;
    return;
  }

  els.emptyState.hidden = true;
  els.detailView.hidden = false;

  const meta = [question.id, question.category, question.subcategory, question.difficulty]
    .filter(Boolean)
    .join(" • ");
  els.questionMeta.textContent = meta || question.id;
  els.questionPrompt.textContent = question.prompt || question.stem || "Untitled question";
  els.questionExplanation.textContent = question.explanation || "No explanation provided.";

  renderOptions(question);
  renderReferences(question);
  renderClaimList(question);
  renderReviewForm(question);

  els.queryEditor.value = buildPromptLines(question).join("\n");
  setQueryStatus("");
}

function selectQuestionById(questionId) {
  state.selectedId = questionId;
  renderQuestionList();
  renderDetail();
}

function loadQuestionsFromRaw(rawText) {
  let parsed;
  try {
    parsed = JSON.parse(rawText);
  } catch (error) {
    setImportStatus(`JSON parse error: ${error.message}`, "alert");
    return false;
  }

  const rawQuestions = extractQuestionArray(parsed);
  if (!rawQuestions.length) {
    setImportStatus("No questions found. Use an array or an object with `questions`.", "alert");
    return false;
  }

  const normalized = rawQuestions.map(normalizeQuestion).filter((q) => q.prompt || q.options.length);
  if (!normalized.length) {
    setImportStatus("Questions were found, but none had usable fields.", "alert");
    return false;
  }

  const dedupe = new Map();
  normalized.forEach((question, index) => {
    const candidateId = question.id || `q_${index + 1}`;
    if (!dedupe.has(candidateId)) {
      dedupe.set(candidateId, question);
      return;
    }
    let suffix = 2;
    let nextId = `${candidateId}_${suffix}`;
    while (dedupe.has(nextId)) {
      suffix += 1;
      nextId = `${candidateId}_${suffix}`;
    }
    dedupe.set(nextId, { ...question, id: nextId });
  });

  state.questions = Array.from(dedupe.values());
  state.bankKey = buildBankKey(state.questions);
  state.selectedId = state.questions[0].id;

  setImportStatus(`Loaded ${state.questions.length} questions.`, "ok");
  renderSummary();
  renderQuestionList();
  renderDetail();
  return true;
}

function openUrl(url) {
  window.open(url, "_blank", "noopener,noreferrer");
}

function getMainQuery() {
  const edited = toStringSafe(els.queryEditor.value);
  if (edited) {
    return edited;
  }
  const question = getSelectedQuestion();
  return question ? buildPromptLines(question).join("\n") : "";
}

async function copyText(text, successMessage) {
  if (!navigator.clipboard || !navigator.clipboard.writeText) {
    setQueryStatus("Clipboard API not available in this browser context.", "warn");
    return;
  }
  try {
    await navigator.clipboard.writeText(text);
    setQueryStatus(successMessage, "ok");
  } catch (_err) {
    setQueryStatus("Clipboard write failed. Copy manually.", "warn");
  }
}

function saveCurrentReview() {
  const question = getSelectedQuestion();
  if (!question) {
    return;
  }

  const status = els.reviewStatus.value || "unreviewed";
  const confidenceRaw = toStringSafe(els.reviewConfidence.value);
  const confidenceNumber = confidenceRaw === "" ? "" : Math.max(0, Math.min(100, Number(confidenceRaw)));
  const citations = toStringSafe(els.reviewCitations.value);
  const notes = toStringSafe(els.reviewNotes.value);

  setReview(question.id, {
    status,
    confidence: Number.isFinite(confidenceNumber) ? confidenceNumber : "",
    citations,
    notes,
    checkedAt: new Date().toISOString(),
  });

  setReviewStatusMessage("Saved review.", "ok");
  renderSummary();
  renderQuestionList();
}

function buildExportRows() {
  return state.questions.map((question) => {
    const review = getReview(question.id);
    return {
      bankKey: state.bankKey,
      id: question.id,
      category: question.category,
      subcategory: question.subcategory,
      prompt: question.prompt,
      correctOption: question.options[question.correctIndex] || "",
      explanation: question.explanation,
      status: review.status || "unreviewed",
      confidence: review.confidence === "" ? "" : review.confidence,
      citations: review.citations || "",
      notes: review.notes || "",
      checkedAt: review.checkedAt || "",
    };
  });
}

function downloadBlob(filename, content, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function escapeCsvCell(value) {
  const text = toStringSafe(value).replace(/"/g, "\"\"");
  if (/[",\n]/.test(text)) {
    return `"${text}"`;
  }
  return text;
}

function exportJsonReport() {
  if (!state.questions.length) {
    setImportStatus("Load questions before exporting a report.", "warn");
    return;
  }

  const payload = {
    generatedAt: new Date().toISOString(),
    bankKey: state.bankKey,
    total: state.questions.length,
    items: buildExportRows(),
  };

  downloadBlob("question-evidence-report.json", JSON.stringify(payload, null, 2), "application/json");
}

function exportCsvReport() {
  if (!state.questions.length) {
    setImportStatus("Load questions before exporting a report.", "warn");
    return;
  }

  const rows = buildExportRows();
  const headers = Object.keys(rows[0] || {});
  const lines = [headers.join(",")];
  rows.forEach((row) => {
    lines.push(headers.map((header) => escapeCsvCell(row[header])).join(","));
  });
  downloadBlob("question-evidence-report.csv", lines.join("\n"), "text/csv;charset=utf-8");
}

function clearSession() {
  state.questions = [];
  state.selectedId = "";
  state.bankKey = "";
  els.jsonInput.value = "";
  els.fileInput.value = "";
  setImportStatus("Cleared loaded question set.");
  renderSummary();
  renderQuestionList();
  renderDetail();
}

function attachEvents() {
  els.importBtn.addEventListener("click", () => {
    const raw = toStringSafe(els.jsonInput.value);
    if (!raw) {
      setImportStatus("Paste JSON first or load a file.", "warn");
      return;
    }
    loadQuestionsFromRaw(raw);
  });

  els.sampleBtn.addEventListener("click", () => {
    const sample = JSON.stringify(SAMPLE_DATA, null, 2);
    els.jsonInput.value = sample;
    loadQuestionsFromRaw(sample);
  });

  els.clearBtn.addEventListener("click", clearSession);

  els.fileInput.addEventListener("change", async (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) {
      return;
    }
    const raw = await file.text();
    els.jsonInput.value = raw;
    loadQuestionsFromRaw(raw);
  });

  els.searchInput.addEventListener("input", () => {
    renderQuestionList();
  });

  els.statusFilter.addEventListener("change", () => {
    renderQuestionList();
  });

  els.questionList.addEventListener("click", (event) => {
    const target = event.target.closest("[data-question-id]");
    if (!target) {
      return;
    }
    selectQuestionById(target.dataset.questionId);
  });

  els.resetPromptBtn.addEventListener("click", () => {
    const question = getSelectedQuestion();
    if (!question) {
      return;
    }
    els.queryEditor.value = buildPromptLines(question).join("\n");
    setQueryStatus("Prompt reset to generated template.");
  });

  els.openEvidenceBtn.addEventListener("click", () => {
    const query = getMainQuery();
    if (!query) {
      setQueryStatus("No query text available.", "warn");
      return;
    }
    openUrl(buildOpenEvidenceUrl(query));
    setQueryStatus("Opened OpenEvidence.");
  });

  els.openAnswerCheckBtn.addEventListener("click", () => {
    const question = getSelectedQuestion();
    if (!question) {
      return;
    }
    const query = buildAnswerOnlyPrompt(question);
    openUrl(buildOpenEvidenceUrl(query));
    setQueryStatus("Opened answer-focused check in OpenEvidence.");
  });

  els.openPubMedBtn.addEventListener("click", () => {
    const question = getSelectedQuestion();
    if (!question) {
      return;
    }
    const query = buildPubMedQuery(question);
    openUrl(buildPubMedUrl(query));
    setQueryStatus("Opened PubMed search.");
  });

  els.copyPromptBtn.addEventListener("click", () => {
    const query = getMainQuery();
    if (!query) {
      setQueryStatus("No query text available.", "warn");
      return;
    }
    copyText(query, "Prompt copied to clipboard.");
  });

  els.claimList.addEventListener("click", (event) => {
    const trigger = event.target.closest("[data-claim-action]");
    if (!trigger) {
      return;
    }
    const claim = trigger.dataset.claim || "";
    const action = trigger.dataset.claimAction;
    if (!claim || !action) {
      return;
    }

    if (action === "openevidence") {
      openUrl(buildOpenEvidenceUrl(claim));
      setQueryStatus("Opened claim check in OpenEvidence.");
      return;
    }
    if (action === "pubmed") {
      openUrl(buildPubMedUrl(claim));
      setQueryStatus("Opened claim search in PubMed.");
      return;
    }
    if (action === "copy") {
      copyText(claim, "Claim copied to clipboard.");
    }
  });

  els.saveReviewBtn.addEventListener("click", saveCurrentReview);

  document.querySelectorAll("[data-quick-status]").forEach((button) => {
    button.addEventListener("click", () => {
      els.reviewStatus.value = button.getAttribute("data-quick-status");
      saveCurrentReview();
    });
  });

  els.exportJsonBtn.addEventListener("click", exportJsonReport);
  els.exportCsvBtn.addEventListener("click", exportCsvReport);
}

function init() {
  state.reviews = loadStoredReviews();
  attachEvents();
  renderSummary();
  renderQuestionList();
  renderDetail();
}

init();
