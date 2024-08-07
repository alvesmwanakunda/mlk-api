(function(){

    "use strict";
    var Projet = require('../models/projets.model').ProjetModel;
    var Dossier = require('../models/dossiers.model').DossierModel;
    var EntrepriseService = require('../services/entreprises.service');
    var fs = require("fs");
    var codes = require('voucher-code-generator');
    var uploadService = require('../services/upload.service');


    module.exports = function(acl){
        return{

            addProjet(req,res,next){
                acl.isAllowed(req.decoded.id,'projets', 'create', async function(err,aclres){
                    if(aclres){

                        var code = codes.generate({
                            length: 9,
                            count: 1,
                            charset: "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"
                        });
                        code = code[0];
                        var client = codes.generate({
                            length: 6,
                            count: 1,
                            charset: "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"
                        });
                        client = client[0];
                      
                        var projet = new Projet(req.body);
                        projet.createdDate = new Date();
                        projet.user = req.decoded.id;
                        projet.code_projet = "KAP-"+code;
                        projet.code_client=client;

                        if(req.file){
                         projet.photo = await uploadService.uploadProjetsToFirebaseStorage(req.file.filename);
                        }
                        projet.save().then(async (projet)=>{
                            /*const pvReception = new Dossier({date:new Date(), dateLastUpdate:new Date(),creator:req.decoded.id,project:projet._id,profondeur:0,nom:"PV de réception"});
                            const etatDeLieu =  new Dossier({date:new Date(), dateLastUpdate:new Date(),creator:req.decoded.id,project:projet._id,profondeur:0,nom:"Etat de lieu"});
                            await pvReception.save();
                            await etatDeLieu.save();*/
                            EntrepriseService.addDossierProjet(req.decoded.id,projet);
                            EntrepriseService.addNombreProjet(projet);
                            res.json({
                                success:true,
                                message:projet
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
            updateProjet(req,res){
                acl.isAllowed(req.decoded.id,'projets', 'update', async function(err,aclres){
                    if(aclres){

                        let projet = await Projet.findOne({_id:req.params.id});
                        projet.projet=req.body.projet;
                        projet.entreprise=req.body.entreprise;
                        projet.service=req.body.service;
                        projet.etat=req.body.etat;
                        projet.nom=req.body.nom;
                        projet.prenom=req.body.prenom;
                        projet.genre=req.body.genre;
                        projet.pays=req.body.pays;
                        projet.ville=req.body.ville;
                        projet.rue=req.body.rue;
                        projet.postal=req.body.postal;
                        projet.adresse=req.body.adresse;
                        projet.numero_offre=req.body.numero_offre;
                        projet.site_offre=req.body.site_offre;
                        projet.budget=req.body.budget;
                        projet.devise=req.body.devise;
                        projet.date_limite=req.body.date_limite;
                        projet.date_fin_contrat=req.body.date_fin_contrat;
                        projet.plan=req.body.plan;
                        projet.contact=req.body.contact;

                        if(req.file){
                            if(projet.photo){
                                uploadService.deleteProjetsFirebaseStorage(projet.photo);
                              }
                              projet.photo = await uploadService.uploadProjetsToFirebaseStorage(req.file.filename);
                        }

                        Projet.findOneAndUpdate({_id:req.params.id},projet,{new:true}).then((projet)=>{
                            res.json({
                                success:true,
                                message:projet
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
            updateProjetFile(req,res){
                acl.isAllowed(req.decoded.id,'projets', 'update', async function(err,aclres){
                    if(aclres){

                        try {

                            let projet = await Projet.findOne({_id:req.params.id});

                            if(projet.photo){
                               uploadService.deleteProjetsFirebaseStorage(projet.photo);
                            }
                            projet.photo = await uploadService.uploadProjetsToFirebaseStorage(req.file.filename);
                            Projet.findOneAndUpdate({_id:req.params.id},projet,{new:true}).then((projet)=>{

                                fs.unlink(path,(err)=>{
                                    if(err){
                                        console.error(err)
                                        return
                                    }
                                })      
                                res.json({
                                    success:true,
                                    message:projet
                                });
                            }).catch((error)=>{
                                return res.status(500).json({
                                    success:false,
                                    message:error.message
                                })
                            })

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
            deletePhoto(req,res){
                acl.isAllowed(req.decoded.id,'projets', 'update', async function(err,aclres){
                    if(aclres){
                        try {
                            let projet = await Projet.findOne({_id:req.params.id});
                            projet.photo=""; 
                            Projet.findOneAndUpdate({_id:req.params.id},projet,{new:true}).then((projet)=>{  
                                    res.json({
                                        success:true,
                                        message:projet
                                    });
                                }).catch((error)=>{
                                    return res.status(500).json({
                                        success:false,
                                        message:error.message
                                    })
                                })
                            
                            

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
            deleteProjet(req,res){
                acl.isAllowed(req.decoded.id,'projets', 'delete', async function(err,aclres){

                    if(aclres){

                        try {

                            let projet = await Projet.findOne({_id:req.params.id});
                            await projet.deleteOne();

                            res.json({
                                success: true,
                                message:"Le projet a été supprimé avec succès."
                            });
                            
                        } catch (error) {
                            return res.status(500).json({
                                success:false,
                                message:error.message
                            })
                        }

                        /*let projet = await Projet.findOne({_id:req.params.id});
                        Projet.deleteOne().then((entreprise)=>{
                            res.json({
                                success: true,
                                message:entreprise
                            });
                        }).catch((error)=>{
                            return res.status(500).json({
                                success:false,
                                message:error.message
                            })
                        })*/

                    }else{
                        return res.status(401).json({
                            success: false,
                            message: "401"
                        });
                    }
                })
            },
            getAllProjet(req,res){
                acl.isAllowed(req.decoded.id,'projets', 'retreive', async function(err,aclres){

                    if(aclres){
                        Projet.find().populate("entreprise").then((projets)=>{
                            res.json({
                                success: true,
                                message:projets
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
                            message: "401",
                        });
                    }
                })
            },
            getProjet(req,res){
                acl.isAllowed(req.decoded.id,'projets', 'retreive', async function(err,aclres){

                    if(aclres){
                        Projet.findOne({_id:req.params.id}).then((projet)=>{
                            res.json({
                                success: true,
                                message:projet
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
            getProjetByEntreprise(req,res){
                acl.isAllowed(req.decoded.id,'projets', 'retreive', async function(err,aclres){

                    if(aclres){
                        Projet.find({entreprise:req.params.id}).then((projets)=>{
                            res.json({
                                success: true,
                                message:projets
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
            // Add Projet by user entreprise
            addProjetEntreprise(req,res,next){
                acl.isAllowed(req.decoded.id,'projets', 'create', async function(err,aclres){
                    if(aclres){

                        var code = codes.generate({
                            length: 9,
                            count: 1,
                            charset: "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"
                        });
                        code = code[0];
                        var client = codes.generate({
                            length: 6,
                            count: 1,
                            charset: "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"
                        });
                        client = client[0];
                      
                        var projet = new Projet(req.body);
                        projet.createdDate = new Date();
                        projet.user = req.decoded.id;
                        projet.code_projet = "KAP-"+code;
                        projet.code_client=client;
                        projet.entreprise=req.params.id;


                        if(req.file){
                           try {
                            let path="./public/"+req.file.filename;

                            fs.readFile(path,{encoding:'base64'},async(err,data)=>{
                                if(err){
                                    console.log("error file", err);
                                }
                                projet.photo = data;
                                projet.save().then(async(projet)=>{

                                        fs.unlink(path,(err)=>{
                                            if(err){
                                                console.error(err)
                                                return
                                            }
                                        })
                                        /*const pvReception = new Dossier({date:new Date(), dateLastUpdate:new Date(),creator:req.decoded.id,project:projet._id,profondeur:0,nom:"PV de réception"});
                                        const etatDeLieu =  new Dossier({date:new Date(), dateLastUpdate:new Date(),creator:req.decoded.id,project:projet._id,profondeur:0,nom:"Etat de lieu"});
                                        await pvReception.save();
                                        await etatDeLieu.save();*/
                                        EntrepriseService.addNombreProjet(projet);
                                        EntrepriseService.addDossierProjet(req.decoded.id,projet);
                                        res.json({
                                            success:true,
                                            message:projet
                                        });

                                    }).catch((error)=>{
                                        return res.status(500).json({
                                            success:false,
                                            message:error.message
                                        })
                                    })
                            })
                           } catch (error) {
                            return res.status(500).json({
                                success:false,
                                message:error
                            })
                           }
                        }else{
                            projet.save().then((projet)=>{
                                EntrepriseService.addDossierProjet(req.decoded.id,projet);
                                EntrepriseService.addNombreProjet(projet);
                                res.json({
                                    success:true,
                                    message:projet
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
            updateProjetEntreprise(req,res){
                acl.isAllowed(req.decoded.id,'projets', 'update', async function(err,aclres){
                    if(aclres){

                        let projet = await Projet.findOne({_id:req.params.id});
                        projet.projet=req.body.projet;
                        projet.service=req.body.service;
                        projet.etat=req.body.etat;
                        projet.nom=req.body.nom;
                        projet.prenom=req.body.nom;
                        projet.genre=req.body.nom;
                        projet.pays=req.body.pays;
                        projet.ville=req.body.ville;
                        projet.rue=req.body.rue;
                        projet.postal=req.body.postal;
                        projet.adresse=req.body.adresse;
                        projet.numero_offre=req.body.numero_offre;
                        projet.site_offre=req.body.site_offre;
                        projet.budget=req.body.budget;
                        projet.devise=req.body.devise;
                        projet.date_limite=req.body.date_limite;
                        projet.plan=req.body.plan;
                        projet.contact=req.body.contact


                        if(req.file){

                            try {
 
                                let path="./public/"+req.file.filename;
                                fs.readFile(path,{encoding:'base64'}, async(err,data)=>{
                                    if(err){
                                        console.log("Error File", err);
                                    }
                                    projet.photo=data; 
                                    Projet.findOneAndUpdate({_id:req.params.id},projet,{new:true}).then((projet)=>{
    
                                        fs.unlink(path,(err)=>{
                                            if(err){
                                                console.error(err)
                                                return
                                            }
                                        })      
                                        res.json({
                                            success:true,
                                            message:projet
                                        });
                                    }).catch((error)=>{
                                        return res.status(500).json({
                                            success:false,
                                            message:error.message
                                        })
                                    })
                                    
                                })
                                
                            } catch (error) {
                                return res.status(500).json({
                                    success:false,
                                    message:error.message
                                })
                            }

                        }else{

                            Projet.findOneAndUpdate({_id:req.params.id},projet,{new:true}).then((projet)=>{
                                res.json({
                                    success:true,
                                    message:projet
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
        }
    }
})();