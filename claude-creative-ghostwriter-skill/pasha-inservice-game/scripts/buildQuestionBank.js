#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

// ── Configuration ──────────────────────────────────────────────────────────────

const DEFAULT_SOURCE_DIR = "/Users/Alex/Desktop/questions for study pets/ENT practice tests/ENT Resources/Pasha_Text_Extracts";
const OUTPUT_JSON = path.join(__dirname, "..", "data", "pasha-question-bank.json");
const OUTPUT_JS = path.join(__dirname, "..", "data", "pasha-question-bank.js");
const INCLUDE_PROSE = process.env.PASHA_INCLUDE_PROSE !== "0";
const MAX_PROSE_PER_FILE = Number(process.env.PASHA_MAX_PROSE_PER_FILE || "2500");

// ── Topic name mapping ─────────────────────────────────────────────────────────

const TOPIC_NAME_MAP = {
  PashaAllergyandRhinology: "Allergy and Rhinology",
  PashaCranialNerves: "Cranial Nerves",
  PashaEndocrinology: "Endocrinology",
  PashaFacialPlastics: "Facial Plastics",
  PashaGeneralENT: "General ENT",
  PashaHeadandNeckCancer: "Head and Neck Cancer",
  PashaHeadandNeckTrauma: "Head and Neck Trauma",
  PashaLaryngology: "Laryngology",
  PashaOtologyNeurootology: "Otology and Neurotology",
  PashaPediatrics: "Pediatrics",
  PashaRadiology: "Radiology",
  PashaSleepMedicine: "Sleep Medicine",
};

// ── Organ system classification rules ──────────────────────────────────────────

const ORGAN_SYSTEM_RULES = [
  { name: "Thyroid and Parathyroid", patterns: [/\bthyroid\b/i, /\bparathyroid\b/i, /\bgoiter\b/i, /\bgraves\b/i] },
  { name: "Ear and Temporal Bone", patterns: [/\bear\b/i, /\botology\b/i, /\botic\b/i, /\btympan/i, /\bcochlea/i, /\btemporal bone\b/i, /\beac\b/i] },
  { name: "Nose and Sinus", patterns: [/\bnasal\b/i, /\bnose\b/i, /\brhino/i, /\bsinus\b/i, /\bseptum\b/i, /\bturbinate\b/i, /\bchoana/i] },
  { name: "Larynx and Airway", patterns: [/\blarynx\b/i, /\blarynge/i, /\bglott/i, /\bvocal fold\b/i, /\btrache/i, /\bstridor\b/i, /\bairway\b/i] },
  { name: "Oral Cavity and Salivary", patterns: [/\boral\b/i, /\borophary/i, /\btongue\b/i, /\bpalate\b/i, /\bsalivary\b/i, /\bparotid\b/i, /\bsubmandibular\b/i, /\bsial/i] },
  { name: "Pharynx and Esophagus", patterns: [/\bpharynx\b/i, /\bpharynge/i, /\besophag/i, /\bdysphagia\b/i] },
  { name: "Neck and Lymphatics", patterns: [/\bneck\b/i, /\bcervical\b/i, /\blymph\b/i, /\bnode\b/i, /\bmass\b/i] },
  { name: "Cranial Nerves and Neuro", patterns: [/\bcranial nerve\b/i, /\bCN\s*[IVX]+\b/i, /\btrigeminal\b/i, /\bfacial nerve\b/i, /\bvestibulocochlear\b/i, /\bneurolog/i] },
  { name: "Sleep and Breathing", patterns: [/\bsleep\b/i, /\bOSA\b/i, /\bapnea\b/i, /\bCPAP\b/i, /\bsnoring\b/i] },
  { name: "Facial Plastics and Skin", patterns: [/\bfacial\b/i, /\brhinoplasty\b/i, /\bblepharoplasty\b/i, /\bcutaneous\b/i, /\bskin\b/i, /\breconstruct/i] },
  { name: "Head and Neck Oncology", patterns: [/\bcancer\b/i, /\bcarcinoma\b/i, /\bmalignan/i, /\bmetast/i, /\boncolog/i, /\bSCC\b/i] },
  { name: "Trauma", patterns: [/\btrauma\b/i, /\bfracture\b/i, /\binjury\b/i, /\bwound\b/i] },
  { name: "Pediatrics", patterns: [/\bpediatric\b/i, /\bchildren\b/i, /\binfant\b/i, /\bneonate\b/i] },
];

