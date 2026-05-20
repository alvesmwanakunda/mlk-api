(function () {
  "use strict";

  const translationService = require("../services/deeplTranslation.service");

  const RESET_MAIL_KEYS = [
    "subject",
    "headerNotice",
    "frenchVersionLabel",
    "greeting",
    "receivedRequest",
    "resetInstruction",
    "ignoreMessage",
    "signature",
  ];

  const RESET_MAIL_I18N = {
    fr: {
      subject: "Réinitialisation de mot de passe MLKA",
      headerNotice: null,
      frenchVersionLabel: null,
      greeting: "Bonjour{{name}},",
      receivedRequest:
        "Nous avons bien reçu une demande de récupération de votre mot de passe MLKA.",
      resetInstruction:
        "Pour définir un nouveau mot de passe, veuillez cliquer sur le lien suivant :",
      ignoreMessage:
        "Si vous n'êtes pas à l'origine de cette demande de récupération de votre mot de passe, veuillez ignorer ce message.",
      signature: "L'équipe MLKA",
    },
    en: {
      subject: "MLKA password reset",
      headerNotice:
        "Below is the English version of this message. The French version follows underneath.",
      frenchVersionLabel: "French version",
      greeting: "Hello{{name}},",
      receivedRequest:
        "We have received a request to reset your MLKA password.",
      resetInstruction:
        "To set a new password, please click the following link:",
      ignoreMessage:
        "If you did not request a password reset, please ignore this message.",
      signature: "The MLKA team",
    },
    tr: {
      subject: "MLKA şifre sıfırlama",
      headerNotice:
        "Aşağıda mesajın Türkçe sürümü yer almaktadır. Fransızca sürüm hemen altındadır.",
      frenchVersionLabel: "Fransızca sürüm",
      greeting: "Merhaba{{name}},",
      receivedRequest:
        "MLKA şifrenizi sıfırlama talebinizi aldık.",
      resetInstruction:
        "Yeni bir şifre belirlemek için lütfen aşağıdaki bağlantıya tıklayın:",
      ignoreMessage:
        "Bu şifre sıfırlama talebini siz yapmadıysanız, lütfen bu mesajı dikkate almayın.",
      signature: "MLKA ekibi",
    },
    pl: {
      subject: "Reset hasła MLKA",
      headerNotice:
        "Poniżej znajduje się wersja wiadomości w języku polskim. Wersja francuska znajduje się pod spodem.",
      frenchVersionLabel: "Wersja francuska",
      greeting: "Witaj{{name}},",
      receivedRequest:
        "Otrzymaliśmy prośbę o zresetowanie hasła do MLKA.",
      resetInstruction:
        "Aby ustawić nowe hasło, kliknij poniższy link:",
      ignoreMessage:
        "Jeśli to nie Ty złożyłeś(-aś) prośbę o reset hasła, zignoruj tę wiadomość.",
      signature: "Zespół MLKA",
    },
    wo: {
      subject: "Soppi mot de passe MLKA",
      headerNotice:
        "Ci suuf la nekk bataaxal bi ci wolof. Version française bi nekk ci suuf.",
      frenchVersionLabel: "Version française",
      greeting: "Nanga def{{name}},",
      receivedRequest:
        "Njooñu nañu laaj ngir soppi sa mot de passe MLKA.",
      resetInstruction:
        "Ngir defar ab mot de passe bu bees, bësal ci lien bi ci suuf :",
      ignoreMessage:
        "Su fekkee laaj bii jëkkul ci yaw, bàyyil bataaxal bi.",
      signature: "Ékip MLKA",
    },
  };

  const MAIL_HEADER_FR =
    "Ci-dessous, la version dans votre langue, puis la version française.";

  const RESET_MAIL_HEADER_FR = MAIL_HEADER_FR;

  const CONGE_VALIDATION_MAIL_KEYS = [
    "subject",
    "headerNotice",
    "frenchVersionLabel",
    "greeting",
    "thanks",
    "closing",
    "approvedMessage",
    "refusedMessageBeforeMotif",
  ];

  const CONGE_VALIDATION_MAIL_I18N = {
    fr: {
      subject: "Demande de congé",
      headerNotice: null,
      frenchVersionLabel: null,
      greeting: "Cher(e){{name}},",
      approvedMessage:
        "Votre demande de congé est validée. Veuillez vous connecter sur la plateforme pour plus de détails.",
      refusedMessageBeforeMotif:
        "Votre demande de congé est refusée pour motif :",
      thanks: "Merci.",
      closing: "Cordialement.",
    },
    en: {
      subject: "Leave request",
      headerNotice:
        "Below is the English version of this message. The French version follows underneath.",
      frenchVersionLabel: "French version",
      greeting: "Dear{{name}},",
      approvedMessage:
        "Your leave request has been approved. Please log in to the platform for more details.",
      refusedMessageBeforeMotif:
        "Your leave request has been refused for the following reason:",
      thanks: "Thank you.",
      closing: "Kind regards,",
    },
    tr: {
      subject: "İzin talebi",
      headerNotice:
        "Aşağıda mesajın Türkçe sürümü yer almaktadır. Fransızca sürüm hemen altındadır.",
      frenchVersionLabel: "Fransızca sürüm",
      greeting: "Sayın{{name}},",
      approvedMessage:
        "İzin talebiniz onaylandı. Daha fazla bilgi için lütfen platforma giriş yapın.",
      refusedMessageBeforeMotif: "İzin talebiniz şu gerekçeyle reddedildi:",
      thanks: "Teşekkürler.",
      closing: "Saygılarımızla,",
    },
    pl: {
      subject: "Wniosek urlopowy",
      headerNotice:
        "Poniżej znajduje się wersja wiadomości w języku polskim. Wersja francuska znajduje się pod spodem.",
      frenchVersionLabel: "Wersja francuska",
      greeting: "Szanowny(-a){{name}},",
      approvedMessage:
        "Twój wniosek urlopowy został zaakceptowany. Zaloguj się na platformę, aby uzyskać więcej informacji.",
      refusedMessageBeforeMotif: "Twój wniosek urlopowy został odrzucony z powodu:",
      thanks: "Dziękujemy.",
      closing: "Z poważaniem,",
    },
    wo: {
      subject: "Laaj bu congé",
      headerNotice:
        "Ci suuf la nekk bataaxal bi ci wolof. Version française bi nekk ci suuf.",
      frenchVersionLabel: "Version française",
      greeting: "Jërëjëf{{name}},",
      approvedMessage:
        "Laaj bu congé bi ñu ko jàppale. Duggal ci plateforme bi ngir xam li ci des.",
      refusedMessageBeforeMotif: "Laaj bu congé bi ñu ko bañ ngir lii:",
      thanks: "Jërëjëf.",
      closing: "Ba beneen yoon,",
    },
  };

  const AUTH_CODE_MAIL_KEYS = [
    "subject",
    "headerNotice",
    "frenchVersionLabel",
    "greeting",
    "codeIntro",
    "validityBeforeDuration",
    "validityDuration",
    "ignoreMessage",
    "farewell",
    "signature",
  ];

  const AUTH_CODE_MAIL_I18N = {
    fr: {
      subject: "Votre code d'authentification MLKA APP",
      headerNotice: null,
      frenchVersionLabel: null,
      greeting: "Bonjour{{name}},",
      codeIntro: "Voici votre code d'authentification :",
      validityBeforeDuration:
        "Ce code est personnel et valable pendant",
      validityDuration: "10 minutes",
      ignoreMessage:
        "Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet e-mail.",
      farewell: "À très bientôt !",
      signature: "L'équipe MLKA GROUPE",
    },
    en: {
      subject: "Your MLKA APP authentication code",
      headerNotice:
        "Below is the English version of this message. The French version follows underneath.",
      frenchVersionLabel: "French version",
      greeting: "Hello{{name}},",
      codeIntro: "Here is your authentication code:",
      validityBeforeDuration: "This code is personal and valid for",
      validityDuration: "10 minutes",
      ignoreMessage:
        "If you did not initiate this request, you can ignore this email.",
      farewell: "See you soon!",
      signature: "The MLKA GROUPE team",
    },
    tr: {
      subject: "MLKA APP kimlik doğrulama kodunuz",
      headerNotice:
        "Aşağıda mesajın Türkçe sürümü yer almaktadır. Fransızca sürüm hemen altındadır.",
      frenchVersionLabel: "Fransızca sürüm",
      greeting: "Merhaba{{name}},",
      codeIntro: "Kimlik doğrulama kodunuz:",
      validityBeforeDuration: "Bu kod kişiseldir ve geçerlilik süresi",
      validityDuration: "10 dakika",
      ignoreMessage:
        "Bu talebi siz başlatmadıysanız, bu e-postayı dikkate almayın.",
      farewell: "Görüşmek üzere!",
      signature: "MLKA GROUPE ekibi",
    },
    pl: {
      subject: "Twój kod uwierzytelniający MLKA APP",
      headerNotice:
        "Poniżej znajduje się wersja wiadomości w języku polskim. Wersja francuska znajduje się pod spodem.",
      frenchVersionLabel: "Wersja francuska",
      greeting: "Witaj{{name}},",
      codeIntro: "Oto Twój kod uwierzytelniający:",
      validityBeforeDuration: "Ten kod jest osobisty i ważny przez",
      validityDuration: "10 minut",
      ignoreMessage:
        "Jeśli to nie Ty zainicjowałeś(-aś) tę prośbę, zignoruj tę wiadomość.",
      farewell: "Do zobaczenia wkrótce!",
      signature: "Zespół MLKA GROUPE",
    },
    wo: {
      subject: "Sa code d'authentification MLKA APP",
      headerNotice:
        "Ci suuf la nekk bataaxal bi ci wolof. Version française bi nekk ci suuf.",
      frenchVersionLabel: "Version française",
      greeting: "Nanga def{{name}},",
      codeIntro: "Li nga war a jëfandikoo mooy code bi :",
      validityBeforeDuration: "Code bii mooy sa boroom te dafa am solo ci",
      validityDuration: "10 simili",
      ignoreMessage:
        "Bu laaj bii jëkkul ci yaw, mën nga bàyyil bataaxal bi.",
      farewell: "Ba beneen yoon !",
      signature: "Ékip MLKA GROUPE",
    },
  };

  function formatGreeting(template, fullName) {
    const name = fullName ? " " + fullName : "";
    return String(template || "").replace("{{name}}", name);
  }

  function hasCompleteResetMailStrings(language) {
    const strings = RESET_MAIL_I18N[language];
    if (!strings || language === "fr") return false;

    return RESET_MAIL_KEYS.every((key) => {
      if (key === "headerNotice" || key === "frenchVersionLabel") {
        return typeof strings[key] === "string" && strings[key].length > 0;
      }
      return typeof strings[key] === "string";
    });
  }

  function getResetMailStrings(language, fullName) {
    const strings = RESET_MAIL_I18N[language];
    if (!strings) return null;

    return {
      subject: strings.subject,
      headerNotice: strings.headerNotice,
      headerFrenchLine: RESET_MAIL_HEADER_FR,
      frenchVersionLabel: strings.frenchVersionLabel,
      greeting: formatGreeting(strings.greeting, fullName),
      receivedRequest: strings.receivedRequest,
      resetInstruction: strings.resetInstruction,
      ignoreMessage: strings.ignoreMessage,
      signature: strings.signature,
    };
  }

  function getFrenchResetMailStrings(fullName) {
    return getResetMailStrings("fr", fullName);
  }

  const RESET_MAIL_DEEPL_SOURCE = {
    headerNotice:
      "Ci-dessous, le message dans votre langue. La version française suit.",
    frenchVersionLabel: "Version française",
  };

  function getResetMailSourceSegments(fullName) {
    const french = getFrenchResetMailStrings(fullName);
    return [
      french.subject,
      RESET_MAIL_DEEPL_SOURCE.headerNotice,
      RESET_MAIL_DEEPL_SOURCE.frenchVersionLabel,
      french.greeting,
      french.receivedRequest,
      french.resetInstruction,
      french.ignoreMessage,
      french.signature,
    ];
  }

  function userCongeDisplayName(user) {
    return [user?.nom, user?.prenom].filter(Boolean).join(" ").trim();
  }

  function hasCompleteCongeValidationMailStrings(language) {
    const strings = CONGE_VALIDATION_MAIL_I18N[language];
    if (!strings || language === "fr") return false;

    return CONGE_VALIDATION_MAIL_KEYS.every((key) => {
      if (key === "headerNotice" || key === "frenchVersionLabel") {
        return typeof strings[key] === "string" && strings[key].length > 0;
      }
      return typeof strings[key] === "string";
    });
  }

  function getCongeValidationMailStrings(language, user, variant) {
    const strings = CONGE_VALIDATION_MAIL_I18N[language];
    if (!strings) return null;

    const displayName = userCongeDisplayName(user);
    const isRefused = variant === "refused";

    return {
      subject: strings.subject,
      headerNotice: strings.headerNotice,
      headerFrenchLine: MAIL_HEADER_FR,
      frenchVersionLabel: strings.frenchVersionLabel,
      greeting: formatGreeting(strings.greeting, displayName),
      mainMessage: isRefused ? null : strings.approvedMessage,
      refusedMessageBeforeMotif: isRefused
        ? strings.refusedMessageBeforeMotif
        : null,
      thanks: strings.thanks,
      closing: strings.closing,
    };
  }

  function getFrenchCongeValidationMailStrings(user, variant) {
    return getCongeValidationMailStrings("fr", user, variant);
  }

  const CONGE_MAIL_DEEPL_SOURCE = {
    headerNotice:
      "Ci-dessous, le message dans votre langue. La version française suit.",
    frenchVersionLabel: "Version française",
  };

  function getCongeValidationMailSourceSegments(user, variant) {
    const french = getFrenchCongeValidationMailStrings(user, variant);
    const segments = [
      french.subject,
      CONGE_MAIL_DEEPL_SOURCE.headerNotice,
      CONGE_MAIL_DEEPL_SOURCE.frenchVersionLabel,
      french.greeting,
    ];

    if (variant === "refused") {
      segments.push(french.refusedMessageBeforeMotif);
    } else {
      segments.push(french.mainMessage);
    }

    segments.push(french.thanks, french.closing);
    return segments;
  }

  function hasCompleteAuthCodeMailStrings(language) {
    const strings = AUTH_CODE_MAIL_I18N[language];
    if (!strings || language === "fr") return false;

    return AUTH_CODE_MAIL_KEYS.every((key) => {
      if (key === "headerNotice" || key === "frenchVersionLabel") {
        return typeof strings[key] === "string" && strings[key].length > 0;
      }
      return typeof strings[key] === "string";
    });
  }

  function getAuthCodeMailStrings(language, user) {
    const strings = AUTH_CODE_MAIL_I18N[language];
    if (!strings) return null;

    const displayName = userCongeDisplayName(user);

    return {
      subject: strings.subject,
      headerNotice: strings.headerNotice,
      headerFrenchLine: MAIL_HEADER_FR,
      frenchVersionLabel: strings.frenchVersionLabel,
      greeting: formatGreeting(strings.greeting, displayName),
      codeIntro: strings.codeIntro,
      validityBeforeDuration: strings.validityBeforeDuration,
      validityDuration: strings.validityDuration,
      ignoreMessage: strings.ignoreMessage,
      farewell: strings.farewell,
      signature: strings.signature,
    };
  }

  function getFrenchAuthCodeMailStrings(user) {
    return getAuthCodeMailStrings("fr", user);
  }

  const AUTH_CODE_MAIL_DEEPL_SOURCE = {
    headerNotice:
      "Ci-dessous, le message dans votre langue. La version française suit.",
    frenchVersionLabel: "Version française",
  };

  function getAuthCodeMailSourceSegments(user) {
    const french = getFrenchAuthCodeMailStrings(user);
    return [
      french.subject,
      AUTH_CODE_MAIL_DEEPL_SOURCE.headerNotice,
      AUTH_CODE_MAIL_DEEPL_SOURCE.frenchVersionLabel,
      french.greeting,
      french.codeIntro,
      french.validityBeforeDuration,
      french.validityDuration,
      french.ignoreMessage,
      french.farewell,
      french.signature,
    ];
  }

  const PLANNING_MAIL_KEYS = [
    "subject",
    "headerNotice",
    "frenchVersionLabel",
    "greeting",
    "assignmentMessage",
    "durationFullDays",
    "durationHoursMinutes",
    "thanks",
    "closing",
  ];

  const PLANNING_MAIL_I18N = {
    fr: {
      subject: "Planning de travail",
      headerNotice: null,
      frenchVersionLabel: null,
      greeting: "Cher(e){{name}},",
      assignmentMessage:
        "Vous avez été assigné à l'agenda {{title}} pour une durée {{duration}}.",
      durationFullDays: "{{count}} jour(s) complet(s)",
      durationHoursMinutes: "{{hours}}h {{minutes}}min",
      thanks: "Merci.",
      closing: "Cordialement.",
    },
    en: {
      subject: "Work schedule",
      headerNotice:
        "Below is the English version of this message. The French version follows underneath.",
      frenchVersionLabel: "French version",
      greeting: "Dear{{name}},",
      assignmentMessage:
        "You have been assigned to the agenda {{title}} for a duration of {{duration}}.",
      durationFullDays: "{{count}} full day(s)",
      durationHoursMinutes: "{{hours}}h {{minutes}}min",
      thanks: "Thank you.",
      closing: "Kind regards,",
    },
    tr: {
      subject: "İş planlaması",
      headerNotice:
        "Aşağıda mesajın Türkçe sürümü yer almaktadır. Fransızca sürüm hemen altındadır.",
      frenchVersionLabel: "Fransızca sürüm",
      greeting: "Sayın{{name}},",
      assignmentMessage:
        "{{title}} ajandasına {{duration}} süreyle atandınız.",
      durationFullDays: "{{count}} tam gün",
      durationHoursMinutes: "{{hours}} saat {{minutes}} dk",
      thanks: "Teşekkürler.",
      closing: "Saygılarımızla,",
    },
    pl: {
      subject: "Plan pracy",
      headerNotice:
        "Poniżej znajduje się wersja wiadomości w języku polskim. Wersja francuska znajduje się pod spodem.",
      frenchVersionLabel: "Wersja francuska",
      greeting: "Szanowny(-a){{name}},",
      assignmentMessage:
        "Zostałeś(-aś) przypisany(-a) do agendy {{title}} na czas {{duration}}.",
      durationFullDays: "{{count}} pełny(ch) dzień/dni",
      durationHoursMinutes: "{{hours}} godz. {{minutes}} min",
      thanks: "Dziękujemy.",
      closing: "Z poważaniem,",
    },
    wo: {
      subject: "Planification bu liggéey",
      headerNotice:
        "Ci suuf la nekk bataaxal bi ci wolof. Version française bi nekk ci suuf.",
      frenchVersionLabel: "Version française",
      greeting: "Jërëjëf{{name}},",
      assignmentMessage:
        "Ñu la jox agenda {{title}} ci waxtu {{duration}}.",
      durationFullDays: "{{count}} bés bu mat",
      durationHoursMinutes: "{{hours}}h {{minutes}} simili",
      thanks: "Jërëjëf.",
      closing: "Ba beneen yoon,",
    },
  };

  function computePlanningDurationValues(agenda) {
    if (!agenda) {
      return { type: "hours", hours: 0, minutes: 0 };
    }

    if (agenda.isDay) {
      const start = new Date(agenda.start);
      const end = new Date(agenda.end);
      const diffTime = end - start;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      return { type: "days", days: diffDays };
    }

    const dateStart = new Date(agenda.start);
    const dateEnd = new Date(agenda.end);
    const [hStart, mStart] = String(agenda.heure_start || "0:0")
      .split(":")
      .map(Number);
    const [hEnd, mEnd] = String(agenda.heure_end || "0:0")
      .split(":")
      .map(Number);

    dateStart.setHours(hStart, mStart, 0);
    dateEnd.setHours(hEnd, mEnd, 0);

    const diffTime = dateEnd - dateStart;
    const hours = Math.floor(diffTime / (1000 * 60 * 60));
    const minutes = Math.floor((diffTime % (1000 * 60 * 60)) / (1000 * 60));

    return { type: "hours", hours, minutes };
  }

  function formatPlanningDuration(agenda, language) {
    const lang = language || "fr";
    const strings = PLANNING_MAIL_I18N[lang] || PLANNING_MAIL_I18N.fr;
    const values = computePlanningDurationValues(agenda);

    if (values.type === "days") {
      return String(strings.durationFullDays).replace(
        "{{count}}",
        String(values.days)
      );
    }

    return String(strings.durationHoursMinutes)
      .replace("{{hours}}", String(values.hours))
      .replace("{{minutes}}", String(values.minutes));
  }

  function formatPlanningAssignmentMessage(template, title, duration) {
    return String(template || "")
      .replace("{{title}}", title || "")
      .replace("{{duration}}", duration || "");
  }

  function hasCompletePlanningMailStrings(language) {
    const strings = PLANNING_MAIL_I18N[language];
    if (!strings || language === "fr") return false;

    return PLANNING_MAIL_KEYS.every((key) => {
      if (key === "headerNotice" || key === "frenchVersionLabel") {
        return typeof strings[key] === "string" && strings[key].length > 0;
      }
      return typeof strings[key] === "string";
    });
  }

  function getPlanningMailStrings(language, user, agenda) {
    const strings = PLANNING_MAIL_I18N[language];
    if (!strings) return null;

    const displayName = userCongeDisplayName(user);
    const duration = formatPlanningDuration(agenda, language);
    const title = agenda?.title || "";

    return {
      subject: strings.subject,
      headerNotice: strings.headerNotice,
      headerFrenchLine: MAIL_HEADER_FR,
      frenchVersionLabel: strings.frenchVersionLabel,
      greeting: formatGreeting(strings.greeting, displayName),
      assignmentMessage: formatPlanningAssignmentMessage(
        strings.assignmentMessage,
        title,
        duration
      ),
      thanks: strings.thanks,
      closing: strings.closing,
    };
  }

  function getFrenchPlanningMailStrings(user, agenda) {
    return getPlanningMailStrings("fr", user, agenda);
  }

  const PLANNING_MAIL_DEEPL_SOURCE = {
    headerNotice:
      "Ci-dessous, le message dans votre langue. La version française suit.",
    frenchVersionLabel: "Version française",
  };

  function getPlanningMailSourceSegments(user) {
    const strings = PLANNING_MAIL_I18N.fr;
    const displayName = userCongeDisplayName(user);

    return [
      strings.subject,
      PLANNING_MAIL_DEEPL_SOURCE.headerNotice,
      PLANNING_MAIL_DEEPL_SOURCE.frenchVersionLabel,
      formatGreeting(strings.greeting, displayName),
      strings.assignmentMessage,
      strings.thanks,
      strings.closing,
    ];
  }

  const TASK_MAIL_LOGIN_URL = "https://mlka.app/login";

  const TASK_MAIL_DATE_LOCALE = {
    fr: "fr-FR",
    en: "en-GB",
    tr: "tr-TR",
    pl: "pl-PL",
    wo: "fr-FR",
  };

  const TASK_MAIL_KEYS = [
    "subject",
    "headerNotice",
    "frenchVersionLabel",
    "greeting",
    "assignmentMessage",
    "loginInstruction",
    "thanks",
    "closing",
  ];

  const TASK_MAIL_I18N = {
    fr: {
      subject: "Tâche de travail",
      headerNotice: null,
      frenchVersionLabel: null,
      greeting: "Cher(e){{name}},",
      assignmentMessage:
        'Une tâche "{{taskTitle}}" du projet "{{projectName}}" vous est assignée par {{authorName}}, pour une période du {{startDate}} au {{endDate}}.',
      loginInstruction: "Merci de vous connecter sur la plateforme",
      thanks: "Merci.",
      closing: "Cordialement.",
    },
    en: {
      subject: "Work task",
      headerNotice:
        "Below is the English version of this message. The French version follows underneath.",
      frenchVersionLabel: "French version",
      greeting: "Dear{{name}},",
      assignmentMessage:
        'The task "{{taskTitle}}" on project "{{projectName}}" has been assigned to you by {{authorName}}, for the period from {{startDate}} to {{endDate}}.',
      loginInstruction: "Please log in at",
      thanks: "Thank you.",
      closing: "Kind regards,",
    },
    tr: {
      subject: "İş görevi",
      headerNotice:
        "Aşağıda mesajın Türkçe sürümü yer almaktadır. Fransızca sürüm hemen altındadır.",
      frenchVersionLabel: "Fransızca sürüm",
      greeting: "Sayın{{name}},",
      assignmentMessage:
        '"{{projectName}}" projesindeki "{{taskTitle}}" görevi, {{authorName}} tarafından {{startDate}} - {{endDate}} tarihleri arasında size atandı.',
      loginInstruction: "Lütfen platforma giriş yapın:",
      thanks: "Teşekkürler.",
      closing: "Saygılarımızla,",
    },
    pl: {
      subject: "Zadanie robocze",
      headerNotice:
        "Poniżej znajduje się wersja wiadomości w języku polskim. Wersja francuska znajduje się pod spodem.",
      frenchVersionLabel: "Wersja francuska",
      greeting: "Szanowny(-a){{name}},",
      assignmentMessage:
        'Zadanie "{{taskTitle}}" w projekcie "{{projectName}}" zostało Ci przypisane przez {{authorName}} na okres od {{startDate}} do {{endDate}}.',
      loginInstruction: "Zaloguj się na platformie",
      thanks: "Dziękujemy.",
      closing: "Z poważaniem,",
    },
    wo: {
      subject: "Tâche bu liggéey",
      headerNotice:
        "Ci suuf la nekk bataaxal bi ci wolof. Version française bi nekk ci suuf.",
      frenchVersionLabel: "Version française",
      greeting: "Jërëjëf{{name}},",
      assignmentMessage:
        'Tâche "{{taskTitle}}" ci projet "{{projectName}}" la ñu la jox ci {{authorName}}, ci waxtu {{startDate}} ba {{endDate}}.',
      loginInstruction: "Duggal ci plateforme bi fi:",
      thanks: "Jërëjëf.",
      closing: "Ba beneen yoon,",
    },
  };

  function formatTaskDate(date, language) {
    if (!date) return "";
    const locale = TASK_MAIL_DATE_LOCALE[language] || TASK_MAIL_DATE_LOCALE.fr;
    return new Date(date).toLocaleDateString(locale);
  }

  function getTaskAuthorName(tache) {
    return [tache?.user?.nom, tache?.user?.prenom].filter(Boolean).join(" ").trim();
  }

  function getTaskContext(tache, language) {
    return {
      taskTitle: translationService.getDisplayTitle(tache, language),
      projectName: tache?.projet?.projet || "",
      authorName: getTaskAuthorName(tache),
      startDate: formatTaskDate(tache?.date_debut, language),
      endDate: formatTaskDate(tache?.date_fin, language),
      loginUrl: TASK_MAIL_LOGIN_URL,
    };
  }

  function formatTaskAssignmentMessage(template, context) {
    return String(template || "")
      .replace("{{taskTitle}}", context.taskTitle || "")
      .replace("{{projectName}}", context.projectName || "")
      .replace("{{authorName}}", context.authorName || "")
      .replace("{{startDate}}", context.startDate || "")
      .replace("{{endDate}}", context.endDate || "")
      .replace("{{loginUrl}}", context.loginUrl || "");
  }

  function hasCompleteTaskMailStrings(language) {
    const strings = TASK_MAIL_I18N[language];
    if (!strings || language === "fr") return false;

    return TASK_MAIL_KEYS.every((key) => {
      if (key === "headerNotice" || key === "frenchVersionLabel") {
        return typeof strings[key] === "string" && strings[key].length > 0;
      }
      return typeof strings[key] === "string";
    });
  }

  function getTaskMailStrings(language, assignee, tache) {
    const strings = TASK_MAIL_I18N[language];
    if (!strings) return null;

    const displayName = userCongeDisplayName(assignee);
    const context = getTaskContext(tache, language);

    return {
      subject: strings.subject,
      headerNotice: strings.headerNotice,
      headerFrenchLine: MAIL_HEADER_FR,
      frenchVersionLabel: strings.frenchVersionLabel,
      greeting: formatGreeting(strings.greeting, displayName),
      assignmentMessage: formatTaskAssignmentMessage(
        strings.assignmentMessage,
        context
      ),
      loginInstruction: strings.loginInstruction,
      loginUrl: context.loginUrl,
      thanks: strings.thanks,
      closing: strings.closing,
    };
  }

  function getFrenchTaskMailStrings(assignee, tache) {
    return getTaskMailStrings("fr", assignee, tache);
  }

  const TASK_MAIL_DEEPL_SOURCE = {
    headerNotice:
      "Ci-dessous, le message dans votre langue. La version française suit.",
    frenchVersionLabel: "Version française",
  };

  function getTaskMailSourceSegments(assignee) {
    const strings = TASK_MAIL_I18N.fr;
    const displayName = userCongeDisplayName(assignee);

    return [
      strings.subject,
      TASK_MAIL_DEEPL_SOURCE.headerNotice,
      TASK_MAIL_DEEPL_SOURCE.frenchVersionLabel,
      formatGreeting(strings.greeting, displayName),
      strings.assignmentMessage,
      strings.loginInstruction,
      strings.thanks,
      strings.closing,
    ];
  }

  const SUB_TASK_MAIL_KEYS = [
    "subject",
    "headerNotice",
    "frenchVersionLabel",
    "greeting",
    "assignmentMessage",
    "loginInstruction",
    "thanks",
    "closing",
  ];

  const SUB_TASK_MAIL_I18N = {
    fr: {
      subject: "Sous-Tâche de travail",
      headerNotice: null,
      frenchVersionLabel: null,
      greeting: "Cher(e){{name}},",
      assignmentMessage:
        'Une sous-tâche "{{subTaskDescription}}" de la tâche "{{taskTitle}}" du projet "{{projectName}}" vous est assignée par {{authorName}}, pour une période du {{taskDate}}.',
      loginInstruction: "Merci de vous connecter sur la plateforme",
      thanks: "Merci.",
      closing: "Cordialement.",
    },
    en: {
      subject: "Work sub-task",
      headerNotice:
        "Below is the English version of this message. The French version follows underneath.",
      frenchVersionLabel: "French version",
      greeting: "Dear{{name}},",
      assignmentMessage:
        'The sub-task "{{subTaskDescription}}" of task "{{taskTitle}}" on project "{{projectName}}" has been assigned to you by {{authorName}}, for the date {{taskDate}}.',
      loginInstruction: "Please log in at",
      thanks: "Thank you.",
      closing: "Kind regards,",
    },
    tr: {
      subject: "İş alt görevi",
      headerNotice:
        "Aşağıda mesajın Türkçe sürümü yer almaktadır. Fransızca sürüm hemen altındadır.",
      frenchVersionLabel: "Fransızca sürüm",
      greeting: "Sayın{{name}},",
      assignmentMessage:
        '"{{projectName}}" projesindeki "{{taskTitle}}" görevinin "{{subTaskDescription}}" alt görevi, {{authorName}} tarafından {{taskDate}} tarihi için size atandı.',
      loginInstruction: "Lütfen platforma giriş yapın:",
      thanks: "Teşekkürler.",
      closing: "Saygılarımızla,",
    },
    pl: {
      subject: "Podzadanie robocze",
      headerNotice:
        "Poniżej znajduje się wersja wiadomości w języku polskim. Wersja francuska znajduje się pod spodem.",
      frenchVersionLabel: "Wersja francuska",
      greeting: "Szanowny(-a){{name}},",
      assignmentMessage:
        'Podzadanie "{{subTaskDescription}}" zadania "{{taskTitle}}" w projekcie "{{projectName}}" zostało Ci przypisane przez {{authorName}} na dzień {{taskDate}}.',
      loginInstruction: "Zaloguj się na platformie",
      thanks: "Dziękujemy.",
      closing: "Z poważaniem,",
    },
    wo: {
      subject: "Sous-tâche bu liggéey",
      headerNotice:
        "Ci suuf la nekk bataaxal bi ci wolof. Version française bi nekk ci suuf.",
      frenchVersionLabel: "Version française",
      greeting: "Jërëjëf{{name}},",
      assignmentMessage:
        'Sous-tâche "{{subTaskDescription}}" ci tâche "{{taskTitle}}" ak projet "{{projectName}}" la ñu la jox ci {{authorName}}, ci bis {{taskDate}}.',
      loginInstruction: "Duggal ci plateforme bi fi:",
      thanks: "Jërëjëf.",
      closing: "Ba beneen yoon,",
    },
  };

  function getSubTaskAuthorName(timeTask) {
    return [timeTask?.user?.nom, timeTask?.user?.prenom]
      .filter(Boolean)
      .join(" ")
      .trim();
  }

  function getSubTaskContext(timeTask, language) {
    const lang = language || "fr";
    return {
      subTaskDescription: translationService.getDisplayDescription(
        timeTask,
        lang
      ),
      taskTitle: translationService.getDisplayTitle(timeTask?.tache, lang),
      projectName: timeTask?.tache?.projet?.projet || "",
      authorName: getSubTaskAuthorName(timeTask),
      taskDate: formatTaskDate(timeTask?.date, language),
      loginUrl: TASK_MAIL_LOGIN_URL,
    };
  }

  function formatSubTaskAssignmentMessage(template, context) {
    return String(template || "")
      .replace("{{subTaskDescription}}", context.subTaskDescription || "")
      .replace("{{taskTitle}}", context.taskTitle || "")
      .replace("{{projectName}}", context.projectName || "")
      .replace("{{authorName}}", context.authorName || "")
      .replace("{{taskDate}}", context.taskDate || "")
      .replace("{{loginUrl}}", context.loginUrl || "");
  }

  function hasCompleteSubTaskMailStrings(language) {
    const strings = SUB_TASK_MAIL_I18N[language];
    if (!strings || language === "fr") return false;

    return SUB_TASK_MAIL_KEYS.every((key) => {
      if (key === "headerNotice" || key === "frenchVersionLabel") {
        return typeof strings[key] === "string" && strings[key].length > 0;
      }
      return typeof strings[key] === "string";
    });
  }

  function getSubTaskMailStrings(language, assignee, timeTask) {
    const strings = SUB_TASK_MAIL_I18N[language];
    if (!strings) return null;

    const displayName = userCongeDisplayName(assignee);
    const context = getSubTaskContext(timeTask, language);

    return {
      subject: strings.subject,
      headerNotice: strings.headerNotice,
      headerFrenchLine: MAIL_HEADER_FR,
      frenchVersionLabel: strings.frenchVersionLabel,
      greeting: formatGreeting(strings.greeting, displayName),
      assignmentMessage: formatSubTaskAssignmentMessage(
        strings.assignmentMessage,
        context
      ),
      loginInstruction: strings.loginInstruction,
      loginUrl: context.loginUrl,
      thanks: strings.thanks,
      closing: strings.closing,
    };
  }

  function getFrenchSubTaskMailStrings(assignee, timeTask) {
    return getSubTaskMailStrings("fr", assignee, timeTask);
  }

  const SUB_TASK_MAIL_DEEPL_SOURCE = {
    headerNotice:
      "Ci-dessous, le message dans votre langue. La version française suit.",
    frenchVersionLabel: "Version française",
  };

  function getSubTaskMailSourceSegments(assignee) {
    const strings = SUB_TASK_MAIL_I18N.fr;
    const displayName = userCongeDisplayName(assignee);

    return [
      strings.subject,
      SUB_TASK_MAIL_DEEPL_SOURCE.headerNotice,
      SUB_TASK_MAIL_DEEPL_SOURCE.frenchVersionLabel,
      formatGreeting(strings.greeting, displayName),
      strings.assignmentMessage,
      strings.loginInstruction,
      strings.thanks,
      strings.closing,
    ];
  }

  const UPDATE_TASK_MAIL_KEYS = [
    "subject",
    "headerNotice",
    "frenchVersionLabel",
    "greeting",
    "statusUpdateMessage",
    "newStatusLabel",
    "detailsInstruction",
    "thanks",
    "closing",
  ];

  const UPDATE_TASK_MAIL_I18N = {
    fr: {
      subject: "Mise à jour de votre tâche",
      headerNotice: null,
      frenchVersionLabel: null,
      greeting: "Cher(e){{name}},",
      statusUpdateMessage:
        "Le statut de votre tâche « {{taskTitle}} » du projet {{projectName}} a été modifié par {{modifierName}}.",
      newStatusLabel: "Nouveau statut :",
      detailsInstruction:
        "Veuillez consulter les détails pour plus d'informations",
      thanks: "Merci.",
      closing: "Cordialement.",
    },
    en: {
      subject: "Your task has been updated",
      headerNotice:
        "Below is the English version of this message. The French version follows underneath.",
      frenchVersionLabel: "French version",
      greeting: "Dear{{name}},",
      statusUpdateMessage:
        'The status of your task "{{taskTitle}}" on project {{projectName}} was updated by {{modifierName}}.',
      newStatusLabel: "New status:",
      detailsInstruction: "Please check the details for more information at",
      thanks: "Thank you.",
      closing: "Kind regards,",
    },
    tr: {
      subject: "Göreviniz güncellendi",
      headerNotice:
        "Aşağıda mesajın Türkçe sürümü yer almaktadır. Fransızca sürüm hemen altındadır.",
      frenchVersionLabel: "Fransızca sürüm",
      greeting: "Sayın{{name}},",
      statusUpdateMessage:
        '"{{projectName}}" projesindeki "{{taskTitle}}" görevinizin durumu {{modifierName}} tarafından güncellendi.',
      newStatusLabel: "Yeni durum:",
      detailsInstruction: "Daha fazla bilgi için ayrıntılara bakın:",
      thanks: "Teşekkürler.",
      closing: "Saygılarımızla,",
    },
    pl: {
      subject: "Aktualizacja Twojego zadania",
      headerNotice:
        "Poniżej znajduje się wersja wiadomości w języku polskim. Wersja francuska znajduje się pod spodem.",
      frenchVersionLabel: "Wersja francuska",
      greeting: "Szanowny(-a){{name}},",
      statusUpdateMessage:
        'Status Twojego zadania "{{taskTitle}}" w projekcie {{projectName}} został zmieniony przez {{modifierName}}.',
      newStatusLabel: "Nowy status:",
      detailsInstruction: "Aby uzyskać więcej informacji, sprawdź szczegóły na",
      thanks: "Dziękujemy.",
      closing: "Z poważaniem,",
    },
    wo: {
      subject: "Soppi na sa tâche",
      headerNotice:
        "Ci suuf la nekk bataaxal bi ci wolof. Version française bi nekk ci suuf.",
      frenchVersionLabel: "Version française",
      greeting: "Jërëjëf{{name}},",
      statusUpdateMessage:
        'Statut sa tâche « {{taskTitle}} » ci projet {{projectName}} soppi na ko {{modifierName}}.',
      newStatusLabel: "Statut bu bees :",
      detailsInstruction: "Xoolal li ci des ngir am xibaar yi:",
      thanks: "Jërëjëf.",
      closing: "Ba beneen yoon,",
    },
  };

  const TASK_STATUS_LABELS = {
    "A Faire": {
      fr: "A Faire",
      en: "To do",
      tr: "Yapılacak",
      pl: "Do zrobienia",
      wo: "A defar",
    },
    "En Cours": {
      fr: "En Cours",
      en: "In progress",
      tr: "Devam ediyor",
      pl: "W toku",
      wo: "Mi ngi ci liggéey",
    },
    Terminer: {
      fr: "Terminer",
      en: "Completed",
      tr: "Tamamlandı",
      pl: "Zakończone",
      wo: "Jeex na",
    },
    "Clôturer": {
      fr: "Clôturer",
      en: "Closed",
      tr: "Kapatıldı",
      pl: "Zamknięte",
      wo: "Tëj na",
    },
    Terminé: {
      fr: "Terminé",
      en: "Completed",
      tr: "Tamamlandı",
      pl: "Zakończone",
      wo: "Jeex na",
    },
  };

  function getTaskStatusLabel(status, language) {
    const lang = language || "fr";
    const labels = TASK_STATUS_LABELS[status];
    if (!labels) return status || "";
    return labels[lang] || labels.fr || status || "";
  }

  function getModifierName(modifierUser) {
    return [modifierUser?.nom, modifierUser?.prenom].filter(Boolean).join(" ").trim();
  }

  function getUpdateTaskContext(tache, modifierUser, language) {
    const lang = language || "fr";
    return {
      taskTitle: translationService.getDisplayTitle(tache, lang),
      projectName: tache?.projet?.projet || "",
      modifierName: getModifierName(modifierUser),
      newStatus: getTaskStatusLabel(tache?.statut, lang),
      loginUrl: TASK_MAIL_LOGIN_URL,
    };
  }

  function formatUpdateTaskMessage(template, context) {
    return String(template || "")
      .replace("{{taskTitle}}", context.taskTitle || "")
      .replace("{{projectName}}", context.projectName || "")
      .replace("{{modifierName}}", context.modifierName || "")
      .replace("{{newStatus}}", context.newStatus || "")
      .replace("{{loginUrl}}", context.loginUrl || "");
  }

  function hasCompleteUpdateTaskMailStrings(language) {
    const strings = UPDATE_TASK_MAIL_I18N[language];
    if (!strings || language === "fr") return false;

    return UPDATE_TASK_MAIL_KEYS.every((key) => {
      if (key === "headerNotice" || key === "frenchVersionLabel") {
        return typeof strings[key] === "string" && strings[key].length > 0;
      }
      return typeof strings[key] === "string";
    });
  }

  function getUpdateTaskMailStrings(language, recipient, tache, modifierUser) {
    const strings = UPDATE_TASK_MAIL_I18N[language];
    if (!strings) return null;

    const displayName = userCongeDisplayName(recipient);
    const context = getUpdateTaskContext(tache, modifierUser, language);

    return {
      subject: strings.subject,
      headerNotice: strings.headerNotice,
      headerFrenchLine: MAIL_HEADER_FR,
      frenchVersionLabel: strings.frenchVersionLabel,
      greeting: formatGreeting(strings.greeting, displayName),
      statusUpdateMessage: formatUpdateTaskMessage(
        strings.statusUpdateMessage,
        context
      ),
      newStatusLabel: strings.newStatusLabel,
      newStatus: context.newStatus,
      detailsInstruction: strings.detailsInstruction,
      loginUrl: context.loginUrl,
      thanks: strings.thanks,
      closing: strings.closing,
    };
  }

  function getFrenchUpdateTaskMailStrings(recipient, tache, modifierUser) {
    return getUpdateTaskMailStrings("fr", recipient, tache, modifierUser);
  }

  const UPDATE_TASK_MAIL_DEEPL_SOURCE = {
    headerNotice:
      "Ci-dessous, le message dans votre langue. La version française suit.",
    frenchVersionLabel: "Version française",
  };

  function getUpdateTaskMailSourceSegments(recipient) {
    const strings = UPDATE_TASK_MAIL_I18N.fr;
    const displayName = userCongeDisplayName(recipient);

    return [
      strings.subject,
      UPDATE_TASK_MAIL_DEEPL_SOURCE.headerNotice,
      UPDATE_TASK_MAIL_DEEPL_SOURCE.frenchVersionLabel,
      formatGreeting(strings.greeting, displayName),
      strings.statusUpdateMessage,
      strings.newStatusLabel,
      strings.detailsInstruction,
      strings.thanks,
      strings.closing,
    ];
  }

  module.exports = {
    RESET_MAIL_I18N,
    CONGE_VALIDATION_MAIL_I18N,
    MAIL_HEADER_FR,
    RESET_MAIL_HEADER_FR,
    hasCompleteResetMailStrings,
    getResetMailStrings,
    getFrenchResetMailStrings,
    getResetMailSourceSegments,
    hasCompleteCongeValidationMailStrings,
    getCongeValidationMailStrings,
    getFrenchCongeValidationMailStrings,
    getCongeValidationMailSourceSegments,
    AUTH_CODE_MAIL_I18N,
    hasCompleteAuthCodeMailStrings,
    getAuthCodeMailStrings,
    getFrenchAuthCodeMailStrings,
    getAuthCodeMailSourceSegments,
    PLANNING_MAIL_I18N,
    computePlanningDurationValues,
    formatPlanningDuration,
    formatPlanningAssignmentMessage,
    hasCompletePlanningMailStrings,
    getPlanningMailStrings,
    getFrenchPlanningMailStrings,
    getPlanningMailSourceSegments,
    TASK_MAIL_I18N,
    TASK_MAIL_LOGIN_URL,
    formatTaskDate,
    formatTaskAssignmentMessage,
    getTaskContext,
    hasCompleteTaskMailStrings,
    getTaskMailStrings,
    getFrenchTaskMailStrings,
    getTaskMailSourceSegments,
    SUB_TASK_MAIL_I18N,
    formatSubTaskAssignmentMessage,
    getSubTaskContext,
    hasCompleteSubTaskMailStrings,
    getSubTaskMailStrings,
    getFrenchSubTaskMailStrings,
    getSubTaskMailSourceSegments,
    UPDATE_TASK_MAIL_I18N,
    formatUpdateTaskMessage,
    getUpdateTaskContext,
    hasCompleteUpdateTaskMailStrings,
    getUpdateTaskMailStrings,
    getFrenchUpdateTaskMailStrings,
    getUpdateTaskMailSourceSegments,
    TASK_STATUS_LABELS,
    getTaskStatusLabel,
    formatGreeting,
    userCongeDisplayName,
  };
})();
