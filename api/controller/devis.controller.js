(function(){
    "use strict";
    var Devis = require('../models/devis.model').DevisModel;
    var uploadService = require('../services/upload.service');

    module.exports=function(acl){

        return{
             create:function(req,res){
                acl.isAllowed(req.decoded.id,'box', 'create', async function(err,aclres){

                    if(aclres){

                        //console.log("File", req.file)

                        let devis = new Devis();

                        devis.dateLastUpdate=new Date();
                        devis.nom=req.body.nom;
                        devis.numero=req.body.numero;
                        
                        if(req.body.projet){
                            devis.projet=req.body.projet;
                        }
                        try {
                            if(req.file){
                                devis.size=req.file.size;
                                let on=req.file.originalname.split('.');
                                let extension=on[on.length -1];
                                devis.extension=extension;
                                devis.devis=req.file.filename;
                                let chemin = await uploadService.uploadFileToFirebaseStorage(req.file.filename);
                                if(chemin){
                                  devis.chemin = chemin;
                                }
                            }
                            devis.save().then((data)=>{

                                res.json({
                                    success: true,
                                    message: data
                                  });
                              
                            }).catch((error)=>{
                                return res.status(500).json({
                                    success:false,
                                    message:error
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

                        let devis = await Devis.findOne({_id:req.params.id});

                        devis.dateLastUpdate=new Date();
                        devis.nom=req.body.nom;
                        devis.numero=req.body.numero;
                        
                        if(req.body.projet){
                            devis.projet=req.body.projet;
                        }

                        try {

                            if(req.file){
                                devis.size=req.file.size;
                                let on=req.file.originalname.split('.');
                                let extension=on[on.length -1];
                                devis.extension=extension;
                                devis.devis=req.file.filename;
                                let chemin = await uploadService.uploadFileToFirebaseStorage(req.file.filename);
                                uploadService.deleteFirebaseStorage(devis.devis);
                                if(chemin){
                                  devis.chemin = chemin;
                                }
                            }
                            Devis.findByIdAndUpdate({_id:req.params.id},devis, { new: true }).then((module) => {
                                          //console.log("Module", module);
                                          res.json({
                                            success: true,
                                            message: module
                                          });
                            }).catch((error) => {
                                          console.error(error);
                                          return res.status(500).json({
                                            success: false,
                                            message: error
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

                        let devis= await Devis.findOne({_id:req.params.id});
                        if(devis.devis){
                            await uploadService.deleteFirebaseStorage(devis.devis);
                        }
                        
                        devis.deleteOne().then((module)=>{
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
             getDevis:function(req,res){
                acl.isAllowed(req.decoded.id,'box', 'create', async function(err,aclres){

                    if(aclres){
                        Devis.findOne({_id:req.params.id}).populate("projet").then((module)=>{
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
             getAllDevis:function(req,res){
                acl.isAllowed(req.decoded.id,'box', 'create', async function(err,aclres){

                    if(aclres){
                        Devis.find().populate("projet").then((module)=>{
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
             getAllDevisByProjet:function(req,res){
                acl.isAllowed(req.decoded.id,'box', 'create', async function(err,aclres){

                    if(aclres){
                        Devis.find({projet:req.params.id}).populate("projet").then((module)=>{
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
        }
    }
})();