const DISEASE_DOMAIN_RULES = [
  { name: "Infectious", patterns: [/\binfect/i, /\bviral\b/i, /\bbacterial\b/i, /\bfungal\b/i, /\babscess\b/i] },
  { name: "Neoplastic", patterns: [/\btumor\b/i, /\bneoplasm\b/i, /\bcancer\b/i, /\bcarcinoma\b/i, /\bmalignan/i] },
  { name: "Inflammatory, Allergic, Autoimmune", patterns: [/\binflamm/i, /\ballerg/i, /\bautoimmune\b/i, /\bgranulomat/i] },
  { name: "Congenital and Developmental", patterns: [/\bcongenital\b/i, /\bembryolog/i, /\bdevelopment/i, /\batresia\b/i] },
  { name: "Traumatic and Iatrogenic", patterns: [/\btrauma\b/i, /\bfracture\b/i, /\biatrogenic\b/i, /\bpostoperative\b/i] },
  { name: "Vascular and Hemorrhagic", patterns: [/\bvascular\b/i, /\bhemorrhag/i, /\bbleed/i, /\bepistaxis\b/i, /\bthrombo/i] },
  { name: "Neurologic", patterns: [/\bneurolog/i, /\bnerve\b/i, /\bparalysis\b/i, /\bvertigo\b/i, /\bnystagmus\b/i] },
  { name: "Endocrine and Metabolic", patterns: [/\bendocrin/i, /\bmetabolic\b/i, /\bthyroid\b/i, /\bparathyroid\b/i] },
  { name: "Degenerative and Functional", patterns: [/\bdegener/i, /\bpresby/i, /\bfunctional\b/i, /\bdysfunction\b/i] },
  { name: "Diagnostic and Staging", patterns: [/\bdiagnos/i, /\bevaluation\b/i, /\bimaging\b/i, /\bTNM\b/i, /\bstaging\b/i] },
  { name: "Therapeutic and Surgical", patterns: [/\bmanagement\b/i, /\btreat/i, /\bsurgery\b/i, /\btherapy\b/i, /\boperative\b/i] },
];

const FOCUS_AREA_RULES = [
  { name: "Thyroid", patterns: [/\bthyroid\b/i] },
  { name: "Parathyroid", patterns: [/\bparathyroid\b/i] },
  { name: "Salivary", patterns: [/\bsalivary\b/i, /\bparotid\b/i, /\bsubmandibular\b/i] },
  { name: "Ear", patterns: [/\bear\b/i, /\botic\b/i, /\beac\b/i] },
  { name: "Hearing", patterns: [/\bhearing\b/i, /\baudiometr/i, /\bcochlea/i] },
  { name: "Vestibular and Balance", patterns: [/\bvestib/i, /\bvertigo\b/i, /\bnystagmus\b/i] },
  { name: "Facial Nerve", patterns: [/\bfacial nerve\b/i, /\bBell palsy\b/i] },
  { name: "Cranial Nerves", patterns: [/\bcranial nerve\b/i, /\bCN\s*[IVX]+\b/i] },
  { name: "Nose", patterns: [/\bnasal\b/i, /\bnose\b/i, /\bseptum\b/i] },
  { name: "Sinus", patterns: [/\bsinus\b/i, /\bostiomeatal\b/i] },
  { name: "Epistaxis", patterns: [/\bepistaxis\b/i] },
  { name: "Larynx and Voice", patterns: [/\blarynx\b/i, /\bdysphon/i, /\bhoarse\b/i, /\bvoice\b/i] },
  { name: "Airway", patterns: [/\bairway\b/i, /\bstridor\b/i, /\btracheotomy\b/i, /\btracheostomy\b/i] },
  { name: "Sleep Apnea", patterns: [/\bOSA\b/i, /\bsleep apnea\b/i, /\bAHI\b/i] },
  { name: "Pediatrics", patterns: [/\bpediatric\b/i, /\binfant\b/i, /\bchildren\b/i] },
  { name: "Neck Mass", patterns: [/\bneck mass\b/i, /\bcervical mass\b/i] },
  { name: "Lymph Nodes", patterns: [/\blymph node\b/i, /\bnodal\b/i] },
  { name: "Head and Neck Cancer", patterns: [/\bhead and neck cancer\b/i, /\bcarcinoma\b/i, /\bSCC\b/i] },
  { name: "Skull Base", patterns: [/\bskull base\b/i, /\bclivus\b/i, /\bpetrous\b/i] },
  { name: "Trauma", patterns: [/\btrauma\b/i, /\bfracture\b/i, /\binjury\b/i] },
  { name: "Dysphagia", patterns: [/\bdysphagia\b/i, /\bswallow/i, /\baspiration\b/i] },
  { name: "Reflux", patterns: [/\bGERD\b/i, /\breflux\b/i, /\bLPR\b/i] },
  { name: "Otitis", patterns: [/\botitis\b/i] },
  { name: "Cholesteatoma", patterns: [/\bcholesteatoma\b/i] },
  { name: "Tinnitus", patterns: [/\btinnitus\b/i] },
  { name: "Allergic Rhinitis", patterns: [/\ballergic rhinitis\b/i, /\brhin/i] },
  { name: "Immunology", patterns: [/\bIgE\b/i, /\bB-cell\b/i, /\bT-cell\b/i, /\bimmune\b/i] },
  { name: "Radiology and Imaging", patterns: [/\bCT\b/i, /\bMRI\b/i, /\bultrasound\b/i, /\bimaging\b/i] },
];

