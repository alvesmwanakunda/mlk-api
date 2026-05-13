(function(){
    "use strict";
    var Agenda = require("../models/agenda.model").AgendaModel;
    var AgendaProjet = require("../models/agendaProjet.model").AgendaProjetModel;
    var ObjectId = require('mongoose').Types.ObjectId;
    var mailService = require('../services/mail.service');
    var User = require("../models/users.model").UserModel;
    var notificationService = require('../services/notification.service');
    var agendaService = require('../services/agenda.service');
    var Tache = require('../models/taches.model').TacheModel;
    var Projet = require('../models/projets.model').ProjetModel;
    var translationService = require('../services/deeplTranslation.service');

    function formatAgendaDate(date, time, web = false) {
        if (!date) return null;
        const day = date.toISOString().split('T')[0];
        return web ? day : `${day}T${time || ''}`;
    }

    function serializeAgenda(data, requestedLanguage, web = false) {
        const agenda = translationService.withDisplayTitle(data, requestedLanguage);
        return {
            _id: agenda?._id,
            title: agenda?.title,
            originalTitle: agenda?.originalTitle,
            titleSourceLanguage: agenda?.titleSourceLanguage,
            titleTranslations: agenda?.titleTranslations || {},
            titleTranslation: agenda?.titleTranslation,
            displayTitle: agenda?.displayTitle,
            start: formatAgendaDate(agenda?.start, agenda?.heure_start, web),
            end: formatAgendaDate(agenda?.end, agenda?.heure_end, web),
            heure_start: agenda?.heure_start,
            heure_end: agenda?.heure_end,
            color: agenda?.color,
            isDay: agenda?.isDay,
            assigne: agenda?.assigne,
            user: agenda?.user,
            type: "agenda",
            timeZoneOffset: agenda?.timeZoneOffset,
            projet: agenda?.projet,
        };
    }


    module.exports = function(acl){
        return {

            addAgenda(req,res){
                acl.isAllowed(req.decoded.id,'agenda', 'create', async function(err,aclres){
                    if(aclres){

                            console.log("Agenda Body",req.body);
                      
                            var agenda = new Agenda();
                            let task=null;

                            if(req.body.end){
                                agenda.end=req.body.end;
                            }
                            if(req.body.isDay==false){
                                agenda.end=req.body.start;
                            }
                            agenda.user = req.decoded.id;
                            agenda.isDay = req.body.isDay;
                            Object.assign(
                                agenda,
                                await translationService.buildAgendaTitleTranslationFields(
                                    req.body.title || ''
                                )
                            );
                            agenda.color = req.body.color;
                            agenda.heure_end=req.body.heure_end;
                            agenda.heure_start=req.body.heure_start;
                            agenda.start = req.body.start;
                            agenda.timeZoneOffset = req.body.timeZoneOffset;

                            if (req.body.assigne && Array.isArray(req.body.assigne)) {
                                // S'assurer que ce sont bien des ObjectId
                                agenda.assigne = req.body.assigne.map(id => new ObjectId(id));
                            }

                             if (req.body.projet) {

                                agenda.projet = req.body.projet;
                             }

                            //console.log("Agenda", agenda);

                            agenda.save().then( async (agenda)=>{
                                if (agenda?.projet) {
                                    let assigneId = null; // <-- pas un tableau

                                    const assigne = req.body?.assigne;

                                    if (Array.isArray(assigne) && assigne.length > 0) {
                                        const firstId = assigne[0];
                                        if (firstId && ObjectId.isValid(firstId)) {
                                        assigneId = new ObjectId(firstId);
                                        }
                                    } else if (assigne && ObjectId.isValid(assigne)) {
                                        // si c’est une seule valeur
                                        assigneId = new ObjectId(assigne);
                                    }

                                    const task = {
                                        titre: req.body?.title || '',
                                        projet: req.body?.projet || null,
                                        assignes: assigneId,
                                        agenda: agenda?._id || null,
                                    };

                                    agendaService.addTask(task);
                                }

                                //send notification to assigne
                                if(agenda?.assigne){
                                    mailService.mailPlanning(agenda?._id);
                                    if (agenda?.projet) {

                                        let projet = await Projet.findOne({_id:agenda.projet});
                                        agenda.assigne.forEach( async userId=>{

                                            User.findOne({_id:userId}).then((user)=>{
                                                notificationService.sendNotification(
                                                    user.fcmToken, 
                                                    'Nouvelle tâche assignée', 
                                                    'La tâche \''+agenda.title+'\' vous a été assignée dans le projet \''+projet.projet+'\'. Merci de vérifier votre tâche.',
                                                    {
                                                        type: "tache", 
                                                        userId: user._id.toString(),
                                                        resource: "projet",
                                                        resourceId: projet._id.toString(),
                                                        agendaId: agenda._id.toString()
                                                    }
                                                );
                                            });
                                        }); 
                                        
                                    }else{
                                        agenda.assigne.forEach(userId=>{
                                            User.findOne({_id:userId}).then((user)=>{
                                                notificationService.sendNotification(
                                                    user.fcmToken, 
                                                    'Nouvelle tâche assignée', 
                                                    'La tâche \''+agenda.title+'\' vous a été assignée. Merci de vérifier votre agenda.',
                                                    {
                                                        type: "agenda",
                                                        userId: user._id.toString(),
                                                        agendaId: agenda._id.toString(),
                                                    }
                                                );
                                            });
                                        });
                                    }                                    
                                }

                                const requestedLanguage =
                                    await translationService.getRequestedLanguage(req);
                                res.json({
                                    success:true,
                                    message: translationService.withDisplayTitle(
                                        agenda,
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
            updateAgenda(req,res){
                acl.isAllowed(req.decoded.id,'agenda', 'update', async function(err,aclres){
                    if(aclres){
                        let agenda = await Agenda.findOne({_id:req.params.id});

                        if(req.body.isDay==false || req.body.isDay=="false"){
                            agenda.end=req.body.start;
                        }
                        if(req.body.isDay==true || req.body.isDay=="true"){
                            agenda.end=req.body.end;
                        }
                        agenda.user = req.decoded.id;
                        agenda.isDay = req.body.isDay;
                        if (req.body.title !== undefined) {
                            Object.assign(
                                agenda,
                                await translationService.buildAgendaTitleTranslationFields(
                                    req.body.title || ''
                                )
                            );
                        }
                        agenda.color = req.body.color;
                        agenda.heure_end=req.body.heure_end;
                        agenda.heure_start=req.body.heure_start;
                        agenda.start = req.body.start;
                        agenda.timeZoneOffset = req.body.timeZoneOffset;

                        // Nouveau : mise à jour des utilisateurs assignés
                        //console.log("Assigne", req.body.assigne);
                        if (req.body.assigne && Array.isArray(req.body.assigne)) {
                            agenda.assigne = req.body.assigne.map(id => new ObjectId(id));
                        }

                        if (req.body.projet) {

                           agenda.projet = req.body.projet;
                           let assigneId = null; // <-- pas un tableau

                            const assigne = req.body?.assigne;

                            if (Array.isArray(assigne) && assigne.length > 0) {
                                const firstId = assigne[0];
                                if (firstId && ObjectId.isValid(firstId)) {
                                assigneId = new ObjectId(firstId);
                                }
                            } else if (assigne && ObjectId.isValid(assigne)) {
                                // si c’est une seule valeur
                                assigneId = new ObjectId(assigne);
                            }

                           let task = await Tache.findOne({agenda:agenda._id});
                           if(task){
                             if(task.projet.equals(req.body.projet)){
                                console.log("Success");
                                let tacheObjet={
                                    titre: req.body.title,
                                    assignes: assigneId,
                                 };
                                 agendaService.updateTask(task._id, tacheObjet);
                             }else{
                                 let tacheObjet={
                                    projet:req.body.projet,
                                    titre: req.body.title,
                                    assignes: assigneId,
                                 };
                                 agendaService.updateTask(task._id, tacheObjet);
                             }
                           }
                        }

                        Agenda.findOneAndUpdate({_id:req.params.id},agenda,{new:true}).then( async (agenda)=>{
                            //send notification to assigne
                            if(agenda?.projet){
                                let projet = await Projet.findOne({_id:agenda.projet});
                                agenda.assigne.forEach( async userId=>{

                                    User.findOne({_id:userId}).then((user)=>{
                                        notificationService.sendNotification(
                                            user.fcmToken, 
                                            'Tâche assignée', 
                                            'La tâche \''+agenda.title+'\' a été modifiée dans le projet \''+projet.projet+'\'. Merci de vérifier votre tâche.',
                                            {
                                                type: "tache", 
                                                userId: user._id.toString(),
                                                resource: "projet",
                                                resourceId: projet._id.toString(),
                                                agendaId: agenda._id.toString()
                                            }
                                        );
                                    });
                                }); 

                            }else{
                                agenda.assigne.forEach(userId=>{
                                    User.findOne({_id:userId}).then((user)=>{
                                        notificationService.sendNotification(
                                            user.fcmToken, 'Tâche assignée', 
                                            'La tâche \''+agenda.title+'\' a été modifiée. Veuillez vérifier votre agenda.',
                                            {
                                                type: "agenda",
                                                userId: user._id.toString(),
                                                agendaId: agenda._id.toString(),
                                            }
                                        );
                                    });
                                });
                            }
                            const requestedLanguage =
                                await translationService.getRequestedLanguage(req);
                            res.json({
                                success:true,
                                message: translationService.withDisplayTitle(
                                    agenda,
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

            deleteAgenda(req,res){
                acl.isAllowed(req.decoded.id,'agenda', 'delete', async function(err,aclres){

                    if(aclres){

                        let agenda = await Agenda.findOne({_id:req.params.id});
                        agenda.deleteOne().then((agenda)=>{
                            res.json({
                                success: true,
                                message:agenda
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

            getAllAgenda(req,res){
                acl.isAllowed(req.decoded.id,'agenda', 'retreive', async function(err,aclres){

                    if(aclres){

                        /*let agenda = await Agenda.find({user:req.decoded.id});
                        let agendaP = await AgendaProjet.find();
                        let agendas = agenda.map((data)=>({
                            _id:data?._id,
                            title:data?.title,
                            start: data?.start.toISOString().split('T')[0]+"T"+data?.heure_start,
                            end: data?.end.toISOString().split('T')[0]+"T"+data?.heure_end,
                            heure_start: data?.heure_start,
                            heure_end:data?.heure_end,
                            color:data?.color,
                            isDay:data?.isDay,
                            user:data?.user,
                            type:"agenda"
                        }));
                        let agendasp = agendaP.map((data)=>({
                            _id:data?._id,
                            title:data?.title,
                            start: data?.start.toISOString().split('T')[0]+"T"+data?.heure_start,
                            end: data?.end.toISOString().split('T')[0]+"T"+data?.heure_end,
                            heure_start: data?.heure_start,
                            heure_end:data?.heure_end,
                            color:data?.color,
                            isDay:data?.isDay,
                            user:data?.user,
                            projet:data?.projet,
                            type:"planning"
                        }));
                        let combinedList = [...agendasp, ...agendas]; // Concaténation si besoin
                        res.json({
                            success: true,
                            message:combinedList
                        });*/

                        //Agenda.find({user:req.decoded.id})
                        Agenda.find().populate('assigne', 'nom prenom _id').then(async (agenda)=>{
                            const requestedLanguage =
                                await translationService.getRequestedLanguage(req);
                            let agendas = agenda.map((data)=>
                                serializeAgenda(data, requestedLanguage)
                            )
                            res.json({
                                success: true,
                                message:agendas
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

            getAgenda(req,res){
                acl.isAllowed(req.decoded.id,'agenda', 'retreive', async function(err,aclres){

                    if(aclres){
                        Agenda.findOne({_id:req.params.id}).then(async (agenda)=>{
                            const requestedLanguage =
                                await translationService.getRequestedLanguage(req);
                            res.json({
                                success: true,
                                message: translationService.withDisplayTitle(
                                    agenda,
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

            getAgendaWeb(req,res){
                acl.isAllowed(req.decoded.id,'agenda', 'retreive', async function(err,aclres){

                    if(aclres){
                        //Agenda.findOne({_id:req.params.id})
                        Agenda.findOne({_id:req.params.id}).then(async (data)=>{
                            const requestedLanguage =
                                await translationService.getRequestedLanguage(req);
                            let agend = serializeAgenda(data, requestedLanguage, true);
                            res.json({
                                success: true,
                                message:agend
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
            }


        }
    }
})();
