(function () {
  "use strict";

  const mailI18n = require("./mail.i18n");
  const translationService = require("../services/deeplTranslation.service");

  const SUPPORTED_LANGUAGES = ["fr", "en", "tr", "pl", "wo"];

  const HISTORIQUE_TEMPLATES = {
    TASK_STATUS_CHANGED: {
      fr: "{{modifierName}} a changé le statut de la tâche en « {{statusLabel}} ».",
      en: '{{modifierName}} changed the task status to "{{statusLabel}}".',
      tr: '{{modifierName}}, görev durumunu "{{statusLabel}}" olarak değiştirdi.',
      pl: '{{modifierName}} zmienił(a) status zadania na „{{statusLabel}}”.',
      wo: "{{modifierName}} soppi statut tâche bi ci « {{statusLabel}} ».",
    },
    SUBTASK_STATUS_CHANGED: {
      fr: '{{modifierName}} a changé le statut de la sous-tâche « {{subTaskDescription}} » en « {{statusLabel}} ».',
      en: '{{modifierName}} changed the sub-task "{{subTaskDescription}}" status to "{{statusLabel}}".',
      tr: '{{modifierName}}, "{{subTaskDescription}}" alt görevinin durumunu "{{statusLabel}}" olarak değiştirdi.',
      pl: '{{modifierName}} zmienił(a) status podzadania „{{subTaskDescription}}” na „{{statusLabel}}”.',
      wo: "{{modifierName}} soppi statut sous-tâche « {{subTaskDescription}} » ci « {{statusLabel}} ».",
    },
  };

  function formatTemplate(template, context) {
    let output = String(template || "");
    const values = context || {};

    Object.keys(values).forEach((key) => {
      output = output.replace(
        new RegExp(`\\{\\{${key}\\}\\}`, "g"),
        values[key] == null ? "" : String(values[key])
      );
    });

    return output;
  }

  function buildContextForLanguage(context, language) {
    const enriched = { ...(context || {}) };

    if (enriched.taskStatus != null && enriched.taskStatus !== "") {
      enriched.statusLabel = mailI18n.getTaskStatusLabel(
        enriched.taskStatus,
        language
      );
    }

    if (enriched.subTaskDescriptionSource) {
      enriched.subTaskDescription = translationService.getDisplayDescription(
        enriched.subTaskDescriptionSource,
        language
      );
    }

    return enriched;
  }

  function buildHistoriqueDescriptionFields(templateKey, context) {
    const template = HISTORIQUE_TEMPLATES[templateKey];
    if (!template) {
      throw new Error(`Gabarit historique inconnu: ${templateKey}`);
    }

    const descriptionTranslations = {};

    SUPPORTED_LANGUAGES.forEach((language) => {
      const langContext = buildContextForLanguage(context, language);
      descriptionTranslations[language] = formatTemplate(
        template[language] || template.fr,
        langContext
      );
    });

    return {
      description: descriptionTranslations.fr,
      originalDescription: descriptionTranslations.fr,
      descriptionSourceLanguage: "fr",
      descriptionTranslations,
      descriptionTranslation: {
        provider: "static",
        status: "translated",
        translatedAt: new Date(),
        baseLanguage: "fr",
        templateKey,
      },
    };
  }

  module.exports = {
    HISTORIQUE_TEMPLATES,
    SUPPORTED_LANGUAGES,
    buildHistoriqueDescriptionFields,
    formatTemplate,
  };
})();
