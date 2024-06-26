(function(){
    'use strict';
    var Modules = require("../models/modules.model").ModulesModel;
    var ProjetModules = require("../models/projetModule.model").ProjetModulesModel;
    var Projet = require("../models/projets.model").ProjetModel;
    var uploadService = require('../services/upload.service');
    var qrcodeService = require('../services/qrCode.service');
    const bucket = require("../../firebase-config");
    var codes = require('voucher-code-generator');
    var fs = require("fs");


    module.exports=function(acl){

        return{
             create:function(req,res){
                acl.isAllowed(req.decoded.id,'box', 'create', async function(err,aclres){

                    if(aclres){

                        console.log("Ici")

                        var code = codes.generate({
                            length: 12,
                            count: 1,
                            charset: "0123456789"
                        });
                        code = code[0];
                        let numero=0;
                        let totalDigits = 4;
                        let leadingZeros;

                        //const lastRecord = await Modules.findOne({sort:{'dateLastUpdate': -1}});
                        const count = await Modules.countDocuments();

                        if(count){
                           numero=Math.floor(Math.log10(count)) + 1;
                           leadingZeros =  totalDigits - numero;
                        }
                        let module = new Modules();

                        module.dateLastUpdate=new Date();
                        module.type=req.body.type;
                        module.nom=req.body.nom;
                        module.categorie=req.body.categorie;
                        module.position=req.body.position;
                        module.hauteur=req.body.hauteur;
                        module.largeur=req.body.largeur;
                        module.longueur=req.body.longueur;
                        module.marque=req.body.marque;
                        module.dateFabrication=req.body.dateFabrication;
                        module.entreprise= req.body.entreprise;
                        module.module_type = req.body.module_type;
                        module.qrcode=code;
                        if(req.body.marque){
                            module.numero_serie = req.body.marque.substring(0, 3).toUpperCase()+"0".repeat(leadingZeros)+count;
                        }else{
                            module.numero_serie = "FAB"+"0".repeat(leadingZeros)+count
                        }
                        /*if(req.body.marque=="ALGECO"){
                            module.numero_serie = "AL"+"0".repeat(leadingZeros)+count;
                        }if(req.body.marque=="COUGNAUD"){
                            module.numero_serie = "CG"+"0".repeat(leadingZeros)+count;
                        }if(req.body.marque=="TEPE PREFABRIK"){
                            module.numero_serie = "TP"+"0".repeat(leadingZeros)+count;
                        }if(req.body.marque=="CONTAINEX"){
                            module.numero_serie = "CT"+"0".repeat(leadingZeros)+count;
                        }*/
                        
                       
                        
                        try {
                            if(req.files.imageFile){
                                module.nom_photo=req.files.imageFile[0].filename;
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
                        module.categorie=req.body.categorie;
                        module.hauteur=req.body.hauteur;
                        module.largeur=req.body.largeur;
                        module.longueur=req.body.longueur;
                        //module.marque=req.body.marque;
                        module.entreprise= req.body.entreprise;
                        module.dateFabrication=req.body.dateFabrication;
                        module.module_type = req.body.module_type;

                        if(module.marque !=req.body.marque){
                            module.marque=req.body.marque;
                            let numero = module.numero_serie.slice(3);
                            module.numero_serie = req.body.marque.substring(0, 3).toUpperCase()+""+numero;
                        }
                    
                        try {

                            if(req.files.imageFile){
                                if(module.nom_photo){
                                  uploadService.deleteFirebaseStorage(module.nom_photo);
                                }
                                module.nom_photo=req.files.imageFile[0].filename;
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
                        let projetModule = await ProjetModules.find({module:req.params.id}).sort({_id:-1}).limit(1);
                        let projet;
                        if(projetModule.length){
                            projet = await Projet.findOne({_id:projetModule[0].projet});
                        }
                       
                        Modules.findOne({_id:req.params.id}).populate("entreprise").then((module)=>{
                            res.json({
                                success: true,
                                message:module,
                                projet:projet
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
                        Modules.find().then((module)=>{
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
                        Modules.find({entreprise:req.params.id}).then((module)=>{
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
                            data:[
                                {y:stock.length, name:"Stock"},
                                {y:preparation.length, name:"En préparation"},
                                {y:pret.length, name:"Prêt à partir"},
                                {y:site.length, name:"Site"}
                            ],
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
                            data:[
                                {y:stock.length, name:"Stock"},
                                {y:preparation.length, name:"En préparation"},
                                {y:pret.length, name:"Prêt à partir"},
                                {y:site.length, name:"Site"}
                            ],
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

             updateImage:function(req,res){
                acl.isAllowed(req.decoded.id,'box', 'create', async function(err,aclres){

                    if(aclres){

                        let module = await Modules.findOne({_id:req.params.id});
                        let nameFile = module.nom_photo;
                        try {
                            if(req.file){
                                module.nom_photo = req.file.filename;
                                uploadService.deleteFirebaseStorage(nameFile);
                                module.photo = await uploadService.uploadFileToFirebaseStorage(req.file.filename);;
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

             updatePlan:function(req,res){
                acl.isAllowed(req.decoded.id,'box', 'create', async function(err,aclres){

                    if(aclres){
                        let module = await Modules.findOne({_id:req.params.id});
                        let nameFile = module.plan;
                        try {

                            if(req.file){
                                
                                let on=req.file.originalname.split('.');
                                let extension=on[on.length -1];
                                module.extension=extension;
                                module.plan=req.file.filename;
                                uploadService.deleteFirebaseStorage(nameFile);
                                let chemin = await uploadService.uploadFileToFirebaseStorage(req.file.filename);
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

             // Get QRCODE

             getQrcodeModule:function(req,res){
                acl.isAllowed(req.decoded.id,'box', 'create', async function(err,aclres){

                    if(aclres){

                        let module = await Modules.findOne({_id:req.params.id});
                        //console.log("Module", module);
                        if(module){
                            let qrcode = await qrcodeService.module_qrcode(module._id,100,50);
                            res.json({
                                success: true,
                                message:qrcode
                            });

                        }else{
                            res.json({
                                success: true,
                                message:"Error QrCode"
                            });
                        }
                    }else{
                        return res.status(401).json({
                            success: false,
                            message: "401"
                        });  
                    }
                })

             },

             getModuleQrCode:async function(req,res){
                        let module = await Modules.findOne({_id:req.params.id}).populate('entreprise');
                        if(module){
                            res.json({
                                success: true,
                                message:module
                            });

                        }else{
                            res.json({
                                success: true,
                                message:"Error QrCode"
                            });
                        }
             },

             // Affectation du module a un projet

             affectModule:function(req,res){
                acl.isAllowed(req.decoded.id,'box', 'create', async function(err,aclres){

                    if(aclres){

                      
                        let module = new ProjetModules();
                        module.dateLastUpdate=new Date();
                        module.module=req.params.id;
                        module.projet=req.body.projet;

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
                       
                    }else{
                        return res.status(401).json({
                            success: false,
                            message: "401"
                        });  
                    }
                })

             },

             getAllModuleProjet:function(req,res){
                acl.isAllowed(req.decoded.id,'box', 'create', async function(err,aclres){

                    if(aclres){
                        ProjetModules.find({module:req.params.id}).populate("projet").then((module)=>{
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

             deleteModuleProjet:function(req,res){
                acl.isAllowed(req.decoded.id,'box', 'create', async function(err,aclres){

                    if(aclres){

                        let module = await ProjetModules.findOne({_id:req.params.id});
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

             getAllModuleByProjet:function(req,res){
                acl.isAllowed(req.decoded.id,'box', 'create', async function(err,aclres){

                    if(aclres){
                        ProjetModules.find({projet:req.params.id}).populate("module").then((module)=>{
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