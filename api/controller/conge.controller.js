(function(){

    "use strict";
    var Conge = require("../models/conge.model").CongeModel;
    var User = require("../models/users.model").UserModel;
    var EmailService = require("../services/mail.service");
    var uploadService = require('../services/upload.service');


    module.exports = function(acl){
        return {

            addConge(req,res){
                acl.isAllowed(req.decoded.id,'agenda', 'create', async function(err,aclres){
                    if(aclres){
                      
                        let user = await User.findOne({_id:req.decoded.id});
                        var conge = new Conge(req.body);
                        conge.user = req.decoded.id;
                        conge.date_demande = new Date();
                        if(req.file){
                            conge.nom_fichier = Buffer.from(req.file.filename, 'latin1').toString('utf8');
                            conge.fichier = await uploadService.uploadCongesToFirebaseStorage(req.file.filename);
                        }
                        conge.save().then((conge)=>{
                                EmailService.mailconge(user);
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

                        if(conge){

                            conge.debut = req.body.debut;
                            conge.fin = req.body.fin;
                            conge.types = req.body.types;
                            conge.jours = req.body.jours;
                            conge.status = req.body.status;
                            conge.heure_debut = req.body.heure_debut;
                            conge.heure_fin = req.body.heure_fin;
                            conge.raison = req.body.raison;
                            if(req.file){
                                if(conge.nom_fichier){
                                    uploadService.deleteCongesFirebaseStorage(conge.nom_fichier);
                                }
                                conge.nom_fichier = Buffer.from(req.file.filename, 'latin1').toString('utf8');
                                conge.fichier = await uploadService.uploadCongesToFirebaseStorage(req.file.filename);
                            }
                            Conge.findOneAndUpdate({_id:req.params.id},conge,{new:true}).then((conge)=>{
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

                    if(aclres){

                        let conge = await Conge.findOne({_id:req.params.id});
                        conge.deleteOne().then((conge)=>{
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
                        Conge.find().populate('user').then((conge)=>{
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
                        Conge.findOneAndUpdate({_id:req.params.id},{status:"Validé",date_signature:new Date(),responsable:req.decoded.id},{new:true}).then((conge)=>{
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
                    
                        Conge.findOneAndUpdate({_id:req.params.id},{status:"Refusée",date_signature:new Date(),responsable:req.decoded.id},{new:true}).then((conge)=>{
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