const ORGAN_FALLBACK_BY_TOPIC = {
  "Allergy and Rhinology": ["Nose and Sinus"],
  "Cranial Nerves": ["Cranial Nerves and Neuro"],
  Endocrinology: ["Thyroid and Parathyroid"],
  "Facial Plastics": ["Facial Plastics and Skin"],
  "General ENT": ["Neck and Lymphatics"],
  "Head and Neck Cancer": ["Head and Neck Oncology"],
  "Head and Neck Trauma": ["Trauma"],
  Laryngology: ["Larynx and Airway"],
  "Otology and Neurotology": ["Ear and Temporal Bone"],
  Pediatrics: ["Pediatrics"],
  Radiology: ["Radiology and Imaging"],
  "Sleep Medicine": ["Sleep and Breathing"],
};

// ── Generic heading terms (used for contextualization) ─────────────────────────

const GENERIC_HEADING_TERMS = new Set([
  "approach", "background", "classification", "clinical features",
  "clinical presentation", "complication", "complications",
  "contraindication", "contraindications", "diagnosis",
  "differential diagnosis", "disadvantage", "disadvantages",
  "epidemiology", "etiology", "evaluation", "follow up", "history",
  "imaging", "indication", "indications", "introduction",
  "investigation", "management", "overview", "pathogenesis",
  "pathophysiology", "pearls", "pitfalls", "prevention", "prognosis",
  "risk factors", "signs and symptoms", "staging", "summary",
  "symptoms", "treatment", "workup", "types", "causes", "anatomy",
  "physical exam", "ancillary tests", "surgical management",
  "medical management", "other tests", "other causes",
  "initial management", "techniques", "stages", "nerves",
  "regulation", "pharmacology", "components", "triggers",
  "general treatment principles", "postoperative complications",
]);

// ── OCR fix maps ───────────────────────────────────────────────────────────────

const OCR_DOUBLED_FIXES = [
  [/\booff\b/gi, "of"],
  [/\bttoo\b/gi, "to"],
  [/\btthhee\b/gi, "the"],
  [/\baanndd\b/gi, "and"],
  [/\biinn\b/gi, "in"],
  [/\bffoorr\b/gi, "for"],
  [/\bwwiitthh\b/gi, "with"],
  [/\biiss\b/gi, "is"],
  [/\baarree\b/gi, "are"],
  [/\bbbyy\b/gi, "by"],
  [/\baass\b/gi, "as"],
  [/\baatt\b/gi, "at"],
  [/\boorr\b/gi, "or"],
  [/\bnnoo\b/gi, "no"],
  [/\bffrroomm\b/gi, "from"],
  [/\btthhaatt\b/gi, "that"],
  [/\btthhiiss\b/gi, "this"],
  [/\biitt\b/gi, "it"],
  [/\bnnoott\b/gi, "not"],
  [/\bbbee\b/gi, "be"],
  [/\bhhaass\b/gi, "has"],
  [/\bhhaavvee\b/gi, "have"],
  [/\bwwaass\b/gi, "was"],
  [/\bwweerree\b/gi, "were"],
  [/\bmmoorree\b/gi, "more"],
  [/\bmmoosstt\b/gi, "most"],
  [/\baallssoo\b/gi, "also"],
  [/\btthheerree\b/gi, "there"],
  [/\btthheeiirr\b/gi, "their"],
  [/\bwwhhiicchh\b/gi, "which"],
  [/\baabboouutt\b/gi, "about"],
  [/\baafftteerr\b/gi, "after"],
  [/\bbbeeffoorree\b/gi, "before"],
  [/\bbeettwweeeenn\b/gi, "between"],
];

// ── Text normalization ─────────────────────────────────────────────────────────

function titleCase(value) {
  return value
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function deriveTopicName(fileName) {
  const stem = path.basename(fileName, ".txt");
  if (TOPIC_NAME_MAP[stem]) return TOPIC_NAME_MAP[stem];
  const withoutPrefix = stem.replace(/^Pasha/, "");
  const withSpaces = withoutPrefix.replace(/([a-z])([A-Z])/g, "$1 $2");
  return titleCase(withSpaces.replace(/\s+/g, " ").trim());
}

function maybeUndoubleWord(word) {
  if (word.length < 6 || word.length % 2 !== 0) return word;
  let pairsMatch = true;
  for (let i = 0; i < word.length; i += 2) {
    if (word[i].toLowerCase() !== word[i + 1].toLowerCase()) {
      pairsMatch = false;
      break;
    }
  }
  if (!pairsMatch) return word;
  let out = "";
  for (let i = 0; i < word.length; i += 2) out += word[i];
  return out;
}

function fixKnownOcrDoubles(text) {
  let result = text;
  for (const [regex, replacement] of OCR_DOUBLED_FIXES) {
    result = result.replace(regex, replacement);
  }
  return result;
}

function normalizeOcrDoubledSegments(text) {
  return String(text).replace(/[A-Za-z]{6,}/g, (segment) => maybeUndoubleWord(segment));
}

function stripShorthandMarkers(text) {
  return String(text)
    .replace(/\b(?:DDxx|RRxx|DDx|RRx)\b/gi, "")
    .replace(/\b(?:DD|RR)\b\s*[:\-]/gi, "")
    .replace(/\(\s*(?:DD|RR)[^)]+\)/gi, "")
    .replace(/\s*;\s*;\s*/g, "; ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function fixDoubledParentheses(text) {
  return text
    .replace(/\(\(/g, "(")
    .replace(/\)\)/g, ")")
    .replace(/^\)+\s*/, "")
    .replace(/\s*\(+$/, "");
}

function normalizeLine(rawLine) {
  let normalized = rawLine
    .replace(/\u00A0/g, " ")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/\t/g, " ")
    .trim();

  normalized = fixKnownOcrDoubles(normalized);
  normalized = fixDoubledParentheses(normalized);

  const undoubled = normalizeOcrDoubledSegments(stripShorthandMarkers(normalized))
    .split(/\s+/)
    .map((word) => normalizeOcrDoubledSegments(maybeUndoubleWord(word)))
    .join(" ");

  return undoubled.replace(/\s+/g, " ").trim();
}

