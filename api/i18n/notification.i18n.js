(function () {
  "use strict";

  const mailI18n = require("./mail.i18n");
  const translationService = require("../services/deeplTranslation.service");

  const SUPPORTED_LANGUAGES = ["fr", "en", "tr", "pl", "wo"];

  const NOTIFICATION_TEMPLATES = {
    TASK_ASSIGNED: {
      fr: {
        title: "Nouvelle tâche assignée",
        body: 'La tâche « {{taskTitle}} » vous a été assignée dans le projet « {{projectName}} ». Merci de vérifier votre tâche.',
      },
      en: {
        title: "New task assigned",
        body: 'Task "{{taskTitle}}" has been assigned to you on project "{{projectName}}". Please check your task.',
      },
      tr: {
        title: "Yeni görev atandı",
        body: '"{{projectName}}" projesindeki "{{taskTitle}}" görevi size atandı. Lütfen görevinizi kontrol edin.',
      },
      pl: {
        title: "Przypisano nowe zadanie",
        body: 'Zadanie "{{taskTitle}}" zostało Ci przypisane w projekcie "{{projectName}}". Sprawdź swoje zadanie.',
      },
      wo: {
        title: "Tâche bu bees",
        body: 'Tâche « {{taskTitle}} » la ñu la jox ci projet « {{projectName}} ». Xoolal sa tâche.',
      },
    },
    TASK_STATUS_UPDATED: {
      fr: {
        title: "Statut de tâche modifié",
        body: "Le statut de la tâche « {{taskTitle}} » du projet « {{projectName}} » a été modifié par {{modifierName}}. Nouveau statut : {{newStatus}}.",
      },
      en: {
        title: "Task status updated",
        body: 'The status of task "{{taskTitle}}" on project "{{projectName}}" was updated by {{modifierName}}. New status: {{newStatus}}.',
      },
      tr: {
        title: "Görev durumu güncellendi",
        body: '"{{projectName}}" projesindeki "{{taskTitle}}" görevinin durumu {{modifierName}} tarafından güncellendi. Yeni durum: {{newStatus}}.',
      },
      pl: {
        title: "Status zadania zaktualizowany",
        body: 'Status zadania "{{taskTitle}}" w projekcie "{{projectName}}" został zmieniony przez {{modifierName}}. Nowy status: {{newStatus}}.',
      },
      wo: {
        title: "Statut tâche soppi na",
        body: 'Statut tâche « {{taskTitle}} » ci projet « {{projectName}} » soppi na ko {{modifierName}}. Statut bu bees : {{newStatus}}.',
      },
    },
    AGENDA_ASSIGNED_PROJECT: {
      fr: {
        title: "Nouvelle tâche assignée",
        body: "La tâche « {{agendaTitle}} » vous a été assignée dans le projet « {{projectName}} ». Merci de vérifier votre tâche.",
      },
      en: {
        title: "New task assigned",
        body: 'Task "{{agendaTitle}}" has been assigned to you on project "{{projectName}}". Please check your task.',
      },
      tr: {
        title: "Yeni görev atandı",
        body: '"{{projectName}}" projesindeki "{{agendaTitle}}" görevi size atandı. Lütfen görevinizi kontrol edin.',
      },
      pl: {
        title: "Przypisano nowe zadanie",
        body: 'Zadanie "{{agendaTitle}}" zostało Ci przypisane w projekcie "{{projectName}}". Sprawdź swoje zadanie.',
      },
      wo: {
        title: "Tâche bu bees",
        body: 'Tâche « {{agendaTitle}} » la ñu la jox ci projet « {{projectName}} ». Xoolal sa tâche.',
      },
    },
    AGENDA_ASSIGNED: {
      fr: {
        title: "Nouvelle tâche assignée",
        body: "La tâche « {{agendaTitle}} » vous a été assignée. Merci de vérifier votre agenda.",
      },
      en: {
        title: "New task assigned",
        body: 'Task "{{agendaTitle}}" has been assigned to you. Please check your agenda.',
      },
      tr: {
        title: "Yeni görev atandı",
        body: '"{{agendaTitle}}" görevi size atandı. Lütfen ajandanızı kontrol edin.',
      },
      pl: {
        title: "Przypisano nowe zadanie",
        body: 'Zadanie "{{agendaTitle}}" zostało Ci przypisane. Sprawdź swój kalendarz.',
      },
      wo: {
        title: "Tâche bu bees",
        body: 'Tâche « {{agendaTitle}} » la ñu la jox. Xoolal sa agenda.',
      },
    },
    AGENDA_UPDATED_PROJECT: {
      fr: {
        title: "Tâche assignée",
        body: "La tâche « {{agendaTitle}} » a été modifiée dans le projet « {{projectName}} ». Merci de vérifier votre tâche.",
      },
      en: {
        title: "Task updated",
        body: 'Task "{{agendaTitle}}" was updated on project "{{projectName}}". Please check your task.',
      },
      tr: {
        title: "Görev güncellendi",
        body: '"{{projectName}}" projesindeki "{{agendaTitle}}" görevi güncellendi. Lütfen görevinizi kontrol edin.',
      },
      pl: {
        title: "Zadanie zaktualizowane",
        body: 'Zadanie "{{agendaTitle}}" zostało zaktualizowane w projekcie "{{projectName}}". Sprawdź swoje zadanie.',
      },
      wo: {
        title: "Tâche soppi na",
        body: 'Tâche « {{agendaTitle}} » soppi na ci projet « {{projectName}} ». Xoolal sa tâche.',
      },
    },
    AGENDA_UPDATED: {
      fr: {
        title: "Tâche assignée",
        body: "La tâche « {{agendaTitle}} » a été modifiée. Veuillez vérifier votre agenda.",
      },
      en: {
        title: "Task updated",
        body: 'Task "{{agendaTitle}}" was updated. Please check your agenda.',
      },
      tr: {
        title: "Görev güncellendi",
        body: '"{{agendaTitle}}" görevi güncellendi. Lütfen ajandanızı kontrol edin.',
      },
      pl: {
        title: "Zadanie zaktualizowane",
        body: 'Zadanie "{{agendaTitle}}" zostało zaktualizowane. Sprawdź swój kalendarz.',
      },
      wo: {
        title: "Tâche soppi na",
        body: 'Tâche « {{agendaTitle}} » soppi na. Xoolal sa agenda.',
      },
    },
    PV_RECEPTION_SIGNED: {
      fr: {
        title: "Signature de PV de réception",
        body: "Le PV de réception « {{pvTitle}} - Version {{pvVersion}} » a été signé par {{signerName}}. Merci de vérifier et lui transmettre le document.",
      },
      en: {
        title: "Reception report signed",
        body: 'Reception report "{{pvTitle}} - Version {{pvVersion}}" was signed by {{signerName}}. Please review and forward the document.',
      },
      tr: {
        title: "Teslim tutanağı imzalandı",
        body: '"{{pvTitle}} - Sürüm {{pvVersion}}" teslim tutanağı {{signerName}} tarafından imzalandı. Lütfen kontrol edin ve belgeyi iletin.',
      },
      pl: {
        title: "Podpisano protokół odbioru",
        body: 'Protokół odbioru "{{pvTitle}} - Wersja {{pvVersion}}" został podpisany przez {{signerName}}. Sprawdź i przekaż dokument.',
      },
      wo: {
        title: "PV réception ñu ko bind",
        body: 'PV réception « {{pvTitle}} - Version {{pvVersion}} » {{signerName}} mo ko bind. Xoolal te yónnee document bi.',
      },
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

    if (enriched.taskTitleSource) {
      enriched.taskTitle = translationService.getDisplayTitle(
        enriched.taskTitleSource,
        language
      );
    }

    if (enriched.agendaTitleSource) {
      enriched.agendaTitle = translationService.getDisplayTitle(
        enriched.agendaTitleSource,
        language
      );
    }

    if (enriched.taskStatus != null && enriched.taskStatus !== "") {
      enriched.newStatus = mailI18n.getTaskStatusLabel(
        enriched.taskStatus,
        language
      );
    }

    return enriched;
  }

  function buildNotificationTranslationFields(templateKey, context) {
    const template = NOTIFICATION_TEMPLATES[templateKey];
    if (!template) {
      throw new Error(`Notification template inconnu: ${templateKey}`);
    }

    const titleTranslations = {};
    const bodyTranslations = {};

    SUPPORTED_LANGUAGES.forEach((language) => {
      const localized = template[language] || template.fr;
      const langContext = buildContextForLanguage(context, language);
      titleTranslations[language] = formatTemplate(localized.title, langContext);
      bodyTranslations[language] = formatTemplate(localized.body, langContext);
    });

    return {
      title: titleTranslations.fr,
      body: bodyTranslations.fr,
      originalTitle: titleTranslations.fr,
      originalBody: bodyTranslations.fr,
      sourceLanguage: "fr",
      titleTranslations,
      bodyTranslations,
      translation: {
        provider: "static",
        status: "translated",
        translatedAt: new Date(),
        baseLanguage: "fr",
        templateKey,
      },
    };
  }

  function getLocalizedNotificationContent(fields, language) {
    const lang = language || "fr";
    return {
      title: fields.titleTranslations?.[lang] || fields.title,
      body: fields.bodyTranslations?.[lang] || fields.body,
    };
  }

  module.exports = {
    NOTIFICATION_TEMPLATES,
    SUPPORTED_LANGUAGES,
    buildNotificationTranslationFields,
    getLocalizedNotificationContent,
    formatTemplate,
  };
})();
