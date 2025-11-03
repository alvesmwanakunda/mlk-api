(function(){
    'use strict';
    var Modules = require("../models/modules.model").ModulesModel;
    var ProjetModules = require("../models/projetModule.model").ProjetModulesModel;
    var FicheTechniques = require('../models/ficheTechnique.model').FicheTechniqueModel;
    var Projet = require("../models/projets.model").ProjetModel;
    var uploadService = require('../services/upload.service');
    var qrcodeService = require('../services/qrCode.service');
    var moduleService = require('../services/modules.service');
    var Dossier = require('../models/dossiersModule.model').DossierModuleModel;
    var Plan = require('../models/plans.model').PlanModel;

    const bucket = require("../../firebase-config").bucket;
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
                        let plan=new Plan();

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
                                module.photo = await uploadService.uploadModuleToFirebaseStorage(req.files.imageFile[0].filename);
                            }
                            if(req.files.planFile){
                                let on=req.files.planFile[0].originalname.split('.');
                                let extension=on[on.length -1];
                                module.extension=extension;
                                module.plan=req.files.planFile[0].filename;
                                let chemin = await uploadService.uploadPlansToFirebaseStorage(req.files.planFile[0].filename);
                                if(chemin){
                                  module.chemin = chemin;
                                  plan.chemin= chemin;
                                }
                            }
                            module.save().then(async (data)=>{

                                if(req.files.planFile){
                                    plan.creator=req.decoded.id;
                                    plan.module=data._id;
                                    plan.date=new Date();
                                    plan.dateLastUpdate=new Date();
                                    plan.extension=data?.extension;
                                    plan.nom=data?.plan;
                                    //plan.chemin=await uploadService.uploadPlansToFirebaseStorage(req.files.planFile[0].filename);;
                                    await plan.save();
                                }

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
                        let plan=new Plan();


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
                                  uploadService.deleteModuleFirebaseStorage(module.nom_photo);
                                }
                                module.nom_photo=req.files.imageFile[0].filename;
                                module.photo = await uploadService.uploadModuleToFirebaseStorage(req.files.imageFile[0].filename);
                            }
                            if(req.files.planFile){
                                let on=req.files.planFile[0].originalname.split('.');
                                let extension=on[on.length -1];
                                module.extension=extension;
                                module.plan=req.files.planFile[0].filename;
                                //uploadService.deletePlansFirebaseStorage(module.plan);
                                let chemin = await uploadService.uploadPlansToFirebaseStorage(req.files.planFile[0].filename);
                                if(chemin){
                                  module.chemin = chemin;
                                  plan.chemin= chemin;
                                }
                            }
                            Modules.findByIdAndUpdate({_id:req.params.id},module, { new: true }).then(async (module) => {

                                        if(req.files.planFile){
                                                plan.creator=req.decoded.id;
                                                plan.module=module._id;
                                                plan.date=new Date();
                                                plan.dateLastUpdate=new Date();
                                                plan.extension=module?.extension;
                                                plan.nom=module?.plan;
                                                //plan.chemin=await uploadService.uploadPlansToFirebaseStorage(req.files.planFile[0].filename);
                                                await plan.save();
                                        }

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
                            await uploadService.deleteModuleFirebaseStorage(module.nom_photo);
                        }
                        /*if(module.chemin){
                            await uploadService.deletePlansFirebaseStorage(module.plan);
                        }*/
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

                         let module = await Modules.countDocuments();
                         let stock = await Modules.countDocuments({type:'Stock'});
                         let preparation = await Modules.countDocuments({type:'En préparation'});
                         let pret = await Modules.countDocuments({type:'Prêt à partir'});
                         let site = await Modules.countDocuments({type:'Site'});

                         //console.log("count", module);

                         return res.status(200).json({
                            success: true,
                            data:[
                                {y:stock, name:"Parc"},
                                {y:preparation, name:"En préparation"},
                                {y:pret, name:"Prêt à partir"},
                                {y:site, name:"Site"}
                            ],
                            message:{
                                module: module,
                                stock: stock,
                                preparation: preparation,
                                pret: pret,
                                site: site
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

                         let module = await Modules.countDocuments({entreprise:req.params.id});
                         let stock = await Modules.countDocuments({type:'Stock',entreprise:req.params.id});
                         let preparation = await Modules.countDocuments({type:'En préparation',entreprise:req.params.id});
                         let pret = await Modules.countDocuments({type:'Prêt à partir',entreprise:req.params.id});
                         let site = await Modules.countDocuments({type:'Site',entreprise:req.params.id});

                         return res.status(200).json({
                            success: true,
                            data:[
                                {y:stock, name:"Parc"},
                                {y:preparation, name:"En préparation"},
                                {y:pret, name:"Prêt à partir"},
                                {y:site, name:"Site"}
                            ],
                            message:{
                                module: module,
                                stock: stock,
                                preparation: preparation,
                                pret: pret,
                                site: site
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
                                uploadService.deleteModuleFirebaseStorage(nameFile);
                                module.photo = await uploadService.uploadModuleToFirebaseStorage(req.file.filename);;
                            }
                         
                            Modules.findByIdAndUpdate({_id:req.params.id},{
                                nom_photo: module.nom_photo, // Champ à mettre à jour
                                photo: module.photo, // Champ à mettre à jour
                              },{ new: true }).then((module) => {
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
                        let plan=new Plan();
                        let nameFile = module.plan;
                        try {

                            if(req.file){
                                
                                let on=req.file.originalname.split('.');
                                let extension=on[on.length -1];
                                module.extension=extension;
                                module.plan=req.file.filename;
                                //uploadService.deletePlansFirebaseStorage(nameFile);
                                let chemin = await uploadService.uploadPlansToFirebaseStorage(req.file.filename);
                                if(chemin){
                                  module.chemin = chemin;
                                  plan.chemin= chemin;
                                }
                            }
                            Modules.findByIdAndUpdate({_id:req.params.id},{
                                extension: module.extension, // Champ à mettre à jour
                                plan: module.plan, // Champ à mettre à jour
                                chemin: module.chemin, // Champ à mettre à jour
                              },{ new: true }).then(async (module) => {
                                          //console.log("Module", module);
                                          if(req.file){
                                                plan.creator=req.decoded.id;
                                                plan.module=module._id;
                                                plan.date=new Date();
                                                plan.dateLastUpdate=new Date();
                                                plan.extension=module?.extension;
                                                plan.nom=module?.plan;
                                               
                                                await plan.save();
                                        }
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

             getAllQrcodeModule:function(req,res){
                acl.isAllowed(req.decoded.id,'box', 'create', async function(err,aclres){

                    if(aclres){

                        try{

                            const {moduleIds} = req.body;

                            if (!moduleIds || !Array.isArray(moduleIds)) {
                                return res.status(400).json({
                                    success: false,
                                    message: "moduleIds doit être un tableau"
                                });
                            }

                            // Générer tous les QR codes
                            const qrcodes = await qrcodeService.modules_qrcodes(moduleIds, 200);
                            
                            res.json({
                                success: true,
                                message: qrcodes
                            });
                        } catch (error) {
                            res.status(500).json({
                                success: false,
                                message: error.message
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
                        let dossier = new Dossier();
                        


                        module.dateLastUpdate=new Date();
                        module.module=req.params.id;
                        module.projet=req.body.projet;
                        module.position=req.body.position;

                        if(req.file){
                            let on=req.file.originalname.split('.');
                            let extension=on[on.length -1];
                            module.extension=extension;
                            module.plan = await uploadService.uploadProjetsModulesToFirebaseStorage(req.file.filename);
                        }
                        
                        module.save().then( async (data)=>{

                            if(req.body.projet){

                                let projet = await Projet.findOne({_id:req.body.projet});
                                dossier.date=new Date();
                                dossier.dateLastUpdate=new Date();
                                dossier.creator=req.decoded.id;
                                dossier.profondeur=0;
                                dossier.module=req.params.id;
                                dossier.nom = projet.projet;
                                dossier.project = req.body.projet;
                                dossier.projetmodule = data._id
                                await dossier.save();
                            }

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

             updateProjetModule:function(req,res){

                acl.isAllowed(req.decoded.id,'box', 'create', async function(err,aclres){
                     if(aclres){
                          let module = await ProjetModules.findOne({_id:req.params.id});
                          let dossier = await Dossier.findOne({projetmodule:req.params.id});
                          module.projet = req.body.projet;
                          let plan = module?.plan;

                          if(req.file){
                            let on=req.file.originalname.split('.');
                            let extension=on[on.length -1];
                            module.extension=extension;
                            if(plan){
                              await uploadService.deleteProjetsModulesFirebaseStorage(plan);
                            }
                            module.plan = await uploadService.uploadProjetsModulesToFirebaseStorage(req.file.filename);
                          }
                          
                          ProjetModules.findByIdAndUpdate({_id:req.params.id},module, { new: true }).then( async (module) => {
                                if(!dossier.project.equals(module.projet)){
                                    let projet = await Projet.findOne({_id:module.projet});
                                    dossier.project = projet._id;
                                    dossier.nom = projet.projet;
                                    await Dossier.findByIdAndUpdate({_id:dossier._id}, dossier, {new:true});
                                }
                                res.json({
                                  success: true,
                                  message: module
                                });
                          }).catch((error) => {
                                return res.status(500).json({
                                    success: false,
                                    message: error.message
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

             getProjetModule:function(req,res){

                acl.isAllowed(req.decoded.id,'box', 'create', async function(err,aclres){
                     if(aclres){
                          
                          ProjetModules.findOne({_id:req.params.id}).then((module) => {
                                res.json({
                                  success: true,
                                  message: module
                                });
                          }).catch((error) => {
                                return res.status(500).json({
                                    success: false,
                                    message: error.message
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

             updatePositionModule:function(req,res){

                acl.isAllowed(req.decoded.id,'box', 'create', async function(err,aclres){
                     if(aclres){
                          let projetM=null;
                          let module = await Modules.findOne({_id:req.params.id});
                          console.log("module", module);

                          if(module){
                            let projetModule = await ProjetModules.find({module:module._id}).sort({_id:-1}).limit(1);
                            projetM = projetModule[0];
                            console.log("Projet Module", projetM);

                            ProjetModules.findByIdAndUpdate({_id:projetM._id},req.body, { new: true }).then((module) => {
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
                            
                          }else{
                            return res.status(500).json({
                                success: false,
                                message: error.message
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
                        if(module.plan){
                          await uploadService.deleteProjetsModulesFirebaseStorage(module.plan);
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

             getAllModuleByProjet:function(req,res){
                acl.isAllowed(req.decoded.id,'box', 'create', async function(err,aclres){

                    if(aclres){
                        ProjetModules.find({projet:req.params.id}).populate({
                            path: 'module',
                            populate: {
                            path: 'entreprise',
                            model: 'Entreprises'
                            }
                        }).then((module)=>{
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

             // All module by Type

             /*getAllModuleStock:function(req,res){
                acl.isAllowed(req.decoded.id,'box', 'create', async function(err,aclres){

                    if(aclres){
                        Modules.find({type:"Stock"}).then((module)=>{
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

             },*/
             getAllModuleStock: function(req, res) {
                acl.isAllowed(req.decoded.id, 'box', 'create', async function(err, aclres) {
                    if(aclres) {
                        try {
                            const modules = await Modules.aggregate([
                                // Filtrer les modules en stock
                                { $match: { type: "Stock" } },
                                
                                // Joindre avec ProjetModules
                                {
                                    $lookup: {
                                        from: "projetmodules",
                                        localField: "_id",
                                        foreignField: "module",
                                        as: "affectations"
                                    }
                                },
                                
                                // Trier les affectations par date et prendre la plus récente
                                {
                                    $addFields: {
                                        derniereAffectation: {
                                            $arrayElemAt: [
                                                {
                                                    $sortArray: {
                                                        input: "$affectations",
                                                        sortBy: { dateLastUpdate: -1 }
                                                    }
                                                },
                                                0
                                            ]
                                        }
                                    }
                                },
                                
                                // Joindre avec Projets pour récupérer le nom du dernier projet
                                {
                                    $lookup: {
                                        from: "projets",
                                        localField: "derniereAffectation.projet",
                                        foreignField: "_id",
                                        as: "projetInfo"
                                    }
                                },
                                
                                // Déstructurer projetInfo
                                {
                                    $unwind: {
                                        path: "$projetInfo",
                                        preserveNullAndEmptyArrays: true
                                    }
                                },
                                
                                // Restructurer le résultat
                                {
                                    $project: {
                                        nom: 1,
                                        type: 1,
                                        position: 1,
                                        plan: 1,
                                        photo: 1,
                                        nom_photo: 1,
                                        chemin: 1,
                                        extension: 1,
                                        hauteur: 1,
                                        largeur: 1,
                                        longueur: 1,
                                        marque: 1,
                                        categorie: 1,
                                        numero_serie: 1,
                                        qrcode: 1,
                                        dateLastUpdate: 1,
                                        dateFabrication: 1,
                                        batiment: 1,
                                        module_type: 1,
                                        entreprise: 1,
                                        isAffected: { 
                                            $cond: [{ $ifNull: ["$derniereAffectation", false] }, true, false] 
                                        },
                                        nombreAffectations: { $size: "$affectations" },
                                        projetNom: "$projetInfo.projet",
                                        projetId: "$projetInfo._id",
                                        /*projetPosition: "$derniereAffectation.position",
                                        projetPlan: "$derniereAffectation.plan",
                                        dateAffectation: "$derniereAffectation.dateLastUpdate"*/
                                    }
                                }
                            ]);
                            
                            res.json({
                                success: true,
                                message: modules
                            });
                            
                        } catch(error) {
                            return res.status(500).json({
                                success: false,
                                message: error.message
                            });
                        }
                    } else {
                        return res.status(401).json({
                            success: false,
                            message: "401"
                        });  
                    }
                });
             },
             /*getAllModulePr:function(req,res){
                acl.isAllowed(req.decoded.id,'box', 'create', async function(err,aclres){

                    if(aclres){
                        Modules.find({type:"En préparation"}).then((module)=>{
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

             },*/
             getAllModulePr: function(req, res) {
                acl.isAllowed(req.decoded.id, 'box', 'create', async function(err, aclres) {
                    if(aclres) {
                        try {
                            const modules = await Modules.aggregate([
                                // Filtrer les modules en stock
                                { $match: { type: "En préparation" } },
                                
                                // Joindre avec ProjetModules
                                {
                                    $lookup: {
                                        from: "projetmodules",
                                        localField: "_id",
                                        foreignField: "module",
                                        as: "affectations"
                                    }
                                },
                                
                                // Trier les affectations par date et prendre la plus récente
                                {
                                    $addFields: {
                                        derniereAffectation: {
                                            $arrayElemAt: [
                                                {
                                                    $sortArray: {
                                                        input: "$affectations",
                                                        sortBy: { dateLastUpdate: -1 }
                                                    }
                                                },
                                                0
                                            ]
                                        }
                                    }
                                },
                                
                                // Joindre avec Projets pour récupérer le nom du dernier projet
                                {
                                    $lookup: {
                                        from: "projets",
                                        localField: "derniereAffectation.projet",
                                        foreignField: "_id",
                                        as: "projetInfo"
                                    }
                                },
                                
                                // Déstructurer projetInfo
                                {
                                    $unwind: {
                                        path: "$projetInfo",
                                        preserveNullAndEmptyArrays: true
                                    }
                                },
                                
                                // Restructurer le résultat
                                {
                                    $project: {
                                        nom: 1,
                                        type: 1,
                                        position: 1,
                                        plan: 1,
                                        photo: 1,
                                        nom_photo: 1,
                                        chemin: 1,
                                        extension: 1,
                                        hauteur: 1,
                                        largeur: 1,
                                        longueur: 1,
                                        marque: 1,
                                        categorie: 1,
                                        numero_serie: 1,
                                        qrcode: 1,
                                        dateLastUpdate: 1,
                                        dateFabrication: 1,
                                        batiment: 1,
                                        module_type: 1,
                                        entreprise: 1,
                                        isAffected: { 
                                            $cond: [{ $ifNull: ["$derniereAffectation", false] }, true, false] 
                                        },
                                        nombreAffectations: { $size: "$affectations" },
                                        projetNom: "$projetInfo.projet",
                                        projetId: "$projetInfo._id",
                                        
                                    }
                                }
                            ]);
                            
                            res.json({
                                success: true,
                                message: modules
                            });
                            
                        } catch(error) {
                            return res.status(500).json({
                                success: false,
                                message: error.message
                            });
                        }
                    } else {
                        return res.status(401).json({
                            success: false,
                            message: "401"
                        });  
                    }
                });
             },
             /*getAllModulePp:function(req,res){
                acl.isAllowed(req.decoded.id,'box', 'create', async function(err,aclres){

                    if(aclres){
                        Modules.find({type:"Prêt à partir"}).then((module)=>{
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

             },*/
             getAllModulePp: function(req, res) {
                acl.isAllowed(req.decoded.id, 'box', 'create', async function(err, aclres) {
                    if(aclres) {
                        try {
                            const modules = await Modules.aggregate([
                                // Filtrer les modules en stock
                                { $match: { type: "Prêt à partir" } },
                                
                                // Joindre avec ProjetModules
                                {
                                    $lookup: {
                                        from: "projetmodules",
                                        localField: "_id",
                                        foreignField: "module",
                                        as: "affectations"
                                    }
                                },
                                
                                // Trier les affectations par date et prendre la plus récente
                                {
                                    $addFields: {
                                        derniereAffectation: {
                                            $arrayElemAt: [
                                                {
                                                    $sortArray: {
                                                        input: "$affectations",
                                                        sortBy: { dateLastUpdate: -1 }
                                                    }
                                                },
                                                0
                                            ]
                                        }
                                    }
                                },
                                
                                // Joindre avec Projets pour récupérer le nom du dernier projet
                                {
                                    $lookup: {
                                        from: "projets",
                                        localField: "derniereAffectation.projet",
                                        foreignField: "_id",
                                        as: "projetInfo"
                                    }
                                },
                                
                                // Déstructurer projetInfo
                                {
                                    $unwind: {
                                        path: "$projetInfo",
                                        preserveNullAndEmptyArrays: true
                                    }
                                },
                                
                                // Restructurer le résultat
                                {
                                    $project: {
                                        nom: 1,
                                        type: 1,
                                        position: 1,
                                        plan: 1,
                                        photo: 1,
                                        nom_photo: 1,
                                        chemin: 1,
                                        extension: 1,
                                        hauteur: 1,
                                        largeur: 1,
                                        longueur: 1,
                                        marque: 1,
                                        categorie: 1,
                                        numero_serie: 1,
                                        qrcode: 1,
                                        dateLastUpdate: 1,
                                        dateFabrication: 1,
                                        batiment: 1,
                                        module_type: 1,
                                        entreprise: 1,
                                        isAffected: { 
                                            $cond: [{ $ifNull: ["$derniereAffectation", false] }, true, false] 
                                        },
                                        nombreAffectations: { $size: "$affectations" },
                                        projetNom: "$projetInfo.projet",
                                        projetId: "$projetInfo._id",
                                    }
                                }
                            ]);
                            
                            res.json({
                                success: true,
                                message: modules
                            });
                            
                        } catch(error) {
                            return res.status(500).json({
                                success: false,
                                message: error.message
                            });
                        }
                    } else {
                        return res.status(401).json({
                            success: false,
                            message: "401"
                        });  
                    }
                });
             },
             /*getAllModuleSite:function(req,res){
                acl.isAllowed(req.decoded.id,'box', 'create', async function(err,aclres){

                    if(aclres){
                        Modules.find({type:"Site"}).then((module)=>{
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

             },*/

             getAllModuleSite: function(req, res) {
                acl.isAllowed(req.decoded.id, 'box', 'create', async function(err, aclres) {
                    if(aclres) {
                        try {
                            const modules = await Modules.aggregate([
                                // Filtrer les modules en stock
                                { $match: { type: "Site" } },
                                
                                // Joindre avec ProjetModules
                                {
                                    $lookup: {
                                        from: "projetmodules",
                                        localField: "_id",
                                        foreignField: "module",
                                        as: "affectations"
                                    }
                                },
                                
                                // Trier les affectations par date et prendre la plus récente
                                {
                                    $addFields: {
                                        derniereAffectation: {
                                            $arrayElemAt: [
                                                {
                                                    $sortArray: {
                                                        input: "$affectations",
                                                        sortBy: { dateLastUpdate: -1 }
                                                    }
                                                },
                                                0
                                            ]
                                        }
                                    }
                                },
                                
                                // Joindre avec Projets pour récupérer le nom du dernier projet
                                {
                                    $lookup: {
                                        from: "projets",
                                        localField: "derniereAffectation.projet",
                                        foreignField: "_id",
                                        as: "projetInfo"
                                    }
                                },
                                
                                // Déstructurer projetInfo
                                {
                                    $unwind: {
                                        path: "$projetInfo",
                                        preserveNullAndEmptyArrays: true
                                    }
                                },
                                
                                // Restructurer le résultat
                                {
                                    $project: {
                                        nom: 1,
                                        type: 1,
                                        position: 1,
                                        plan: 1,
                                        photo: 1,
                                        nom_photo: 1,
                                        chemin: 1,
                                        extension: 1,
                                        hauteur: 1,
                                        largeur: 1,
                                        longueur: 1,
                                        marque: 1,
                                        categorie: 1,
                                        numero_serie: 1,
                                        qrcode: 1,
                                        dateLastUpdate: 1,
                                        dateFabrication: 1,
                                        batiment: 1,
                                        module_type: 1,
                                        entreprise: 1,
                                        isAffected: { 
                                            $cond: [{ $ifNull: ["$derniereAffectation", false] }, true, false] 
                                        },
                                        nombreAffectations: { $size: "$affectations" },
                                        projetNom: "$projetInfo.projet",
                                        projetId: "$projetInfo._id",
                                    }
                                }
                            ]);
                            
                            res.json({
                                success: true,
                                message: modules
                            });
                            
                        } catch(error) {
                            return res.status(500).json({
                                success: false,
                                message: error.message
                            });
                        }
                    } else {
                        return res.status(401).json({
                            success: false,
                            message: "401"
                        });  
                    }
                });
            },


             // All module by Type and by Entreprise

             getAllModuleByEntrepriseStock:function(req,res){
                acl.isAllowed(req.decoded.id,'box', 'create', async function(err,aclres){

                    if(aclres){
                        Modules.find({type:"Stock",entreprise:req.params.id}).then((module)=>{
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
             getAllModuleByEntreprisePr:function(req,res){
                acl.isAllowed(req.decoded.id,'box', 'create', async function(err,aclres){

                    if(aclres){
                        Modules.find({type:"En préparation",entreprise:req.params.id}).then((module)=>{
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
             getAllModuleByEntreprisePp:function(req,res){
                acl.isAllowed(req.decoded.id,'box', 'create', async function(err,aclres){

                    if(aclres){
                        Modules.find({type:"Prêt à partir",entreprise:req.params.id}).then((module)=>{
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
             getAllModuleByEntrepriseSite:function(req,res){
                acl.isAllowed(req.decoded.id,'box', 'create', async function(err,aclres){

                    if(aclres){
                        Modules.find({type:"Site",entreprise:req.params.id}).then((module)=>{
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

             // Fiche Technique
             createFiche:function(req,res){
                acl.isAllowed(req.decoded.id,'box', 'create', async function(err,aclres){

                    if(aclres){

                        let fiche = new FicheTechniques(req.body);
                        fiche.createdAt=new Date();
                        fiche.module=req.params.id;
                        try {
                            fiche.save().then((data)=>{

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

             updateFiche:function(req,res){
                acl.isAllowed(req.decoded.id,'box', 'create', async function(err,aclres){

                    if(aclres){

                        let fiche = await FicheTechniques.findOne({_id:req.params.id});

                        try {
                            FicheTechniques.findByIdAndUpdate({_id:fiche._id},req.body, { new: true }).then((module) => {
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

             getFicheByModule:function(req,res){
                acl.isAllowed(req.decoded.id,'box', 'create', async function(err,aclres){
                    if(aclres){
                        FicheTechniques.findOne({module:req.params.id}).populate('module','_id nom').then((module)=>{
                            res.json({
                                success: true,
                                message:module,
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

             deleteFicheModule:function(req,res){
                acl.isAllowed(req.decoded.id,'box', 'create', async function(err,aclres){

                    if(aclres){

                        let module = await FicheTechniques.findOne({_id:req.params.id});
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
             // Creation module et Affectation sur le interface projet 

             getAllModuleNotSite:function(req,res){
                acl.isAllowed(req.decoded.id,'box', 'create', async function(err,aclres){
                    if(aclres){
                        Modules.find({type:{ $ne: 'Site' }}).then((module)=>{
                            res.json({
                                success: true,
                                message:module,
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

            /* addModuleProjet:function(req,res){
                acl.isAllowed(req.decoded.id,'box', 'create', async function(err,aclres){
                    if(aclres){
                        
                        Modules.findByIdAndUpdate({_id:req.params.id},{ new: true }).then((module) => {
                            moduleService.addModuleProjet(req.params.id,req.params.projet);
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
                        
                    }else{
                        return res.status(401).json({
                            success: false,
                            message: "401"
                        });  
                    }
                })
             },*/

             addModuleProjet: function(req, res) {
                acl.isAllowed(req.decoded.id, 'box', 'create', async function(err, aclres) {
                    if (err) {
                        return res.status(500).json({ 
                            success: false, 
                            message: "Erreur ACL : " + err.message 
                        });
                    }

                    if (!aclres) {
                        return res.status(401).json({
                            success: false,
                            message: "Non autorisé"
                        });
                    }

                    try {
                        const projetId = req.params.projet;
                        const modulesIds = req.body.modules; // Tableau d'IDs de modules
                        
                        if (!Array.isArray(modulesIds) || modulesIds.length === 0) {
                            return res.status(400).json({
                                success: false,
                                message: "Veuillez sélectionner au moins un module"
                            });
                        }

                        const results = [];
                        
                        // Boucle for pour ajouter chaque module un par un
                        for (const moduleId of modulesIds) {
                            try {
                                // Utiliser votre service existant pour chaque module
                                console.log("Module", moduleId);
                                console.log("Projet", projetId);
                                const result = await moduleService.addModuleProjet(moduleId, projetId,req.decoded.id);
                                
                                results.push({
                                    moduleId: moduleId,
                                    success: true,
                                    data: result
                                });
                            } catch (error) {
                                results.push({
                                    moduleId: moduleId,
                                    success: false,
                                    error: error.message
                                });
                            }
                        }

                        // Compter les réussites et échecs
                        const successful = results.filter(r => r.success);
                        const failed = results.filter(r => !r.success);

                        return res.json({
                            success: true,
                            message: `${successful.length} module(s) ajouté(s) avec succès${failed.length > 0 ? ', ' + failed.length + ' échec(s)' : ''}`,
                            data: {
                                added: successful,
                                failed: failed
                            }
                        });

                    } catch (error) {
                        console.error(error);
                        return res.status(500).json({
                            success: false,
                            message: error.message
                        });
                    }
                });
            },

             createModuleAffecteProjet:function(req,res){
                acl.isAllowed(req.decoded.id,'box', 'create', async function(err,aclres){

                    if(aclres){
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
                        let plan=new Plan();

                        module.dateLastUpdate=new Date();
                        module.type='Stock';
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
                        
                        try {
                            if(req.files.imageFile){
                                module.nom_photo=req.files.imageFile[0].filename;
                                module.photo = await uploadService.uploadModuleToFirebaseStorage(req.files.imageFile[0].filename);
                            }
                            if(req.files.planFile){
                                let on=req.files.planFile[0].originalname.split('.');
                                let extension=on[on.length -1];
                                module.extension=extension;
                                module.plan=req.files.planFile[0].filename;
                                let chemin = await uploadService.uploadPlansToFirebaseStorage(req.files.planFile[0].filename);
                                if(chemin){
                                  module.chemin = chemin;
                                  plan.chemin= chemin;

                                }
                            }
                            module.save().then(async (data)=>{
                                moduleService.addModuleProjet(data?._id,req.params.id,req.decoded.id);
                                if(req.files.planFile){
                                    plan.creator=req.decoded.id;
                                    plan.module=data._id;
                                    plan.date=new Date();
                                    plan.dateLastUpdate=new Date();
                                    plan.extension=data?.extension;
                                    plan.nom=data?.plan;
                                    await plan.save();
                                }
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



        }
    }
})();