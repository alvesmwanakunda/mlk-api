var nodemailer = require('nodemailer');
var ObjectId = require('mongoose').Types.ObjectId;
var Conge = require('../models/conge.model').CongeModel;
var Agenda = require ('../models/agenda.model').AgendaModel;
var Tache = require('../models/taches.model').TacheModel;
var SubTask = require('../models/sousTache.model').SousTacheModel;
var TimeTask = require('../models/timesheetTask.model').TimesheetTaskModel;
var User = require('../models/users.model').UserModel;
var translationService = require('./deeplTranslation.service');
var mailI18n = require('../i18n/mail.i18n');

function escapeHtml(value) {
    return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function userFullName(user) {
    return [user?.prenom, user?.nom].filter(Boolean).join(' ').trim();
}

function renderResetMailBody(parts) {
    return `
        <p>${escapeHtml(parts.greeting)}</p>
        <p>${escapeHtml(parts.receivedRequest)}</p>
        <p>${escapeHtml(parts.resetInstruction)}</p>
        <p><a href="${escapeHtml(parts.resetLink)}">${escapeHtml(parts.resetLink)}</a></p>
        <p>${escapeHtml(parts.ignoreMessage)}</p>
        <p>${escapeHtml(parts.signature)}</p>
    `;
}

function buildFrenchResetMailParts(user, resetLink) {
    const fullName = userFullName(user);
    const strings = mailI18n.getFrenchResetMailStrings(fullName);

    return {
        subject: strings.subject,
        greeting: strings.greeting,
        receivedRequest: strings.receivedRequest,
        resetInstruction: strings.resetInstruction,
        resetLink,
        ignoreMessage: strings.ignoreMessage,
        signature: strings.signature,
    };
}

function mailTranslationHeader(headerNotice, headerFrenchLine) {
    return `
        <div style="font-family: Arial, sans-serif; color: #555; font-size: 13px; line-height: 1.5; margin-bottom: 20px;">
            --------------------------------------------------------<br/>
            ${escapeHtml(headerNotice)}<br/>
            ${escapeHtml(headerFrenchLine)}<br/>
            --------------------------------------------------------
        </div>
    `;
}

function buildBilingualMailHtml(renderBody, frenchParts, localizedParts, headerNotice, headerFrenchLine, frenchVersionLabel) {
    return `
        ${mailTranslationHeader(headerNotice, headerFrenchLine)}
        ${renderBody(localizedParts)}
        <hr style="border:0;border-top:1px solid #ddd;margin:24px 0;"/>
        <p><strong>${escapeHtml(frenchVersionLabel)}</strong></p>
        ${renderBody(frenchParts)}
    `;
}

function buildBilingualResetMailHtml(frenchParts, localizedParts, headerNotice, headerFrenchLine, frenchVersionLabel) {
    return buildBilingualMailHtml(
        renderResetMailBody,
        frenchParts,
        localizedParts,
        headerNotice,
        headerFrenchLine,
        frenchVersionLabel
    );
}

function renderCongeValidationBody(parts) {
    const mainParagraph = parts.refusedMessageBeforeMotif
        ? `<p>${escapeHtml(parts.refusedMessageBeforeMotif)} <b>${escapeHtml(parts.motif)}</b></p>`
        : `<p>${escapeHtml(parts.mainMessage)}</p>`;

    return `
        <p>${escapeHtml(parts.greeting)}</p>
        ${mainParagraph}
        <p>${escapeHtml(parts.thanks)}</p>
        <p>${escapeHtml(parts.closing)}</p>
    `;
}

function buildFrenchCongeValidationMailParts(user, variant, motif) {
    const strings = mailI18n.getFrenchCongeValidationMailStrings(user, variant);

    return {
        subject: strings.subject,
        greeting: strings.greeting,
        mainMessage: strings.mainMessage,
        refusedMessageBeforeMotif: strings.refusedMessageBeforeMotif,
        motif: motif || '',
        thanks: strings.thanks,
        closing: strings.closing,
    };
}

function mapLocalizedStringsToCongeParts(localizedStrings, motif) {
    return {
        greeting: localizedStrings.greeting,
        mainMessage: localizedStrings.mainMessage,
        refusedMessageBeforeMotif: localizedStrings.refusedMessageBeforeMotif,
        motif: motif || '',
        thanks: localizedStrings.thanks,
        closing: localizedStrings.closing,
    };
}

function isUntranslatedBatch(frenchSegments, translatedSegments) {
    if (!Array.isArray(frenchSegments) || !Array.isArray(translatedSegments)) {
        return true;
    }

    if (frenchSegments.length !== translatedSegments.length) {
        return true;
    }

    return frenchSegments.every(
        (segment, index) => segment === translatedSegments[index]
    );
}

async function translateResetMailViaDeepL(language, fullName) {
    const frenchSegments = mailI18n.getResetMailSourceSegments(fullName);
    const result = await translationService.translateTexts(
        frenchSegments,
        language,
        'fr'
    );

    if (result.skipped || isUntranslatedBatch(frenchSegments, result.texts)) {
        return null;
    }

    const [
        subject,
        headerNotice,
        frenchVersionLabel,
        greeting,
        receivedRequest,
        resetInstruction,
        ignoreMessage,
        signature,
    ] = result.texts;

    return {
        subject,
        headerNotice,
        headerFrenchLine: mailI18n.RESET_MAIL_HEADER_FR,
        frenchVersionLabel,
        greeting,
        receivedRequest,
        resetInstruction,
        ignoreMessage,
        signature,
    };
}

async function resolveLocalizedResetMailStrings(language, fullName) {
    if (mailI18n.hasCompleteResetMailStrings(language)) {
        return mailI18n.getResetMailStrings(language, fullName);
    }

    try {
        return await translateResetMailViaDeepL(language, fullName);
    } catch (error) {
        console.error('Erreur traduction mail reset:', error.response?.data || error.message);
        return null;
    }
}

async function translateCongeValidationMailViaDeepL(language, user, variant) {
    const frenchSegments = mailI18n.getCongeValidationMailSourceSegments(user, variant);
    const result = await translationService.translateTexts(
        frenchSegments,
        language,
        'fr'
    );

    if (result.skipped || isUntranslatedBatch(frenchSegments, result.texts)) {
        return null;
    }

    const isRefused = variant === 'refused';
    const [
        subject,
        headerNotice,
        frenchVersionLabel,
        greeting,
        mainOrRefusedPrefix,
        thanks,
        closing,
    ] = result.texts;

    return {
        subject,
        headerNotice,
        headerFrenchLine: mailI18n.MAIL_HEADER_FR,
        frenchVersionLabel,
        greeting,
        mainMessage: isRefused ? null : mainOrRefusedPrefix,
        refusedMessageBeforeMotif: isRefused ? mainOrRefusedPrefix : null,
        thanks,
        closing,
    };
}

async function resolveLocalizedCongeValidationMailStrings(language, user, variant) {
    if (mailI18n.hasCompleteCongeValidationMailStrings(language)) {
        return mailI18n.getCongeValidationMailStrings(language, user, variant);
    }

    try {
        return await translateCongeValidationMailViaDeepL(language, user, variant);
    } catch (error) {
        console.error('Erreur traduction mail congé:', error.response?.data || error.message);
        return null;
    }
}

function renderAuthCodeBody(parts) {
    return `
        <p>${escapeHtml(parts.greeting)}</p>
        <p>${escapeHtml(parts.codeIntro)}</p>
        <p style="font-size: 24px; font-weight: bold; color: #2c3e50; margin: 20px 0;">${escapeHtml(parts.code)}</p>
        <p>${escapeHtml(parts.validityBeforeDuration)} <b>${escapeHtml(parts.validityDuration)}</b>.</p>
        <p>${escapeHtml(parts.ignoreMessage)}</p>
        <p>${escapeHtml(parts.farewell)}</p>
        <p><b>${escapeHtml(parts.signature)}</b></p>
    `;
}

function buildFrenchAuthCodeMailParts(user, code) {
    const strings = mailI18n.getFrenchAuthCodeMailStrings(user);

    return {
        subject: strings.subject,
        greeting: strings.greeting,
        codeIntro: strings.codeIntro,
        code: String(code || ''),
        validityBeforeDuration: strings.validityBeforeDuration,
        validityDuration: strings.validityDuration,
        ignoreMessage: strings.ignoreMessage,
        farewell: strings.farewell,
        signature: strings.signature,
    };
}

function mapLocalizedStringsToAuthCodeParts(localizedStrings, code) {
    return {
        greeting: localizedStrings.greeting,
        codeIntro: localizedStrings.codeIntro,
        code: String(code || ''),
        validityBeforeDuration: localizedStrings.validityBeforeDuration,
        validityDuration: localizedStrings.validityDuration,
        ignoreMessage: localizedStrings.ignoreMessage,
        farewell: localizedStrings.farewell,
        signature: localizedStrings.signature,
    };
}

async function translateAuthCodeMailViaDeepL(language, user) {
    const frenchSegments = mailI18n.getAuthCodeMailSourceSegments(user);
    const result = await translationService.translateTexts(
        frenchSegments,
        language,
        'fr'
    );

    if (result.skipped || isUntranslatedBatch(frenchSegments, result.texts)) {
        return null;
    }

    const [
        subject,
        headerNotice,
        frenchVersionLabel,
        greeting,
        codeIntro,
        validityBeforeDuration,
        validityDuration,
        ignoreMessage,
        farewell,
        signature,
    ] = result.texts;

    return {
        subject,
        headerNotice,
        headerFrenchLine: mailI18n.MAIL_HEADER_FR,
        frenchVersionLabel,
        greeting,
        codeIntro,
        validityBeforeDuration,
        validityDuration,
        ignoreMessage,
        farewell,
        signature,
    };
}

async function resolveLocalizedAuthCodeMailStrings(language, user) {
    if (mailI18n.hasCompleteAuthCodeMailStrings(language)) {
        return mailI18n.getAuthCodeMailStrings(language, user);
    }

    try {
        return await translateAuthCodeMailViaDeepL(language, user);
    } catch (error) {
        console.error('Erreur traduction mail code auth:', error.response?.data || error.message);
        return null;
    }
}

async function buildAuthCodeMail(user, code) {
    const language = translationService.normalizeAppLanguage(user?.preferredLanguage) || 'fr';
    const frenchParts = buildFrenchAuthCodeMailParts(user, code);

    if (language === 'fr') {
        return {
            subject: frenchParts.subject,
            html: renderAuthCodeBody(frenchParts),
        };
    }

    const localizedStrings = await resolveLocalizedAuthCodeMailStrings(language, user);

    if (!localizedStrings) {
        return {
            subject: frenchParts.subject,
            html: renderAuthCodeBody(frenchParts),
        };
    }

    const localizedParts = mapLocalizedStringsToAuthCodeParts(localizedStrings, code);

    return {
        subject: localizedStrings.subject,
        html: buildBilingualMailHtml(
            renderAuthCodeBody,
            frenchParts,
            localizedParts,
            localizedStrings.headerNotice,
            localizedStrings.headerFrenchLine,
            localizedStrings.frenchVersionLabel
        ),
    };
}

function renderPlanningBody(parts) {
    return `
        <p>${escapeHtml(parts.greeting)}</p>
        <p>${escapeHtml(parts.assignmentMessage)}</p>
        <p>${escapeHtml(parts.thanks)}</p>
        <p>${escapeHtml(parts.closing)}</p>
    `;
}

function buildFrenchPlanningMailParts(user, agenda) {
    const strings = mailI18n.getFrenchPlanningMailStrings(user, agenda);

    return {
        subject: strings.subject,
        greeting: strings.greeting,
        assignmentMessage: strings.assignmentMessage,
        thanks: strings.thanks,
        closing: strings.closing,
    };
}

function mapLocalizedStringsToPlanningParts(localizedStrings) {
    return {
        greeting: localizedStrings.greeting,
        assignmentMessage: localizedStrings.assignmentMessage,
        thanks: localizedStrings.thanks,
        closing: localizedStrings.closing,
    };
}

async function translatePlanningMailViaDeepL(language, user, agenda) {
    const frenchSegments = mailI18n.getPlanningMailSourceSegments(user);
    const result = await translationService.translateTexts(
        frenchSegments,
        language,
        'fr'
    );

    if (result.skipped || isUntranslatedBatch(frenchSegments, result.texts)) {
        return null;
    }

    const [
        subject,
        headerNotice,
        frenchVersionLabel,
        greeting,
        assignmentMessageTemplate,
        thanks,
        closing,
    ] = result.texts;

    const title = agenda?.title || '';
    const duration = mailI18n.formatPlanningDuration(agenda, language);

    return {
        subject,
        headerNotice,
        headerFrenchLine: mailI18n.MAIL_HEADER_FR,
        frenchVersionLabel,
        greeting,
        assignmentMessage: mailI18n.formatPlanningAssignmentMessage(
            assignmentMessageTemplate,
            title,
            duration
        ),
        thanks,
        closing,
    };
}

async function resolveLocalizedPlanningMailStrings(language, user, agenda) {
    if (mailI18n.hasCompletePlanningMailStrings(language)) {
        return mailI18n.getPlanningMailStrings(language, user, agenda);
    }

    try {
        return await translatePlanningMailViaDeepL(language, user, agenda);
    } catch (error) {
        console.error('Erreur traduction mail planning:', error.response?.data || error.message);
        return null;
    }
}

async function buildPlanningMail(user, agenda) {
    const planning = toMailTache(agenda);
    const language = translationService.normalizeAppLanguage(user?.preferredLanguage) || 'fr';
    const frenchParts = buildFrenchPlanningMailParts(user, planning);

    if (language === 'fr') {
        return {
            subject: frenchParts.subject,
            html: renderPlanningBody(frenchParts),
        };
    }

    const localizedStrings = await resolveLocalizedPlanningMailStrings(
        language,
        user,
        planning
    );

    if (!localizedStrings) {
        return {
            subject: frenchParts.subject,
            html: renderPlanningBody(frenchParts),
        };
    }

    const localizedParts = mapLocalizedStringsToPlanningParts(localizedStrings);

    return {
        subject: localizedStrings.subject,
        html: buildBilingualMailHtml(
            renderPlanningBody,
            frenchParts,
            localizedParts,
            localizedStrings.headerNotice,
            localizedStrings.headerFrenchLine,
            localizedStrings.frenchVersionLabel
        ),
    };
}

function renderTaskBody(parts) {
    return `
        <p>${escapeHtml(parts.greeting)}</p>
        <p>${escapeHtml(parts.assignmentMessage)} ${escapeHtml(parts.loginInstruction)} <a href="${escapeHtml(parts.loginUrl)}">${escapeHtml(parts.loginUrl)}</a></p>
        <p>${escapeHtml(parts.thanks)}</p>
        <p>${escapeHtml(parts.closing)}</p>
    `;
}

function buildFrenchTaskMailParts(assignee, tache) {
    const strings = mailI18n.getFrenchTaskMailStrings(assignee, tache);

    return {
        subject: strings.subject,
        greeting: strings.greeting,
        assignmentMessage: strings.assignmentMessage,
        loginInstruction: strings.loginInstruction,
        loginUrl: strings.loginUrl,
        thanks: strings.thanks,
        closing: strings.closing,
    };
}

function mapLocalizedStringsToTaskParts(localizedStrings) {
    return {
        greeting: localizedStrings.greeting,
        assignmentMessage: localizedStrings.assignmentMessage,
        loginInstruction: localizedStrings.loginInstruction,
        loginUrl: localizedStrings.loginUrl,
        thanks: localizedStrings.thanks,
        closing: localizedStrings.closing,
    };
}

async function translateTaskMailViaDeepL(language, assignee, tache) {
    const frenchSegments = mailI18n.getTaskMailSourceSegments(assignee);
    const result = await translationService.translateTexts(
        frenchSegments,
        language,
        'fr'
    );

    if (result.skipped || isUntranslatedBatch(frenchSegments, result.texts)) {
        return null;
    }

    const [
        subject,
        headerNotice,
        frenchVersionLabel,
        greeting,
        assignmentMessageTemplate,
        loginInstruction,
        thanks,
        closing,
    ] = result.texts;

    const context = mailI18n.getTaskContext(tache, language);

    return {
        subject,
        headerNotice,
        headerFrenchLine: mailI18n.MAIL_HEADER_FR,
        frenchVersionLabel,
        greeting,
        assignmentMessage: mailI18n.formatTaskAssignmentMessage(
            assignmentMessageTemplate,
            context
        ),
        loginInstruction,
        loginUrl: context.loginUrl,
        thanks,
        closing,
    };
}

async function resolveLocalizedTaskMailStrings(language, assignee, tache) {
    if (mailI18n.hasCompleteTaskMailStrings(language)) {
        return mailI18n.getTaskMailStrings(language, assignee, tache);
    }

    try {
        return await translateTaskMailViaDeepL(language, assignee, tache);
    } catch (error) {
        console.error('Erreur traduction mail tâche:', error.response?.data || error.message);
        return null;
    }
}

function toMailTache(tache) {
    if (!tache) return tache;
    return typeof tache.toObject === 'function'
        ? tache.toObject({ virtuals: true })
        : tache;
}

async function buildTaskMail(assignee, tache) {
    const task = toMailTache(tache);
    const language = translationService.normalizeAppLanguage(assignee?.preferredLanguage) || 'fr';
    const frenchParts = buildFrenchTaskMailParts(assignee, task);

    if (language === 'fr') {
        return {
            subject: frenchParts.subject,
            html: renderTaskBody(frenchParts),
        };
    }

    const localizedStrings = await resolveLocalizedTaskMailStrings(
        language,
        assignee,
        task
    );

    if (!localizedStrings) {
        return {
            subject: frenchParts.subject,
            html: renderTaskBody(frenchParts),
        };
    }

    const localizedParts = mapLocalizedStringsToTaskParts(localizedStrings);

    return {
        subject: localizedStrings.subject,
        html: buildBilingualMailHtml(
            renderTaskBody,
            frenchParts,
            localizedParts,
            localizedStrings.headerNotice,
            localizedStrings.headerFrenchLine,
            localizedStrings.frenchVersionLabel
        ),
    };
}

function buildFrenchSubTaskMailParts(assignee, timeTask) {
    const strings = mailI18n.getFrenchSubTaskMailStrings(assignee, timeTask);

    return {
        subject: strings.subject,
        greeting: strings.greeting,
        assignmentMessage: strings.assignmentMessage,
        loginInstruction: strings.loginInstruction,
        loginUrl: strings.loginUrl,
        thanks: strings.thanks,
        closing: strings.closing,
    };
}

function mapLocalizedStringsToSubTaskParts(localizedStrings) {
    return {
        greeting: localizedStrings.greeting,
        assignmentMessage: localizedStrings.assignmentMessage,
        loginInstruction: localizedStrings.loginInstruction,
        loginUrl: localizedStrings.loginUrl,
        thanks: localizedStrings.thanks,
        closing: localizedStrings.closing,
    };
}

async function translateSubTaskMailViaDeepL(language, assignee, timeTask) {
    const frenchSegments = mailI18n.getSubTaskMailSourceSegments(assignee);
    const result = await translationService.translateTexts(
        frenchSegments,
        language,
        'fr'
    );

    if (result.skipped || isUntranslatedBatch(frenchSegments, result.texts)) {
        return null;
    }

    const [
        subject,
        headerNotice,
        frenchVersionLabel,
        greeting,
        assignmentMessageTemplate,
        loginInstruction,
        thanks,
        closing,
    ] = result.texts;

    const context = mailI18n.getSubTaskContext(timeTask, language);

    return {
        subject,
        headerNotice,
        headerFrenchLine: mailI18n.MAIL_HEADER_FR,
        frenchVersionLabel,
        greeting,
        assignmentMessage: mailI18n.formatSubTaskAssignmentMessage(
            assignmentMessageTemplate,
            context
        ),
        loginInstruction,
        loginUrl: context.loginUrl,
        thanks,
        closing,
    };
}

async function resolveLocalizedSubTaskMailStrings(language, assignee, timeTask) {
    if (mailI18n.hasCompleteSubTaskMailStrings(language)) {
        return mailI18n.getSubTaskMailStrings(language, assignee, timeTask);
    }

    try {
        return await translateSubTaskMailViaDeepL(language, assignee, timeTask);
    } catch (error) {
        console.error('Erreur traduction mail sous-tâche:', error.response?.data || error.message);
        return null;
    }
}

async function buildSubTaskMail(assignee, timeTask) {
    const entry = toMailTache(timeTask);
    if (entry?.tache) {
        entry.tache = toMailTache(entry.tache);
    }
    const language = translationService.normalizeAppLanguage(assignee?.preferredLanguage) || 'fr';
    const frenchParts = buildFrenchSubTaskMailParts(assignee, entry);

    if (language === 'fr') {
        return {
            subject: frenchParts.subject,
            html: renderTaskBody(frenchParts),
        };
    }

    const localizedStrings = await resolveLocalizedSubTaskMailStrings(
        language,
        assignee,
        entry
    );

    if (!localizedStrings) {
        return {
            subject: frenchParts.subject,
            html: renderTaskBody(frenchParts),
        };
    }

    const localizedParts = mapLocalizedStringsToSubTaskParts(localizedStrings);

    return {
        subject: localizedStrings.subject,
        html: buildBilingualMailHtml(
            renderTaskBody,
            frenchParts,
            localizedParts,
            localizedStrings.headerNotice,
            localizedStrings.headerFrenchLine,
            localizedStrings.frenchVersionLabel
        ),
    };
}

function renderUpdateTaskBody(parts) {
    return `
        <p>${escapeHtml(parts.greeting)}</p>
        <p>${escapeHtml(parts.statusUpdateMessage)}</p>
        <p>${escapeHtml(parts.newStatusLabel)} ${escapeHtml(parts.newStatus)}.</p>
        <p>${escapeHtml(parts.detailsInstruction)} <a href="${escapeHtml(parts.loginUrl)}">${escapeHtml(parts.loginUrl)}</a></p>
        <p>${escapeHtml(parts.thanks)}</p>
        <p>${escapeHtml(parts.closing)}</p>
    `;
}

function buildFrenchUpdateTaskMailParts(recipient, tache, modifierUser) {
    const strings = mailI18n.getFrenchUpdateTaskMailStrings(recipient, tache, modifierUser);

    return {
        subject: strings.subject,
        greeting: strings.greeting,
        statusUpdateMessage: strings.statusUpdateMessage,
        newStatusLabel: strings.newStatusLabel,
        newStatus: strings.newStatus,
        detailsInstruction: strings.detailsInstruction,
        loginUrl: strings.loginUrl,
        thanks: strings.thanks,
        closing: strings.closing,
    };
}

function mapLocalizedStringsToUpdateTaskParts(localizedStrings) {
    return {
        greeting: localizedStrings.greeting,
        statusUpdateMessage: localizedStrings.statusUpdateMessage,
        newStatusLabel: localizedStrings.newStatusLabel,
        newStatus: localizedStrings.newStatus,
        detailsInstruction: localizedStrings.detailsInstruction,
        loginUrl: localizedStrings.loginUrl,
        thanks: localizedStrings.thanks,
        closing: localizedStrings.closing,
    };
}

async function translateUpdateTaskMailViaDeepL(language, recipient, tache, modifierUser) {
    const frenchSegments = mailI18n.getUpdateTaskMailSourceSegments(recipient);
    const result = await translationService.translateTexts(
        frenchSegments,
        language,
        'fr'
    );

    if (result.skipped || isUntranslatedBatch(frenchSegments, result.texts)) {
        return null;
    }

    const [
        subject,
        headerNotice,
        frenchVersionLabel,
        greeting,
        statusUpdateMessageTemplate,
        newStatusLabel,
        detailsInstruction,
        thanks,
        closing,
    ] = result.texts;

    const context = mailI18n.getUpdateTaskContext(tache, modifierUser, language);

    return {
        subject,
        headerNotice,
        headerFrenchLine: mailI18n.MAIL_HEADER_FR,
        frenchVersionLabel,
        greeting,
        statusUpdateMessage: mailI18n.formatUpdateTaskMessage(
            statusUpdateMessageTemplate,
            context
        ),
        newStatusLabel,
        newStatus: context.newStatus,
        detailsInstruction,
        loginUrl: context.loginUrl,
        thanks,
        closing,
    };
}

async function resolveLocalizedUpdateTaskMailStrings(language, recipient, tache, modifierUser) {
    if (mailI18n.hasCompleteUpdateTaskMailStrings(language)) {
        return mailI18n.getUpdateTaskMailStrings(
            language,
            recipient,
            tache,
            modifierUser
        );
    }

    try {
        return await translateUpdateTaskMailViaDeepL(language, recipient, tache, modifierUser);
    } catch (error) {
        console.error('Erreur traduction mail mise à jour tâche:', error.response?.data || error.message);
        return null;
    }
}

async function buildUpdateTaskMail(recipient, tache, modifierUser) {
    const task = toMailTache(tache);
    const language = translationService.normalizeAppLanguage(recipient?.preferredLanguage) || 'fr';
    const frenchParts = buildFrenchUpdateTaskMailParts(recipient, task, modifierUser);

    if (language === 'fr') {
        return {
            subject: frenchParts.subject,
            html: renderUpdateTaskBody(frenchParts),
        };
    }

    const localizedStrings = await resolveLocalizedUpdateTaskMailStrings(
        language,
        recipient,
        task,
        modifierUser
    );

    if (!localizedStrings) {
        return {
            subject: frenchParts.subject,
            html: renderUpdateTaskBody(frenchParts),
        };
    }

    const localizedParts = mapLocalizedStringsToUpdateTaskParts(localizedStrings);

    return {
        subject: localizedStrings.subject,
        html: buildBilingualMailHtml(
            renderUpdateTaskBody,
            frenchParts,
            localizedParts,
            localizedStrings.headerNotice,
            localizedStrings.headerFrenchLine,
            localizedStrings.frenchVersionLabel
        ),
    };
}

async function buildCongeValidationMail(user, variant, motif) {
    const language = translationService.normalizeAppLanguage(user?.preferredLanguage) || 'fr';
    const frenchParts = buildFrenchCongeValidationMailParts(user, variant, motif);

    if (language === 'fr') {
        return {
            subject: frenchParts.subject,
            html: renderCongeValidationBody(frenchParts),
        };
    }

    const localizedStrings = await resolveLocalizedCongeValidationMailStrings(
        language,
        user,
        variant
    );

    if (!localizedStrings) {
        return {
            subject: frenchParts.subject,
            html: renderCongeValidationBody(frenchParts),
        };
    }

    const localizedParts = mapLocalizedStringsToCongeParts(localizedStrings, motif);

    return {
        subject: localizedStrings.subject,
        html: buildBilingualMailHtml(
            renderCongeValidationBody,
            frenchParts,
            localizedParts,
            localizedStrings.headerNotice,
            localizedStrings.headerFrenchLine,
            localizedStrings.frenchVersionLabel
        ),
    };
}

async function buildResetMail(user) {
    const language = translationService.normalizeAppLanguage(user?.preferredLanguage) || 'fr';
    const resetLink = process.env.lostpassword + user.code + '&email=' + user.email;
    const fullName = userFullName(user);
    const frenchParts = buildFrenchResetMailParts(user, resetLink);

    if (language === 'fr') {
        return {
            subject: frenchParts.subject,
            html: renderResetMailBody(frenchParts),
        };
    }

    const localizedStrings = await resolveLocalizedResetMailStrings(language, fullName);

    if (!localizedStrings) {
        return {
            subject: frenchParts.subject,
            html: renderResetMailBody(frenchParts),
        };
    }

    const localizedParts = {
        greeting: localizedStrings.greeting,
        receivedRequest: localizedStrings.receivedRequest,
        resetInstruction: localizedStrings.resetInstruction,
        resetLink,
        ignoreMessage: localizedStrings.ignoreMessage,
        signature: localizedStrings.signature,
    };

    return {
        subject: localizedStrings.subject,
        html: buildBilingualResetMailHtml(
            frenchParts,
            localizedParts,
            localizedStrings.headerNotice,
            localizedStrings.headerFrenchLine,
            localizedStrings.frenchVersionLabel
        ),
    };
}


module.exports={


    reset:(user)=>{
        return new Promise(async(resolve, reject)=>{
            try {

                let transporter = nodemailer.createTransport({
                    host: process.env.SMTP_SERVER,
                    port: process.env.SMTP_PORT,
                    secure:false,
                    tls:true,
                    auth:{
                        user:process.env.SMTP_USERNAME,
                        pass:process.env.SMTP_PASSWORD
                    },
                    logger: true,
                    debug: true
                },{
                    from: 'MLKA <' + process.env.SMTP_FROM + '>',
                    headers:{
                        'X-Laziness-level':1000
                    }
                });
                
                const resetMail = await buildResetMail(user);
                let message = {
                    to: user.email,
                    subject: resetMail.subject,
                    html: resetMail.html,
                };
                transporter.sendMail(message, (error, user)=>{
                    if(error){
                        console.log("erreur", error);
                    }
                    resolve(user);
                    transporter.close();
                });
                
            } catch (error) {
                console.log("Erreur mail", error);
                reject(error);
            }

            
        });
    },

    signup:(user,password)=>{
        return new Promise(async(resolve, reject)=>{
            try {

                let transporter = nodemailer.createTransport({
                    host: process.env.SMTP_SERVER,
                    port: process.env.SMTP_PORT,
                    secure:false,
                    tls:true,
                    auth:{
                        user:process.env.SMTP_USERNAME,
                        pass:process.env.SMTP_PASSWORD
                    },
                    logger: false,
                    debug: false
                },{
                    from: 'MLKA <' + process.env.SMTP_FROM + '>',
                    headers:{
                        'X-Laziness-level':1000
                    }
                });
                
                let message = {
                    to: user.email,
                    subject: 'Bienvenue sur MLKA GROUPE - Votre partenaire en bâtiments préfabriqués',
                    html:'Cher(e) ' + user?.nom +" "+user?.prenom+ 
                    '<br/><br/>'+ 
                    '<p>Nous sommes ravis de vous accueillir chez <b>MLKA GROUPE</b>, votre partenaire de confiance pour le suivi, la fourniture et l\'installation de bâtiments préfabriqués. Merci de votre inscription et de votre confiance en notre expertise.<p/>'+
                    '<p>Chez <b>MLKA GROUPE</b>, nous nous engageons à vous offrir une <b>expérience optimale</b> à chaque étape de votre projet.</p>'+
                    '<p><b>🌐 Accédez à nos plateformes dès maintenant :</b></p>'+
                    '<p>🔹 <a href="https://mlka-market.com/" target="_blank"><b>Accéder à la MarketPlace MLKA</b></a> – Trouvez, achetez et louez des modules en toute simplicité.</p>' +
                    '<p>🔹 <a href="https://mlka.app" target="_blank"><b>Gérez vos projets en temps réel</b></a> – Suivez l’avancement de vos chantiers et optimisez votre gestion.</p>' +
                    '<p>Pour commencer, connectez-vous à votre compte MLKA GROUPE avec vos identifiants :</p>'+
                    '<p> <b>📧 Adresse e-mail: '+user.email+'</b> </p>'+
                    '<p> <b>🔑 Mot de passe: '+password+'</b> </p>'+
                    '<p>Si vous avez des projets en cours ou des demandes spécifiques, ajoutez-les dès maintenant depuis votre tableau de bord.</p>'+
                    '<p>Bienvenue chez <b>MLKA GROUPE</b>, où la qualité et le professionnalisme sont au cœur de tout ce que nous faisons.</p>'+
                    '<p>À très bientôt !</p>'+
                    '<p><b>L\'équipe MLKA GROUPE</b></p>',
                };
                transporter.sendMail(message, (error, user)=>{
                    if(error){
                        console.log("erreur", error);
                    }
                    resolve(user);
                    transporter.close();
                });
                
            } catch (error) {
                console.log("Erreur mail", error);
                reject(error);
            }

            
        });
    },

    signupParticulier:(user,password)=>{
        return new Promise(async(resolve, reject)=>{
            try {

                let transporter = nodemailer.createTransport({
                    host: process.env.SMTP_SERVER,
                    port: process.env.SMTP_PORT,
                    secure:false,
                    tls:true,
                    auth:{
                        user:process.env.SMTP_USERNAME,
                        pass:process.env.SMTP_PASSWORD
                    },
                    logger: false,
                    debug: false
                },{
                    from: 'MLKA <' + process.env.SMTP_FROM + '>',
                    headers:{
                        'X-Laziness-level':1000
                    }
                });
                
                let message = {
                    to: user.email,
                    subject: 'Bienvenue sur MLKA GROUPE - Votre partenaire en bâtiments préfabriqués',
                    html:'Cher(e) ' + user?.nom +" "+user?.prenom+ 
                    '<br/><br/>'+ 
                    '<p>Nous sommes ravis de vous accueillir chez <b>MLKA GROUPE</b>, votre partenaire de confiance pour le suivi, la fourniture et l\'installation de bâtiments préfabriqués. Merci de votre inscription et de votre confiance en notre expertise.<p/>'+
                    '<p>Que vous ayez un projet de construction, d’aménagement ou simplement une curiosité pour les bâtiments préfabriqués, vous êtes au bon endroit.</p>'+
                    '<p><b>🔐 Accédez dès maintenant à notre Marketplace pour consulter nos offres :</b></p>'+
                    '<p>🔹 <a href="https://mlka-market.com/" target="_blank"><b>MLKA MarketPlace</b></a> – Achetez, louez ou découvrez nos modules préfabriqués en quelques clics.</p>'+
                    '<p>Voici vos identifiants pour vous connecter :</p>'+
                    '<p> <b>📧 Adresse e-mail: '+user.email+'</b> </p>'+
                    '<p> <b>🔑 Mot de passe: '+password+'</b> </p>'+
                    '<p>Découvrez qui nous sommes, nos services et nos engagements sur notre site officiel :</p>'+
                    '<p>🌐 <a href="https://mlka-groupe.fr/" target="_blank"><b>www.mlka-groupe.fr</b></a></p>'+
                    '<p>Nous mettons tout en œuvre pour vous garantir une expérience simple, rapide et fiable.</p>'+
                    '<p style="margin-top: 20px;">Bienvenue dans la famille <b>MLKA GROUPE</b> ! Ensemble, concrétisons vos projets avec qualité et sérénité.</p>'+
                    '<p>À très bientôt !</p>'+
                    '<p><b>L\'équipe MLKA GROUPE</b></p>',
                };

                transporter.sendMail(message, (error, user)=>{
                    if(error){
                        console.log("erreur", error);
                    }
                    resolve(user);
                    transporter.close();
                });
                
            } catch (error) {
                console.log("Erreur mail", error);
                reject(error);
            }

            
        });
    },

    signupParticulierSource:(user, source)=>{
        return new Promise(async(resolve, reject)=>{
            try {

                let transporter = nodemailer.createTransport({
                    host: process.env.SMTP_SERVER,
                    port: process.env.SMTP_PORT,
                    secure:false,
                    tls:true,
                    auth:{
                        user:process.env.SMTP_USERNAME,
                        pass:process.env.SMTP_PASSWORD
                    },
                    logger: false,
                    debug: false
                },{
                    from: 'MLKA <' + process.env.SMTP_FROM + '>',
                    headers:{
                        'X-Laziness-level':1000
                    }
                });
                
                let message = {
                    to: user.email,
                    subject: 'Bienvenue sur MLKA GROUPE - Votre partenaire en bâtiments préfabriqués',
                    html:'Cher(e) ' + user?.nom +" "+user?.prenom+ 
                    '<br/><br/>'+ 
                    '<p>Nous sommes ravis de vous accueillir chez <b>MLKA GROUPE</b>, votre partenaire de confiance pour le suivi, la fourniture et l\'installation de bâtiments préfabriqués. Merci de votre inscription et de votre confiance en notre expertise.<p/>'+
                    '<p>Que vous ayez un projet de construction, d’aménagement ou simplement une curiosité pour les bâtiments préfabriqués, vous êtes au bon endroit.</p>'+
                    '<p><b>🔐 Accédez dès maintenant à notre Marketplace pour consulter nos offres :</b></p>'+
                    '<p>🔹 <a href="https://mlka-market.com/" target="_blank"><b>MLKA MarketPlace</b></a> – Achetez, louez ou découvrez nos modules préfabriqués en quelques clics.</p>'+
                    '<p>Vous pouvez vous connecter directement avec votre compte '+source +' dont l\'adresse e-mail est : <b>'+user.email+'</b>.</p>' +
                    '<p>Découvrez qui nous sommes, nos services et nos engagements sur notre site officiel :</p>'+
                    '<p>🌐 <a href="https://mlka-groupe.fr/" target="_blank"><b>www.mlka-groupe.fr</b></a></p>'+
                    '<p>Nous mettons tout en œuvre pour vous garantir une expérience simple, rapide et fiable.</p>'+
                    '<p style="margin-top: 20px;">Bienvenue dans la famille <b>MLKA GROUPE</b> ! Ensemble, concrétisons vos projets avec qualité et sérénité.</p>'+
                    '<p>À très bientôt !</p>'+
                    '<p><b>L\'équipe MLKA GROUPE</b></p>',
                };

                transporter.sendMail(message, (error, user)=>{
                    if(error){
                        console.log("erreur", error);
                    }
                    resolve(user);
                    transporter.close();
                });
                
            } catch (error) {
                console.log("Erreur mail", error);
                reject(error);
            }

            
        });
    },

    mailconge:(user)=>{
        return new Promise(async(resolve, reject)=>{
            try {

                let transporter = nodemailer.createTransport({
                    host: process.env.SMTP_SERVER,
                    port: process.env.SMTP_PORT,
                    secure:false,
                    tls:true,
                    auth:{
                        user:process.env.SMTP_USERNAME,
                        pass:process.env.SMTP_PASSWORD
                    },
                    logger: false,
                    debug: false
                },{
                    from: 'MLKA <' + process.env.SMTP_FROM + '>',
                    headers:{
                        'X-Laziness-level':1000
                    }
                });
                
                let message = {
                    to: "m.minthe@mlka.fr;s.mbaye@mlka.fr",
                    subject: 'Demande de congé',
                    html:'Cher(e) Malick'+'<br/><br/>'+ 
                    '<p>Vous avez reçu une demande de congé de '+user.nom+' '+user.prenom+'.<p/>'+
                    '<p>Veuillez vous connecter dans l\'application MLKA pour valider la demande. <span><a href="https://mlka.app/login">Cliquez ici</a></span></p>'+
                    '<p>Merci.</p>'+
                    '<p>Cordialement.</p>',
                };
                transporter.sendMail(message, (error, user)=>{
                    if(error){
                        console.log("erreur", error);
                    }
                    resolve(user);
                    transporter.close();
                });
                
            } catch (error) {
                console.log("Erreur mail", error);
                reject(error);
            }

            
        });
    },

    mailValidationconge:(idConge)=>{
        return new Promise(async(resolve, reject)=>{
            try {

                let conge = await Conge.findOne({_id:idConge}).populate('user');
                const isRefused = conge?.status === 'Refusée';
                const variant = isRefused ? 'refused' : 'approved';
                const congeMail = await buildCongeValidationMail(
                    conge?.user,
                    variant,
                    conge?.motif
                );

                let transporter = nodemailer.createTransport({
                    host: process.env.SMTP_SERVER,
                    port: process.env.SMTP_PORT,
                    secure:false,
                    tls:true,
                    auth:{
                        user:process.env.SMTP_USERNAME,
                        pass:process.env.SMTP_PASSWORD
                    },
                    logger: false,
                    debug: false
                },{
                    from: 'MLKA <' + process.env.SMTP_FROM + '>',
                    headers:{
                        'X-Laziness-level':1000
                    }
                });
                
                let message = {
                    to: conge?.user?.email,
                    subject: congeMail.subject,
                    html: congeMail.html,
                };
                transporter.sendMail(message, (error, user)=>{
                    if(error){
                        console.log("erreur", error);
                    }
                    resolve(user);
                    transporter.close();
                });
                
            } catch (error) {
                console.log("Erreur mail", error);
                reject(error);
            }

            
        });
    },
    
    mailCodeAuthentication:(user, code)=>{
        return new Promise(async(resolve, reject)=>{
            try {

                let transporter = nodemailer.createTransport({
                    host: process.env.SMTP_SERVER,
                    port: process.env.SMTP_PORT,
                    secure:false,
                    tls:true,
                    auth:{
                        user:process.env.SMTP_USERNAME,
                        pass:process.env.SMTP_PASSWORD
                    },
                    logger: false,
                    debug: false
                },{
                    from: 'MLKA <' + process.env.SMTP_FROM + '>',
                    headers:{
                        'X-Laziness-level':1000
                    }
                });
                
                const authCodeMail = await buildAuthCodeMail(user, code);
                let message = {
                    to: user.email,
                    subject: authCodeMail.subject,
                    html: authCodeMail.html,
                };

                transporter.sendMail(message, (error, user)=>{
                    if(error){
                        console.log("erreur", error);
                    }
                    resolve(user);
                    transporter.close();
                });
                
            } catch (error) {
                console.log("Erreur mail", error);
                reject(error);
            }

            
        });
    },


    mailPlanning:(idAgenda)=>{
        return new Promise(async(resolve, reject)=>{
            try {

                let agenda = await Agenda.findOne({_id:idAgenda}).populate('assigne');

                let transporter = nodemailer.createTransport({
                    host: process.env.SMTP_SERVER,
                    port: process.env.SMTP_PORT,
                    secure:false,
                    tls:true,
                    auth:{
                        user:process.env.SMTP_USERNAME,
                        pass:process.env.SMTP_PASSWORD
                    },
                    logger: false,
                    debug: false
                },{
                    from: 'MLKA <' + process.env.SMTP_FROM + '>',
                    headers:{
                        'X-Laziness-level':1000
                    }
                });

                for (const user of agenda?.assigne || []) {
                    const planningMail = await buildPlanningMail(user, agenda);
                    let message = {
                        to: user?.email,
                        subject: planningMail.subject,
                        html: planningMail.html,
                    };

                    await new Promise((sendResolve) => {
                        transporter.sendMail(message, (error) => {
                            if (error) {
                                console.log("erreur", error);
                            }
                            sendResolve();
                        });
                    });
                }

                transporter.close();
                resolve(agenda);
                
            } catch (error) {
                console.log("Erreur mail", error);
                reject(error);
            }

            
        });
    },

    mailTache:(idTask)=>{
        return new Promise(async(resolve, reject)=>{
            try {

                let tache = await Tache.findOne({_id:idTask}).populate('assignes').populate('user').populate('projet');
                if (!tache) return resolve({ sent: 0, results: [], reason: "TASK_NOT_FOUND" });


                let transporter = nodemailer.createTransport({
                    host: process.env.SMTP_SERVER,
                    port: process.env.SMTP_PORT,
                    secure:false,
                    tls:true,
                    auth:{
                        user:process.env.SMTP_USERNAME,
                        pass:process.env.SMTP_PASSWORD
                    },
                    logger: false,
                    debug: false
                },{
                    from: 'MLKA <' + process.env.SMTP_FROM + '>',
                    headers:{
                        'X-Laziness-level':1000
                    }
                });

            const assignes = Array.isArray(tache.assignes) ? tache.assignes : [];
            if (assignes.length === 0) {
                transporter.close();
                return resolve({ sent: 0, results: [], reason: "NO_ASSIGNEES" });
            }

            const sendPromises = assignes.map(async (assigne) => {
                const email = assigne?.email;
                if (!email) {
                    return { ok: false, assigneId: assigne?._id, reason: "NO_EMAIL" };
                }

                try {
                    const taskMail = await buildTaskMail(assigne, tache);
                    const message = {
                        to: email,
                        subject: taskMail.subject,
                        html: taskMail.html,
                    };

                    const info = await transporter.sendMail(message);
                    return {
                        ok: true,
                        assigneId: assigne._id,
                        email,
                        messageId: info?.messageId,
                    };
                } catch (error) {
                    return {
                        ok: false,
                        assigneId: assigne?._id,
                        email,
                        error: error?.message || String(error),
                    };
                }
            });

            const results = await Promise.all(sendPromises);
            transporter.close();

            const sent = results.filter(r => r.ok).length;
            resolve({ sent, results });
                
                //console.log("User", user);

                // let message = {
                //     to:tache?.assignes?.email,
                //     subject: 'Tâche de travail',
                //     html:'Cher(e) '+tache?.assignes?.nom+' '+tache?.assignes?.prenom+' '+'<br/><br/>'+
                //     '<p>Une tâche "'+tache?.titre+'" du projet "'+tache?.projet?.projet+'" vous est assignée par '+tache?.user?.nom+' '+tache?.user?.prenom+', pour une période du '+new Date(tache?.date_debut).toLocaleDateString('fr-FR')+' au '+new Date(tache?.date_fin).toLocaleDateString('fr-FR')+'. Merci de vous connecter sur la plateforme https://mlka.app/login</p>'+ 
                //     '<p>Merci.</p>'+
                //     '<p>Cordialement.</p>',
                // };
                // transporter.sendMail(message, (error, user)=>{
                //     if(error){
                //         console.log("erreur", error);
                //     }
                //     resolve(user);
                //     transporter.close();
                // });
                
            } catch (error) {
                console.log("Erreur mail", error);
                reject(error);
            }

            
        });

    },

    mailSousTache:(idSousTask)=>{
        return new Promise(async(resolve, reject)=>{
            try {

                let tache = await TimeTask.findOne({_id:idSousTask}).populate('employee').populate('user').populate({
                    path: 'tache',
                    populate: {
                        path: 'projet',  // Populate le projet dans la tache
                        select: 'projet'  // Optionnel : seulement le titre
                    }
                });
                //console.log("Time tache", tache);

                let transporter = nodemailer.createTransport({
                    host: process.env.SMTP_SERVER,
                    port: process.env.SMTP_PORT,
                    secure:false,
                    tls:true,
                    auth:{
                        user:process.env.SMTP_USERNAME,
                        pass:process.env.SMTP_PASSWORD
                    },
                    logger: false,
                    debug: false
                },{
                    from: 'MLKA <' + process.env.SMTP_FROM + '>',
                    headers:{
                        'X-Laziness-level':1000
                    }
                });

            const assignes = Array.isArray(tache.employee) ? tache.employee : [];
            if (assignes.length === 0) {
                transporter.close();
                return resolve({ sent: 0, results: [], reason: "NO_ASSIGNEES" });
            }

            const sendPromises = assignes.map(async (assigne) => {
                const email = assigne?.email;
                if (!email) {
                    return { ok: false, assigneId: assigne?._id, reason: "NO_EMAIL" };
                }

                try {
                    const subTaskMail = await buildSubTaskMail(assigne, tache);
                    const message = {
                        to: email,
                        subject: subTaskMail.subject,
                        html: subTaskMail.html,
                    };

                    const info = await transporter.sendMail(message);
                    return {
                        ok: true,
                        assigneId: assigne._id,
                        email,
                        messageId: info?.messageId,
                    };
                } catch (error) {
                    return {
                        ok: false,
                        assigneId: assigne?._id,
                        email,
                        error: error?.message || String(error),
                    };
                }
            });

            const results = await Promise.all(sendPromises);
            transporter.close();

            const sent = results.filter(r => r.ok).length;
            resolve({ sent, results });


                //console.log("User", user);

                // let message = {
                //     to:tache?.employee?.email,
                //     subject: 'Sous-Tâche de travail',
                //     html:'Cher(e) '+tache?.employee?.nom+' '+tache?.employee?.prenom+' '+'<br/><br/>'+
                //     '<p>Une sous-tâche "'+tache?.description+'" de la tâche "'+tache?.tache?.titre+'" du projet "'+tache?.tache?.projet?.projet+'" vous est assignée par '+tache?.user?.nom+' '+tache?.user?.prenom+', avec comme deadline le '+new Date(tache?.date).toLocaleDateString('fr-FR')+'. Merci de vous connecter sur la plateforme https://mlka.app/login</p>'+ 
                //     '<p>Merci.</p>'+
                //     '<p>Cordialement.</p>',
                // };
                // transporter.sendMail(message, (error, user)=>{
                //     if(error){
                //         console.log("erreur", error);
                //     }
                //     resolve(user);
                //     transporter.close();
                // });
                
            } catch (error) {
                console.log("Erreur mail", error);
                reject(error);
            }

            
        });
    },

    mailUpdateTache:(idTask, idUser)=>{
        return new Promise(async(resolve, reject)=>{
            try {

                let tache = await Tache.findOne({_id:idTask}).populate('assignes').populate('user').populate('projet');
                let user = await User.findOne({_id:idUser});


                let transporter = nodemailer.createTransport({
                    host: process.env.SMTP_SERVER,
                    port: process.env.SMTP_PORT,
                    secure:false,
                    tls:true,
                    auth:{
                        user:process.env.SMTP_USERNAME,
                        pass:process.env.SMTP_PASSWORD
                    },
                    logger: false,
                    debug: false
                },{
                    from: 'MLKA <' + process.env.SMTP_FROM + '>',
                    headers:{
                        'X-Laziness-level':1000
                    }
                });


                //console.log("User", user);

                const updateMail = await buildUpdateTaskMail(tache?.user, tache, user);
                let message = {
                    to: tache?.user?.email,
                    subject: updateMail.subject,
                    html: updateMail.html,
                };
                transporter.sendMail(message, (error, user)=>{
                    if(error){
                        console.log("erreur", error);
                    }
                    resolve(user);
                    transporter.close();
                });
                
            } catch (error) {
                console.log("Erreur mail", error);
                reject(error);
            }

            
        });

    },

    mailPvReception: ({projet, nomComplet, email, pvBuffer, fileName }) => {
        return new Promise(async (resolve, reject) => {
            try {

            let transporter = nodemailer.createTransport({
                host: process.env.SMTP_SERVER,
                port: process.env.SMTP_PORT,
                secure: false,
                auth: {
                user: process.env.SMTP_USERNAME,
                pass: process.env.SMTP_PASSWORD
                }
            });

            let message = {
                from: `MLKA <${process.env.SMTP_FROM}>`,
                to: email,
                subject: "PV de réception MLKA",
                html: `
                <p>Bonjour ${nomComplet},</p>

                <p>
                    Veuillez trouver ci-joint le <strong>Procès-Verbal de réception des travaux ${projet}</strong>.
                </p>

                <p>
                    Nous vous invitons à consulter le document en pièce jointe.
                </p>

                <p>
                    Pour toute information complémentaire, veuillez nous contacter par mail à l'adresse <a href="mailto:contact@mlka.fr">contact@mlka.fr</a> ou adressez-vous directement au responsable du projet.
                </p>

\               <p>Cordialement,</p>
                <p><strong>L'équipe MLKA</strong></p>
                `,

                attachments: [
                {
                    filename: fileName || "pv_reception_mlka.pdf",
                    content: pvBuffer
                }
                ]
            };

            transporter.sendMail(message, (error, info) => {
                if (error) {
                console.log("Erreur mail :", error);
                return reject(error);
                }

                resolve(info);
                transporter.close();
            });

            } catch (error) {
            console.log("Erreur mail", error);
            reject(error);
            }
        });
    },

    mailPvSignatureRequest: ({ nomComplet, email, signatureLink, projet }) => {
        return new Promise(async (resolve, reject) => {
            try {
                let transporter = nodemailer.createTransport({
                    host: process.env.SMTP_SERVER,
                    port: process.env.SMTP_PORT,
                    secure: false,
                    auth: {
                        user: process.env.SMTP_USERNAME,
                        pass: process.env.SMTP_PASSWORD
                    }
                });

                let message = {
                    from: `MLKA <${process.env.SMTP_FROM}>`,
                    to: email,
                    subject: 'Demande de signature du PV de réception MLKA',
                    html: `
                        <p>Bonjour ${nomComplet || ''},</p>
                        <p>
                            Nous vous invitons à consulter attentivement le procès-verbal de réception
                            ${projet ? `<strong>${projet}</strong>` : ''}.
                        </p>
                        <p>
                            Si le document vous convient, vous pouvez le valider et le signer en ligne.
                            Si des points ne vous conviennent pas, vous pouvez refuser la réception
                            et préciser les motifs depuis la même page.
                        </p>
                        <p>
                            Accéder à la page de lecture et de signature :
                            <a href="${signatureLink}" target="_blank">${signatureLink}</a>
                        </p>
                        <p><strong>Ce lien expire dans 1 heure.</strong></p>
                        <p>Cordialement,<br/><strong>L'équipe MLKA</strong></p>
                    `,
                };

                transporter.sendMail(message, (error, info) => {
                    if (error) {
                        return reject(error);
                    }
                    resolve(info);
                    transporter.close();
                });
            } catch (error) {
                reject(error);
            }
        });
    }


}
