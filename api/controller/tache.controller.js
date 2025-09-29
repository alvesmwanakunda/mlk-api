(function(){

    "use strict";
    var Tache = require('../models/taches.model').TacheModel;
    var Timesheet = require('../models/timesheetTask.model').TimesheetTaskModel;
    var SubTask = require('../models/sousTache.model').SousTacheModel;
    var notificationService = require('../services/notification.service');
    var User = require("../models/users.model").UserModel;
    var Projet = require("../models/projets.model").ProjetModel;




    module.exports = function(acl){
        return {
                 
            addTache(req,res,next){
                acl.isAllowed(req.decoded.id,'projets', 'create', async function(err,aclres){
                    if(aclres){

                        var tache = new Tache(req.body);
                        console.log("Assigne", req.body.assignes);
                        if(!req.body.assignes){
                         tache.assignes=null
                        }else{
                           tache.assignes =  req.body.assignes;
                        }
                        //if(tache.assignes)
                       
                        tache.projet = req.params.id;
                        tache.save().then(async (tache)=>{
                            if(tache.assignes){
                                let projet = await Projet.findOne({_id:tache.projet});
                                User.findOne({_id:tache.assignes}).then((user)=>{
                                    notificationService.sendNotification(
                                        user.fcmToken, 
                                        'Nouvelle tâche assignée', 
                                        'La tâche \''+tache.titre+'\' vous a été assignée dans le projet \''+projet.projet+'\'. Merci de vérifier votre tâche.',
                                        {
                                            type: "tache", 
                                            userId: user._id.toString(),
                                            resource: "projet",
                                            resourceId: projet._id.toString()
                                        }
                                    );
                                });
                            }
                                res.json({
                                    success:true,
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

            updateTache(req,res){
                acl.isAllowed(req.decoded.id,'agenda', 'create', async function(err,aclres){
                    if(aclres){
                        Tache.findOneAndUpdate({_id:req.params.id},req.body,{new:true}).then(async (tache)=>{
                            if(tache.assignes){
                                let projet = await Projet.findOne({_id:tache.projet});
                                User.findOne({_id:tache.assignes}).then((user)=>{
                                    notificationService.sendNotification(
                                        user.fcmToken, 
                                        'Tâche assignée', 
                                        'La tâche \''+tache.titre+'\' a été modifiée dans le projet \''+projet.projet+'\'. Merci de vérifier votre tâche.',
                                        {
                                            type: "tache", 
                                            userId: user._id.toString(),
                                            resource: "projet",
                                            resourceId: projet._id.toString()
                                        }
                                    );
                                });
                            }
                            res.json({
                                success:true,
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

            deleteTache(req,res){
                acl.isAllowed(req.decoded.id,'agenda', 'delete', async function(err,aclres){

                    if(aclres){

                        let tache = await Tache.findOne({_id:req.params.id});
                        tache.deleteOne().then((tache)=>{
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
                        Tache.find({projet:req.params.id}).populate('assignes').then((tache)=>{
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

                    // Toujours forcer un tableau
                    if (!Array.isArray(times)) {
                        times = [times];
                    }

                    // Ajouter l'ID de la tâche à chaque élément
                    const timesToInsert = times.map(t => ({
                        ...t,
                        tache: tacheId
                    }));

                    const result = await Timesheet.insertMany(timesToInsert);

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

            updateTime(req,res){
                acl.isAllowed(req.decoded.id,'agenda', 'create', async function(err,aclres){
                    if(aclres){
                        Timesheet.findOneAndUpdate({_id:req.params.id},req.body,{new:true}).then((time)=>{
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
                        tache: tacheId
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
  
  
        }
     }
})();