(function(){
    'use strict';
    var Dossier = require('../models/dossiers.model').DossierModel,
        Fichier = require('../models/fichiers.model').FichierModel;
    var ObjectId = require('mongoose').Types.ObjectId;

    module.exports=function(acl){
        return{
            list:function(req,res){
                acl.isAllowed(req.decoded.id,'box', 'create', async function(err,aclres){

                    if(aclres){

                        let dossiers = await Dossier.find({profondeur:0}).populate('creator');
                        let fichiers = await Fichier.find({profondeur:0}).populate('creator');

                        return res.json({
                            success : true,
                            message:{
                                dossiers:dossiers,
                                fichiers:fichiers
                            }
                        })

                    }else{
                        return res.status(401).json({
                            success: false,
                            message: "401"
                        }); 
                    }
                })
            },
            listProjet:function(req,res){
                acl.isAllowed(req.decoded.id,'box', 'create', async function(err,aclres){

                    if(aclres){

                        let dossiers = await Dossier.find({profondeur:0,project:req.params.id}).populate('creator');
                        let fichiers = await Fichier.find({profondeur:0,project:req.params.id}).populate('creator');

                        return res.json({
                            success : true,
                            message:{
                                dossiers:dossiers,
                                fichiers:fichiers
                            }
                        })

                    }else{
                        return res.status(401).json({
                            success: false,
                            message: "401"
                        }); 
                    }
                })
            },
            create:function(req,res){
                acl.isAllowed(req.decoded.id,'box', 'create', async function(err,aclres){

                    if(aclres){

                        req.body.date=new Date();
                        req.body.dateLastUpdate=new Date();
                        req.body.creator=req.decoded.id;
                        let profondeur=0;

                        if(req.body.dossierParent){
                            let notfound={
                                success:false,
                                code:"404",
                                message:"le dossier parent spécifié est introuvable"
                            };

                            Dossier.findOne({_id:req.body.dossierParent}).then((data)=>{

                                if(!data){
                                    res.json(notfound);
                                }
                                profondeur=data.profondeur+1;
                                req.body.profondeur=profondeur;
                                let dossier = new Dossier(req.body);
                                dossier.save().then((data)=>{

                                    res.json({
                                        success:true,
                                        message:data
                                    })

                                }).catch((error)=>{
                                    return res.status(500).json({
                                        success:false,
                                        message:error.message
                                    })
                                })

                            }).catch((error)=>{
                                return res.status(500).json({
                                    success:false,
                                    message:error.message
                                })
                            })
                        }else{
                                req.body.profondeur=profondeur;
                                let dossier = new Dossier(req.body);
                                dossier.save().then((data)=>{

                                    res.json({
                                        success:true,
                                        message:data
                                    })

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
            createProjet:function(req,res){
                acl.isAllowed(req.decoded.id,'box', 'create', async function(err,aclres){

                    if(aclres){

                        req.body.date=new Date();
                        req.body.dateLastUpdate=new Date();
                        req.body.creator=req.decoded.id;
                        req.body.project=req.params.id;
                        let profondeur=0;

                        if(req.body.dossierParent){
                            let notfound={
                                success:false,
                                code:"404",
                                message:"le dossier parent spécifié est introuvable"
                            };

                            Dossier.findOne({_id:req.body.dossierParent}).then((data)=>{

                                if(!data){
                                    res.json(notfound);
                                }
                                profondeur=data.profondeur+1;
                                req.body.profondeur=profondeur;
                                let dossier = new Dossier(req.body);
                                dossier.save().then((data)=>{

                                    res.json({
                                        success:true,
                                        message:data
                                    })

                                }).catch((error)=>{
                                    return res.status(500).json({
                                        success:false,
                                        message:error.message
                                    })
                                })

                            }).catch((error)=>{
                                return res.status(500).json({
                                    success:false,
                                    message:error.message
                                })
                            })
                        }else{
                                req.body.profondeur=profondeur;
                                let dossier = new Dossier(req.body);
                                dossier.save().then((data)=>{

                                    res.json({
                                        success:true,
                                        message:data
                                    })

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
            read:function(req,res){
                acl.isAllowed(req.decoded.id,'box', 'create', async function(err,aclres){

                    if(aclres){

                        let dossier = await Dossier.findOne({_id:req.params.id});
                        if(!dossier){
                            return res.status(404).json({
                                success: false,
                                message: '404'
                              });
                        }else{
                            let dossiers = await Dossier.find({dossierParent:dossier._id}).populate('creator').populate('dossierParent');
                            let fichiers = await Fichier.find({dossierParent:dossier._id}).populate('creator').populate('dossierParent');

                            return res.json({
                                success : true,
                                message:{
                                    dossier:dossier,
                                    dossiers:dossiers,
                                    fichiers:fichiers
                                }
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
            readOnly:function(req,res){
                acl.isAllowed(req.decoded.id,'box', 'create', async function(err,aclres){

                    if(aclres){

                        let dossier = await Dossier.findOne({_id:req.params.id});
                        if(!dossier){
                            return res.status(404).json({
                                success: false,
                                message: '404'
                              });
                        }else{
                            return res.json({
                                success : true,
                                message: dossier
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
            update:function(req,res){
                acl.isAllowed(req.decoded.id,'box', 'update', async function(err,aclres){

                    if(aclres){

                        req.body.dateLastUpdate=new Date();
                        if(req.body.dossierParent && req.body.dossierParent!=""){

                            Dossier.findOne({_id:req.body.dossierParent}).then((data)=>{

                                if(data){
                                    req.body.profondeur=data.profondeur+1
                                }
                                Dossier.findOneAndUpdate({_id:req.params.id},req.body,{new:true}).then((data)=>{
                                    return res.json({
                                        success : true,
                                        message:data
                                    })
                                    
                                }).catch((error)=>{
                                    return res.status(500).json({
                                        success:false,
                                        message:error.message
                                    })
                                })

                            }).catch((error)=>{
                                return res.status(500).json({
                                    success:false,
                                    message:error.message
                                })
                            })

                        }else{
                            Dossier.findOneAndUpdate({_id:req.params.id},req.body,{new:true}).then((data)=>{
                                return res.json({
                                    success : true,
                                    message:data
                                })
                                
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
            delete(req,res){
                acl.isAllowed(req.decoded.id,'box', 'delete', async function(err,aclres){

                    if(aclres){

                        let dossier = await Dossier.findOne({_id:req.params.id});
                        dossier.deleteOne().then((data)=>{
                            res.json({
                                success: true,
                                message:data
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