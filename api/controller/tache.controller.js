(function(){

    "use strict";
    var Tache = require('../models/taches.model').TacheModel;
    var Timesheet = require('../models/timesheetTask.model').TimesheetTaskModel;
    var SubTask = require('../models/sousTache.model').SousTacheModel;
    var notificationService = require('../services/notification.service');
    var User = require("../models/users.model").UserModel;
    var Projet = require("../models/projets.model").ProjetModel;
    var MailService = require('../services/mail.service');
    var HistoriqueService = require('../services/historique.service');
    var uploadService = require('../services/upload.service');
    var translationService = require('../services/deeplTranslation.service');
    var axios = require('axios');
    var fs = require('fs/promises');
    const mongoose = require('mongoose');
    var Historique = require('../models/historiqueTache.model').HistoriqueTacheModel;
    var markerCounterService = require('../services/marker-counter.service');

    const OPENAI_API_BASE_URL = process.env.OPENAI_API_BASE_URL || 'https://api.openai.com/v1';
    const OPENAI_TRANSCRIPTION_MODEL = process.env.OPENAI_TRANSCRIPTION_MODEL || 'gpt-4o-transcribe';
    const OPENAI_TASK_EXTRACTION_MODEL = process.env.OPENAI_TASK_EXTRACTION_MODEL || 'gpt-5.4-mini';


    function extractFilePath(fullUrl) {
        if (!fullUrl) return null;

        // Vérifier si c'est une URL Firebase Storage
        if (fullUrl.includes('taches/')) {
            // Trouver le début de "pvreception/"
            const startIndex = fullUrl.indexOf('taches/');

            // Trouver la fin (soit '?', soit fin de string)
            const endIndex = fullUrl.indexOf('?', startIndex);

            if (startIndex !== -1) {
            if (endIndex !== -1) {
                // Extraire de "pvreception/" jusqu'à "?"
                return fullUrl.substring(startIndex, endIndex);
            } else {
                // Pas de paramètres, prendre jusqu'à la fin
                return fullUrl.substring(startIndex);
            }
            }
        }

        // Si ce n'est pas une URL Firebase, retourner telle quelle
        // (pour les data URLs ou autres formats)
        return fullUrl;
    };

    function extractFileName(fullUrl) {
        if (!fullUrl) return null;

        // Vérifier si c'est une URL Firebase Storage
        if (fullUrl.includes('taches/')) {
            // Trouver le début de "pvreception/"
            const startIndex = fullUrl.indexOf('taches');
            
            // Trouver la fin (soit '?', soit fin de string)
            const endIndex = fullUrl.indexOf('?', startIndex);
            
            if (startIndex !== -1) {
            let path = '';
            
            if (endIndex !== -1) {
                // Extraire de "pvreception/" jusqu'à "?"
                path = fullUrl.substring(startIndex, endIndex);
            } else {
                // Pas de paramètres, prendre jusqu'à la fin
                path = fullUrl.substring(startIndex);
            }
            
            // Maintenant extraire seulement le nom du fichier
            // "pvreception/calendar-dashboard-app-design.png" → "calendar-dashboard-app-design.png"
            const parts = path.split('/');
            if (parts.length > 1) {
                return parts[parts.length - 1]; // Dernière partie = nom du fichier
            }
            return path;
            }
        }

        // Si ce n'est pas une URL Firebase, retourner l'URL complète
        return fullUrl;
    };

    function toOptionalNumber(value) {
        if (value === undefined || value === null || value === '') return undefined;

        const number = Number(value);
        return Number.isNaN(number) ? undefined : number;
    }

    function normalizeMarker(body) {
        let marker = body.marker;

        if (typeof marker === 'string') {
            try {
                marker = JSON.parse(marker);
            } catch {
                marker = {};
            }
        }

        if (!marker || typeof marker !== 'object' || Array.isArray(marker)) {
            marker = {};
        }

        const normalizedMarker = {
            page: toOptionalNumber(marker.page ?? body.markerPage ?? body.page ?? body['marker[page]']),
            xPercent: toOptionalNumber(marker.xPercent ?? body.markerXPercent ?? body.xPercent ?? body['marker[xPercent]']),
            yPercent: toOptionalNumber(marker.yPercent ?? body.markerYPercent ?? body.yPercent ?? body['marker[yPercent]'])
        };

        const hasMarker = Object.values(normalizedMarker).some(value => value !== undefined);
        return hasMarker ? normalizedMarker : null;
    }

    function isTruthy(value) {
        return value === true || value === 'true' || value === '1' || value === 1;
    }

    function cleanString(value) {
        if (value === undefined || value === null) return '';
        return String(value).trim();
    }

    function toNullableString(value) {
        const text = cleanString(value);
        return text ? text : null;
    }

    function normalizeSearchText(value) {
        return cleanString(value)
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .replace(/[^a-z0-9@.]+/g, ' ')
            .trim();
    }

    function compactUserName(user) {
        return [user?.prenom, user?.nom].filter(Boolean).join(' ').trim();
    }

    function getOpenAiHeaders() {
        if (!process.env.OPENAI_API_KEY) {
            throw new Error('OPENAI_API_KEY manquante dans les variables d’environnement');
        }

        return {
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
        };
    }

    function getOpenAiErrorMessage(error) {
        return error?.response?.data?.error?.message ||
            error?.response?.data?.message ||
            error.message;
    }

    function getOpenAiOutputText(responseData) {
        if (typeof responseData?.output_text === 'string') {
            return responseData.output_text;
        }

        if (!Array.isArray(responseData?.output)) return '';

        for (const outputItem of responseData.output) {
            if (!Array.isArray(outputItem.content)) continue;

            for (const contentItem of outputItem.content) {
                if (typeof contentItem.text === 'string') return contentItem.text;
                if (typeof contentItem.refusal === 'string') return contentItem.refusal;
            }
        }

        return '';
    }

    function normalizeDateForTask(value) {
        const text = cleanString(value);
        if (!text) return undefined;

        const date = new Date(text);
        if (Number.isNaN(date.getTime())) return undefined;

        return text.length === 10 ? text : date.toISOString();
    }

    function buildAvailableUserContext(users) {
        return users.map((user) => ({
            id: user._id.toString(),
            nom: user.nom || '',
            prenom: user.prenom || '',
            email: user.email || ''
        }));
    }

    async function getAssignableUsers() {
        return User.find({
            role: { $in: ['agent', 'admin'] },
            desactive: { $ne: true },
            valid: { $ne: false }
        })
        .select('_id nom prenom email role')
        .lean();
    }

    function findBestUserMatch(assigne, users) {
        const label = cleanString(assigne?.label || assigne?.texte || assigne);
        const email = normalizeSearchText(assigne?.email || '');
        const rawId = cleanString(assigne?.id || assigne?._id || '');

        if (rawId && mongoose.Types.ObjectId.isValid(rawId)) {
            const directUser = users.find((user) => String(user._id) === rawId);
            if (directUser) {
                return { user: directUser, score: 100, ambiguous: false };
            }
        }

        if (email) {
            const directEmailUser = users.find((user) =>
                normalizeSearchText(user.email) === email
            );
            if (directEmailUser) {
                return { user: directEmailUser, score: 100, ambiguous: false };
            }
        }

        const normalizedLabel = normalizeSearchText(label);
        if (!normalizedLabel) {
            return { user: null, score: 0, ambiguous: false };
        }

        const labelTokens = normalizedLabel.split(' ').filter(Boolean);
        const scoredUsers = users.map((user) => {
            const prenom = normalizeSearchText(user.prenom);
            const nom = normalizeSearchText(user.nom);
            const emailText = normalizeSearchText(user.email);
            const fullName = normalizeSearchText(compactUserName(user));
            const reversedName = normalizeSearchText([user.nom, user.prenom].filter(Boolean).join(' '));
            const fullTokens = fullName.split(' ').filter(Boolean);
            let score = 0;

            if (normalizedLabel === emailText) score = 100;
            else if (normalizedLabel === fullName || normalizedLabel === reversedName) score = 95;
            else if (labelTokens.length >= 2 && labelTokens.every((token) => fullTokens.includes(token))) score = 82;
            else if (fullTokens.length >= 2 && fullTokens.every((token) => labelTokens.includes(token))) score = 78;
            else if (labelTokens.length === 1 && (labelTokens[0] === prenom || labelTokens[0] === nom)) score = 65;
            else if (labelTokens.length === 1 && fullTokens.some((token) => token.startsWith(labelTokens[0]))) score = 55;

            return { user, score };
        })
        .sort((a, b) => b.score - a.score);

        const best = scoredUsers[0];
        const second = scoredUsers[1];

        if (!best || best.score < 60) {
            return { user: null, score: best?.score || 0, ambiguous: false };
        }

        return {
            user: best.user,
            score: best.score,
            ambiguous: !!second && second.score === best.score && best.score < 100
        };
    }

    function resolveAssignes(extractedAssignes, users) {
        const assignesInput = Array.isArray(extractedAssignes) ? extractedAssignes : [];
        const resolvedAssignes = [];
        const unresolvedAssignes = [];
        const assignes = [];
        const usedIds = new Set();

        for (const assigne of assignesInput) {
            const label = cleanString(assigne?.label || assigne?.texte || assigne);
            const match = findBestUserMatch(assigne, users);

            if (match.user && !match.ambiguous) {
                const id = match.user._id.toString();
                if (!usedIds.has(id)) {
                    usedIds.add(id);
                    assignes.push(id);
                    resolvedAssignes.push({
                        input: label,
                        id,
                        nom: match.user.nom || '',
                        prenom: match.user.prenom || '',
                        email: match.user.email || '',
                        score: match.score
                    });
                }
            } else if (label) {
                unresolvedAssignes.push({
                    input: label,
                    reason: match.ambiguous ? 'ambiguous' : 'not_found'
                });
            }
        }

        return { assignes, resolvedAssignes, unresolvedAssignes };
    }

    async function transcribeAudioFile(file) {
        const buffer = await fs.readFile(file.path);
        const formData = new FormData();

        formData.append(
            'file',
            new Blob([buffer], { type: file.mimetype || 'application/octet-stream' }),
            file.originalname || file.filename || 'audio.webm'
        );
        formData.append('model', OPENAI_TRANSCRIPTION_MODEL);
        formData.append('response_format', 'text');
        formData.append(
            'prompt',
            'Audio en français pour créer une tâche projet. Conserver les noms propres, les dates, le titre et la description.'
        );

        const response = await axios.post(
            `${OPENAI_API_BASE_URL}/audio/transcriptions`,
            formData,
            {
                headers: getOpenAiHeaders(),
                timeout: 120000,
                maxBodyLength: Infinity
            }
        );

        if (typeof response.data === 'string') return response.data.trim();
        return cleanString(response.data?.text);
    }

    async function extractTaskFields(transcript, users) {
        const today = new Date().toISOString().slice(0, 10);
        const response = await axios.post(
            `${OPENAI_API_BASE_URL}/responses`,
            {
                model: OPENAI_TASK_EXTRACTION_MODEL,
                input: [
                    {
                        role: 'system',
                        content: [
                            'Tu extrais les informations pour créer une tâche projet.',
                            'Réponds uniquement avec un JSON conforme au schéma.',
                            'N’invente pas les champs absents.',
                            'Si une seule date est donnée, utilise-la pour date_debut et date_fin.',
                            'Normalise les dates au format ISO: YYYY-MM-DD si aucune heure n’est donnée.'
                        ].join(' ')
                    },
                    {
                        role: 'user',
                        content: JSON.stringify({
                            date_actuelle: today,
                            timezone: 'Africa/Dakar',
                            utilisateurs_assignables: buildAvailableUserContext(users),
                            transcript
                        })
                    }
                ],
                text: {
                    format: {
                        type: 'json_schema',
                        name: 'tache_audio_extraction',
                        strict: true,
                        schema: {
                            type: 'object',
                            additionalProperties: false,
                            required: [
                                'titre',
                                'assignes',
                                'date_debut',
                                'date_fin',
                                'description',
                                'missing_fields',
                                'confidence'
                            ],
                            properties: {
                                titre: { type: ['string', 'null'] },
                                assignes: {
                                    type: 'array',
                                    items: {
                                        type: 'object',
                                        additionalProperties: false,
                                        required: ['label', 'email'],
                                        properties: {
                                            label: { type: 'string' },
                                            email: { type: ['string', 'null'] }
                                        }
                                    }
                                },
                                date_debut: { type: ['string', 'null'] },
                                date_fin: { type: ['string', 'null'] },
                                description: { type: ['string', 'null'] },
                                missing_fields: {
                                    type: 'array',
                                    items: {
                                        type: 'string',
                                        enum: ['titre', 'assignes', 'date_debut', 'date_fin', 'description']
                                    }
                                },
                                confidence: {
                                    type: 'number',
                                    minimum: 0,
                                    maximum: 1
                                }
                            }
                        }
                    }
                }
            },
            {
                headers: Object.assign(
                    { 'Content-Type': 'application/json' },
                    getOpenAiHeaders()
                ),
                timeout: 120000
            }
        );

        const outputText = getOpenAiOutputText(response.data);
        if (!outputText) {
            throw new Error('Réponse OpenAI vide lors de l’extraction');
        }

        return JSON.parse(outputText);
    }

    function buildTaskDraft(extracted, assignes) {
        return {
            titre: toNullableString(extracted.titre),
            assignes,
            date_debut: normalizeDateForTask(extracted.date_debut),
            date_fin: normalizeDateForTask(extracted.date_fin),
            description: toNullableString(extracted.description)
        };
    }

    function computeMissingFields(extracted, draft) {
        const missingFields = new Set(
            Array.isArray(extracted.missing_fields) ? extracted.missing_fields : []
        );

        if (!draft.titre) missingFields.add('titre');
        if (!draft.date_debut) missingFields.add('date_debut');
        if (!draft.date_fin) missingFields.add('date_fin');
        if (!draft.description) missingFields.add('description');

        return Array.from(missingFields);
    }

    async function createTaskFromVoice(req, draft) {
        const tache = new Tache({
            titre: draft.titre,
            assignes: draft.assignes,
            date_debut: draft.date_debut,
            date_fin: draft.date_fin,
            description: draft.description,
            projet: req.params.id,
            user: req.decoded.id
        });

        Object.assign(
            tache,
            await translationService.buildTacheTitleTranslationFields(draft.titre || '')
        );

        if (draft.description) {
            Object.assign(
                tache,
                await translationService.buildTacheDescriptionTranslationFields(draft.description)
            );
        }

        const savedTache = await tache.save();
        MailService.mailTache(savedTache._id);

        const projet = await Projet.findOne({ _id: savedTache.projet });
        if (Array.isArray(savedTache.assignes) && savedTache.assignes.length) {
            const users = await Promise.all(savedTache.assignes.map(id => User.findOne({ _id: id })));
            for (const user of users.filter(Boolean)) {
                notificationService.sendNotification({
                    user,
                    templateKey: 'TASK_ASSIGNED',
                    context: {
                        taskTitleSource: translationService.toTitleSource(savedTache),
                        projectName: projet?.projet || '',
                    },
                    data: {
                        type: 'tache',
                        userId: user._id.toString(),
                        resource: 'projet',
                        resourceId: (projet?._id || savedTache.projet).toString(),
                        tacheId: savedTache._id.toString(),
                    },
                });
            }
        }

        return savedTache;
    }





    module.exports = function(acl){
        return {

            createTacheFromVoice(req, res) {
                acl.isAllowed(req.decoded.id, 'projets', 'create', async (err, aclres) => {
                    if (err) return res.status(500).json({ success: false, message: 'ACL error', error: err.message });
                    if (!aclres) return res.status(401).json({ success: false, message: "401" });

                    try {
                        let transcript = cleanString(req.body.transcript);

                        if (!transcript && req.file) {
                            transcript = await transcribeAudioFile(req.file);
                        }

                        if (!transcript) {
                            return res.status(400).json({
                                success: false,
                                message: "Envoyez un fichier audio dans le champ 'audio' ou un transcript"
                            });
                        }

                        const assignableUsers = await getAssignableUsers();
                        const extracted = await extractTaskFields(transcript, assignableUsers);
                        const resolved = resolveAssignes(extracted.assignes, assignableUsers);
                        const draft = buildTaskDraft(extracted, resolved.assignes);
                        const missingFields = computeMissingFields(extracted, draft);
                        const shouldCreate = isTruthy(req.body.create || req.body.confirmCreation);

                        if (shouldCreate) {
                            if (missingFields.length || resolved.unresolvedAssignes.length) {
                                return res.status(422).json({
                                    success: false,
                                    message: "La tâche nécessite une confirmation ou une correction avant création",
                                    transcript,
                                    data: draft,
                                    extracted,
                                    resolvedAssignes: resolved.resolvedAssignes,
                                    unresolvedAssignes: resolved.unresolvedAssignes,
                                    missingFields
                                });
                            }

                            const savedTache = await createTaskFromVoice(req, draft);
                            const requestedLanguage = await translationService.getRequestedLanguage(req);

                            return res.json({
                                success: true,
                                created: true,
                                transcript,
                                data: translationService.withDisplayTache(
                                    savedTache,
                                    requestedLanguage
                                ),
                                extracted,
                                resolvedAssignes: resolved.resolvedAssignes,
                                unresolvedAssignes: resolved.unresolvedAssignes,
                                missingFields
                            });
                        }

                        return res.json({
                            success: true,
                            created: false,
                            transcript,
                            data: draft,
                            extracted,
                            resolvedAssignes: resolved.resolvedAssignes,
                            unresolvedAssignes: resolved.unresolvedAssignes,
                            missingFields
                        });
                    } catch (error) {
                        return res.status(500).json({
                            success: false,
                            message: "Erreur createTacheFromVoice",
                            error: getOpenAiErrorMessage(error)
                        });
                    } finally {
                        if (req.file?.path) {
                            await fs.unlink(req.file.path).catch(() => {});
                        }
                    }
                });
            },

            addTache(req, res, next) {
                acl.isAllowed(req.decoded.id, 'projets', 'create', async (err, aclres) => {
                    if (err) return res.status(500).json({ success: false, message: 'ACL error', error: err.message });
                    if (!aclres) return res.status(401).json({ success: false, message: "401" });

                try {
                    const body = Object.assign({}, req.body);
                    delete body.marker;
                    delete body.pdfId;   
                    const tache = new Tache(req.body);
                    const titleFields =
                        await translationService.buildTacheTitleTranslationFields(req.body.titre || '');
                    Object.assign(tache, titleFields);

                    if (req.body.description !== undefined && req.body.description !== '') {
                        Object.assign(
                            tache,
                            await translationService.buildTacheDescriptionTranslationFields(
                                req.body.description
                            )
                        );
                    }

                    // ✅ Normaliser assignes => toujours tableau
                    let assignes = req.body.assignes;
                    if (!assignes) {
                        assignes = [];
                    } else if (typeof assignes === 'string') {
                        // cas fréquent: assignes envoyé en JSON string
                        try { assignes = JSON.parse(assignes); } catch { assignes = [assignes]; }
                    } else if (!Array.isArray(assignes)) {
                        assignes = [assignes];
                    }
                    tache.assignes = assignes;

                    tache.projet = req.params.id;
                    tache.user = req.decoded.id;

                    const plan = req.body.plan || req.body.pdfId;
                    const marker = normalizeMarker(req.body);

                    if (plan) {
                        tache.plan = plan;
                    }

                    if (marker) {
                        if (!plan) {
                            return res.status(400).json({
                                success: false,
                                message: "Le plan est requis pour créer un marker"
                            });
                        }

                        if (marker.page === undefined || marker.xPercent === undefined || marker.yPercent === undefined) {
                            return res.status(400).json({
                                success: false,
                                message: "Les champs marker.page, marker.xPercent et marker.yPercent sont requis"
                            });
                        }

                        const { markerNumber, markerCode } = await markerCounterService.getNextMarkerNumber(plan);
                        tache.marker = {
                            page: marker.page,
                            xPercent: marker.xPercent,
                            yPercent: marker.yPercent,
                            markerNumber,
                            markerCode
                        };
                    }

                    // ✅ Uploader toutes les images, puis save 1 seule fois
                    const files = Array.isArray(req.files) ? req.files : [];
                    const imageWidths  = req.body.imageWidths;
                    const imageHeights = req.body.imageHeights;

                    const uploadedImages = await Promise.all(
                        files.map(async (imageFile, index) => {
                        const imageUrl = await uploadService.uploadTachesToFirebaseStorage(imageFile.filename);
                        return {
                            url: imageUrl,
                            width: imageWidths ? (imageWidths[index] ?? null) : null,
                            height: imageHeights ? (imageHeights[index] ?? null) : null,
                            filename: imageFile.originalname || `image_${Date.now()}_${index}`,
                            uploadedAt: new Date()
                        };
                        })
                    );

                    tache.image = uploadedImages; // ✅ tableau

                    const savedTache = await tache.save();

                    // Mail une seule fois
                    MailService.mailTache(savedTache._id);

                    // Notifications (sécurisé)
                    const projet = await Projet.findOne({ _id: savedTache.projet });
                    if (Array.isArray(savedTache.assignes) && savedTache.assignes.length) {
                        const users = await Promise.all(savedTache.assignes.map(id => User.findOne({ _id: id })));
                        for (const user of users.filter(Boolean)) {
                        notificationService.sendNotification({
                            user,
                            templateKey: 'TASK_ASSIGNED',
                            context: {
                                taskTitleSource: translationService.toTitleSource(savedTache),
                                projectName: projet?.projet || '',
                            },
                            data: {
                                type: 'tache',
                                userId: user._id.toString(),
                                resource: 'projet',
                                resourceId: (projet?._id || savedTache.projet).toString(),
                                tacheId: savedTache._id.toString(),
                            },
                        });
                        }
                    }

                    const requestedLanguage =
                        await translationService.getRequestedLanguage(req);
                    return res.json({
                        success: true,
                        data: translationService.withDisplayTache(
                            savedTache,
                            requestedLanguage
                        )
                    });
                    } catch (e) {
                    return res.status(500).json({ success: false, message: "Erreur addTache", error: e.message });
                    }
                });
            },

            updateTache(req, res) {
                acl.isAllowed(req.decoded.id, 'agenda', 'create', async (err, aclres) => {
                    if (err) {
                    return res.status(500).json({ success: false, message: 'ACL error', error: err.message });
                    }
                    if (!aclres) {
                    return res.status(401).json({ success: false, message: "401" });
                    }

                    try {
                    const taskId = req.params.id;
                    const task = await Tache.findOne({ _id: taskId });
                    if (!task) return res.status(404).json({ success: false, message: 'Tache introuvable' });

                    // -----------------------------
                    // 1) Normaliser assignes (FormData => JSON string)
                    // -----------------------------
                    let assignes = undefined;
                    if (req.body.assignes !== undefined) {
                        let parsed = [];
                        try { parsed = JSON.parse(req.body.assignes); } catch { parsed = []; }
                        if (!Array.isArray(parsed)) parsed = [];
                        parsed = parsed
                        .map(String).map(s => s.trim())
                        .filter(Boolean)
                        .filter(mongoose.Types.ObjectId.isValid);

                        assignes = parsed; // on set seulement si fourni
                    }

                    // -----------------------------
                    // 2) Champs simples à $set
                    // -----------------------------
                    const setData = {
                        statut: req.body.statut,
                        date_debut: req.body.date_debut,
                        date_fin: req.body.date_fin,
                        temps: req.body.temps,
                    };
                    Object.keys(setData).forEach(k => setData[k] === undefined && delete setData[k]);

                    if (req.body.titre !== undefined) {
                        Object.assign(
                            setData,
                            await translationService.buildTacheTitleTranslationFields(req.body.titre || '')
                        );
                    }

                    if (req.body.description !== undefined) {
                        Object.assign(
                            setData,
                            await translationService.buildTacheDescriptionTranslationFields(
                                req.body.description || ''
                            )
                        );
                    }

                    if (assignes !== undefined) {
                        setData.assignes = assignes;
                    }

                    // -----------------------------
                    // 3) Upload nouvelles images -> newImages[]
                    // -----------------------------
                    const files = req.files?.image ? req.files.image : []; // multer fields: { image: [] }
                    console.log("Images", files);
                    let newImages = [];

                    if (Array.isArray(files) && files.length) {
                        const uploaded = await Promise.all(
                        files.map(async (imageFile, index) => {
                            const imageUrl = await uploadService.uploadTachesToFirebaseStorage(imageFile.filename);
                            return {
                            url: imageUrl,
                            width: req.body.imageWidths ? (req.body.imageWidths[index] ?? null) : null,
                            height: req.body.imageHeights ? (req.body.imageHeights[index] ?? null) : null,
                            filename: imageFile.originalname || `image_${Date.now()}_${index}`,
                            uploadedAt: new Date()
                            };
                        })
                        );
                        newImages = uploaded.filter(Boolean);
                    }

                    // -----------------------------
                    // 4) Suppressions d'images demandées
                    //   - recommandé: supprimer par url/filename (stable)
                    //   - imagesToDelete peut contenir url, filename ou index
                    // -----------------------------
                    //let pullCondition = null;
                    let removedUrls = [];
                    const updateDoc = { $set: setData };

                    // if (pullCondition) {
                    //     updateDoc.$pull = { image: pullCondition };
                    // }

                    // Ajouter les nouvelles images SI elles existent
                    if (newImages.length > 0) {
                        updateDoc.$push = { image: { $each: newImages } };
                    }

                    if (req.body.removedUrls) {
                        try { removedUrls = JSON.parse(req.body.removedUrls); }
                        catch { removedUrls = []; }
                    }
                    if (!Array.isArray(removedUrls)) removedUrls = [];
                    // ✅ normaliser : url firebase -> path, path -> path
                    const removedPaths = removedUrls.map(u => extractFilePath(u)).filter(Boolean);
                    if (removedPaths.length) {
                      updateDoc.$pull = { image: { url: { $in: removedPaths } } };
                    }
                
                    const updatedTache = await Tache.findOneAndUpdate(
                        { _id: taskId },
                        updateDoc,
                        { new: true }
                    );
                    if (removedUrls.length) {
                        for (const url of removedUrls) {
                            try {
                            await uploadService.deleteTachesFirebaseStorage(extractFileName(url));
                            } catch (err) {
                            console.error('Erreur suppression Firebase:', url, err.message);
                            }
                        }
                    }

                    // -----------------------------
                    // 6) Mail + notifications si statut changé
                    // (alignés : même déclencheur, assignés + créateur)
                    // -----------------------------
                    const statusChanged = task.statut !== updatedTache?.statut;

                    if (statusChanged) {
                        MailService.mailUpdateTache(updatedTache._id, req.decoded.id);
                        HistoriqueService.create(updatedTache._id, req.decoded.id);

                        const projet = await Projet.findOne({ _id: updatedTache.projet });
                        const userUpdate = await User.findOne({ _id: req.decoded.id });
                        const modifierName = [userUpdate?.nom, userUpdate?.prenom]
                            .filter(Boolean)
                            .join(' ')
                            .trim();

                        const recipientIds = new Set();
                        (updatedTache.assignes || []).forEach((assigneId) => {
                            if (assigneId) recipientIds.add(String(assigneId));
                        });
                        if (updatedTache.user) {
                            recipientIds.add(String(updatedTache.user));
                        }

                        const recipients = await Promise.all(
                            [...recipientIds].map((id) => User.findOne({ _id: id }))
                        );

                        for (const recipient of recipients.filter(Boolean)) {
                            if (String(recipient._id) === String(req.decoded.id)) {
                                continue;
                            }

                            notificationService.sendNotification({
                                user: recipient,
                                templateKey: 'TASK_STATUS_UPDATED',
                                context: {
                                    taskTitleSource: translationService.toTitleSource(updatedTache),
                                    projectName: projet?.projet || '',
                                    modifierName,
                                    taskStatus: updatedTache.statut || '',
                                },
                                data: {
                                    type: 'tache',
                                    userId: recipient._id.toString(),
                                    resource: 'projet',
                                    resourceId:
                                        projet?._id?.toString() || String(updatedTache.projet),
                                    tacheId: updatedTache._id.toString(),
                                },
                            });
                        }
                    }

                    const requestedLanguage =
                        await translationService.getRequestedLanguage(req);
                    return res.json({
                        success: true,
                        message: translationService.withDisplayTache(
                            updatedTache,
                            requestedLanguage
                        )
                    });

                    } catch (error) {
                    return res.status(500).json({ success: false, message: error.message });
                    }
                });
            },

            updateTacheImages(req, res) {
                acl.isAllowed(req.decoded.id, 'agenda', 'create', async (err, ok) => {
                    if (err) return res.status(500).json({ success: false, message: err.message });
                    if (!ok) return res.status(401).json({ success: false, message: "401" });

                    try {
                    const taskId = req.params.id;
                    const task = await Tache.findById(taskId);
                    if (!task) return res.status(404).json({ success: false, message: 'Tache introuvable' });

                    const files = req.files?.image || [];
                    if (!files.length) {
                        return res.status(400).json({ success: false, message: "Aucune image envoyée" });
                    }

                    const newImages = await Promise.all(files.map(async (f, i) => {
                        const storagePath = await uploadService.uploadTachesToFirebaseStorage(f.filename); // doit retourner "taches/xxx.png"
                        return {
                        url: storagePath,
                        filename: f.originalname || `image_${Date.now()}_${i}`,
                        width: null,
                        height: null,
                        uploadedAt: new Date()
                        };
                    }));

                    const updated = await Tache.findByIdAndUpdate(
                        taskId,
                        { $push: { image: { $each: newImages } } },
                        { new: true }
                    );

                    return res.json({ success: true, message: updated });
                    } catch (e) {
                    return res.status(500).json({ success: false, message: e.message });
                    }
                });
            },

            deleteTacheImages(req, res) {
                acl.isAllowed(req.decoded.id, 'agenda', 'create', async (err, ok) => {
                    if (err) return res.status(500).json({ success: false, message: err.message });
                    if (!ok) return res.status(401).json({ success: false, message: "401" });

                    try {
                    const taskId = req.params.id;
                    const paths = Array.isArray(req.body.paths) ? req.body.paths : [];
                    const removedPaths = paths.map(p => extractFilePath(p)).filter(Boolean);

                    if (!removedPaths.length) {
                        return res.status(400).json({ success: false, message: "paths requis" });
                    }

                    const updated = await Tache.findByIdAndUpdate(
                        taskId,
                        { $pull: { image: { url: { $in: removedPaths } } } },
                        { new: true }
                    );

                    // delete firebase AFTER mongo success
                    for (const p of removedPaths) {
                        try { await uploadService.deleteTachesFirebaseStorage(p); } catch (e) {}
                    }

                    return res.json({ success: true, message: updated });
                    } catch (e) {
                    return res.status(500).json({ success: false, message: e.message });
                    }
                });
            },

            deleteTache(req, res) {
                acl.isAllowed(req.decoded.id, 'agenda', 'delete', async function (err, aclres) {
                    if (aclres) {
                        try {
                            let tache = await Tache.findOne({ _id: req.params.id });
                            
                            if (!tache) {
                                return res.status(404).json({
                                    success: false,
                                    message: "Tâche non trouvée"
                                });
                            }

                            // Supprimer toutes les images associées
                            if (tache.image && tache.image.length > 0) {
                                try {
                                    // Créer un tableau de promesses pour supprimer toutes les images
                                    const deletePromises = tache.image.map(async (image, index) => {
                                        if (image && image.url) {
                                            try {
                                                await uploadService.deleteTachesFirebaseStorage(extractFileName(image.url));
                                                console.log(`✅ Image ${index} supprimée: ${image.url}`);
                                            } catch (err) {
                                                console.error(`❌ Erreur lors de la suppression de l'image ${index}:`, err);
                                                // On continue même si une image échoue
                                            }
                                        }
                                    });

                                    // Attendre que toutes les suppressions soient terminées
                                    await Promise.allSettled(deletePromises);
                                    console.log(`✅ ${tache.images.length} image(s) supprimée(s) du stockage`);
                                    
                                } catch (err) {
                                    console.error('❌ Erreur lors de la suppression des images:', err);
                                    // On continue quand même avec la suppression de la tâche
                                }
                            }
                            
                            // Compatibilité ascendante : vérifier l'ancien format image
                            else if (tache.image && tache.image.url) {
                                try {
                                    await uploadService.deleteTachesFirebaseStorage(tache.image.url);
                                    console.log('✅ Ancienne image supprimée:', tache.image.url);
                                } catch (err) {
                                    console.error('❌ Erreur lors de la suppression de l\'ancienne image:', err);
                                }
                            }

                            // Supprimer la tâche de la base de données
                            tache.deleteOne().then((deletedTache) => {
                                res.json({
                                    success: true,
                                    message: {
                                        task: deletedTache,
                                        imagesDeleted: tache.images ? tache.images.length : 0
                                    }
                                });
                            }).catch((error) => {
                                return res.status(500).json({
                                    success: false,
                                    message: error.message
                                });
                            });

                        } catch (error) {
                            console.error('❌ Erreur dans deleteTache:', error);
                            return res.status(500).json({
                                success: false,
                                message: "Erreur interne du serveur",
                                error: error.message
                            });
                        }
                    } else {
                        return res.status(401).json({
                            success: false,
                            message: "401"
                        });
                    }
                });
            },

            getTache(req,res){
                acl.isAllowed(req.decoded.id,'agenda', 'retreive', async function(err,aclres){

                    if(aclres){
                        Tache.findOne({_id:req.params.id}).populate('assignes').populate('projet').populate('user').then(async (tache)=>{
                            const requestedLanguage =
                                await translationService.getRequestedLanguage(req);
                            res.json({
                                success: true,
                                message: translationService.withDisplayTache(
                                    tache,
                                    requestedLanguage
                                )
                            });
                        }).catch((error)=>{
                            return res.status(500).json({
                                success:false,
                                message:error.message
                            })
                        })

                    }else{
                        return res.status(401).json({
                            success: false,
                            message: "401"
                        });
                    }
                })
            },

            getAllTacheByProjet(req,res){
                acl.isAllowed(req.decoded.id,'agenda', 'retreive', async function(err,aclres){

                    if(aclres){
                        Tache.find({projet:req.params.id}).sort({date_creation: -1}).populate('assignes').then(async (tache)=>{
                            const requestedLanguage =
                                await translationService.getRequestedLanguage(req);
                            res.json({
                                success: true,
                                message: tache.map((item) =>
                                    translationService.withDisplayTache(
                                        item,
                                        requestedLanguage
                                    )
                                )
                            });
                        }).catch((error)=>{
                            return res.status(500).json({
                                success:false,
                                message:error.message
                            })
                        })

                    }else{
                        return res.status(401).json({
                            success: false,
                            message: "401"
                        });
                    }
                })
            },

            // Time sheet

            addTime(req, res, next) {
                acl.isAllowed(req.decoded.id, 'projets', 'create', async function (err, aclres) {
                    if (err) {
                    return res.status(500).json({ success: false, message: "Erreur ACL : " + err.message });
                    }

                    if (!aclres) {
                    return res.status(401).json({
                        success: false,
                        message: "Non autorisé"
                    });
                    }

                    try {
                    let times = req.body; // Peut être un objet ou un tableau
                    const tacheId = req.params.id;
                    // ✅ Normaliser employee => toujours tableau
                    let employeesRaw = req.body.employee;   // <-- let (pas const)
                    let employees = [];

                    if (employeesRaw === undefined || employeesRaw === null || employeesRaw === '') {
                        employees = [];
                    } else if (typeof employeesRaw === 'string') {
                        // souvent JSON string
                        try {
                        employees = JSON.parse(employeesRaw);
                        } catch {
                        employees = [employeesRaw];
                        }
                    } else if (Array.isArray(employeesRaw)) {
                        employees = employeesRaw;
                    } else {
                        employees = [employeesRaw];
                    }

                    // nettoyer + valider ids
                    employees = employees
                        .map(String)
                        .map(s => s.trim())
                        .filter(Boolean)
                        .filter(mongoose.Types.ObjectId.isValid);

                    //console.log("employees normalized", employees);

                    // Toujours forcer un tableau
                    if (!Array.isArray(times)) {
                        times = [times];
                    }

                    // ✅ Uploader toutes les images, puis save 1 seule fois
                    const files = Array.isArray(req.files?.image) ? req.files?.image : [];
                    const imageWidths  = req.body.imageWidths;
                    const imageHeights = req.body.imageHeights;

                    const uploadedImages = await Promise.all(
                        files.map(async (imageFile, index) => {
                        const imageUrl = await uploadService.uploadTachesToFirebaseStorage(imageFile.filename);
                        return {
                            url: imageUrl,
                            width: imageWidths ? (imageWidths[index] ?? null) : null,
                            height: imageHeights ? (imageHeights[index] ?? null) : null,
                            filename: imageFile.originalname || `image_${Date.now()}_${index}`,
                            uploadedAt: new Date()
                        };
                        })
                    );

                    const savedTimesheets = [];

                    for (const timeData of times) {
                        const descriptionFields =
                            await translationService.buildSousTacheDescriptionTranslationFields(
                                timeData.description || ''
                            );
                        const time = new Timesheet({
                            ...timeData,
                            ...descriptionFields,
                            tache: tacheId,
                            employee:employees,
                            user: req.decoded.id,
                            ...(uploadedImages ? {image: uploadedImages}:{}),
                        });
                        
                        const savedDoc = await time.save();
                        savedTimesheets.push(savedDoc);
                        
                        // Envoyer l'email immédiatement
                         MailService.mailSousTache(savedDoc._id)
                            .catch(emailError => {
                                console.error('Erreur email:', emailError);
                            });
                    }

                    const requestedLanguage =
                        await translationService.getRequestedLanguage(req);
                    return res.json({
                        success: true,
                        message: savedTimesheets.map((item) =>
                            translationService.withDisplayDescription(
                                item,
                                requestedLanguage
                            )
                        )
                    });

                    } catch (error) {
                    return res.status(500).json({
                        success: false,
                        message: error.message
                    });
                    }
                });
            },

            async updateTime(req, res) {
                try {

                    const taskId = req.params.id;

                    const aclres = await new Promise((resolve, reject) => {
                        acl.isAllowed(req.decoded.id, 'agenda', 'create', (err, resAcl) => {
                            if (err) reject(err);
                            resolve(resAcl);
                        });
                    });

                    if (!aclres) {
                        return res.status(401).json({
                            success: false,
                            message: "401"
                        });
                    }

                    const task = await Timesheet.findById(taskId);

                    if (!task) {
                        return res.status(404).json({
                            success: false,
                            message: "Tâche introuvable"
                        });
                    }

                    
                    let employeesRaw = req.body.employee;
                    let employees = [];

                    if (!employeesRaw) {
                    employees = [];
                    } else if (typeof employeesRaw === 'string') {
                    try {
                        employees = JSON.parse(employeesRaw);
                    } catch {
                        employees = [employeesRaw];
                    }
                    } else if (Array.isArray(employeesRaw)) {
                    employees = employeesRaw;
                    } else {
                    employees = [employeesRaw];
                    }


                    const files = req.files?.image || [];
                    let newImages = [];

                    if (files.length) {

                        const uploaded = await Promise.all(
                            files.map(async (file, index) => {

                                const path = await uploadService.uploadTachesToFirebaseStorage(file.filename);

                                return {
                                    url: path,
                                    filename: file.filename,
                                    width: req.body.imageWidths ? (req.body.imageWidths[index] ?? null) : null,
                                    height: req.body.imageHeights ? (req.body.imageHeights[index] ?? null) : null,
                                    uploadedAt: new Date()
                                };
                            })
                        );

                        newImages = uploaded.filter(Boolean);
                    }


                    // Images à supprimer
                    let removedUrls = [];

                    if (req.body.removedUrls) {
                        try {
                            removedUrls = JSON.parse(req.body.removedUrls);
                        } catch {
                            removedUrls = [];
                        }
                    }

                    if (!Array.isArray(removedUrls)) removedUrls = [];

                    const removedPaths = removedUrls .map(url => extractFilePath(url)).filter(Boolean);

                    //Suppression Firebase
                    for (const url of removedUrls) {
                        try {
                            const filename = extractFileName(url);
                            await uploadService.deleteTachesFirebaseStorage(filename);
                            console.log('[updateTime] deleted cloud file =', filename);
                        } catch (err) {
                            console.error('[updateTime] Firebase delete error:', err.message);
                        }
                    }

                    // Suppression images 
                    if (removedPaths.length) {
                        await Timesheet.updateOne(
                            { _id: taskId },
                            { $pull: { image: { url: { $in: removedPaths } } } }
                        );
                    }

                    const setData = {
                        date: req.body.date,
                        date_fin: req.body.date_fin,
                        statut: req.body.statut,
                        employee: employees
                    };
                    Object.keys(setData).forEach(k => setData[k] === undefined && delete setData[k]);

                    if (req.body.description !== undefined) {
                        Object.assign(
                            setData,
                            await translationService.buildSousTacheDescriptionTranslationFields(
                                req.body.description || ''
                            )
                        );
                    }

                    const updateQuery = {
                        $set: setData
                    };

                    if (newImages.length) {
                        updateQuery.$push = {
                            image: { $each: newImages }
                        };
                    }

                    const time = await Timesheet.findOneAndUpdate({ _id: taskId }, updateQuery,{ new: true });

                    // Historique si statut change
                    if (task.statut !== req.body.statut) {
                        await HistoriqueService.createSous(task._id, req.decoded.id);
                    }

                    const requestedLanguage =
                        await translationService.getRequestedLanguage(req);
                    return res.json({
                        success: true,
                        message: translationService.withDisplayDescription(
                            time,
                            requestedLanguage
                        )
                    });

                } catch (error) {
                    console.error('[updateTime] ERROR:', error);
                    return res.status(500).json({
                        success: false,
                        message: error.message
                    });
                }
            },
            
            deleteTime(req,res){
                acl.isAllowed(req.decoded.id,'agenda', 'delete', async function(err,aclres){

                    if(aclres){

                        let time = await Timesheet.findOne({_id:req.params.id});
                        time.deleteOne().then((time)=>{
                            res.json({
                                success: true,
                                message:time
                            });
                        }).catch((error)=>{
                            return res.status(500).json({
                                success:false,
                                message:error.message
                            })
                        })

                    }else{
                        return res.status(401).json({
                            success: false,
                            message: "401"
                        });
                    }
                })
            },

            getTime(req,res){
                acl.isAllowed(req.decoded.id,'agenda', 'retreive', async function(err,aclres){

                    if(aclres){
                        Timesheet.findOne({_id:req.params.id}).then(async (time)=>{
                            const requestedLanguage =
                                await translationService.getRequestedLanguage(req);
                            res.json({
                                success: true,
                                message: translationService.withDisplayDescription(
                                    time,
                                    requestedLanguage
                                )
                            });
                        }).catch((error)=>{
                            return res.status(500).json({
                                success:false,
                                message:error.message
                            })
                        })

                    }else{
                        return res.status(401).json({
                            success: false,
                            message: "401"
                        });
                    }
                })
            },

            getAllTimeByTask(req,res){
                acl.isAllowed(req.decoded.id,'agenda', 'retreive', async function(err,aclres){

                    if(aclres){
                        Timesheet.find({tache:req.params.id}).then(async (time)=>{
                            const requestedLanguage =
                                await translationService.getRequestedLanguage(req);
                            res.json({
                                success: true,
                                message: time.map((item) =>
                                    translationService.withDisplayDescription(
                                        item,
                                        requestedLanguage
                                    )
                                )
                            });
                        }).catch((error)=>{
                            return res.status(500).json({
                                success:false,
                                message:error.message
                            })
                        })

                    }else{
                        return res.status(401).json({
                            success: false,
                            message: "401"
                        });
                    }
                })
            },

             // SubTask

            addSubTask(req, res, next) {
                acl.isAllowed(req.decoded.id, 'projets', 'create', async function (err, aclres) {
                    if (err) {
                    return res.status(500).json({ success: false, message: "Erreur ACL : " + err.message });
                    }

                    if (!aclres) {
                    return res.status(401).json({
                        success: false,
                        message: "Non autorisé"
                    });
                    }

                    try {
                    let times = req.body; // Peut être un objet ou un tableau
                    const tacheId = req.params.id;

                    


                    // Toujours forcer un tableau
                    if (!Array.isArray(times)) {
                        times = [times];
                    }

                    // Ajouter l'ID de la tâche à chaque élément
                    const timesToInsert = await Promise.all(times.map(async (t) => ({
                        ...t,
                        ...(await translationService.buildSousTacheDescriptionTranslationFields(
                            t.description || ''
                        )),
                        tache: tacheId,
                        user: req.decoded.id
                    })));

                    const result = await SubTask.insertMany(timesToInsert);
                    const requestedLanguage =
                        await translationService.getRequestedLanguage(req);

                    return res.json({
                        success: true,
                        message: result.map((item) =>
                            translationService.withDisplayDescription(
                                item,
                                requestedLanguage
                            )
                        )
                    });

                    } catch (error) {
                    return res.status(500).json({
                        success: false,
                        message: error.message
                    });
                    }
                });
            },

            updateSubTask(req,res){
                acl.isAllowed(req.decoded.id,'agenda', 'create', async function(err,aclres){
                    if(aclres){
                        const setData = { ...req.body };
                        if (req.body.description !== undefined) {
                            Object.assign(
                                setData,
                                await translationService.buildSousTacheDescriptionTranslationFields(
                                    req.body.description || ''
                                )
                            );
                        }
                        SubTask.findOneAndUpdate({_id:req.params.id},{ $set: setData },{new:true}).then(async (time)=>{
                            const requestedLanguage =
                                await translationService.getRequestedLanguage(req);
                            res.json({
                                success:true,
                                message: translationService.withDisplayDescription(
                                    time,
                                    requestedLanguage
                                )
                            });
                        }).catch((error)=>{
                            return res.status(500).json({
                                success:false,
                                message:error.message
                            })
                        })
                    }else{
                        return res.status(401).json({
                            success: false,
                            message: "401"
                        }); 
                    }
            })
            },

             deleteSubTask(req,res){
                acl.isAllowed(req.decoded.id,'agenda', 'delete', async function(err,aclres){

                    if(aclres){

                        let time = await SubTask.findOne({_id:req.params.id});
                        time.deleteOne().then((time)=>{
                            res.json({
                                success: true,
                                message:time
                            });
                        }).catch((error)=>{
                            return res.status(500).json({
                                success:false,
                                message:error.message
                            })
                        })

                    }else{
                        return res.status(401).json({
                            success: false,
                            message: "401"
                        });
                    }
                })
            },

            getSubTask(req,res){
                acl.isAllowed(req.decoded.id,'agenda', 'retreive', async function(err,aclres){

                    if(aclres){
                        SubTask.findOne({_id:req.params.id}).then(async (time)=>{
                            const requestedLanguage =
                                await translationService.getRequestedLanguage(req);
                            res.json({
                                success: true,
                                message: translationService.withDisplayDescription(
                                    time,
                                    requestedLanguage
                                )
                            });
                        }).catch((error)=>{
                            return res.status(500).json({
                                success:false,
                                message:error.message
                            })
                        })

                    }else{
                        return res.status(401).json({
                            success: false,
                            message: "401"
                        });
                    }
                })
            },

            getAllSubTaskByTask(req,res){
                acl.isAllowed(req.decoded.id,'agenda', 'retreive', async function(err,aclres){

                    if(aclres){
                        SubTask.find({tache:req.params.id}).then(async (time)=>{
                            const requestedLanguage =
                                await translationService.getRequestedLanguage(req);
                            res.json({
                                success: true,
                                message: time.map((item) =>
                                    translationService.withDisplayDescription(
                                        item,
                                        requestedLanguage
                                    )
                                )
                            });
                        }).catch((error)=>{
                            return res.status(500).json({
                                success:false,
                                message:error.message
                            })
                        })

                    }else{
                        return res.status(401).json({
                            success: false,
                            message: "401"
                        });
                    }
                })
            },

            // historique

            getAllHistoriqueByTask(req,res){
                acl.isAllowed(req.decoded.id,'agenda', 'retreive', async function(err,aclres){

                    if(aclres){
                        Historique.find({tache:req.params.id}).sort({date_creation: -1}).then(async (time)=>{
                            const requestedLanguage =
                                await translationService.getRequestedLanguage(req);
                            res.json({
                                success: true,
                                message: time.map((item) =>
                                    translationService.withDisplayDescription(
                                        item,
                                        requestedLanguage
                                    )
                                ),
                            });
                        }).catch((error)=>{
                            return res.status(500).json({
                                success:false,
                                message:error.message
                            })
                        })

                    }else{
                        return res.status(401).json({
                            success: false,
                            message: "401"
                        });
                    }
                })
            },

            // updateTaskMarkerPosition(req,res){
            //     acl.isAllowed(req.decoded.id,'projets', 'create', async function(err,aclres){
            //         if(aclres){

            //             try{

            //                 let {taskId} = req.params.id;
            //                 var {page, xPercent, yPercent} = req.body;

            //                 let tache = await Tache.findByIdAndUpdate(
            //                     taskId,
            //                     {
            //                         $set: {
            //                         'marker.page': page,
            //                         'marker.xPercent': xPercent,
            //                         'marker.yPercent': yPercent
            //                         }
            //                     },
            //                     { new: true }
            //                     );

            //                     return res.json(tache);

            //             } catch (error) {
            //                 console.error(error);
            //                 return res.status(500).json({ message: 'Erreur lors du déplacement du marker' });
            //             }
            //         }else{
            //             return res.status(401).json({
            //                 success: false,
            //                 message: "401"
            //             }); 
            //         }
            //     })
            // },
            updateTaskMarkerPosition(req, res) {
                acl.isAllowed(req.decoded.id, 'projets', 'create', async function(err, aclres) {
                    if (err) {
                        return res.status(500).json({ success: false, message: 'ACL error' });
                    }

                    if (!aclres) {
                        return res.status(401).json({
                            success: false,
                            message: "401"
                        });
                    }

                    try {
                        const taskId = req.params.id;
                        const { page, xPercent, yPercent } = req.body;

                        if (page === undefined || xPercent === undefined || yPercent === undefined) {
                            return res.status(400).json({
                                success: false,
                                message: "page, xPercent et yPercent sont requis"
                            });
                        }

                        const tache = await Tache.findByIdAndUpdate(
                            taskId,
                            {
                                $set: {
                                    'marker.page': Number(page),
                                    'marker.xPercent': Number(xPercent),
                                    'marker.yPercent': Number(yPercent)
                                }
                            },
                            { new: true, runValidators: true }
                        );

                        if (!tache) {
                            return res.status(404).json({
                                success: false,
                                message: "Tâche introuvable"
                            });
                        }

                        return res.json({
                            success: true,
                            data: tache
                        });

                    } catch (error) {
                        console.error(error);
                        return res.status(500).json({
                            success: false,
                            message: 'Erreur lors du déplacement du marker'
                        });
                    }
                });
            },

            deleteTaskMarker(req, res) {
                acl.isAllowed(req.decoded.id, 'projets', 'create', async function(err, aclres) {
                    if (err) {
                        return res.status(500).json({ success: false, message: 'ACL error' });
                    }

                    if (!aclres) {
                        return res.status(401).json({
                            success: false,
                            message: "401"
                        });
                    }

                    try {
                        const taskId = req.params.id;

                        const tache = await Tache.findByIdAndUpdate(
                            taskId,
                            {
                                $unset: {
                                    marker: 1
                                }
                            },
                            { new: true, runValidators: true }
                        );

                        if (!tache) {
                            return res.status(404).json({
                                success: false,
                                message: "Tâche introuvable"
                            });
                        }

                        return res.json({
                            success: true,
                            data: tache
                        });

                    } catch (error) {
                        console.error(error);
                        return res.status(500).json({
                            success: false,
                            message: 'Erreur lors de la suppression du marker'
                        });
                    }
                });
            }

  
        }
     }
})();
