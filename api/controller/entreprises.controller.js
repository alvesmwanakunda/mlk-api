(function(){
    "use strict";
    var Entreprise = require('../models/entreprises.model').EntrepriseModel;
    var User = require('../models/users.model').UserModel;
    var prestashopService = require('../services/prestashop.service');
    var odooService = require('../services/odoo.service');
    var crypto = require('crypto');
    var ObjectId = require('mongoose').Types.ObjectId;
    var fs = require('fs');
    const axios = require('axios');


    module.exports = function(acl){
        return{

            newAddEntreprise(req,res,next){
                acl.isAllowed(req.decoded.id,'projets', 'create', async function(err,aclres){
                   if(aclres){

                    let gender='';

                var query = {email:req.body.email}
                var entreprise = new Entreprise();
                entreprise.societe = req.body.societe;
                entreprise.nom= req.body.nom;
                entreprise.prenom= req.body.prenom;
                entreprise.email = req.body.email;
                entreprise.genre= req.body.genre;
                entreprise.siret= req.body.siret;
                entreprise.postal= req.body.postal;
                entreprise.rue= req.body.rue;
                entreprise.numero= req.body.numero;
                entreprise.adresse= req.body.adresse;
                entreprise.indicatif = req.body.indicatif;
                entreprise.telephone = req.body.telephone;
                entreprise.pays = req.body.pays;

                /*var password = codes.generate({
                    length: 9,
                    count: 1,
                    charset: "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"
                });
                password = password[0];*/
                let password="mlka@2024";

                var user = new User();
                user.email = req.body.email;
                user.nom = req.body.nom;
                user.prenom = req.body.prenom;
                user.role = "user";
                user.valid = true;

                if(req.body.genre=='Mr'){
                    gender=1;
                    user.genre = "Mr"
                }else{
                    gender=2;
                    user.genre = "Mlle"
                }

                let payload={
                    lastname: req.body.nom,
                    firstname: req.body.prenom,
                    email : req.body.email,
                    active:"1",
                    company:req.body.societe,
                    siret: req.body.siret,
                    passwd: password,
                    id_gender:gender,
                    id_default_group:3,
                    phone:req.body.indicatif+""+req.body.telephone
                };
                let adresse={
                    id_country:8,
                    alias:req.body.prenom+""+req.body.nom,
                    lastname: req.body.nom,
                    firstname: req.body.prenom,
                    adress1:req.body.rue+" "+req.body.numero,
                    postcode:req.body.postal,
                    phone:req.body.indicatif+""+req.body.telephone,
                    city:req.body.rue,
                    company:req.body.societe,
                }

                let payloadOdoo={
                    'name': req.body.societe,
                    'company_type':req.body.company, // Type de l'entreprise
                    'is_company': true, // Indique qu'il s'agit d'une entreprise
                    'street': req.body.rue+" "+req.body.numero,
                    'city': req.body.rue,
                    'zip': req.body.postal,
                    'country_id': false, // ID du pays (peut être défini si nécessaire)
                    'phone': req.body.indicatif+""+req.body.telephone,
                    'email': req.body.email,
                }

                User.findOne(query).then((result)=>{
                    if(result){
                        return res.json({
                            success:false,
                            message: "already exists"
                        })
                    }else{
                         entreprise.save().then((entreprise)=>{
                          //console.log("Entreprise", entreprise);  
                          user.entreprise=new ObjectId(entreprise._id);
                          user.password = crypto.createHash('md5').update(password).digest("hex");
                          user.save().then((result)=>{
                                    //mailService.signup(result, password);
                                    prestashopService.addClient(payload,adresse);
                                    odooService.addCompany(payloadOdoo,entreprise);
                                    res.json({
                                        success:true,
                                        message:result,
                                        signature:password,
                                        entreprise: entreprise
                                    });
                                }).catch((error)=>{
                                    return res.status(500).json({
                                        success:false,
                                        message: error.message
                                    });
                          })
                         }).catch((error)=>{
                            return res.status(500).json({
                                success:false,
                                message: error.message
                            })
                         })
                    } 
                }).catch((error)=>{
                    
                    return res.status(500).json({
                        success:false,
                        message: error.message
                    });
                })
                       
                   }else{
                    return res.status(401).json({
                        success: false,
                        message: "401"
                    });
                   }
                })

            },

        
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
                        
                        try {
                            entreprise.societe = req.body.societe;
                            entreprise.commercial = req.body.commercial;
                            entreprise.siren = req.body.siren;
                            entreprise.siret = req.body.siret;
                            entreprise.juridique = req.body.juridique;
                            entreprise.tva = req.body.tva;
                            entreprise.activite = req.body.activite;
                            entreprise.pays = req.body.pays;
                            entreprise.ville = req.body.ville;
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

                        let entreprise = await Entreprise.findOne({_id:req.params.id});
                        entreprise.deleteOne().then((entreprise)=>{
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
            }
        }
    }

})();