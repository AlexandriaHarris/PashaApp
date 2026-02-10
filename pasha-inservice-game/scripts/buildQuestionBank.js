#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const DEFAULT_SOURCE_DIR =
  "/Users/Alex/Desktop/ENT practice tests/ENT Resources/Pasha_Text_Extracts";
const OUTPUT_JSON = path.join(__dirname, "..", "data", "pasha-question-bank.json");
const OUTPUT_JS = path.join(__dirname, "..", "data", "pasha-question-bank.js");
const INCLUDE_PROSE = process.env.PASHA_INCLUDE_PROSE !== "0";
const MAX_PROSE_PER_FILE = Number(process.env.PASHA_MAX_PROSE_PER_FILE || "2500");

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

const ORGAN_SYSTEM_RULES = [
  {
    name: "Thyroid and Parathyroid",
    patterns: [/\bthyroid\b/i, /\bparathyroid\b/i, /\bgoiter\b/i, /\bgraves\b/i],
  },
  {
    name: "Ear and Temporal Bone",
    patterns: [
      /\bear\b/i,
      /\botology\b/i,
      /\botic\b/i,
      /\btympan/i,
      /\bcochlea/i,
      /\btemporal bone\b/i,
      /\beac\b/i,
    ],
  },
  {
    name: "Nose and Sinus",
    patterns: [
      /\bnasal\b/i,
      /\bnose\b/i,
      /\brhino/i,
      /\bsinus\b/i,
      /\bseptum\b/i,
      /\bturbinate\b/i,
      /\bchoana/i,
    ],
  },
  {
    name: "Larynx and Airway",
    patterns: [
      /\blarynx\b/i,
      /\blarynge/i,
      /\bglott/i,
      /\bvocal fold\b/i,
      /\btrache/i,
      /\bstridor\b/i,
      /\bairway\b/i,
    ],
  },
  {
    name: "Oral Cavity and Salivary",
    patterns: [
      /\boral\b/i,
      /\borophary/i,
      /\btongue\b/i,
      /\bpalate\b/i,
      /\bsalivary\b/i,
      /\bparotid\b/i,
      /\bsubmandibular\b/i,
      /\bsial/i,
    ],
  },
  {
    name: "Pharynx and Esophagus",
    patterns: [/\bpharynx\b/i, /\bpharynge/i, /\besophag/i, /\bdysphagia\b/i],
  },
  {
    name: "Neck and Lymphatics",
    patterns: [/\bneck\b/i, /\bcervical\b/i, /\blymph\b/i, /\bnode\b/i, /\bmass\b/i],
  },
  {
    name: "Cranial Nerves and Neuro",
    patterns: [
      /\bcranial nerve\b/i,
      /\bCN\s*[IVX]+\b/i,
      /\btrigeminal\b/i,
      /\bfacial nerve\b/i,
      /\bvestibulocochlear\b/i,
      /\bneurolog/i,
    ],
  },
  {
    name: "Sleep and Breathing",
    patterns: [/\bsleep\b/i, /\bOSA\b/i, /\bapnea\b/i, /\bCPAP\b/i, /\bsnoring\b/i],
  },
  {
    name: "Facial Plastics and Skin",
    patterns: [
      /\bfacial\b/i,
      /\brhinoplasty\b/i,
      /\bblepharoplasty\b/i,
      /\bcutaneous\b/i,
      /\bskin\b/i,
      /\breconstruct/i,
    ],
  },
  {
    name: "Head and Neck Oncology",
    patterns: [
      /\bcancer\b/i,
      /\bcarcinoma\b/i,
      /\bmalignan/i,
      /\bmetast/i,
      /\boncolog/i,
      /\bSCC\b/i,
    ],
  },
  {
    name: "Trauma",
    patterns: [/\btrauma\b/i, /\bfracture\b/i, /\binjury\b/i, /\bwound\b/i],
  },
  {
    name: "Pediatrics",
    patterns: [/\bpediatric\b/i, /\bchildren\b/i, /\binfant\b/i, /\bneonate\b/i],
  },
];

