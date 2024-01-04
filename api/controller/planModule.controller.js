(function(){

    'use strict';
    var Plan = require('../models/planModule.model').PlanModuleModel;
    var uploadService = require('../services/upload.service');


    module.exports=function(acl){
        return {

            create:function(req,res){
                acl.isAllowed(req.decoded.id,'box', 'create', async function(err,aclres){

                    if(aclres){

                        //console.log("File", req.files);

                        req.body.creator=req.decoded.id;
                        req.body.module=req.params.id;
                        req.body.date=new Date();
                        req.body.dateLastUpdate=new Date();
                        let files = req.files;

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
                                let plan=new Plan(req.body);
                                const savedFichier = await plan.save();
                                const downloadUrl = await uploadService.uploadFileToFirebaseStorage(file.filename);
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
                                    uploadService.deleteFirebaseStorage(plan.nom);
                                    uploadService.uploadFileToFirebaseStorage(req.file.filename)
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
                        await uploadService.deleteFirebaseStorage(plan.nom);
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

        }
    }
})();