function stripListPrefix(line) {
  return line
    .replace(/^[-*\u2022]\s*/, "")
    .replace(/^\d+[.)]\s*/, "")
    .trim();
}

function cleanSegment(text) {
  return stripShorthandMarkers(text)
    .replace(/^[.,;:)\]]+/, "")
    .replace(/[.,;:([\-]+$/, "")
    .replace(/\s+\.+$/, "")
    .replace(/\bcontinues\b$/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

// ── Line classification ────────────────────────────────────────────────────────

function isNoiseLine(line) {
  const dotLeaders = /\.\s*\.\s*\./.test(line) || /\.{3,}/.test(line);
  return (
    !line ||
    /^=+$/.test(line) ||
    /^[\u2500/-]+$/.test(line) ||
    dotLeaders ||
    /^TEXT EXTRACTION FROM:/i.test(line) ||
    /^Total Pages:/i.test(line) ||
    /^PAGE \d+/i.test(line) ||
    /^CHAPTER$/i.test(line) ||
    /^CHAPTER \d+/i.test(line) ||
    /^FIGURE \d+/i.test(line) ||
    /^TABLE \d+/i.test(line) ||
    /^\d+$/.test(line) ||
    /^\d+\s+Otolaryngology-Head and Neck Surgery/i.test(line) ||
    /^continues$/i.test(line)
  );
}

function isLikelyFact(term, definition) {
  if (term.length < 2 || term.length > 110) return false;
  if (definition.length < 20 || definition.length > 420) return false;
  if (term.split(/\s+/).length > 14) return false;
  if (!/[A-Za-z]/.test(term) || !/[A-Za-z]/.test(definition)) return false;
  if (/^(chapter|page|figure|table|overview|introduction)\b/i.test(term)) return false;
  if (/^\d+$/.test(term)) return false;
  return true;
}

function isReferenceOnly(definition) {
  return /^see\s+(p\.\s*\d+|below|above|chapter)/i.test(definition.trim());
}

function isGarbageTerm(term) {
  const t = (term || "").trim();
  if (!t || t.length < 2) return true;
  // Medical abbreviation terms that produce useless flashcards
  if (/^(S?Sx|DDx?|Tx|Dx|Rx|HHx|NNx|Hx|PE|Labs?|H&N|HH&N|HH&&NN|S\/Sx|Associated\s+S?Sx)$/i.test(t)) return true;
  // OCR garbage in terms
  if (/&&|~~|\|{2,}|##/.test(t)) return true;
  // Sentence-fragment terms: 7+ words AND contains a verb (means it's not a real term)
  const words = t.split(/\s+/);
  if (words.length >= 7 && /\b(is|are|was|were|has|have|occurs?|results?|causes?|includes?|presents?|may|can)\b/i.test(t)) return true;
  // Only digits
  if (/^\d+$/.test(t)) return true;
  return false;
}

function isGarbageDefinition(definition) {
  const text = definition.trim();
  if (isReferenceOnly(text)) return true;
  if (text.length < 20) return true;
  if (/^[A-Z]{2,}(,\s*[A-Z]{2,})+$/.test(text)) return true;
  if (text.length > 10 && !/[aeiouAEIOU]/.test(text)) return true;
  // Reject OCR garbage characters
  if (/&&|~~|\|{2,}|##/.test(text)) return true;
  return false;
}

function isLikelyHeading(line) {
  if (!line || line.includes(":") || /[.?!;]/.test(line)) return false;
  const words = line.split(/\s+/).filter(Boolean);
  if (words.length < 1 || words.length > 10) return false;
  if (/^[A-Z0-9 ()/-]+$/.test(line) && /[A-Z]/.test(line)) return true;
  const titledWords = words.filter((word) => /^[A-Z][A-Za-z0-9'()/.-]*$/.test(word)).length;
  return titledWords / words.length >= 0.7;
}

function sanitizeHeading(line) {
  const candidate = cleanSegment(line);
  if (!candidate || candidate.length < 3 || candidate.length > 120) return "";
  if (/^(chapter|page|figure|table)\b/i.test(candidate)) return "";
  return candidate;
}

// ── Heading context helpers ────────────────────────────────────────────────────

function normalizeHeadingKey(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isGenericHeading(term) {
  const normalized = normalizeHeadingKey(term);
  if (!normalized) return true;
  if (GENERIC_HEADING_TERMS.has(normalized)) return true;
  if (/^(advantages?|disadvantages?|complications?|indications?|contraindications?)$/.test(normalized)) return true;
  return false;
}

function contextualizeGenericTerm(term, section, chapterTitle) {
  if (!isGenericHeading(term)) return term;
  const candidates = [section, chapterTitle].filter(Boolean);
  for (const candidate of candidates) {
    const candidateNorm = normalizeHeadingKey(candidate);
    const termNorm = normalizeHeadingKey(term);
    if (candidateNorm !== termNorm && !GENERIC_HEADING_TERMS.has(candidateNorm)) {
      return `${candidate} \u2014 ${term}`;
    }
  }
  return term;
}

// ── Prose sentence parsing ─────────────────────────────────────────────────────

function splitParagraphIntoSentences(paragraph) {
  if (!paragraph) return [];
  return paragraph
    .split(/(?<=[.?!])\s+(?=[A-Z0-9(])/g)
    .map(cleanSegment)
    .filter(Boolean);
}

function isLikelyProseSentence(sentence) {
  if (!sentence || sentence.length < 40 || sentence.length > 320) return false;
  if (!/[A-Za-z]/.test(sentence)) return false;
  const wordCount = sentence.split(/\s+/).length;
  if (wordCount < 7 || wordCount > 55) return false;
  if (/^Figure\b/i.test(sentence) || /^Table\b/i.test(sentence)) return false;
  if (!/^\(?[A-Za-z0-9]/.test(sentence)) return false;
  if (/^(to|into|from|of|and|or|with|without|via|for)\b/i.test(sentence)) return false;
  if (/[,:;]$/.test(sentence)) return false;
  if (/\.\s*\.\s*\./.test(sentence) || /\.{3,}/.test(sentence)) return false;
  if (/^[A-Z0-9 ()/-]+$/.test(sentence)) return false;
  return /\b(is|are|was|were|can|may|has|have|contains|contain|consists|include|includes|forms|form|arises|arise|occurs|occur|results|result|causes|cause|provides|provide|supplies|supply|innervates|innervate|derives|derived|treated|treat|diagnosed|diagnosis|evaluated|evaluation|associated)\b/i.test(sentence);
}

function deriveTermFromSentence(sentence, heading) {
  const working = sentence.replace(/^\(?[a-z0-9]\)\s*/i, "").trim();
  const subjectMatch = working.match(
    /^(.{2,110}?)\s+\b(is|are|was|were|can|may|has|have|contains|contain|consists|include|includes|forms|form|arises|arise|occurs|occur|results|result|causes|cause|provides|provide|supplies|supply|innervates|innervate|derives|derived)\b/i
  );

  let subject = "";
  if (subjectMatch) {
    subject = cleanSegment(subjectMatch[1]);
  } else {
    const firstClause = working.split(/[,:;]/)[0].trim();
    if (firstClause && firstClause.length <= 110) {
      subject = cleanSegment(firstClause);
    } else {
      subject = cleanSegment(working.split(/\s+/).slice(0, 10).join(" "));
    }
  }

  if (!subject || /^(it|this|these|those|they|there)$/i.test(subject)) {
    subject = heading ? `${heading} statement` : cleanSegment(working.split(/\s+/).slice(0, 8).join(" "));
  }

  if (/^(the|a|an)\s+/i.test(subject)) subject = subject.replace(/^(the|a|an)\s+/i, "");
  subject = subject.replace(/^[,;:()\-\s]+/, "").replace(/\s+/g, " ").trim();
  if (!/^[A-Z]/.test(subject)) {
    if (/^(to|into|from|of|and|or|with|without|via|for)\b/i.test(subject)) {
      subject = heading || titleCase(working.split(/\s+/).slice(0, 8).join(" "));
    } else {
      subject = titleCase(subject);
    }
  }

  if (subject.length > 110) subject = `${subject.slice(0, 109).trim()}...`;
  return subject;
}

// ── Chapter meta extraction ────────────────────────────────────────────────────

function extractChapterMeta(text, topic) {
  const lines = text.split(/\r?\n/).map(normalizeLine).filter(Boolean);
  let chapterNumber = null;
  let chapterTitle = topic;

  for (let i = 0; i < Math.min(lines.length, 120); i += 1) {
    const line = lines[i];
    const compact = line.match(/^CHAPTER\s+(\d+)\s+(.+)/i);
    if (compact) {
      chapterNumber = Number(compact[1]);
      chapterTitle = cleanSegment(compact[2]) || topic;
      break;
    }
    if (/^CHAPTER$/i.test(line)) {
      const next = lines[i + 1] || "";
      const nextNext = lines[i + 2] || "";
      if (/^\d+$/.test(next)) chapterNumber = Number(next);
      if (nextNext && !/^\d+$/.test(nextNext) && !isNoiseLine(nextNext)) {
        chapterTitle = cleanSegment(nextNext) || topic;
        break;
      }
    }
  }

  const chapter = chapterNumber
    ? `Chapter ${chapterNumber}: ${chapterTitle}`
    : `Chapter: ${chapterTitle}`;

  return { chapterNumber, chapterTitle, chapter };
}

// ── Fact extraction (colon-style) ──────────────────────────────────────────────

function parseColonFacts(lines, topic, sourceFile, chapterMeta) {
  const facts = [];
  let currentHeading = chapterMeta.chapterTitle;
  let parentHeading = chapterMeta.chapterTitle;

  for (const rawLine of lines) {
    if (isNoiseLine(rawLine)) continue;
    const line = stripListPrefix(rawLine);
    if (!line) continue;

    if (!line.includes(":") && isLikelyHeading(line)) {
      const heading = sanitizeHeading(line);
      if (heading) {
        if (!isGenericHeading(heading)) parentHeading = heading;
        currentHeading = heading;
      }
      continue;
    }

    if (!line.includes(":")) {
      if (
        facts.length > 0 &&
        line.length < 120 &&
        /^[a-z(]/.test(line) &&
        !facts[facts.length - 1].definition.endsWith(".")
      ) {
        facts[facts.length - 1].definition = cleanSegment(
          `${facts[facts.length - 1].definition} ${line}`
        );
      }
      continue;
    }

    const separator = line.indexOf(":");
    let rawTerm = cleanSegment(line.slice(0, separator));
    const rawDefinition = cleanSegment(line.slice(separator + 1));

    if (!isLikelyFact(rawTerm, rawDefinition)) continue;
    if (isGarbageTerm(rawTerm)) continue;
    if (isGarbageDefinition(rawDefinition)) continue;

    rawTerm = contextualizeGenericTerm(rawTerm, parentHeading, chapterMeta.chapterTitle);

    facts.push({
      topic,
      chapter: chapterMeta.chapter,
      chapterNumber: chapterMeta.chapterNumber,
      chapterTitle: chapterMeta.chapterTitle,
      section: currentHeading || chapterMeta.chapterTitle,
      parentSection: parentHeading || chapterMeta.chapterTitle,
      term: rawTerm,
      definition: rawDefinition,
      sourceFile,
      sourceType: "colon",
    });
  }

  return facts;
}

// ── Fact extraction (prose-style) ──────────────────────────────────────────────

function parseProseFacts(lines, topic, sourceFile, chapterMeta) {
  const facts = [];
  let currentHeading = chapterMeta.chapterTitle;
  let parentHeading = chapterMeta.chapterTitle;
  let paragraphParts = [];
  let limitReached = false;
  let previousLineHadColon = false;

  const flushParagraph = () => {
    if (limitReached || paragraphParts.length === 0) {
      paragraphParts = [];
      return;
    }
    const paragraph = cleanSegment(paragraphParts.join(" "));
    paragraphParts = [];
    if (!paragraph || paragraph.length < 40) return;

    const sentences = splitParagraphIntoSentences(paragraph);
    for (const sentence of sentences) {
      if (!isLikelyProseSentence(sentence)) continue;
      const term = deriveTermFromSentence(sentence, currentHeading);
      if (!isLikelyFact(term, sentence)) continue;
      if (isGarbageTerm(term)) continue;
      if (isGarbageDefinition(sentence)) continue;

      const contextualizedTerm = contextualizeGenericTerm(term, parentHeading, chapterMeta.chapterTitle);

      facts.push({
        topic,
        chapter: chapterMeta.chapter,
        chapterNumber: chapterMeta.chapterNumber,
        chapterTitle: chapterMeta.chapterTitle,
        section: currentHeading || chapterMeta.chapterTitle,
        parentSection: parentHeading || chapterMeta.chapterTitle,
        term: contextualizedTerm,
        definition: sentence,
        sourceFile,
        sourceType: "prose",
      });

      if (facts.length >= MAX_PROSE_PER_FILE) {
        limitReached = true;
        break;
      }
    }
  };

  for (const rawLine of lines) {
    if (limitReached) break;
    if (isNoiseLine(rawLine)) { flushParagraph(); previousLineHadColon = false; continue; }
    const line = stripListPrefix(rawLine);
    if (!line) { flushParagraph(); previousLineHadColon = false; continue; }
    if (line.includes(":")) { flushParagraph(); previousLineHadColon = true; continue; }
    if (previousLineHadColon && (/^[a-z(]/.test(line) || /^(to|into|from|of|and|or|with|without|via|for)\b/i.test(line))) { continue; }
    previousLineHadColon = false;

    if (isLikelyHeading(line)) {
      flushParagraph();
      const heading = sanitizeHeading(line);
      if (heading) {
        if (!isGenericHeading(heading)) parentHeading = heading;
        currentHeading = heading;
      }
      continue;
    }

    paragraphParts.push(line);
    if (/[.?!]$/.test(line) || paragraphParts.length >= 4) flushParagraph();
  }

  flushParagraph();
  return facts;
}

// ── Combined extraction ────────────────────────────────────────────────────────

function parseFactsFromText(text, topic, sourceFile, chapterMeta) {
  const lines = text.split(/\r?\n/).map(normalizeLine);
  const colonFacts = parseColonFacts(lines, topic, sourceFile, chapterMeta);
  const proseFacts = INCLUDE_PROSE ? parseProseFacts(lines, topic, sourceFile, chapterMeta) : [];
  return [...colonFacts, ...proseFacts];
}

// ── Quality tier scoring ───────────────────────────────────────────────────────

function hasExplanatoryVerb(text) {
  return /\b(is|are|was|were|has|have|contains?|consists?|includes?|forms?|occurs?|results?|causes?|provides?|presents?|treated|diagnosed|evaluated|associated|indicates?|innervates?|supplies?|arises?|derives?)\b/i.test(text || "");
}

function scoreFactQuality(fact) {
  let score = 0;
  const term = fact.term || "";
  const def = fact.definition || "";
  const termWords = term.split(/\s+/).length;

  // Term specificity — contextualized terms (with em-dash) get partial credit
  const isContextualized = term.includes("\u2014");
  if (isContextualized) {
    score += 2; // better than raw generic, but not as good as naturally specific
  } else if (termWords >= 1 && termWords <= 6) {
    score += 3;
  } else {
    score += 1;
  }

  // Definition informativeness
  if (def.length >= 100 && def.length <= 400) score += 3;
  else if (def.length >= 50 && def.length <= 300) score += 2;
  else if (def.length >= 20) score += 1;

  // Contains explanatory verb
  if (hasExplanatoryVerb(def)) score += 2;

  // Contains high-yield clinical detail
  if (/\b\d+\s*%/.test(def)) score += 1;
  if (/\b(most common|mc|classic|hallmark|pathognomonic|gold standard)\b/i.test(def)) score += 1;
  if (/\b(treated with|treatment of choice|first[ -]line)\b/i.test(def)) score += 1;

  // Penalize long comma-lists without sentence structure
  const commaCount = (def.match(/,/g) || []).length;
  if (commaCount >= 6 && !/[.;!?]/.test(def)) score -= 2;

  // Rule: If NO explanatory verb AND 3+ commas, mark as "low" (bare lists make poor cloze questions)
  const hasExplanatory = hasExplanatoryVerb(def);
  if (!hasExplanatory && commaCount >= 3) {
    return "low";
  }

  if (score >= 7) return "high";
  if (score >= 4) return "medium";
  return "low";
}

// ── Deduplication and tagging ──────────────────────────────────────────────────

function matchRuleSet(text, rules) {
  return rules
    .filter((rule) => rule.patterns.some((pattern) => pattern.test(text)))
    .map((rule) => rule.name);
}

function dedupeAndTagFacts(facts) {
  const seen = new Set();
  const deduped = [];
  let index = 1;

  for (const fact of facts) {
    const key = `${fact.topic}|${fact.term.toLowerCase()}|${fact.definition.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);

    deduped.push({
      id: `fact-${index}`,
      topic: fact.topic,
      chapter: fact.chapter,
      chapterNumber: fact.chapterNumber,
      chapterTitle: fact.chapterTitle,
      section: fact.section,
      parentSection: fact.parentSection,
      term: fact.term,
      definition: fact.definition,
      sourceFile: fact.sourceFile,
      sourceType: fact.sourceType || "unknown",
    });
    index += 1;
  }

  return deduped;
}

function enrichFactTags(facts) {
  return facts.map((fact) => {
    const text = `${fact.term} ${fact.definition} ${fact.topic} ${fact.chapterTitle} ${fact.section || ""}`;

    let organSystems = matchRuleSet(text, ORGAN_SYSTEM_RULES);
    if (!organSystems.length) organSystems = ORGAN_FALLBACK_BY_TOPIC[fact.topic] || ["Neck and Lymphatics"];

    let diseaseDomains = matchRuleSet(text, DISEASE_DOMAIN_RULES);
    if (!diseaseDomains.length) diseaseDomains = ["General Concepts"];

    const focusAreas = matchRuleSet(text, FOCUS_AREA_RULES);
    const qualityTier = scoreFactQuality(fact);

    return { ...fact, organSystems, diseaseDomains, focusAreas, qualityTier };
  });
}

// ── Sibling and relationship tagging ───────────────────────────────────────────

function buildRelationships(facts) {
  const sectionGroups = {};
  facts.forEach((fact) => {
    const key = `${fact.topic}|${fact.section}`;
    if (!sectionGroups[key]) sectionGroups[key] = [];
    sectionGroups[key].push(fact.id);
  });

  const termIndex = {};
  facts.forEach((fact) => {
    // Use the raw term (strip contextualization prefix for matching)
    const rawTerm = fact.term.includes("\u2014")
      ? fact.term.split("\u2014").pop().trim()
      : fact.term;
    const normalized = rawTerm.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim();
    if (normalized.length >= 3) termIndex[normalized] = fact.id;
  });

  return facts.map((fact) => {
    const sectionKey = `${fact.topic}|${fact.section}`;
    const siblingIds = (sectionGroups[sectionKey] || []).filter((id) => id !== fact.id).slice(0, 20);

    const relatedIds = [];
    const defLower = fact.definition.toLowerCase();
    for (const [termNorm, factId] of Object.entries(termIndex)) {
      if (factId === fact.id) continue;
      if (termNorm.length >= 5 && defLower.includes(termNorm)) {
        relatedIds.push(factId);
        if (relatedIds.length >= 10) break;
      }
    }

    return { ...fact, siblingIds, relatedIds };
  });
}

// ── Facet counting ─────────────────────────────────────────────────────────────

function buildSingleCounts(facts, key) {
  const counts = {};
  for (const fact of facts) {
    const value = fact[key];
    if (!value) continue;
    counts[value] = (counts[value] || 0) + 1;
  }
  return counts;
}

function buildArrayCounts(facts, key) {
  const counts = {};
  for (const fact of facts) {
    (fact[key] || []).forEach((value) => {
      counts[value] = (counts[value] || 0) + 1;
    });
  }
  return counts;
}

function buildFacetCounts(facts) {
  return {
    topic: buildSingleCounts(facts, "topic"),
    chapter: buildSingleCounts(facts, "chapter"),
    section: buildSingleCounts(facts, "section"),
    sourceType: buildSingleCounts(facts, "sourceType"),
    qualityTier: buildSingleCounts(facts, "qualityTier"),
    organSystems: buildArrayCounts(facts, "organSystems"),
    diseaseDomains: buildArrayCounts(facts, "diseaseDomains"),
    focusAreas: buildArrayCounts(facts, "focusAreas"),
  };
}

// ── Main ───────────────────────────────────────────────────────────────────────

function main() {
  const sourceDir = process.env.PASHA_SOURCE_DIR || DEFAULT_SOURCE_DIR;

  if (!fs.existsSync(sourceDir)) {
    throw new Error(`Source directory not found: ${sourceDir}`);
  }

  const files = fs
    .readdirSync(sourceDir)
    .filter((fileName) => /^Pasha.*\.txt$/i.test(fileName))
    .sort((left, right) => left.localeCompare(right));

  if (files.length === 0) throw new Error(`No Pasha .txt files found in: ${sourceDir}`);

  const allFacts = [];
  for (const fileName of files) {
    const fullPath = path.join(sourceDir, fileName);
    const fileText = fs.readFileSync(fullPath, "utf8");
    const topic = deriveTopicName(fileName);
    const chapterMeta = extractChapterMeta(fileText, topic);
    const extractedFacts = parseFactsFromText(fileText, topic, fileName, chapterMeta);
    allFacts.push(...extractedFacts);
  }

  const dedupedFacts = dedupeAndTagFacts(allFacts);
  const taggedFacts = enrichFactTags(dedupedFacts);
  const facts = buildRelationships(taggedFacts);
  const facetCounts = buildFacetCounts(facts);

  const payload = {
    generatedAt: new Date().toISOString(),
    sourceDir,
    includeProse: INCLUDE_PROSE,
    maxProsePerFile: MAX_PROSE_PER_FILE,
    fileCount: files.length,
    totalFacts: facts.length,
    topicCounts: facetCounts.topic,
    sourceTypeCounts: facetCounts.sourceType,
    qualityTierCounts: facetCounts.qualityTier,
    facetCounts,
    facts,
  };

  fs.mkdirSync(path.dirname(OUTPUT_JSON), { recursive: true });
  fs.writeFileSync(OUTPUT_JSON, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  fs.writeFileSync(
    OUTPUT_JS,
    `window.PASHA_QUESTION_BANK = ${JSON.stringify(payload, null, 2)};\n`,
    "utf8"
  );

  console.log(`\nBuilt Pasha question bank from ${files.length} files.`);
  console.log(`Extracted ${allFacts.length} raw facts.`);
  console.log(`After dedup + filtering: ${facts.length} unique facts.`);
  console.log(`Source types: ${JSON.stringify(facetCounts.sourceType)}`);
  console.log(`Quality tiers: ${JSON.stringify(facetCounts.qualityTier)}`);
  console.log(`Saved to:`);
  console.log(`  - ${OUTPUT_JSON}`);
  console.log(`  - ${OUTPUT_JS}`);
}

try {
  main();
} catch (error) {
  console.error(`Failed to build question bank: ${error.message}`);
  process.exit(1);
}
