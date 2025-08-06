(function(){

    "use strict";
    var Projet = require('../models/projets.model').ProjetModel;
    var Dossier = require('../models/dossiers.model').DossierModel;
    var Entreprise = require('../models/entreprises.model').EntrepriseModel;
    var Contact = require('../models/contacts.model').ContactModel;
    var EntrepriseService = require('../services/entreprises.service');
    var fs = require("fs");
    var codes = require('voucher-code-generator');
    var uploadService = require('../services/upload.service');



    module.exports = function(acl){
        return{

            // Add Projet by odoo 
            addProjetByOdoo(req,res,next){
                acl.isAllowed(req.decoded.id,'projets', 'create', async function(err,aclres){
                    if(aclres){
                        try {
                            let entreprise = await Entreprise.findOne({company_id:req.body.entreprise.id});
                            if(!entreprise){
                                entreprise = new Entreprise();
                                entreprise.createdDate = new Date();
                                entreprise.company_id = req.body.entreprise.id;
                                entreprise.societe = req.body.entreprise.name;
                                entreprise.rue = req.body.entreprise.street;
                                entreprise.postal = req.body.entreprise.zip;
                                entreprise.numero = req.body.entreprise.city;
                                entreprise.pays = req.body.entreprise.country;
                                entreprise.type_entreprise = req.body.entreprise.type;
                                entreprise.categorie_societe = req.body.entreprise.categorie
                                entreprise.indicatif = req.body.entreprise.indicatif;
                                entreprise.telephone = req.body.entreprise.phone;
                                entreprise.email = req.body.entreprise.email;
                                
                                entreprise.save().then((result)=>{
                                   entreprise = result;
                                }).catch((error)=>{
                                    return res.status(500).json({
                                        success:false,
                                        message:error.message
                                    })
                                })
                            }
                            let contact = await Contact.findOne({client_id:req.body.contact.id});
                            if(!contact){
                                contact = new Contact();
                                contact.createdDate = new Date();
                                contact.entreprise = entreprise._id;
                                contact.contact_id = entreprise.company_id;
                                contact.client_id = req.body.contact.id;
                                contact.nom = req.body.contact.nom;
                                contact.prenom = req.body.contact.prenom;
                                contact.genre = req.body.contact.genre;
                                contact.email = req.body.contact.email;
                                contact.indicatif = req.body.contact.indicatif;
                                contact.phone = req.body.contact.phone;
                                contact.rue = req.body.contact.street;
                                contact.postal = req.body.contact.zip;
                                contact.poste = req.body.contact.poste;
                                contact.save().then((result)=>{
                                    contact = result;
                                }).catch((error)=>{
                                    return res.status(500).json({
                                        success:false,
                                        message:error.message
                                    })
                                })
                            }
                            req.body.entreprise = entreprise._id;
                            req.body.contact = contact._id;
                            let projet = await Projet.findOne({projet:req.body.projet});
                            if(projet){
                                return res.status(400).json({
                                    success:false,
                                    message:"Le projet existe déjà"
                                })
                            }else{
                                projet = await Projet.findOne({id_odoo:req.body.id_odoo});
                                console.log(projet);
                                if(projet){
                                    Projet.findOneAndUpdate({_id:projet._id},{projet:req.body.projet},{new:true}).then((result)=>{
                                        console.log(result);
                                        return res.json({
                                            success:true,
                                            message:result
                                        })
                                    }).catch((error)=>{
                                        return res.status(500).json({   
                                            success:false,
                                            message:error.message
                                        })
                                    })
                                }else{
                                    return module.exports(acl).addProjet(req,res,next);
                                }
                            }
                        } catch (error) {
                            return res.status(500).json({
                                success:false,
                                message:error.message
                            })
                        }
                    }else{
                        return res.status(401).json({
                            success: false,
                            message: "Vous n'êtes pas autoriser à accéder à cette ressource"
                        }); 
                    }})
            },

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
                        projet.latitude=req.body.latitude
                        projet.longitude=req.body.longitude

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
                        projet.contact=req.body.contact;
                        projet.latitude=req.body.latitude
                        projet.longitude=req.body.longitude


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