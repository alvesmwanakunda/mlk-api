(function(){
    "use strict";
    var Facture = require('../models/facture.mode').FacturesModel;
    var uploadService = require('../services/upload.service');

    module.exports=function(acl){

        return{
             create:function(req,res){
                acl.isAllowed(req.decoded.id,'box', 'create', async function(err,aclres){

                    if(aclres){

                        let facture = new Facture();

                        facture.dateLastUpdate=new Date();
                        facture.nom=req.body.nom;
                        facture.numero=req.body.numero;
                        
                        if(req.body.projet){
                            facture.projet=req.body.projet;
                        }
                        try {
                            if(req.file){
                                facture.size=req.file.size;
                                let on=req.file.originalname.split('.');
                                let extension=on[on.length -1];
                                facture.extension=extension;
                                facture.facture=req.file.filename;
                                let chemin = await uploadService.uploadFileToFirebaseStorage(req.file.filename);
                                if(chemin){
                                  facture.chemin = chemin;
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

                        let facture = await Facture.findOne({_id:req.params.id});

                        facture.dateLastUpdate=new Date();
                        facture.nom=req.body.nom;
                        facture.numero=req.body.numero;
                        
                        if(req.body.projet){
                            facture.projet=req.body.projet;
                        } 

                        try {

                            if(req.file){
                                facture.size=req.file.size;
                                let on=req.file.originalname.split('.');
                                let extension=on[on.length -1];
                                facture.extension=extension;
                                facture.facture=req.file.filename;
                                let chemin = await uploadService.uploadFileToFirebaseStorage(req.file.filename);
                                uploadService.deleteFirebaseStorage(facture.facture);
                                if(chemin){
                                 facture.chemin = chemin;
                                }
                            }
                            Facture.findByIdAndUpdate({_id:req.params.id},facture, { new: true }).then((module) => {
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

                        let facture= await Facture.findOne({_id:req.params.id});
                        if(facture.facture){
                            await uploadService.deleteFirebaseStorage(facture.facture);
                        }
                        
                        facture.deleteOne().then((module)=>{
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
             getFacture:function(req,res){
                acl.isAllowed(req.decoded.id,'box', 'create', async function(err,aclres){

                    if(aclres){
                        Facture.findOne({_id:req.params.id}).populate("projet").then((module)=>{
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
             getAllFactures:function(req,res){
                acl.isAllowed(req.decoded.id,'box', 'create', async function(err,aclres){

                    if(aclres){
                        Facture.find().populate("projet").then((module)=>{
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
             getAllFacturesByProjet:function(req,res){
                acl.isAllowed(req.decoded.id,'box', 'create', async function(err,aclres){

                    if(aclres){
                        Facture.find({projet:req.params.id}).populate("projet").then((module)=>{
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