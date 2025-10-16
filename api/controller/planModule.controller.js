(function(){

    'use strict';
    var Plan = require('../models/planModule.model').PlanModuleModel;
    var Dossier = require('../models/dossiersModule.model').DossierModuleModel;
    var uploadService = require('../services/upload.service');


    module.exports=function(acl){
        return {

            create:function(req,res){
                acl.isAllowed(req.decoded.id,'box', 'create', async function(err,aclres){

                    //console.log("Bonjour", req);

                    if(aclres){

                        req.body.creator=req.decoded.id;
                        req.body.module=req.params.id;
                        req.body.date=new Date();
                        req.body.dateLastUpdate=new Date();
                        let files = req.files;
                        let profondeur=0;

                        try {

                            if(!files || files.length===0){
                                return res.status(400).json({
                                    success: false,
                                    message: 'Aucun fichier n\'a été téléchargé.',
                                });
                            }
                            const uploadPromises = files.map(async(file)=>{

                                req.body.size=file.size;
                                let on=file.originalname.split('.');
                                let extension=on[on.length -1];
                                req.body.extension=extension;
                                req.body.nom=file.filename;

                                if(req.body.dossierParent){

                                    const dossier = await  Dossier.findOne({_id:req.body.dossierParent});
                                    if (!dossier) {
                                        return{
                                            success:false,
                                            code:"404",
                                            message:"le dossier parent spécifié est introuvable"
                                        };
                                    }

                                    profondeur=dossier.profondeur+1;
                                }
                                req.body.profondeur=profondeur;

                                let plan=new Plan(req.body);
                                const savedFichier = await plan.save();
                                const downloadUrl = await uploadService.uploadPlansToFirebaseStorage(file.filename);
                                const updatedFile = await Plan.findByIdAndUpdate(savedFichier._id,{chemin:downloadUrl},{new:true});
                                return {
                                    success:true,
                                    message:updatedFile
                                };
                            });
                            Promise.all(uploadPromises)
                            .then((results) => {
                              return res.json({
                                success: true,
                                message: results,
                              });
                            })
                            .catch((error) => {
                              console.error(error);
                              return res.status(500).json({
                                success: false,
                                message: error.message,
                              });
                            });
                        } catch (error) {
                            console.log("Erreur", error);
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

                        let plan = await Plan.findOne({_id:req.params.id});
                        let notfound={
                            success:false,
                            code:"404",
                            message:"le dossier parent spécifié est introuvable"
                        };
                        if(fichier){
                            req.body.creator=req.decoded.id;

                            req.body.date=new Date();
                            req.body.dateLastUpdate=new Date();
                            req.body.size=req.file.size;
                            let on=req.file.originalname.split('.');
                            let extension=on[on.length -1];
                            req.body.extension=extension;
                            req.body.nom=req.file.filename;

                            try {
                                    uploadService.deletePlansFirebaseStorage(plan.nom);
                                    uploadService.uploadPlansToFirebaseStorage(req.file.filename)
                                    .then((downloadUrl) => {
                                      req.body.chemin=downloadUrl;
                                      Plan.findByIdAndUpdate({_id:plan._id}, req.body, { new: true })
                                        .then((updatedFile) => {
                                          res.json({
                                            success: true,
                                            message: updatedFile
                                          });
                                        })
                                        .catch((error) => {
                                          console.error(error);
                                          return res.status(500).json({
                                            success: false,
                                            message: error.message
                                          });
                                        });
                                    });
                                
                            } catch (error) {
                                return res.status(500).json({
                                    success:false,
                                    message:error.message
                                })
                            }


                        }else{
                          res.json(notfound);
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

                        let plan = await Plan.findOne({_id:req.params.id});
                        await uploadService.deletePlansFirebaseStorage(plan.nom);
                        plan.deleteOne().then((data)=>{
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
            read:function(req,res){
                acl.isAllowed(req.decoded.id,'box', 'create', async function(err,aclres){

                    if(aclres){

                        let plan = await Plan.findOne({_id:req.params.id});
                        if(!plan){
                            return res.status(404).json({
                                success: false,
                                message: '404'
                              });
                        }else{
                            return res.json({
                                success: true,
                                message: plan
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
            readAll:function(req,res){
                acl.isAllowed(req.decoded.id,'box', 'create', async function(err,aclres){

                    if(aclres){

                        let plan = await Plan.find({module:req.params.id}).populate('creator');
                        if(!plan){
                            return res.status(404).json({
                                success: false,
                                message: '404'
                              });
                        }else{
                            return res.json({
                                success: true,
                                message: plan
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
            moveFile:function(req,res){
                acl.isAllowed(req.decoded.id,'box', 'create', async function(err,aclres){
                    if(aclres){
                        let file = await Plan.findOne({_id:req.params.id});
                        let parent = await Dossier.findOne({_id:req.params.parent});
                        if(parent){
                         //file.dossierParent = parent._id;
                         //file.profondeur = parent.profondeur + 1;

                         Plan.findOneAndUpdate({_id:req.params.id},{dossierParent:parent._id, profondeur: parent.profondeur + 1},{new:true}).then((data)=>{
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

            // dossier

            list:function(req,res){
                acl.isAllowed(req.decoded.id,'box', 'create', async function(err,aclres){

                    if(aclres){

                        let dossiers = await Dossier.find({profondeur:0,module:req.params.id}).populate('creator');
                        let fichiers = await Plan.find({profondeur:0,module:req.params.id}).populate('creator');

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
            createDossier:function(req,res){
                acl.isAllowed(req.decoded.id,'box', 'create', async function(err,aclres){

                    if(aclres){

                        req.body.date=new Date();
                        req.body.dateLastUpdate=new Date();
                        req.body.creator=req.decoded.id;
                        req.body.module=req.params.id;
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
            readDossier:function(req,res){
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
                            let fichiers = await Plan.find({dossierParent:dossier._id}).populate('creator').populate('dossierParent');

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
            updateDossier:function(req,res){
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
            deleteDossier(req,res){
                acl.isAllowed(req.decoded.id,'box', 'delete', async function(err,aclres){

                    if(aclres){

                        try {

                            let dossier = await Dossier.findOne({_id:req.params.id});
                            await dossier.deleteOne();
                            res.json({
                                success: true,
                                message:"Folder delete"
                            });
                            
                        } catch (error) {
                            return res.status(500).json({
                                success:false,
                                message:error.message
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
            moveFolder(req,res){
                acl.isAllowed(req.decoded.id,'box', 'update', async function(err,aclres){
                    if(aclres){
                           let dossier = await Dossier.findOne({_id:req.params.id});
                           let parent = await Dossier.findOne({_id:req.params.parent});
                           if(parent){
                            dossier.dossierParent = parent._id;
                            dossier.profondeur = parent.profondeur + 1;

                            Dossier.findOneAndUpdate({_id:req.params.id},dossier,{new:true}).then((data)=>{
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
            }

        }
    }
})();