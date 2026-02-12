(function(){
    "use strict";
    var Entreprise = require('../models/entreprises.model').EntrepriseModel;
    var odooService = require('../services/odoo.service');
    var fs = require('fs');
    const axios = require('axios');
    const mongoose = require('mongoose');



    module.exports = function(acl){
        return{

            newAddEntreprise(req,res,next){
                acl.isAllowed(req.decoded.id,'projets', 'create', async function(err,aclres){
                if(aclres){

                    let numero="600001122";
                    let email="contact@monsite.com"

                    if(req.body.telephone){
                        numero =  req.body.telephone;
                    }
                    if(req.body.email) {
                        email= req.body.email;
                    }

                    var entreprise = new Entreprise();
                    entreprise.societe = req.body.societe;
                    entreprise.email = email;
                    entreprise.genre= req.body.genre;
                    entreprise.siret= req.body.siret;
                    entreprise.siren= req.body.siren;
                    entreprise.postal= req.body.postal;
                    entreprise.rue= req.body.rue;
                    entreprise.numero= req.body.numero;
                    entreprise.adresse= req.body.adresse;
                    entreprise.indicatif = req.body.indicatif;
                    entreprise.telephone = numero;
                    entreprise.pays = req.body.pays;
                    entreprise.type_entreprise = req.body.type_entreprise;
                    entreprise.source = req.body.source;
                    entreprise.categorie_societe = req.body.categorie_societe;

                    let payloadOdoo={
                        'name': req.body.societe,
                        'company_type':req.body.company, // Type de l'entreprise
                        'is_company': true, // Indique qu'il s'agit d'une entreprise
                        'street': req.body.rue,
                        'city': req.body.numero,
                        'zip': req.body.postal,
                        'country_id': false, // ID du pays (peut être défini si nécessaire)
                        'phone': req.body.indicatif+""+numero,
                        'email': req.body.email,
                        'x_type_entreprise': req.body.type_entreprise,
                        'x_source': req.body.source,
                        'x_categorie_societe': req.body.categorie_societe
                    }
                    entreprise.save().then((entreprise)=>{
                        odooService.addCompany(payloadOdoo,entreprise);
                        res.json({
                            success:true,
                            entreprise: entreprise
                        });
                    }).catch((error)=>{
                        return res.status(500).json({
                            success:false,
                            message: error.message
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

            // odoo contact
            /*searchEntrepreseId:async function(req,res){

                let entreprise = await Entreprise.findOne({_id:req.params.id});
                odooService.getCompany();
            },*/

            searchEntreprese:async function(req,res){

                try {
                    const queryParam =req.params.societe;
                    if (!queryParam) {
                      return res.status(400).json({ error: 'Missing query parameter "q".' });
                    }
                
                    const response = await axios.get('https://recherche-entreprises.api.gouv.fr/search', {
                      params: { q: queryParam },
                    });
                
                    res.json(response.data);
                  } catch (error) {
                    console.error(error);
                    res.status(500).json({ error: 'Internal Server Error' });
                  }
            },

            entrepriseExist:function(req,res){

                var query={societe : new RegExp(req.params.societe, 'i')};
                Entreprise.findOne(query).then((result)=>{
                    if(result){
                        return res.json({
                            exists:true,
                        })
                    }else{
                        return res.json({
                            exists:false,
                        }) 
                    } 
                }).catch((error)=>{
                    return res.status(500).json({
                        success:false,
                        message: error.message
                    });
                })
            },

            addEntreprise(req,res,next){
                acl.isAllowed(req.decoded.id,'projets', 'create', async function(err,aclres){
                    if(aclres){
                      
                        var entreprise = new Entreprise(req.body);
                        entreprise.createdDate = new Date();

                        if(req.file){
                           try {
                            let path="./public/"+req.file.filename;

                            fs.readFile(path,{encoding:'base64'},async(err,data)=>{
                                if(err){
                                    console.log("error file", err);
                                }
                                entreprise.photo = data;
                                entreprise.save().then((entreprise)=>{

                                        fs.unlink(path,(err)=>{
                                            if(err){
                                                console.error(err)
                                                return
                                            }
                                        })
                                        res.json({
                                            success:true,
                                            message:entreprise
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
                            entreprise.save().then((entreprise)=>{
                                res.json({
                                    success:true,
                                    message:entreprise
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
            updateEntreprise(req,res){
                acl.isAllowed(req.decoded.id,'projets', 'update', async function(err,aclres){
                    if(aclres){

                        let entreprise = await Entreprise.findOne({_id:req.params.id});
                        let isUpdate=false;
                        let payloadOdoo={
                            'name': req.body.societe,
                            'company_type':req.body.company, // Type de l'entreprise
                            'is_company': true, // Indique qu'il s'agit d'une entreprise
                            'street': req.body.rue,
                            'city': req.body.numero,
                            'zip': req.body.postal,
                            'country_id': false, // ID du pays (peut être défini si nécessaire)
                            'phone': req.body.indicatif+""+req.body.telephone,
                            'email': req.body.email,
                            'x_type_entreprise': req.body.type_entreprise,
                            'x_source': req.body.source,
                            'x_categorie_societe': req.body.categorie_societe
                        }

                        if(req.body.societe!=entreprise.societe || req.body.company!=entreprise.company || req.body.rue!=entreprise.rue || req.body.numero!=entreprise.numero || req.body.postal!=entreprise.postal || req.body.email!=entreprise.email || req.body.indicatif!=entreprise.indicatif || req.body.telephone!=entreprise.telephone || req.body.type_entreprise!=entreprise.type_entreprise || req.body.source!=entreprise.source || req.body.categorie_societe!=entreprise.categorie_societe){
                            isUpdate = true;
                       }
                        
                        try {
                            entreprise.societe = req.body.societe;
                            entreprise.commercial = req.body.commercial;
                            entreprise.siren = req.body.siren;
                            entreprise.siret = req.body.siret;
                            entreprise.juridique = req.body.juridique;
                            entreprise.tva = req.body.tva;
                            entreprise.activite = req.body.activite;
                            entreprise.pays = req.body.pays;
                            //entreprise.ville = req.body.ville;
                            entreprise.rue = req.body.rue;
                            entreprise.postal = req.body.postal;
                            entreprise.site = req.body.site;
                            entreprise.email = req.body.email;
                            entreprise.indicatif = req.body.indicatif;
                            entreprise.telephone = req.body.telephone;
                            entreprise.nom = req.body.nom;
                            entreprise.prenom = req.body.prenom;
                            entreprise.genre = req.body.genre;
                            entreprise.corps_act = req.body.corps_act;
                            entreprise.corps_etat = req.body.corps_etat;
                            entreprise.fournisseur = req.body.fournisseur;
                            entreprise.type_entreprise =req.body.type_entreprise;
                            entreprise.source= req.body.source;
                            entreprise.categorie_societe= req.body.categorie_societe;


                            if(req.file){
                                 
                                let path="./public/"+req.file.filename;
                                fs.readFile(path,{encoding:'base64'}, async(err,data)=>{
                                    if(err){
                                        console.log("Error File", err);
                                    }
                                    entreprise.photo=data; 
                                    Entreprise.findOneAndUpdate({_id:req.params.id},entreprise,{new:true}).then((entreprise)=>{
    
                                        fs.unlink(path,(err)=>{
                                            if(err){
                                                console.error(err)
                                                return
                                            }
                                        }) 
                                        if(isUpdate){
                                            odooService.updateEntreprise(payloadOdoo,entreprise);
                                        }     
                                        res.json({
                                            success:true,
                                            message:entreprise
                                        });
                                    }).catch((error)=>{
                                        return res.status(500).json({
                                            success:false,
                                            message:error.message
                                        })
                                    })
                                    
                                })
                            }
                            else{

                                Entreprise.findOneAndUpdate({_id:req.params.id},entreprise,{new:true}).then((entreprise)=>{
                                    if(isUpdate){
                                        odooService.updateEntreprise(payloadOdoo,entreprise);
                                    } 
                                    res.json({
                                        success:true,
                                        message:entreprise
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
            updateEntrepriseFile(req,res){
                acl.isAllowed(req.decoded.id,'projets', 'update', async function(err,aclres){
                    if(aclres){

                        try {

                            let entreprise = await Entreprise.findOne({_id:req.params.id});
                            
                            let path="./public/"+req.file.filename;
                            fs.readFile(path,{encoding:'base64'}, async(err,data)=>{
                                if(err){
                                    console.log("Error File", err);
                                }
                                entreprise.photo=data; 
                                Entreprise.findOneAndUpdate({_id:req.params.id},entreprise,{new:true}).then((entreprise)=>{

                                    fs.unlink(path,(err)=>{
                                        if(err){
                                            console.error(err)
                                            return
                                        }
                                    })      
                                    res.json({
                                        success:true,
                                        message:entreprise
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
                        return res.status(401).json({
                            success: false,
                            message: "401"
                        }); 
                    }
                })

            },
            deleteEntreprise(req,res){
                acl.isAllowed(req.decoded.id,'projets', 'delete', async function(err,aclres){

                    if(aclres){

                        try {

                            let entre = await Entreprise.findOne({_id:req.params.id});
                            await entre.deleteOne();
                            odooService.deletePartner(entre.company_id);

                            res.json({
                                success: true,
                                message:"L'entreprise a été supprimée"
                            });
                            
                        } catch (error) {
                            return res.status(500).json({
                                success:false,
                                message:error.message
                            })
                        }

                        /*let entre = await Entreprise.findOne({_id:req.params.id});
                        entre.deleteOne().then((entreprise)=>{
                            odooService.deletePartner(entre.company_id),
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
            getAllEntreprise(req,res){
                acl.isAllowed(req.decoded.id,'projets', 'retreive', async function(err,aclres){

                    if(aclres){
                        Entreprise.find().then((entreprises)=>{
                            res.json({
                                success: true,
                                message:entreprises
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
            getEntreprise(req,res){
                acl.isAllowed(req.decoded.id,'projets', 'retreive', async function(err,aclres){

                    if(aclres){
                        Entreprise.findOne({_id:req.params.id}).then((entreprise)=>{
                            res.json({
                                success: true,
                                message:entreprise
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
            updateEntrepriseStatut(req,res){
                acl.isAllowed(req.decoded.id,'projets', 'update', async function(err,aclres){
                    if(aclres){
                        //console.log("Body", req.body);
                        Entreprise.findOneAndUpdate({_id:req.params.id},{statut:req.body.statut},{new:true}).then((projet)=>{
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

            updateMultipleEntrepriseStatut(req, res) {
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
                        const { entrepriseIds, statut } = req.body;
                        

                        
                        // Validation des données
                        if (!entrepriseIds || !Array.isArray(entrepriseIds) || entrepriseIds.length === 0) {
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
                        const validIds = entrepriseIds.filter(id => mongoose.Types.ObjectId.isValid(id));
                        
                        if (validIds.length === 0) {
                            return res.status(400).json({
                                success: false,
                                message: "Aucun ID entreprise valide fourni"
                            });
                        }

                        // Vérifier que le statut est valide (selon vos valeurs possibles)
                        const statutsValides = ['Non archiver', 'Archiver']; // À adapter selon vos besoins
                        if (!statutsValides.includes(statut)) {
                            return res.status(400).json({
                                success: false,
                                message: `Statut invalide. Valeurs acceptées: ${statutsValides.join(', ')}`
                            });
                        }

                        // Mettre à jour les projets
                        const updateResult = await Entreprise.updateMany(
                            { _id: { $in: validIds } },
                            { 
                                $set: { 
                                    statut: statut,
                                } 
                            }
                        );

                        // Récupérer les projets mis à jour
                        const projetsUpdated = await Entreprise.find({
                            _id: { $in: validIds }
                        });

                        return res.json({
                            success: true,
                            message: `${updateResult.modifiedCount} entreprise(s) mis à jour avec succès`,
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
             deleteMultipleEntreprises(req, res) {
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
                        const { entrepriseIds } = req.body;
                        
                        // Vérifier que projetIds est fourni et est un tableau
                        if (!entrepriseIds || !Array.isArray(entrepriseIds) || entrepriseIds.length === 0) {
                            return res.status(400).json({
                                success: false,
                                message: "Veuillez fournir un tableau d'IDs de projets à supprimer"
                            });
                        }

                        // Filtrer les IDs valides
                        const validIds = entrepriseIds.filter(id => mongoose.Types.ObjectId.isValid(id));
                        
                        if (validIds.length === 0) {
                            return res.status(400).json({
                                success: false,
                                message: "Aucun ID de projet valide fourni"
                            });
                        }

                        // Récupérer les projets pour obtenir leurs photos
                        const entreprises = await Entreprise.find({
                            _id: { $in: validIds }
                        });

                        // Supprimer les photos Firebase des projets
                        // for (const entreprise of entreprises) {
                        //     if (projet.photo) {
                        //         try {
                        //             await uploadService.deleteProjetsFirebaseStorage(
                        //                 extractFileNameDelete(projet.photo)
                        //             );
                        //         } catch (firebaseError) {
                        //             console.error(`Erreur lors de la suppression de la photo du projet ${projet._id}:`, firebaseError.message);
                        //             // Continuer même si une photo ne peut pas être supprimée
                        //         }
                        //     }
                        // }

                        // Supprimer les projets de la base de données
                        const deleteResult = await Entreprise.deleteMany({
                            _id: { $in: validIds }
                        });

                        return res.json({
                            success: true,
                            message: `${deleteResult.deletedCount} entreprise(s) supprimé(s) avec succès`,
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
        }
    }

})();