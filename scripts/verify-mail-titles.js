#!/usr/bin/env node
"use strict";

const translationService = require("../api/services/deeplTranslation.service");
const mailI18n = require("../api/i18n/mail.i18n");

function assert(condition, message) {
  if (!condition) {
    console.error("FAIL:", message);
    process.exitCode = 1;
    throw new Error(message);
  }
  console.log("OK:", message);
}

const tacheEnSource = {
  titre: "Inspection électrique",
  originalTitle: "Electrical inspection",
  titleTranslations: new Map([
    ["fr", "Inspection électrique"],
    ["en", "Electrical inspection"],
    ["tr", "Elektrik kontrolü"],
  ]),
};

const tacheLegacy = {
  titre: "Titre source polonais",
  originalTitle: "Titre source polonais",
  titleTranslations: {},
};

const assigneeEn = { nom: "Dupont", prenom: "Jean", preferredLanguage: "en" };

const frStrings = mailI18n.getFrenchTaskMailStrings(assigneeEn, tacheEnSource);
assert(
  frStrings.assignmentMessage.includes("Inspection électrique"),
  "mail tâche FR : titre en français dans la version française"
);
assert(
  !frStrings.assignmentMessage.includes("Electrical inspection"),
  "mail tâche FR : pas le titre anglais brut"
);

const enStrings = mailI18n.getTaskMailStrings("en", assigneeEn, tacheEnSource);
assert(
  enStrings.assignmentMessage.includes("Electrical inspection"),
  "mail tâche EN : titre en anglais dans la version localisée"
);

const frLegacy = mailI18n.getFrenchTaskMailStrings(assigneeEn, tacheLegacy);
assert(
  frLegacy.assignmentMessage.includes("Titre source polonais"),
  "mail tâche legacy : repli sur titre canonique"
);

const agenda = {
  title: "Réunion chantier",
  titleTranslations: new Map([
    ["fr", "Réunion chantier"],
    ["en", "Site meeting"],
  ]),
};

const frPlanning = mailI18n.getFrenchPlanningMailStrings(assigneeEn, agenda);
assert(
  frPlanning.assignmentMessage.includes("Réunion chantier"),
  "mail planning FR : titre agenda traduit"
);

if (!process.exitCode) {
  console.log("\nTous les contrôles mail/titre sont passés.");
}
