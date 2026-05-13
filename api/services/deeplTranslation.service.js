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
  };

  const DEFAULT_NOTE_LANGUAGES = ["fr", "en", "tr", "pl"];

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

  async function translateText(text, targetLanguage, sourceLanguage) {
    const authKey = getAuthKey();
    const target = getDeepLTargetLanguage(targetLanguage);

    if (!authKey || !target) {
      return {
        text,
        detectedSourceLanguage: normalizeAppLanguage(sourceLanguage),
        skipped: true,
      };
    }

    const payload = {
      text: [text],
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

    const translation = response.data?.translations?.[0] || {};

    return {
      text: translation.text || text,
      detectedSourceLanguage: normalizeDeepLLanguage(
        translation.detected_source_language
      ),
      billedCharacters: translation.billed_characters,
      modelTypeUsed: translation.model_type_used,
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

  function getDisplayTitle(tache, requestedLanguage) {
    const language = normalizeAppLanguage(requestedLanguage) || "fr";
    const translations = getTranslationsObject({
      translations: tache?.titleTranslations,
    });

    return (
      translations[language] ||
      tache?.displayTitle ||
      tache?.title ||
      tache?.titre ||
      tache?.originalTitle ||
      ""
    );
  }

  function getDisplayDescription(sousTache, requestedLanguage) {
    const language = normalizeAppLanguage(requestedLanguage) || "fr";
    const translations = getTranslationsObject({
      translations: sousTache?.descriptionTranslations,
    });

    return (
      translations[language] ||
      sousTache?.displayDescription ||
      sousTache?.description ||
      sousTache?.originalDescription ||
      ""
    );
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

    plainTache.titleTranslations = getTranslationsObject({
      translations: plainTache.titleTranslations,
    });
    plainTache.displayTitle = getDisplayTitle(plainTache, requestedLanguage);
    return plainTache;
  }

  function withDisplayDescription(sousTache, requestedLanguage) {
    if (!sousTache) return sousTache;

    const plainSousTache =
      sousTache && typeof sousTache.toObject === "function"
        ? sousTache.toObject({ virtuals: true })
        : { ...sousTache };

    plainSousTache.descriptionTranslations = getTranslationsObject({
      translations: plainSousTache.descriptionTranslations,
    });
    plainSousTache.displayDescription = getDisplayDescription(
      plainSousTache,
      requestedLanguage
    );
    return plainSousTache;
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
    getRequestedLanguage,
    withDisplayText,
    withDisplayTitle,
    withDisplayDescription,
    getDisplayText,
    getDisplayTitle,
    getDisplayDescription,
    normalizeAppLanguage,
  };
})();