const DISEASE_DOMAIN_RULES = [
  {
    name: "Infectious",
    patterns: [/\binfect/i, /\bviral\b/i, /\bbacterial\b/i, /\bfungal\b/i, /\babscess\b/i],
  },
  {
    name: "Neoplastic",
    patterns: [/\btumor\b/i, /\bneoplasm\b/i, /\bcancer\b/i, /\bcarcinoma\b/i, /\bmalignan/i],
  },
  {
    name: "Inflammatory, Allergic, Autoimmune",
    patterns: [/\binflamm/i, /\ballerg/i, /\bautoimmune\b/i, /\bgranulomat/i],
  },
  {
    name: "Congenital and Developmental",
    patterns: [/\bcongenital\b/i, /\bembryolog/i, /\bdevelopment/i, /\batresia\b/i],
  },
  {
    name: "Traumatic and Iatrogenic",
    patterns: [/\btrauma\b/i, /\bfracture\b/i, /\biatrogenic\b/i, /\bpostoperative\b/i],
  },
  {
    name: "Vascular and Hemorrhagic",
    patterns: [/\bvascular\b/i, /\bhemorrhag/i, /\bbleed/i, /\bepistaxis\b/i, /\bthrombo/i],
  },
  {
    name: "Neurologic",
    patterns: [/\bneurolog/i, /\bnerve\b/i, /\bparalysis\b/i, /\bvertigo\b/i, /\bnystagmus\b/i],
  },
  {
    name: "Endocrine and Metabolic",
    patterns: [/\bendocrin/i, /\bmetabolic\b/i, /\bthyroid\b/i, /\bparathyroid\b/i],
  },
  {
    name: "Degenerative and Functional",
    patterns: [/\bdegener/i, /\bpresby/i, /\bfunctional\b/i, /\bdysfunction\b/i],
  },
  {
    name: "Diagnostic and Staging",
    patterns: [/\bdiagnos/i, /\bevaluation\b/i, /\bimaging\b/i, /\bTNM\b/i, /\bstaging\b/i],
  },
  {
    name: "Therapeutic and Surgical",
    patterns: [/\bmanagement\b/i, /\btreat/i, /\bsurgery\b/i, /\btherapy\b/i, /\boperative\b/i],
  },
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

function titleCase(value) {
  return value
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function deriveTopicName(fileName) {
  const stem = path.basename(fileName, ".txt");
  if (TOPIC_NAME_MAP[stem]) {
    return TOPIC_NAME_MAP[stem];
  }

  const withoutPrefix = stem.replace(/^Pasha/, "");
  const withSpaces = withoutPrefix.replace(/([a-z])([A-Z])/g, "$1 $2");
  return titleCase(withSpaces.replace(/\s+/g, " ").trim());
}

function maybeUndoubleWord(word) {
  if (word.length < 6 || word.length % 2 !== 0) {
    return word;
  }

  let pairsMatch = true;
  for (let index = 0; index < word.length; index += 2) {
    if (word[index] !== word[index + 1]) {
      pairsMatch = false;
      break;
    }
  }

  if (!pairsMatch) {
    return word;
  }

  let out = "";
  for (let index = 0; index < word.length; index += 2) {
    out += word[index];
  }
  return out;
}

function normalizeLine(rawLine) {
  const normalized = rawLine
    .replace(/\u00A0/g, " ")
    .replace(/[“”]/g, '"')
    .replace(/[’]/g, "'")
    .replace(/\t/g, " ")
    .trim();

  const undoubled = normalized
    .split(/\s+/)
    .map(maybeUndoubleWord)
    .join(" ");

  return undoubled.replace(/\s+/g, " ").trim();
}

function stripListPrefix(line) {
  return line
    .replace(/^[-*•]\s*/, "")
    .replace(/^\d+[.)]\s*/, "")
    .trim();
}

function cleanSegment(text) {
  return text
    .replace(/^[.,;:)\]]+/, "")
    .replace(/[.,;:([\-]+$/, "")
    .replace(/\s+\.+$/, "")
    .replace(/\bcontinues\b$/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

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
  if (term.length < 2 || term.length > 110) {
    return false;
  }
  if (definition.length < 8 || definition.length > 420) {
    return false;
  }
  if (term.split(/\s+/).length > 14) {
    return false;
  }
  if (!/[A-Za-z]/.test(term) || !/[A-Za-z]/.test(definition)) {
    return false;
  }
  if (/^(chapter|page|figure|table|overview|introduction)\b/i.test(term)) {
    return false;
  }
  if (/^\d+$/.test(term)) {
    return false;
  }
  return true;
}

function isLikelyHeading(line) {
  if (!line || line.includes(":") || /[.?!;]/.test(line)) {
    return false;
  }

  const words = line.split(/\s+/).filter(Boolean);
  if (words.length < 1 || words.length > 10) {
    return false;
  }

  if (/^[A-Z0-9 ()/-]+$/.test(line) && /[A-Z]/.test(line)) {
    return true;
  }

  const titledWords = words.filter((word) => /^[A-Z][A-Za-z0-9'()/.-]*$/.test(word)).length;
  return titledWords / words.length >= 0.7;
}

function sanitizeHeading(line) {
  const candidate = cleanSegment(line);
  if (!candidate || candidate.length < 3 || candidate.length > 120) {
    return "";
  }
  if (/^(chapter|page|figure|table)\b/i.test(candidate)) {
    return "";
  }
  return candidate;
}

function splitParagraphIntoSentences(paragraph) {
  if (!paragraph) {
    return [];
  }

  return paragraph
    .split(/(?<=[.?!])\s+(?=[A-Z0-9(])/g)
    .map(cleanSegment)
    .filter(Boolean);
}

function isLikelyProseSentence(sentence) {
  if (!sentence || sentence.length < 40 || sentence.length > 320) {
    return false;
  }
  if (!/[A-Za-z]/.test(sentence)) {
    return false;
  }
  const wordCount = sentence.split(/\s+/).length;
  if (wordCount < 7 || wordCount > 55) {
    return false;
  }
  if (/^Figure\b/i.test(sentence) || /^Table\b/i.test(sentence)) {
    return false;
  }
  if (!/^\(?[A-Za-z0-9]/.test(sentence)) {
    return false;
  }
  if (/^(to|into|from|of|and|or|with|without|via|for)\b/i.test(sentence)) {
    return false;
  }
  if (/[,:;]$/.test(sentence)) {
    return false;
  }
  if (/\.\s*\.\s*\./.test(sentence) || /\.{3,}/.test(sentence)) {
    return false;
  }
  if (/^[A-Z0-9 ()/-]+$/.test(sentence)) {
    return false;
  }

  return /\b(is|are|was|were|can|may|has|have|contains|contain|consists|include|includes|forms|form|arises|arise|occurs|occur|results|result|causes|cause|provides|provide|supplies|supply|innervates|innervate|derives|derived|treated|treat|diagnosed|diagnosis|evaluated|evaluation|associated)\b/i.test(
    sentence
  );
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
    if (heading) {
      subject = `${heading} statement`;
    } else {
      subject = cleanSegment(working.split(/\s+/).slice(0, 8).join(" "));
    }
  }

  if (/^(the|a|an)\s+/i.test(subject)) {
    subject = subject.replace(/^(the|a|an)\s+/i, "");
  }
  subject = subject.replace(/^[,;:()\-\s]+/, "").replace(/\s+/g, " ").trim();
  if (!/^[A-Z]/.test(subject)) {
    if (/^(to|into|from|of|and|or|with|without|via|for)\b/i.test(subject)) {
      subject = heading || titleCase(working.split(/\s+/).slice(0, 8).join(" "));
    } else {
      subject = titleCase(subject);
    }
  }

  if (subject.length > 110) {
    subject = `${subject.slice(0, 109).trim()}...`;
  }

  return subject;
}

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

      if (/^\d+$/.test(next)) {
        chapterNumber = Number(next);
      }

      if (nextNext && !/^\d+$/.test(nextNext) && !isNoiseLine(nextNext)) {
        chapterTitle = cleanSegment(nextNext) || topic;
        break;
      }
    }
  }

  const chapter = chapterNumber
    ? `Chapter ${chapterNumber}: ${chapterTitle}`
    : `Chapter: ${chapterTitle}`;

  return {
    chapterNumber,
    chapterTitle,
    chapter,
  };
}

function parseColonFacts(lines, topic, sourceFile, chapterMeta) {
  const facts = [];
  let currentHeading = chapterMeta.chapterTitle;

  for (const rawLine of lines) {
    if (isNoiseLine(rawLine)) {
      continue;
    }

    const line = stripListPrefix(rawLine);
    if (!line) {
      continue;
    }

    if (!line.includes(":") && isLikelyHeading(line)) {
      const heading = sanitizeHeading(line);
      if (heading) {
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
    const rawTerm = cleanSegment(line.slice(0, separator));
    const rawDefinition = cleanSegment(line.slice(separator + 1));

    if (!isLikelyFact(rawTerm, rawDefinition)) {
      continue;
    }

    facts.push({
      topic,
      chapter: chapterMeta.chapter,
      chapterNumber: chapterMeta.chapterNumber,
      chapterTitle: chapterMeta.chapterTitle,
      section: currentHeading || chapterMeta.chapterTitle,
      term: rawTerm,
      definition: rawDefinition,
      sourceFile,
      sourceType: "colon",
    });
  }

  return facts;
}

function parseProseFacts(lines, topic, sourceFile, chapterMeta) {
  const facts = [];
  let currentHeading = chapterMeta.chapterTitle;
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

    if (!paragraph || paragraph.length < 40) {
      return;
    }

    const sentences = splitParagraphIntoSentences(paragraph);
    for (const sentence of sentences) {
      if (!isLikelyProseSentence(sentence)) {
        continue;
      }

      const term = deriveTermFromSentence(sentence, currentHeading);
      if (!isLikelyFact(term, sentence)) {
        continue;
      }

      facts.push({
        topic,
        chapter: chapterMeta.chapter,
        chapterNumber: chapterMeta.chapterNumber,
        chapterTitle: chapterMeta.chapterTitle,
        section: currentHeading || chapterMeta.chapterTitle,
        term,
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
    if (limitReached) {
      break;
    }

    if (isNoiseLine(rawLine)) {
      flushParagraph();
      previousLineHadColon = false;
      continue;
    }

    const line = stripListPrefix(rawLine);
    if (!line) {
      flushParagraph();
      previousLineHadColon = false;
      continue;
    }

    if (line.includes(":")) {
      flushParagraph();
      previousLineHadColon = true;
      continue;
    }

    if (
      previousLineHadColon &&
      (/^[a-z(]/.test(line) || /^(to|into|from|of|and|or|with|without|via|for)\b/i.test(line))
    ) {
      continue;
    }
    previousLineHadColon = false;

    if (isLikelyHeading(line)) {
      flushParagraph();
      const heading = sanitizeHeading(line);
      if (heading) {
        currentHeading = heading;
      }
      continue;
    }

    paragraphParts.push(line);
    if (/[.?!]$/.test(line) || paragraphParts.length >= 4) {
      flushParagraph();
    }
  }

  flushParagraph();
  return facts;
}

function parseFactsFromText(text, topic, sourceFile, chapterMeta) {
  const lines = text.split(/\r?\n/).map(normalizeLine);
  const colonFacts = parseColonFacts(lines, topic, sourceFile, chapterMeta);
  const proseFacts = INCLUDE_PROSE
    ? parseProseFacts(lines, topic, sourceFile, chapterMeta)
    : [];
  return [...colonFacts, ...proseFacts];
}

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
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);

    deduped.push({
      id: `fact-${index}`,
      topic: fact.topic,
      chapter: fact.chapter,
      chapterNumber: fact.chapterNumber,
      chapterTitle: fact.chapterTitle,
      section: fact.section,
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
    const text = `${fact.term} ${fact.definition} ${fact.topic} ${fact.chapterTitle} ${
      fact.section || ""
    }`;

    let organSystems = matchRuleSet(text, ORGAN_SYSTEM_RULES);
    if (!organSystems.length) {
      organSystems = ORGAN_FALLBACK_BY_TOPIC[fact.topic] || ["Neck and Lymphatics"];
    }

    let diseaseDomains = matchRuleSet(text, DISEASE_DOMAIN_RULES);
    if (!diseaseDomains.length) {
      diseaseDomains = ["General Concepts"];
    }

    const focusAreas = matchRuleSet(text, FOCUS_AREA_RULES);

    return {
      ...fact,
      organSystems,
      diseaseDomains,
      focusAreas,
    };
  });
}

function buildSingleCounts(facts, key) {
  const counts = {};
  for (const fact of facts) {
    const value = fact[key];
    if (!value) {
      continue;
    }
    counts[value] = (counts[value] || 0) + 1;
  }
  return counts;
}

function buildArrayCounts(facts, key) {
  const counts = {};
  for (const fact of facts) {
    const values = fact[key] || [];
    values.forEach((value) => {
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
    organSystems: buildArrayCounts(facts, "organSystems"),
    diseaseDomains: buildArrayCounts(facts, "diseaseDomains"),
    focusAreas: buildArrayCounts(facts, "focusAreas"),
  };
}

function main() {
  const sourceDir = process.env.PASHA_SOURCE_DIR || DEFAULT_SOURCE_DIR;

  if (!fs.existsSync(sourceDir)) {
    throw new Error(`Source directory not found: ${sourceDir}`);
  }

  const files = fs
    .readdirSync(sourceDir)
    .filter((fileName) => /^Pasha.*\.txt$/i.test(fileName))
    .sort((left, right) => left.localeCompare(right));

  if (files.length === 0) {
    throw new Error(`No Pasha .txt files found in: ${sourceDir}`);
  }

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
  const facts = enrichFactTags(dedupedFacts);
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

  console.log(`Built Pasha question bank from ${files.length} files.`);
  console.log(`Extracted ${allFacts.length} raw facts.`);
  console.log(`Source types: ${JSON.stringify(facetCounts.sourceType)}`);
  console.log(`Top organ systems: ${JSON.stringify(facetCounts.organSystems)}`);
  console.log(`Saved ${facts.length} unique facts to:`);
  console.log(`  - ${OUTPUT_JSON}`);
  console.log(`  - ${OUTPUT_JS}`);
}

try {
  main();
} catch (error) {
  console.error(`Failed to build question bank: ${error.message}`);
  process.exit(1);
}
