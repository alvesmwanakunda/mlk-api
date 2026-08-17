(function(){

    "use strict";
    var Projet = require('../models/projets.model').ProjetModel;
    var PlanProjet = require('../models/planProjet.model').PlanProjetModel;
    var Dossier = require('../models/dossiers.model').DossierModel;
    var Entreprise = require('../models/entreprises.model').EntrepriseModel;
    var Contact = require('../models/contacts.model').ContactModel;
    var EntrepriseService = require('../services/entreprises.service');
    var fs = require("fs");
    var codes = require('voucher-code-generator');
    var uploadService = require('../services/upload.service');
    const mongoose = require('mongoose');
    const axios = require('axios');
    const GOOGLE_API_KEY = process.env.GOOGLE_PLACE_ID;

    function extractFileName(fullUrl) {
        if (!fullUrl) return null;
        try {
            // Décoder l'URL jusqu'à ce qu'il n'y ait plus d'encodage
            let decoded = fullUrl;
            while (decoded.includes('%')) {
                const temp = decodeURIComponent(decoded);
                if (temp === decoded) break;
                decoded = temp;
            }
            
            // Chercher le pattern "projets/nomfichier.ext"
            const match = decoded.match(/projets\/[^?&]+/);
            
            if (match) {
                return match[0]; // Retourne "projets/calendar-dashboard-app-design.png"
            }
            
            return null;
        } catch (error) {
            console.error("Erreur extraction pour suppression:", error);
            return null;
        }
    };
    function extractFileNameDelete(fullUrl) {
        if (!fullUrl) return null;

        // Vérifier si c'est une URL Firebase Storage
        if (fullUrl.includes('projets/')) {
            // Trouver le début de "pvreception/"
            const startIndex = fullUrl.indexOf('projets/');
            
            // Trouver la fin (soit '?', soit fin de string)
            const endIndex = fullUrl.indexOf('?', startIndex);
            
            if (startIndex !== -1) {
            let path = '';
            
            if (endIndex !== -1) {
                // Extraire de "pvreception/" jusqu'à "?"
                path = fullUrl.substring(startIndex, endIndex);
            } else {
                // Pas de paramètres, prendre jusqu'à la fin
                path = fullUrl.substring(startIndex);
            }
            
            // Maintenant extraire seulement le nom du fichier
            // "pvreception/calendar-dashboard-app-design.png" → "calendar-dashboard-app-design.png"
            const parts = path.split('/');
            if (parts.length > 1) {
                return parts[parts.length - 1]; // Dernière partie = nom du fichier
            }
            return path;
            }
        }

        // Si ce n'est pas une URL Firebase, retourner l'URL complète
        return fullUrl;
    };

    function extractPlanProjetFileName(fullUrl) {
        if (!fullUrl) return null;
        try {
            let decoded = fullUrl;
            while (decoded.includes('%')) {
                const temp = decodeURIComponent(decoded);
                if (temp === decoded) break;
                decoded = temp;
            }

            const match = decoded.match(/planprojet\/[^?&]+/);

            if (match) {
                return match[0];
            }

            return null;
        } catch (error) {
            console.error("Erreur extraction du plan projet:", error);
            return null;
        }
    };

    function extractPlanProjetFileNameDelete(fullUrl) {
        if (!fullUrl) return null;

        try {
            let decoded = fullUrl;
            while (decoded.includes('%')) {
                const temp = decodeURIComponent(decoded);
                if (temp === decoded) break;
                decoded = temp;
            }

            if (decoded.includes('planprojet/')) {
                const startIndex = decoded.indexOf('planprojet/');
                const endIndex = decoded.indexOf('?', startIndex);
                const path = endIndex !== -1 ? decoded.substring(startIndex, endIndex) : decoded.substring(startIndex);
                const parts = path.split('/');

                if (parts.length > 1) {
                    return parts[parts.length - 1];
                }

                return path;
            }

            if (!decoded.includes('/') && !decoded.includes('?')) {
                return decoded;
            }

            return null;
        } catch (error) {
            console.error("Erreur extraction pour suppression du plan projet:", error);
            return null;
        }
    };



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

                        const photoFile = req.file || (req.files && req.files.uploadfile && req.files.uploadfile[0]);
                        const planFile = req.files && req.files.uploadplan && req.files.uploadplan[0];

                        if(photoFile){
                         projet.photo = await uploadService.uploadProjetsToFirebaseStorage(photoFile.filename);
                        }
                        projet.save().then(async (projet)=>{
                            if(planFile){
                                let originalNameParts = planFile.originalname.split('.');
                                let extension = originalNameParts[originalNameParts.length - 1];
                                let chemin = await uploadService.uploadPlanProjetToFirebaseStorage(planFile.filename);
                                let planProjet = new PlanProjet({
                                    nom: planFile.filename,
                                    chemin: chemin,
                                    extension: extension,
                                    date: new Date(),
                                    projet: projet._id
                                });
                                await planProjet.save();
                            }
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

            updateProjetStatut(req,res){
                acl.isAllowed(req.decoded.id,'projets', 'update', async function(err,aclres){
                    if(aclres){
                        //console.log("Body", req.body);
                        Projet.findOneAndUpdate({_id:req.params.id},{statut:req.body.statut},{new:true}).then((projet)=>{
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

            updateMultipleProjetStatut(req, res) {
                acl.isAllowed(req.decoded.id, 'projets', 'update', async function(err, aclres) {
                    if (err) {
                        return res.status(500).json({ 
                            success: false, 
                            message: 'ACL error', 
                            error: err.message 
                        });
                    }
                    
                    if (!aclres) {
                        return res.status(401).json({
                            success: false,
                            message: "401"
                        });
                    }

                    try {
                        const { projetIds, statut } = req.body;
                        //console.log("body", req.body);
                        //console.log("projetIds", projetIds);

                        
                        // Validation des données
                        if (!projetIds || !Array.isArray(projetIds) || projetIds.length === 0) {
                            return res.status(400).json({
                                success: false,
                                message: "Veuillez fournir un tableau d'IDs de projets"
                            });
                        }
                        
                        if (!statut || statut.trim() === '') {
                            return res.status(400).json({
                                success: false,
                                message: "Le statut est requis"
                            });
                        }

                        // Filtrer les IDs valides
                        const validIds = projetIds.filter(id => mongoose.Types.ObjectId.isValid(id));
                        
                        if (validIds.length === 0) {
                            return res.status(400).json({
                                success: false,
                                message: "Aucun ID de projet valide fourni"
                            });
                        }

                        // Vérifier que le statut est valide (selon vos valeurs possibles)
                        const statutsValides = ['En Cours', 'Archiver', 'Clôturer']; // À adapter selon vos besoins
                        if (!statutsValides.includes(statut)) {
                            return res.status(400).json({
                                success: false,
                                message: `Statut invalide. Valeurs acceptées: ${statutsValides.join(', ')}`
                            });
                        }

                        // Mettre à jour les projets
                        const updateResult = await Projet.updateMany(
                            { _id: { $in: validIds } },
                            { 
                                $set: { 
                                    statut: statut,
                                    updatedAt: new Date() // Optionnel: ajouter un timestamp de mise à jour
                                } 
                            }
                        );

                        // Récupérer les projets mis à jour
                        const projetsUpdated = await Projet.find({
                            _id: { $in: validIds }
                        });

                        return res.json({
                            success: true,
                            message: `${updateResult.modifiedCount} projet(s) mis à jour avec succès`,
                            modifiedCount: updateResult.modifiedCount,
                            matchedCount: updateResult.matchedCount,
                            projets: projetsUpdated // Optionnel: retourner les projets mis à jour
                        });

                    } catch (error) {
                        console.error("Erreur lors de la mise à jour multiple:", error);
                        return res.status(500).json({
                            success: false,
                            message: error.message
                        });
                    }
                });
            },

            updateProjet(req,res){
                acl.isAllowed(req.decoded.id,'projets', 'update', async function(err,aclres){
                    if(aclres){

                        let projet = await Projet.findOne({_id:req.params.id});

                        if(!projet){
                            return res.status(404).json({
                                success:false,
                                message:"Projet introuvable"
                            });
                        }

                        const photoFile = req.file || (req.files && req.files.uploadfile && req.files.uploadfile[0]);
                        const planFile = req.files && req.files.uploadplan && req.files.uploadplan[0];

                        //console.log("Body", req.body);
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
                        projet.latitude=req.body.latitude;
                        projet.longitude=req.body.longitude;
                        projet.coordonnees = req.body.coordonnees;
                        projet.addressSearch = req.body.addressSearch;
                        
                        projet.societeResponsableCode = req.body.societeResponsableCode || 'MLKA';

                        if (photoFile) {
                            //console.log("Nouveau fichier reçu");
                            
                            // Supprimer l'ancienne photo si elle existe
                            if (projet.photo) {
                                try {
                                    // Extraire le chemin pour suppression
                                     //console.log("Photo:", projet.photo);
                                    const filePath = extractFileNameDelete(projet.photo);
                                    //console.log("Chemin à supprimer:", filePath);
                                    
                                    if (filePath) {
                                        await uploadService.deleteProjetsFirebaseStorage(filePath);
                                    }
                                } catch (error) {
                                    console.error("Erreur suppression ancienne photo:", error);
                                }
                            }
                            
                            // Uploader la nouvelle photo
                            try {
                                projet.photo = await uploadService.uploadProjetsToFirebaseStorage(photoFile.filename);
                                //console.log("Nouvelle photo URL:", projet.photo);
                            } catch (error) {
                                console.error("Erreur upload nouvelle photo:", error);
                            }
                        }else{
                            //console.log("Photo u", projet.photo);
                            try {
                                const filePath = extractFileName(projet.photo);
                                //console.log("Chemin à supprimer:", filePath);
                                projet.photo = filePath;
                                //console.log("Nouvelle photo URL:", projet.photo);
                            } catch (error) {
                                console.error("Erreur upload nouvelle photo:", error);
                            }
                        }

                        if(planFile){
                            const planProjet = await PlanProjet.findOne({projet:req.params.id});

                            if(!planProjet){
                                let originalNameParts = planFile.originalname.split('.');
                                let extension = originalNameParts[originalNameParts.length - 1];
                                let chemin = await uploadService.uploadPlanProjetToFirebaseStorage(planFile.filename);
                                let newPlanProjet = new PlanProjet({
                                    nom: planFile.filename,
                                    chemin: chemin,
                                    extension: extension,
                                    date: new Date(),
                                    projet: req.params.id
                                });
                                await newPlanProjet.save();
                            }else{
                                fs.promises.unlink(`./public/${planFile.filename}`).catch(() => {});
                            }
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

            getPlanProjetbyIdProjet(req,res){
                acl.isAllowed(req.decoded.id,'projets', 'retreive', async function(err,aclres){
                    if(aclres){
                        try {
                            let planProjet = await PlanProjet.findOne({projet:req.params.id});

                            // if(!planProjet){
                            //     return res.status(200).json({
                            //         success:false,
                            //         message:"Plan projet introuvable"
                            //     });
                            // }

                            return res.json({
                                success:true,
                                message:planProjet
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

            updatePlanProjet(req,res){
                acl.isAllowed(req.decoded.id,'projets', 'update', async function(err,aclres){
                    if(aclres){
                        try {
                            let planProjet = await PlanProjet.findOne({_id:req.params.id});

                            if(!planProjet){
                                return res.status(404).json({
                                    success:false,
                                    message:"Plan projet introuvable"
                                });
                            }

                            const planFile = req.file || (req.files && req.files.uploadplan && req.files.uploadplan[0]);

                            if(planProjet.chemin){
                                planProjet.chemin = extractPlanProjetFileName(planProjet.chemin) || planProjet.chemin;
                            }

                            const oldFileName = extractPlanProjetFileNameDelete(planProjet.chemin) || planProjet.nom;

                            if(req.body.nom){
                                planProjet.nom = req.body.nom;
                            }
                            if(req.body.date){
                                planProjet.date = req.body.date;
                            }
                            if(req.body.projet){
                                planProjet.projet = req.body.projet;
                            }
                            if(req.body.extension){
                                planProjet.extension = req.body.extension;
                            }
                            if(req.body.chemin){
                                planProjet.chemin = extractPlanProjetFileName(req.body.chemin) || planProjet.chemin;
                            }

                            if(planFile){
                                if(oldFileName){
                                    await uploadService.deletePlanProjetFirebaseStorage(oldFileName);
                                }

                                let originalNameParts = planFile.originalname.split('.');
                                planProjet.nom = planFile.filename;
                                planProjet.extension = originalNameParts[originalNameParts.length - 1];
                                planProjet.chemin = await uploadService.uploadPlanProjetToFirebaseStorage(planFile.filename);
                                planProjet.date = new Date();
                            }

                            PlanProjet.findOneAndUpdate({_id:req.params.id},planProjet,{new:true}).then((planProjet)=>{
                                res.json({
                                    success:true,
                                    message:planProjet
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

            deletePlanProjet(req,res){
                acl.isAllowed(req.decoded.id,'projets', 'delete', async function(err,aclres){
                    if(aclres){
                        try {
                            let planProjet = await PlanProjet.findOne({_id:req.params.id});

                            if(!planProjet){
                                return res.status(404).json({
                                    success:false,
                                    message:"Plan projet introuvable"
                                });
                            }

                            const fileName = extractPlanProjetFileNameDelete(planProjet.chemin) || planProjet.nom;

                            if(fileName){
                                await uploadService.deletePlanProjetFirebaseStorage(fileName);
                            }

                            planProjet.deleteOne().then((data)=>{
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
                            if(projet.photo){
                                uploadService.deleteProjetsFirebaseStorage(extractFileNameDelete(projet.photo));
                            }
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
                            if(projet.photo){
                                uploadService.deleteProjetsFirebaseStorage(extractFileNameDelete(projet.photo));
                            }
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

            deleteMultipleProjets(req, res) {
                acl.isAllowed(req.decoded.id, 'projets', 'delete', async function(err, aclres) {
                    if (err) {
                        return res.status(500).json({ 
                            success: false, 
                            message: 'ACL error', 
                            error: err.message 
                        });
                    }
                    
                    if (!aclres) {
                        return res.status(401).json({
                            success: false,
                            message: "401"
                        });
                    }

                    try {
                        // Récupérer les IDs des projets à supprimer
                        const { projetIds } = req.body;
                        
                        // Vérifier que projetIds est fourni et est un tableau
                        if (!projetIds || !Array.isArray(projetIds) || projetIds.length === 0) {
                            return res.status(400).json({
                                success: false,
                                message: "Veuillez fournir un tableau d'IDs de projets à supprimer"
                            });
                        }

                        // Filtrer les IDs valides
                        const validIds = projetIds.filter(id => mongoose.Types.ObjectId.isValid(id));
                        
                        if (validIds.length === 0) {
                            return res.status(400).json({
                                success: false,
                                message: "Aucun ID de projet valide fourni"
                            });
                        }

                        // Récupérer les projets pour obtenir leurs photos
                        const projets = await Projet.find({
                            _id: { $in: validIds }
                        });

                        // Supprimer les photos Firebase des projets
                        for (const projet of projets) {
                            if (projet.photo) {
                                try {
                                    await uploadService.deleteProjetsFirebaseStorage(
                                        extractFileNameDelete(projet.photo)
                                    );
                                } catch (firebaseError) {
                                    console.error(`Erreur lors de la suppression de la photo du projet ${projet._id}:`, firebaseError.message);
                                    // Continuer même si une photo ne peut pas être supprimée
                                }
                            }
                        }

                        // Supprimer les projets de la base de données
                        const deleteResult = await Projet.deleteMany({
                            _id: { $in: validIds }
                        });

                        return res.json({
                            success: true,
                            message: `${deleteResult.deletedCount} projet(s) supprimé(s) avec succès`,
                            deletedCount: deleteResult.deletedCount
                        });

                    } catch (error) {
                        console.error("Erreur lors de la suppression multiple:", error);
                        return res.status(500).json({
                            success: false,
                            message: error.message
                        });
                    }
                });
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
                        Projet.findOne({_id:req.params.id}).populate("entreprise").then((projet)=>{
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

                        const photoFile = req.file || (req.files && req.files.uploadfile && req.files.uploadfile[0]);
                        const planFile = req.files && req.files.uploadplan && req.files.uploadplan[0];

                        if(photoFile){
                         projet.photo = await uploadService.uploadProjetsToFirebaseStorage(photoFile.filename);
                        }
                        projet.save().then(async (projet)=>{
                            if(planFile){
                                let originalNameParts = planFile.originalname.split('.');
                                let extension = originalNameParts[originalNameParts.length - 1];
                                let chemin = await uploadService.uploadPlanProjetToFirebaseStorage(planFile.filename);
                                let planProjet = new PlanProjet({
                                    nom: planFile.filename,
                                    chemin: chemin,
                                    extension: extension,
                                    date: new Date(),
                                    projet: projet._id
                                });
                                await planProjet.save();
                            }
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
            updateProjetEntreprise(req,res){

                 acl.isAllowed(req.decoded.id,'projets', 'update', async function(err,aclres){
                    if(aclres){

                        let projet = await Projet.findOne({_id:req.params.id});

                        if(!projet){
                            return res.status(404).json({
                                success:false,
                                message:"Projet introuvable"
                            });
                        }

                        const photoFile = req.file || (req.files && req.files.uploadfile && req.files.uploadfile[0]);
                        const planFile = req.files && req.files.uploadplan && req.files.uploadplan[0];

                        //console.log("Body", req.body);
                        projet.projet=req.body.projet;
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
                        projet.latitude=req.body.latitude;
                        projet.longitude=req.body.longitude;
                        projet.coordonnees = req.body.coordonnees;
                        projet.addressSearch = req.body.addressSearch;
                        
                        projet.societeResponsableCode = req.body.societeResponsableCode || 'MLKA';

                        if (photoFile) {
                            //console.log("Nouveau fichier reçu");
                            
                            // Supprimer l'ancienne photo si elle existe
                            if (projet.photo) {
                                try {
                                    // Extraire le chemin pour suppression
                                     //console.log("Photo:", projet.photo);
                                    const filePath = extractFileNameDelete(projet.photo);
                                    //console.log("Chemin à supprimer:", filePath);
                                    
                                    if (filePath) {
                                        await uploadService.deleteProjetsFirebaseStorage(filePath);
                                    }
                                } catch (error) {
                                    console.error("Erreur suppression ancienne photo:", error);
                                }
                            }
                            
                            // Uploader la nouvelle photo
                            try {
                                projet.photo = await uploadService.uploadProjetsToFirebaseStorage(photoFile.filename);
                                //console.log("Nouvelle photo URL:", projet.photo);
                            } catch (error) {
                                console.error("Erreur upload nouvelle photo:", error);
                            }
                        }else{
                            //console.log("Photo u", projet.photo);
                            try {
                                const filePath = extractFileName(projet.photo);
                                //console.log("Chemin à supprimer:", filePath);
                                projet.photo = filePath;
                                //console.log("Nouvelle photo URL:", projet.photo);
                            } catch (error) {
                                console.error("Erreur upload nouvelle photo:", error);
                            }
                        }

                        if(planFile){
                            const planProjet = await PlanProjet.findOne({projet:req.params.id});

                            if(!planProjet){
                                let originalNameParts = planFile.originalname.split('.');
                                let extension = originalNameParts[originalNameParts.length - 1];
                                let chemin = await uploadService.uploadPlanProjetToFirebaseStorage(planFile.filename);
                                let newPlanProjet = new PlanProjet({
                                    nom: planFile.filename,
                                    chemin: chemin,
                                    extension: extension,
                                    date: new Date(),
                                    projet: req.params.id
                                });
                                await newPlanProjet.save();
                            }else{
                                fs.promises.unlink(`./public/${planFile.filename}`).catch(() => {});
                            }
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

            // Adresse

            adresseProjet: async function(req,res){

                try {
                    const { country, q } = req.query;

                    if (!country || !q || q.length < 3) {
                    return res.json([]);
                    }

                    // 
                    const response = await axios.get(
                        "https://maps.googleapis.com/maps/api/place/autocomplete/json",
                        {
                            params: {
                            input: q,
                            components: `country:${country}`,
                            types: "address",
                            key: GOOGLE_API_KEY
                            }
                        }
                    );

                    //console.log("response", response.data)
                    const suggestions = response.data.predictions.map(pred => ({
                    description: pred.description,
                    place_id: pred.place_id
                    }));

                    res.json(suggestions);
                    // const components = response.data.result.address_components;

                    // const get = (type) =>
                    // components.find(c => c.types.includes(type))?.long_name || "";

                    // res.json({
                    // numero: get("street_number"),
                    // rue: get("route"),
                    // postal: get("postal_code"),
                    // ville: get("locality"),
                    // lat: response.data.result.geometry.location.lat,
                    // lon: response.data.result.geometry.location.lng
                    // });

                    // const suggestions = response.data.map((item) => ({
                    // label: item.display_name,
                    // lat: item.lat,
                    // lon: item.lon,
                    // components: {
                    //     numero: item.address?.house_number || "",
                    //     rue: item.address?.road || "",
                    //     codePostal: item.address?.postcode || "",
                    //     ville:
                    //     item.address?.city ||
                    //     item.address?.town ||
                    //     item.address?.village ||
                    //     ""
                    // }
                    // }));

                    //res.json(suggestions);

                } catch (error) {
                    console.error(error);
                    res.status(500).json({ message: "Geo error" });
                }
               
            },

            adresseDetail: async function(req, res){
                try {
                    const { place_id } = req.query;

                    const response = await axios.get(
                    "https://maps.googleapis.com/maps/api/place/details/json",
                    {
                        params: {
                        place_id,
                        fields: "address_component,geometry",
                        key: GOOGLE_API_KEY
                        }
                    }
                    );
                    //console.log("response detail", response.data)
                    const components = response.data.result.address_components;

                    const get = (type) =>
                    components.find(c => c.types.includes(type))?.long_name || "";

                    res.json({
                    numero: get("street_number"),
                    rue: get("route"),
                    postal: get("postal_code"),
                    ville: get("locality"),
                    lat: response.data.result.geometry.location.lat,
                    lon: response.data.result.geometry.location.lng
                    });

                } catch (error) {
                    console.error(error.response?.data || error);
                    res.status(500).json({ message: "Google Details error" });
                }
            }
        }
    }
})();
