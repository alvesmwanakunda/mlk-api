(function () {
  "use strict";

  const axios = require("axios");
  const ObjectId = require("mongoose").Types.ObjectId;

  const APP_TO_DEEPL_LANGUAGE = {
    fr: "FR",
    en: "EN-US",
    tr: "TR",
    pl: "PL",
    wo: "WO",
  };

  const APP_TO_DEEPL_SOURCE_LANGUAGE = {
    fr: "FR",
    en: "EN",
    tr: "TR",
    pl: "PL",
    wo: "WO",
  };

  const DEFAULT_NOTE_LANGUAGES = ["fr", "en", "tr", "pl", "wo"];

  function getConfiguredNoteLanguages() {
    const configured = process.env.NOTE_TRANSLATION_LANGUAGES;
    if (!configured) return DEFAULT_NOTE_LANGUAGES;

    const languages = configured
      .split(",")
      .map((language) => normalizeAppLanguage(language))
      .filter(Boolean);

    return languages.length ? Array.from(new Set(languages)) : DEFAULT_NOTE_LANGUAGES;
  }

  function getApiUrl() {
    if (process.env.DEEPL_API_URL) return process.env.DEEPL_API_URL;
    if (process.env.DEEPL_API_PLAN === "free") return "https://api-free.deepl.com";
    return "https://api.deepl.com";
  }

  function getAuthKey() {
    return process.env.DEEPL_AUTH_KEY || process.env.DEEPL_API_KEY;
  }

  function normalizeAppLanguage(language) {
    if (!language || typeof language !== "string") return null;
    const normalized = language.toLowerCase().replace("_", "-").trim();
    if (normalized.startsWith("fr")) return "fr";
    if (normalized.startsWith("en")) return "en";
    if (normalized.startsWith("tr")) return "tr";
    if (normalized.startsWith("pl")) return "pl";
    if (normalized.startsWith("wo")) return "wo";
    return normalized.split("-")[0] || null;
  }

  function normalizeDeepLLanguage(language) {
    if (!language || typeof language !== "string") return null;
    return normalizeAppLanguage(language);
  }

  function getDeepLTargetLanguage(language) {
    const appLanguage = normalizeAppLanguage(language);
    return APP_TO_DEEPL_LANGUAGE[appLanguage] || appLanguage?.toUpperCase();
  }

  function getDeepLSourceLanguage(language) {
    const appLanguage = normalizeAppLanguage(language);
    return APP_TO_DEEPL_SOURCE_LANGUAGE[appLanguage] || appLanguage?.toUpperCase();
  }

  function isSameLanguage(sourceLanguage, targetLanguage) {
    const source = normalizeAppLanguage(sourceLanguage);
    const target = normalizeAppLanguage(targetLanguage);
    return !!source && !!target && source === target;
  }

  async function translateTexts(texts, targetLanguage, sourceLanguage) {
    const segments = Array.isArray(texts)
      ? texts.map((segment) => (typeof segment === "string" ? segment : ""))
      : [];

    if (!segments.length) {
      return {
        texts: [],
        skipped: true,
      };
    }

    const authKey = getAuthKey();
    const target = getDeepLTargetLanguage(targetLanguage);

    if (!authKey || !target) {
      return {
        texts: segments,
        skipped: true,
      };
    }

    const payload = {
      text: segments,
      target_lang: target,
    };

    if (sourceLanguage) {
      payload.source_lang = getDeepLSourceLanguage(sourceLanguage);
    }

    const response = await axios.post(`${getApiUrl()}/v2/translate`, payload, {
      headers: {
        Authorization: `DeepL-Auth-Key ${authKey}`,
        "Content-Type": "application/json",
      },
      timeout: Number(process.env.DEEPL_TIMEOUT_MS || 10000),
    });

    const translations = response.data?.translations || [];

    return {
      texts: segments.map(
        (segment, index) => translations[index]?.text || segment
      ),
      skipped: false,
      billedCharacters: translations.reduce(
        (total, item) => total + (item?.billed_characters || 0),
        0
      ),
    };
  }

  async function translateText(text, targetLanguage, sourceLanguage) {
    const result = await translateTexts([text], targetLanguage, sourceLanguage);
    const segment = typeof text === "string" ? text : "";

    return {
      text: result.texts?.[0] || segment,
      detectedSourceLanguage: normalizeAppLanguage(sourceLanguage),
      billedCharacters: result.billedCharacters,
      skipped: result.skipped,
    };
  }

  async function buildNoteTranslationFields(text) {
    const originalText = typeof text === "string" ? text.trim() : "";
    const translations = {};

    if (!originalText) {
      return {
        text: "",
        originalText: "",
        sourceLanguage: null,
        translations,
        translation: {
          provider: "deepl",
          status: "skipped_empty_text",
          translatedAt: new Date(),
        },
      };
    }

    if (!getAuthKey()) {
      translations.fr = originalText;
      return {
        text: originalText,
        originalText,
        sourceLanguage: null,
        translations,
        translation: {
          provider: "deepl",
          status: "skipped_missing_auth_key",
          translatedAt: new Date(),
        },
      };
    }

    try {
      const frenchTranslation = await translateText(originalText, "fr");
      const sourceLanguage = frenchTranslation.detectedSourceLanguage;
      const frenchText = isSameLanguage(sourceLanguage, "fr")
        ? originalText
        : frenchTranslation.text;

      translations.fr = frenchText;

      const targetLanguages = getConfiguredNoteLanguages().filter(
        (language) => language !== "fr"
      );

      await Promise.all(
        targetLanguages.map(async (language) => {
          if (isSameLanguage(sourceLanguage, language)) {
            translations[language] = originalText;
            return;
          }

          const translated = await translateText(
            originalText,
            language,
            sourceLanguage
          );
          translations[language] = translated.text;
        })
      );

      return {
        text: frenchText,
        originalText,
        sourceLanguage,
        translations,
        translation: {
          provider: "deepl",
          status: "translated",
          translatedAt: new Date(),
          baseLanguage: "fr",
        },
      };
    } catch (error) {
      console.error("Erreur DeepL:", error.response?.data || error.message);
      translations.fr = originalText;
      return {
        text: originalText,
        originalText,
        sourceLanguage: null,
        translations,
        translation: {
          provider: "deepl",
          status: "failed",
          translatedAt: new Date(),
          error: error.response?.data?.message || error.message,
        },
      };
    }
  }

  async function buildTacheTitleTranslationFields(title) {
    const fields = await buildNoteTranslationFields(title);
    return {
      titre: fields.text,
      originalTitle: fields.originalText,
      titleSourceLanguage: fields.sourceLanguage,
      titleTranslations: fields.translations,
      titleTranslation: fields.translation,
    };
  }

  async function buildAgendaTitleTranslationFields(title) {
    const fields = await buildNoteTranslationFields(title);
    return {
      title: fields.text,
      originalTitle: fields.originalText,
      titleSourceLanguage: fields.sourceLanguage,
      titleTranslations: fields.translations,
      titleTranslation: fields.translation,
    };
  }

  async function buildSousTacheDescriptionTranslationFields(description) {
    const fields = await buildNoteTranslationFields(description);
    return {
      description: fields.text,
      originalDescription: fields.originalText,
      descriptionSourceLanguage: fields.sourceLanguage,
      descriptionTranslations: fields.translations,
      descriptionTranslation: fields.translation,
    };
  }

  async function buildTacheDescriptionTranslationFields(description) {
    return buildSousTacheDescriptionTranslationFields(description);
  }

  function toTitleSource(entity) {
    if (!entity) return null;

    const plain =
      entity && typeof entity.toObject === "function"
        ? entity.toObject({ virtuals: true })
        : { ...entity };

    return {
      titleTranslations: plain.titleTranslations,
      titre: plain.titre,
      title: plain.title,
      originalTitle: plain.originalTitle,
    };
  }

  function getTranslationsObject(note) {
    if (!note?.translations) return {};
    if (note.translations instanceof Map) {
      return Object.fromEntries(note.translations);
    }
    return note.translations;
  }

  function getDisplayText(note, requestedLanguage) {
    const language = normalizeAppLanguage(requestedLanguage) || "fr";
    const translations = getTranslationsObject(note);

    return (
      translations[language] ||
      note?.displayText ||
      note?.text ||
      note?.originalText ||
      ""
    );
  }

  function getTitleTranslationsObject(entity) {
    const raw = entity?.titleTranslations;
    if (!raw) return {};
    if (raw instanceof Map) {
      return Object.fromEntries(raw);
    }
    if (typeof raw === "object") {
      return { ...raw };
    }
    return {};
  }

  function pickNonEmptyTranslation(translations, language) {
    const value = translations?.[language];
    if (value == null) return "";
    const text = String(value).trim();
    return text;
  }

  function getDisplayTitle(tache, requestedLanguage) {
    const language = normalizeAppLanguage(requestedLanguage) || "fr";
    const translations = getTitleTranslationsObject(tache);

    const localized = pickNonEmptyTranslation(translations, language);
    if (localized) return localized;

    // Champ canonique FR (buildTacheTitleTranslationFields / buildAgendaTitleTranslationFields)
    if (language === "fr") {
      const canonicalFr = String(tache?.titre || tache?.title || "").trim();
      if (canonicalFr) return canonicalFr;

      const storedFr = pickNonEmptyTranslation(translations, "fr");
      if (storedFr) return storedFr;
    }

    const frenchFallback = pickNonEmptyTranslation(translations, "fr");
    if (frenchFallback) return frenchFallback;

    return String(
      tache?.originalTitle || tache?.titre || tache?.title || ""
    ).trim();
  }

  function getDescriptionTranslationsObject(entity) {
    const raw = entity?.descriptionTranslations;
    if (!raw) return {};
    if (raw instanceof Map) {
      return Object.fromEntries(raw);
    }
    if (typeof raw === "object") {
      return { ...raw };
    }
    return {};
  }

  function getDisplayDescription(sousTache, requestedLanguage) {
    const language = normalizeAppLanguage(requestedLanguage) || "fr";
    const translations = getDescriptionTranslationsObject(sousTache);

    const localized = pickNonEmptyTranslation(translations, language);
    if (localized) return localized;

    if (language === "fr") {
      const canonicalFr = String(sousTache?.description || "").trim();
      if (canonicalFr) return canonicalFr;

      const storedFr = pickNonEmptyTranslation(translations, "fr");
      if (storedFr) return storedFr;
    }

    const frenchFallback = pickNonEmptyTranslation(translations, "fr");
    if (frenchFallback) return frenchFallback;

    return String(
      sousTache?.originalDescription || sousTache?.description || ""
    ).trim();
  }

  function withDisplayText(note, requestedLanguage) {
    if (!note) return note;

    const plainNote =
      note && typeof note.toObject === "function"
        ? note.toObject({ virtuals: true })
        : { ...note };

    plainNote.translations = getTranslationsObject(plainNote);
    plainNote.displayText = getDisplayText(plainNote, requestedLanguage);
    return plainNote;
  }

  function withDisplayTitle(tache, requestedLanguage) {
    if (!tache) return tache;

    const plainTache =
      tache && typeof tache.toObject === "function"
        ? tache.toObject({ virtuals: true })
        : { ...tache };

    plainTache.titleTranslations = getTitleTranslationsObject(plainTache);
    plainTache.displayTitle = getDisplayTitle(plainTache, requestedLanguage);
    return plainTache;
  }

  function getNotificationTitleTranslations(notification) {
    if (!notification?.titleTranslations) return {};
    if (notification.titleTranslations instanceof Map) {
      return Object.fromEntries(notification.titleTranslations);
    }
    return notification.titleTranslations;
  }

  function getNotificationBodyTranslations(notification) {
    if (!notification?.bodyTranslations) return {};
    if (notification.bodyTranslations instanceof Map) {
      return Object.fromEntries(notification.bodyTranslations);
    }
    return notification.bodyTranslations;
  }

  function getDisplayNotificationTitle(notification, requestedLanguage) {
    const language = normalizeAppLanguage(requestedLanguage) || "fr";
    const translations = getNotificationTitleTranslations(notification);

    return (
      translations[language] ||
      notification?.displayTitle ||
      notification?.title ||
      notification?.originalTitle ||
      ""
    );
  }

  function getDisplayNotificationBody(notification, requestedLanguage) {
    const language = normalizeAppLanguage(requestedLanguage) || "fr";
    const translations = getNotificationBodyTranslations(notification);

    return (
      translations[language] ||
      notification?.displayBody ||
      notification?.body ||
      notification?.originalBody ||
      ""
    );
  }

  function withDisplayNotification(notification, requestedLanguage) {
    if (!notification) return notification;

    const plainNotification =
      notification && typeof notification.toObject === "function"
        ? notification.toObject({ virtuals: true })
        : { ...notification };

    plainNotification.titleTranslations =
      getNotificationTitleTranslations(plainNotification);
    plainNotification.bodyTranslations =
      getNotificationBodyTranslations(plainNotification);
    plainNotification.displayTitle = getDisplayNotificationTitle(
      plainNotification,
      requestedLanguage
    );
    plainNotification.displayBody = getDisplayNotificationBody(
      plainNotification,
      requestedLanguage
    );

    return plainNotification;
  }

  function withDisplayDescription(entity, requestedLanguage) {
    if (!entity) return entity;

    const plainEntity =
      entity && typeof entity.toObject === "function"
        ? entity.toObject({ virtuals: true })
        : { ...entity };

    plainEntity.descriptionTranslations = getTranslationsObject({
      translations: plainEntity.descriptionTranslations,
    });
    plainEntity.displayDescription = getDisplayDescription(
      plainEntity,
      requestedLanguage
    );
    return plainEntity;
  }

  function withDisplayTache(tache, requestedLanguage) {
    if (!tache) return tache;
    return withDisplayDescription(
      withDisplayTitle(tache, requestedLanguage),
      requestedLanguage
    );
  }

  async function getRequestedLanguage(req) {
    const userId = req.decoded?.id;
    if (userId && ObjectId.isValid(userId)) {
      try {
        const User = require("../models/users.model").UserModel;
        const user = await User.findById(userId).select("preferredLanguage");
        const preferredLanguage = normalizeAppLanguage(user?.preferredLanguage);
        if (preferredLanguage) return preferredLanguage;
      } catch (error) {
        console.error(
          "Erreur récupération langue utilisateur:",
          error.message
        );
      }
    }

    const queryLanguage = req.query?.lang;
    const headerLanguage =
      req.headers?.["x-user-language"] || req.headers?.["accept-language"];

    if (queryLanguage) return normalizeAppLanguage(queryLanguage);
    if (!headerLanguage || typeof headerLanguage !== "string") return "fr";

    return normalizeAppLanguage(headerLanguage.split(",")[0]) || "fr";
  }

  module.exports = {
    buildNoteTranslationFields,
    buildTacheTitleTranslationFields,
    buildAgendaTitleTranslationFields,
    buildSousTacheDescriptionTranslationFields,
    buildTacheDescriptionTranslationFields,
    toTitleSource,
    getRequestedLanguage,
    withDisplayText,
    withDisplayTitle,
    withDisplayTache,
    withDisplayDescription,
    getDisplayText,
    getTitleTranslationsObject,
    getDisplayTitle,
    getDisplayDescription,
    withDisplayNotification,
    getDisplayNotificationTitle,
    getDisplayNotificationBody,
    translateText,
    translateTexts,
    normalizeAppLanguage,
  };
})();
