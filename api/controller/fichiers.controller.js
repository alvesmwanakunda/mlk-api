(function(){

    'use strict';
    var Dossier = require('../models/dossiers.model').DossierModel,
        Fichier = require('../models/fichiers.model').FichierModel,
        Project = require('../models/projets.model').ProjetModel;
        var ObjectId = require('mongoose').Types.ObjectId;
        var fs = require("fs");
        var uploadService = require('../services/upload.service');
        const bucket = require("../../firebase-config");


    module.exports=function(acl){
        return{
            create:function(req,res){
                acl.isAllowed(req.decoded.id,'box', 'create', async function(err,aclres){

                    if(aclres){

                        //console.log("File", req.file);

                        req.body.creator=req.decoded.id;
                        req.body.date=new Date();
                        req.body.dateLastUpdate=new Date();
                        let profondeur=0;

                        req.body.size=req.file.size;
                        let on=req.file.originalname.split('.');
                        let extension=on[on.length -1];
                        req.body.extension=extension;
                        req.body.nom=req.file.filename;

                        try {

                            let path="./public/"+req.file.filename;
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
                                    let fichier=new Fichier(req.body);

                                    fichier.save().then((data)=>{

                                        /*fs.unlink(path, (err) => {
                                            if (err) {
                                              console.error(err);
                                              return;
                                            }
                                        });*/
                                        uploadService.uploadFileToFirebaseStorage(req.file.filename)
                                        .then((downloadUrl) => {
                                          Fichier.findByIdAndUpdate(data._id, { chemin: downloadUrl }, { new: true })
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
                                let fichier=new Fichier(req.body);

                                fichier.save().then((data)=>{

                                    /*fs.unlink(path,(err)=>{
                                        if(err){
                                            console.error(err)
                                            return
                                        }
                                    });*/
                                    uploadService.uploadFileToFirebaseStorage(req.file.filename)
                                        .then((downloadUrl) => {
                                          Fichier.findByIdAndUpdate(data._id, { chemin: downloadUrl }, { new: true })
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
                                }).catch((error)=>{
                                    return res.status(500).json({
                                        success:false,
                                        message:error.message
                                    })
                                })
                            }
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
            createProject:function(req,res){
                acl.isAllowed(req.decoded.id,'box', 'create', async function(err,aclres){

                    if(aclres){

                        req.body.creator=req.decoded.id;
                        req.body.date=new Date();
                        req.body.dateLastUpdate=new Date();
                        req.body.project=req.params.id;
                        let profondeur=0;

                        req.body.size=req.file.size;
                        let on=req.file.originalname.split('.');
                        let extension=on[on.length -1];
                        req.body.extension=extension;
                        req.body.nom=req.file.filename;

                        try {

                            let path="./public/"+req.file.filename;
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
                                    let fichier=new Fichier(req.body);

                                    fichier.save().then((data)=>{

                                        uploadService.uploadFileToFirebaseStorage(req.file.filename)
                                        .then((downloadUrl) => {
                                          Fichier.findByIdAndUpdate(data._id, { chemin: downloadUrl }, { new: true })
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
                                let fichier=new Fichier(req.body);

                                fichier.save().then((data)=>{

                                    uploadService.uploadFileToFirebaseStorage(req.file.filename)
                                        .then((downloadUrl) => {
                                          Fichier.findByIdAndUpdate(data._id, { chemin: downloadUrl }, { new: true })
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
                                }).catch((error)=>{
                                    return res.status(500).json({
                                        success:false,
                                        message:error.message
                                    })
                                })
                            }
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

                        let fichier = await Fichier.findOne({_id:req.params.id});
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

                                    uploadService.deleteFirebaseStorage(fichier.nom);
                                    uploadService.uploadFileToFirebaseStorage(req.file.filename)
                                    .then((downloadUrl) => {
                                      req.body.chemin=downloadUrl;
                                      Fichier.findByIdAndUpdate({_id:fichier._id}, req.body, { new: true })
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
            /*update:function(req,res){
                acl.isAllowed(req.decoded.id,'box', 'create', async function(err,aclres){

                    if(aclres){

                        let fichier = await Fichier.findOne({_id:req.params.id});

                        req.body.creator=req.decoded.id;
                        req.body.date=new Date();
                        req.body.dateLastUpdate=new Date();
                        let profondeur=0;

                        req.body.size=req.file.size;
                        let on=req.file.originalname.split('.');
                        let extension=on[on.length -1];
                        req.body.extension=extension;
                        req.body.nom=req.file.filename;

                        try {

                            let path="./public/"+req.file.filename;
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

                                    Fichier.findOneAndUpdate({_id:req.params.id},req.body,new true).then((data)=>{

                                        uploadService.uploadFileToFirebaseStorage(req.file.filename)
                                        .then((downloadUrl) => {
                                          Fichier.findByIdAndUpdate(data._id, { chemin: downloadUrl }, { new: true })
                                            .then((updatedFile) => {
                                             uploadService.deleteFirebaseStorage(fichier.nom).then((data)=>{})
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
                                Fichier.findOneAndUpdate({_id:req.params.id},req.body,new true).then((data)=>{
                                    uploadService.uploadFileToFirebaseStorage(req.file.filename)
                                        .then((downloadUrl) => {
                                          Fichier.findByIdAndUpdate(data._id, { chemin: downloadUrl }, { new: true })
                                            .then((updatedFile) => {
                                              uploadService.deleteFirebaseStorage(fichier.nom).then((data)=>{})  
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
                                }).catch((error)=>{
                                    return res.status(500).json({
                                        success:false,
                                        message:error.message
                                    })
                                })
                            }

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
            },*/
            delete(req,res){
                acl.isAllowed(req.decoded.id,'box', 'delete', async function(err,aclres){

                    if(aclres){

                        let fichier = await Fichier.findOne({_id:req.params.id});
                        uploadService.deleteFirebaseStorage(fichier.nom).then((data)=>{
                            fichier.deleteOne().then((data)=>{
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

                        let fichier = await Fichier.findOne({_id:req.params.id});
                        if(!fichier){
                            return res.status(404).json({
                                success: false,
                                message: '404'
                              });
                        }else{
                            return res.json({
                                success: true,
                                message: fichier
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

            donwload:function(req,res){

                acl.isAllowed(req.decoded.id,'box', 'create', async function(err,aclres){

                    if(aclres){
                        let fichier = await Fichier.findOne({_id:req.params.id});
                        try {
                            console.log("chemin",`files/${fichier.nom}`)
                            const file = bucket.file(`files/${fichier.nom}`);
                            const [fileStream] = await file.createReadStream();
                            res.set('Content-Disposition', `attachment; filename="${fichier.nom}"`);
                            fileStream.pipe(res);
                        } catch (error) {
                            console.error('Erreur lors de la récupération du fichier :', error);
                            res.status(500).send('Erreur lors de la récupération du fichier');
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