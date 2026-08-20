const mailService = require("../services/mail.service");

(function(){

    "use strict";
    var Conge = require("../models/conge.model").CongeModel;
    var User = require("../models/users.model").UserModel;
    var TimeSheet = require('../models/timesheet.model').TimeSheetModel;
    var EmailService = require("../services/mail.service");
    var uploadService = require('../services/upload.service');
    var AgendaService = require('../services/agenda.service');
    var notificationService = require('../services/notification.service');
    const CONGE_NOTIFICATION_RECIPIENT_EMAILS = ['m.minthe@mlka.fr', 's.mbaye@mlka.fr'];

    function formatCongeNotificationDate(value) {
        return value ? new Date(value).toLocaleDateString('fr-FR') : '';
    }

    function requiresJustificatif(types) {
        return types === "Absence justifiée";
    }

    async function notifyCongeAuthor(conge, templateKey) {
        try {
            if (!conge?.user) {
                return;
            }
            const author = await User.findOne({ _id: conge.user });
            if (!author) {
                return;
            }
            await notificationService.sendNotification({
                user: author,
                templateKey,
                context: {
                    congeType: conge.types || '',
                    startDate: formatCongeNotificationDate(conge.debut),
                    endDate: formatCongeNotificationDate(conge.fin),
                },
                data: {
                    type: 'conge',
                    resource: 'conge',
                    resourceId: conge._id.toString(),
                    userId: author._id.toString(),
                },
            });
        } catch (error) {
            console.log("Erreur notification congé auteur", error);
        }
    }

    async function notifyCongeValidators(conge, user, templateKey) {
        try {
            const notificationRecipients = await User.find({
                email: { $in: CONGE_NOTIFICATION_RECIPIENT_EMAILS }
            });
            await Promise.allSettled(
                notificationRecipients.map((recipient) =>
                    notificationService.sendNotification({
                        user: recipient,
                        templateKey,
                        context: {
                            requesterName: [user?.prenom, user?.nom].filter(Boolean).join(' '),
                            congeType: conge.types || '',
                            startDate: formatCongeNotificationDate(conge.debut),
                            endDate: formatCongeNotificationDate(conge.fin),
                        },
                        data: {
                            type: 'conge',
                            resource: 'conge',
                            resourceId: conge._id.toString(),
                            userId: recipient._id.toString(),
                        },
                    })
                )
            );
        } catch (error) {
            console.log("Erreur notification congé validateurs", error);
        }
    }

    module.exports = function(acl){
        return {

            addConge(req,res){
                acl.isAllowed(req.decoded.id,'agenda', 'create', async function(err,aclres){
                    if(aclres){
                      
                        let user = await User.findOne({_id:req.decoded.id});
                        var conge = new Conge(req.body);
                        conge.user = req.decoded.id;
                        conge.date_demande = new Date();
                        if (requiresJustificatif(conge.types) && !req.file) {
                            return res.status(400).json({
                                success: false,
                                message: "Un document justificatif est obligatoire pour une absence justifiée"
                            });
                        }
                        if(req.file){
                            conge.nom_fichier = Buffer.from(req.file.filename, 'latin1').toString('utf8');
                            conge.fichier = await uploadService.uploadCongesToFirebaseStorage(req.file.filename);
                        }
                        conge.save().then(async(conge)=>{
                                EmailService.mailconge(user);
                                await notifyCongeValidators(conge, user, 'CONGE_REQUEST_CREATED');
                                res.json({
                                    success:true,
                                    message:conge
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

            updateConge(req,res){
                acl.isAllowed(req.decoded.id,'agenda', 'update', async function(err,aclres){
                    if(aclres){

                        let conge = await Conge.findOne({_id:req.params.id});

                        if(!conge){
                            return res.status(404).json({
                                success: false,
                                message: "Demande introuvable"
                            });
                        }

                        if (String(conge.user) !== String(req.decoded.id)) {
                            return res.status(403).json({
                                success: false,
                                message: "Vous ne pouvez modifier que votre demande"
                            });
                        }

                        const isSigned = Boolean(conge.signature_entreprise && String(conge.signature_entreprise).trim());
                        if (conge.status !== "En attente de validation" || isSigned) {
                            return res.status(409).json({
                                success: false,
                                message: "Cette demande ne peut plus être modifiée"
                            });
                        }

                        if (req.body.debut != null) {
                            conge.debut = req.body.debut;
                        }
                        if (req.body.fin != null) {
                            conge.fin = req.body.fin;
                        }
                        if (req.body.types != null) {
                            conge.types = req.body.types;
                        }
                        if (req.body.jours != null) {
                            conge.jours = req.body.jours;
                        }
                        if (req.body.heure_debut != null) {
                            conge.heure_debut = req.body.heure_debut;
                        }
                        if (req.body.heure_fin != null) {
                            conge.heure_fin = req.body.heure_fin;
                        }
                        if (req.body.raison != null) {
                            conge.raison = req.body.raison;
                        }
                        if (req.body.signature_user && String(req.body.signature_user).trim()) {
                            conge.signature_user = req.body.signature_user;
                        }

                        const shouldRemoveFile = req.body.remove_fichier === 'true' || req.body.remove_fichier === true;
                        if (req.file) {
                            if (conge.nom_fichier) {
                                uploadService.deleteCongesFirebaseStorage(conge.nom_fichier);
                            }
                            conge.nom_fichier = Buffer.from(req.file.filename, 'latin1').toString('utf8');
                            conge.fichier = await uploadService.uploadCongesToFirebaseStorage(req.file.filename);
                        } else if (shouldRemoveFile) {
                            if (conge.nom_fichier) {
                                uploadService.deleteCongesFirebaseStorage(conge.nom_fichier);
                            }
                            conge.nom_fichier = null;
                            conge.fichier = null;
                        }

                        if (requiresJustificatif(conge.types) && !conge.fichier) {
                            return res.status(400).json({
                                success: false,
                                message: "Un document justificatif est obligatoire pour une absence justifiée"
                            });
                        }

                        try {
                            const updated = await conge.save();
                            const user = await User.findOne({_id: req.decoded.id});
                            await notifyCongeValidators(updated, user, 'CONGE_REQUEST_UPDATED');
                            return res.json({
                                success:true,
                                message:updated
                            });
                        } catch (error) {
                            return res.status(500).json({
                                success:false,
                                message:error.message
                            });
                        }
                        
                    }else{
                        return res.status(401).json({
                            success: false,
                            message: "401"
                        }); 
                    }
                })

            },

            deleteConge(req,res){
                acl.isAllowed(req.decoded.id,'agenda', 'delete', async function(err,aclres){
                    if(!aclres){
                        return res.status(401).json({
                            success: false,
                            message: "401"
                        });
                    }

                    try {
                        const conge = await Conge.findOne({_id:req.params.id});
                        if (!conge) {
                            return res.status(404).json({
                                success: false,
                                message: "Demande introuvable"
                            });
                        }

                        if (String(conge.user) !== String(req.decoded.id)) {
                            return res.status(403).json({
                                success: false,
                                message: "Vous ne pouvez annuler que votre demande"
                            });
                        }

                        const isSigned = Boolean(conge.signature_entreprise && String(conge.signature_entreprise).trim());
                        if (conge.status !== "En attente de validation" || isSigned) {
                            return res.status(409).json({
                                success: false,
                                message: "Cette demande ne peut plus être annulée"
                            });
                        }

                        const user = await User.findOne({_id: req.decoded.id});
                        if (conge.nom_fichier) {
                            uploadService.deleteCongesFirebaseStorage(conge.nom_fichier);
                        }
                        await conge.deleteOne();
                        await notifyCongeValidators(conge, user, 'CONGE_REQUEST_CANCELLED');
                        return res.json({
                            success: true,
                            message: conge
                        });
                    } catch (error) {
                        return res.status(500).json({
                            success: false,
                            message: error.message
                        });
                    }
                })
            },

            getAllCongeUser(req,res){
                acl.isAllowed(req.decoded.id,'agenda', 'retreive', async function(err,aclres){

                    if(aclres){
                        Conge.find({user:req.decoded.id}).populate('user').then((conge)=>{
                            res.json({
                                success: true,
                                message:conge
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

            getAllConge(req,res){
                acl.isAllowed(req.decoded.id,'agenda', 'retreive', async function(err,aclres){

                    if(aclres){
                        Conge.find().sort({date_demande: -1}).populate('user').then((conge)=>{
                            res.json({
                                success: true,
                                message:conge
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

            getConge(req,res){
                acl.isAllowed(req.decoded.id,'agenda', 'retreive', async function(err,aclres){

                    if(aclres){
                        Conge.findOne({_id:req.params.id}).populate('user').populate('responsable').then((conge)=>{
                            res.json({
                                success: true,
                                message:conge
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

            valideConge(req,res){
                acl.isAllowed(req.decoded.id,'agenda', 'update', async function(err,aclres){
                    if(aclres){
                        Conge.findOneAndUpdate({_id:req.params.id},{status:"Validé",date_signature:new Date(),responsable:req.decoded.id},{new:true}).then(async(conge)=>{
                            EmailService.mailValidationconge(conge._id);
                            await notifyCongeAuthor(conge, 'CONGE_REQUEST_APPROVED');
                            //Créer feuille de temps après validation de congés
                            if(conge.types == "Congé de naissance" || conge.types == "Congé d'accueil" || conge.types == "Congé paternité"){
                                const date = conge.debut;
                                while (date <= conge.fin) {
                                    let timeSheet = new TimeSheet();
                                    timeSheet.user = conge.user._id;
                                    timeSheet.responsable = req.decoded.id;
                                    timeSheet.createdAt = new Date(date)
                                    timeSheet.presence = "Absent";
                                    timeSheet.deplacement = "Non";
                                    timeSheet.heure = 0;
                                    timeSheet.motifs = conge.types;
                                    timeSheet.save();
                                    date.setDate(date.getDate()+1);
                                }
                            }
                            AgendaService.addAgenda(conge);
                            res.json({
                                success:true,
                                message:conge
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

            refuseConge(req,res){
                acl.isAllowed(req.decoded.id,'agenda', 'update', async function(err,aclres){
                    if(aclres){
                    
                        Conge.findOneAndUpdate({_id:req.params.id},{status:"Refusée",date_signature:new Date(),responsable:req.decoded.id},{new:true}).then(async(conge)=>{
                            EmailService.mailValidationconge(conge._id);
                            await notifyCongeAuthor(conge, 'CONGE_REQUEST_REFUSED');
                            res.json({
                                success:true,
                                message:conge
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

            updateStatus(req,res){
                acl.isAllowed(req.decoded.id,'agenda', 'update', async function(err,aclres){
                    if(aclres){

                        Conge.findOneAndUpdate({_id:req.params.id},req.body,{new:true}).then((conge)=>{
                            res.json({
                                success:true,
                                message:conge
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