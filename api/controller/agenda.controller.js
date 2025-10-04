(function(){
    "use strict";
    var Agenda = require("../models/agenda.model").AgendaModel;
    var AgendaProjet = require("../models/agendaProjet.model").AgendaProjetModel;
    var ObjectId = require('mongoose').Types.ObjectId;
    var mailService = require('../services/mail.service');
    var User = require("../models/users.model").UserModel;
    var notificationService = require('../services/notification.service');


    module.exports = function(acl){
        return {

            addAgenda(req,res){
                acl.isAllowed(req.decoded.id,'agenda', 'create', async function(err,aclres){
                    if(aclres){

                            console.log("Agenda Body",req.body);
                      
                            var agenda = new Agenda();

                            if(req.body.end){
                                agenda.end=req.body.end;
                            }
                            if(req.body.isDay==false){
                                agenda.end=req.body.start;
                            }
                            agenda.user = req.decoded.id;
                            agenda.isDay = req.body.isDay;
                            agenda.title = req.body.title;
                            agenda.color = req.body.color;
                            agenda.heure_end=req.body.heure_end;
                            agenda.heure_start=req.body.heure_start;
                            agenda.start = req.body.start;
                            agenda.timeZoneOffset = req.body.timeZoneOffset;

                            if (req.body.assigne && Array.isArray(req.body.assigne)) {
                                // S'assurer que ce sont bien des ObjectId
                                agenda.assigne = req.body.assigne.map(id => new ObjectId(id));
                            }

                            //console.log("Agenda", agenda);

                            agenda.save().then((agenda)=>{

                                if(agenda?.assigne){
                                    mailService.mailPlanning(agenda?._id);
                                    //send notification to assigne
                                    agenda.assigne.forEach(user=>{
                                        User.findOne({_id:user}).then((user)=>{
                                            notificationService.sendNotification(
                                                user.fcmToken, 
                                                'Nouvelle tâche assignée', 
                                                'La tâche \''+agenda.title+'\' vous a été assignée. Merci de vérifier votre agenda.',
                                                {
                                                    type: "agenda",
                                                    userId: user._id.toString(),
                                                }
                                            );
                                        });
                                    });
                                }

                                res.json({
                                    success:true,
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
                        agenda.title = req.body.title;
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

                        Agenda.findOneAndUpdate({_id:req.params.id},agenda,{new:true}).then((agenda)=>{
                            //send notification to assigne
                            agenda.assigne.forEach(user=>{
                                User.findOne({_id:user}).then((user)=>{
                                    notificationService.sendNotification(
                                        user.fcmToken, 'Tâche assignée', 
                                        'La tâche \''+agenda.title+'\' a été modifiée. Veuillez vérifier votre agenda.',
                                        {
                                            type: "agenda",
                                            userId: user._id.toString(),
                                        }
                                    );
                                });
                            });
                            res.json({
                                success:true,
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
                        Agenda.find().populate('assigne', 'nom prenom _id').then((agenda)=>{
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
                                assigne:data?.assigne,
                                type:"agenda",
                                timeZoneOffset:data?.timeZoneOffset
                            }))
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
                        Agenda.findOne({_id:req.params.id}).then((agenda)=>{
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

            getAgendaWeb(req,res){
                acl.isAllowed(req.decoded.id,'agenda', 'retreive', async function(err,aclres){

                    if(aclres){
                        //Agenda.findOne({_id:req.params.id})
                        Agenda.findOne({_id:req.params.id}).then((data)=>{
                            let agend = {
                                _id:data?._id,
                                title:data?.title,
                                start: data?.start.toISOString().split('T')[0],
                                end: data?.end.toISOString().split('T')[0],
                                heure_start: data?.heure_start,
                                heure_end:data?.heure_end,
                                color:data?.color,
                                isDay:data?.isDay,
                                assigne:data?.assigne,
                                user:data?.user,
                                timeZoneOffset:data?.timeZoneOffset
                            }
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