(function(){
    'use strict';
    var Modules = require("../models/modules.model").ModulesModel;
    var uploadService = require('../services/upload.service');
    const bucket = require("../../firebase-config");
    var fs = require("fs");


    module.exports=function(acl){

        return{
             create:function(req,res){
                acl.isAllowed(req.decoded.id,'box', 'create', async function(err,aclres){

                    if(aclres){

                        let module = new Modules();

                        module.dateLastUpdate=new Date();
                        module.type=req.body.type;
                        module.nom=req.body.nom;
                        module.position=req.body.position;
                        module.hauteur=req.body.hauteur;
                        module.largeur=req.body.largeur;
                        module.longueur=req.body.longueur;
                        module.marque=req.body.marque;
                        if(req.body.entreprise){
                           module.entreprise=req.body.entreprise;
                        }
                        if(req.body.projet){
                          module.project=req.body.projet;
                        }
                        if(req.body.nom_photo){
                            module.nom_photo=req.body.nom_photo;
                        }
                        try {
                            if(req.files.imageFile){
                                module.photo = await uploadService.uploadFileToFirebaseStorage(req.files.imageFile[0].filename);;
                            }
                            if(req.files.planFile){
                                let on=req.files.planFile[0].originalname.split('.');
                                let extension=on[on.length -1];
                                module.extension=extension;
                                module.plan=req.files.planFile[0].filename;
                                let chemin = await uploadService.uploadFileToFirebaseStorage(req.files.planFile[0].filename);
                                if(chemin){
                                  module.chemin = chemin;
                                }
                            }
                            module.save().then((data)=>{

                                res.json({
                                    success: true,
                                    message: data
                                  });
                              
                            }).catch((error)=>{
                                return res.status(500).json({
                                    success:false,
                                    message:error.message
                                });
                            });

                            
                        } catch (error) {
                            return res.status(500).json({
                                success:false,
                                message:error
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
                acl.isAllowed(req.decoded.id,'box', 'create', async function(err,aclres){

                    if(aclres){

                        let module = await Modules.findOne({_id:req.params.id});

                        module.dateLastUpdate=new Date();
                        module.type=req.body.type;
                        module.nom=req.body.nom;
                        module.position=req.body.position;
                        module.hauteur=req.body.hauteur;
                        module.largeur=req.body.largeur;
                        module.longueur=req.body.longueur;
                        module.marque=req.body.marque;
                        if(req.body.entreprise){
                           module.entreprise=req.body.entreprise;
                        }
                        if(req.body.projet){
                          module.project=req.body.projet;
                        }
                        if(req.body.nom_photo){
                            module.nom_photo=req.body.nom_photo;
                        }

                        try {

                            if(req.files.imageFile){
                                uploadService.deleteFirebaseStorage(module.nom_photo);
                                module.photo = await uploadService.uploadFileToFirebaseStorage(req.files.imageFile[0].filename);;
                            }
                            if(req.files.planFile){
                                let on=req.files.planFile[0].originalname.split('.');
                                let extension=on[on.length -1];
                                module.extension=extension;
                                module.plan=req.files.planFile[0].filename;
                                uploadService.deleteFirebaseStorage(module.plan);
                                let chemin = await uploadService.uploadFileToFirebaseStorage(req.files.planFile[0].filename);
                                if(chemin){
                                  module.chemin = chemin;
                                }
                            }
                            Modules.findByIdAndUpdate({_id:req.params.id},module, { new: true }).then((module) => {
                                          //console.log("Module", module);
                                          res.json({
                                            success: true,
                                            message: module
                                          });
                            }).catch((error) => {
                                          console.error(error);
                                          return res.status(500).json({
                                            success: false,
                                            message: error.message
                                          });
                            });

                        
                           
                        } catch (error) {
                            return res.status(500).json({
                                success:false,
                                message:error
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
             delete:function(req,res){
                acl.isAllowed(req.decoded.id,'box', 'create', async function(err,aclres){

                    if(aclres){

                        let module = await Modules.findOne({_id:req.params.id});
                        if(module.photo){
                            await uploadService.deleteFirebaseStorage(module.nom_photo);
                        }
                        if(module.chemin){
                            await uploadService.deleteFirebaseStorage(module.plan);
                        }
                        module.deleteOne().then((module)=>{
                            res.json({
                                success: true,
                                message:module
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
             getModule:function(req,res){
                acl.isAllowed(req.decoded.id,'box', 'create', async function(err,aclres){

                    if(aclres){
                        Modules.findOne({_id:req.params.id}).populate("project").populate("entreprise").then((module)=>{
                            res.json({
                                success: true,
                                message:module
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
             getAllModule:function(req,res){
                acl.isAllowed(req.decoded.id,'box', 'create', async function(err,aclres){

                    if(aclres){
                        Modules.find().populate("project").populate("entreprise").then((module)=>{
                            res.json({
                                success: true,
                                message:module
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
             getAllModuleByEntreprise:function(req,res){
                acl.isAllowed(req.decoded.id,'box', 'create', async function(err,aclres){

                    if(aclres){
                        Modules.find({entreprise:req.params.id}).populate("project").populate("entreprise").then((module)=>{
                            res.json({
                                success: true,
                                message:module
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
             getAccountModule:function(req,res){
                acl.isAllowed(req.decoded.id,'box', 'create', async function(err,aclres){

                    if(aclres){

                         let module = await Modules.find();
                         let stock = await Modules.find({type:'Stock'});
                         let preparation = await Modules.find({type:'En préparation'});
                         let pret = await Modules.find({type:'Prêt à partir'});
                         let site = await Modules.find({type:'Site'});

                         return res.status(200).json({
                            success: true,
                            message:{
                                module: module.length,
                                stock: stock.length,
                                preparation: preparation.length,
                                pret: pret.length,
                                site: site.length
                            }
                        });

                    }else{
                        return res.status(401).json({
                            success: false,
                            message: "401"
                        });
                    }
                })
             },
             getAccountModuleEntreprise:function(req,res){
                acl.isAllowed(req.decoded.id,'box', 'create', async function(err,aclres){

                    if(aclres){

                         let module = await Modules.find({entreprise:req.params.id});
                         let stock = await Modules.find({type:'Stock',entreprise:req.params.id});
                         let preparation = await Modules.find({type:'En préparation',entreprise:req.params.id});
                         let pret = await Modules.find({type:'Prêt à partir',entreprise:req.params.id});
                         let site = await Modules.find({type:'Site',entreprise:req.params.id});

                         return res.status(200).json({
                            success: true,
                            message:{
                                module: module.length,
                                stock: stock.length,
                                preparation: preparation.length,
                                pret: pret.length,
                                site: site.length
                            }
                        });

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