(function(){
    "use strict";
    var Entreprise = require('../models/entreprises.model').EntrepriseModel;
    var fs = require('fs');

    module.exports = function(acl){
        return{

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