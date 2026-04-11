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
    const mongoose = require('mongoose');
    var Historique = require('../models/historiqueTache.model').HistoriqueTacheModel;


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






    module.exports = function(acl){
        return {

            addTache(req, res, next) {
                acl.isAllowed(req.decoded.id, 'projets', 'create', async (err, aclres) => {
                    if (err) return res.status(500).json({ success: false, message: 'ACL error', error: err.message });
                    if (!aclres) return res.status(401).json({ success: false, message: "401" });

                    try {
                    const tache = new Tache(req.body);

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
                        if (!user.fcmToken) continue;
                        notificationService.sendNotification(
                            user.fcmToken,
                            'Nouvelle tâche assignée',
                            `La tâche '${savedTache.titre}' vous a été assignée dans le projet '${projet?.projet ?? ''}'. Merci de vérifier votre tâche.`,
                            {
                            type: "tache",
                            userId: user._id.toString(),
                            resource: "projet",
                            resourceId: (projet?._id || savedTache.projet).toString(),
                            tacheId: savedTache._id.toString()
                            }
                        );
                        }
                    }

                    return res.json({ success: true, data: savedTache });
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
                        titre: req.body.titre,
                        description: req.body.description,
                        statut: req.body.statut,
                        date_debut: req.body.date_debut,
                        date_fin: req.body.date_fin,
                        temps: req.body.temps,
                    };
                    Object.keys(setData).forEach(k => setData[k] === undefined && delete setData[k]);

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
                    // 6) Mail si statut changé
                    // -----------------------------
                    if (task.statut !== updatedTache?.statut && Array.isArray(updatedTache.assignes) && updatedTache.assignes.length) {
                        MailService.mailUpdateTache(updatedTache._id, req.decoded.id);
                        HistoriqueService.create(updatedTache._id, req.decoded.id);
                    }

                    // -----------------------------
                    // 7) Notifications à tous les assignés
                    // -----------------------------
                    if (Array.isArray(updatedTache.assignes) && updatedTache.assignes.length) {
                        const projet = await Projet.findOne({ _id: updatedTache.projet });
                        const userUpdate = await User.findOne({ _id: req.decoded.id });

                        const users = await Promise.all(updatedTache.assignes.map(id => User.findOne({ _id: id })));
                        for (const user of users.filter(Boolean)) {
                        if (!user.fcmToken) continue;

                        notificationService.sendNotification(
                            user.fcmToken,
                            'Tâche assignée',
                            `La tâche '${updatedTache.titre}' a été modifiée par '${userUpdate?.nom || ''}' '${userUpdate?.prenom || ''}' dans le projet '${projet?.projet || ''}'. Merci de vérifier votre tâche.`,
                            {
                            type: "tache",
                            userId: user._id.toString(),
                            resource: "projet",
                            resourceId: projet?._id?.toString() || String(updatedTache.projet),
                            tacheId: updatedTache._id.toString()
                            }
                        );
                        }
                    }

                    return res.json({ success: true, message: updatedTache });

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
                        Tache.findOne({_id:req.params.id}).populate('assignes').populate('projet').then((tache)=>{
                            res.json({
                                success: true,
                                message:tache
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
                        Tache.find({projet:req.params.id}).sort({date_creation: -1}).populate('assignes').then((tache)=>{
                            res.json({
                                success: true,
                                message:tache
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
                        const time = new Timesheet({
                            ...timeData,
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
                    
                    return res.json({
                        success: true,
                        message: savedTimesheets
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

                    const updateQuery = {
                        $set: {
                            date: req.body.date,
                            date_fin: req.body.date_fin,
                            description: req.body.description,
                            statut: req.body.statut,
                            employee: employees
                        }
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

                    return res.json({
                        success: true,
                        message: time
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
                        Timesheet.findOne({_id:req.params.id}).then((time)=>{
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

            getAllTimeByTask(req,res){
                acl.isAllowed(req.decoded.id,'agenda', 'retreive', async function(err,aclres){

                    if(aclres){
                        Timesheet.find({tache:req.params.id}).then((time)=>{
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
                    const timesToInsert = times.map(t => ({
                        ...t,
                        tache: tacheId,
                        user: req.decoded.id
                    }));

                    const result = await SubTask.insertMany(timesToInsert);

                    return res.json({
                        success: true,
                        message: result
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
                        SubTask.findOneAndUpdate({_id:req.params.id},req.body,{new:true}).then((time)=>{
                            res.json({
                                success:true,
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
                        SubTask.findOne({_id:req.params.id}).then((time)=>{
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

            getAllSubTaskByTask(req,res){
                acl.isAllowed(req.decoded.id,'agenda', 'retreive', async function(err,aclres){

                    if(aclres){
                        SubTask.find({tache:req.params.id}).then((time)=>{
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

            // historique

            getAllHistoriqueByTask(req,res){
                acl.isAllowed(req.decoded.id,'agenda', 'retreive', async function(err,aclres){

                    if(aclres){
                        Historique.find({tache:req.params.id}).sort({date_creation: -1}).then((time)=>{
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
  
        }
     }
})();