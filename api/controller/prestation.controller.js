(function(){

    "use strict";
    var Prestation = require('../models/prestation.model').PrestationModel;

    module.exports=function(acl){
        return{

            create:function(req,res){
                acl.isAllowed(req.decoded.id,'box', 'create', async function(err,aclres){
                    if(aclres){

                        try {
                            let prestation = new Prestation();
                            prestation.createdAt=new Date();
                            prestation.nom=req.body.nom;
                            prestation.reference=req.body.reference;
                            prestation.prix=req.body.prix;
                            prestation.unite=req.body.unite;
                            prestation.categorie = req.params.id;

                            const categorieNew = await prestation.save(prestation);
                            return res.status(200).json({
                                success: true,
                                message: categorieNew,
                            }); 
                        } catch (error) {
                            console.error(error);
                            return res.status(500).json({
                                success: false,
                                message: "Erreur lors de l'enregistrement du devis et des produits"
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

            update:function(req,res){
                acl.isAllowed(req.decoded.id,'box', 'create', async function(err,aclres){
                    if(aclres){

                        try {
                            let prestation = await Prestation.findOne({_id:req.params.id});
                            if(prestation){

                                Prestation.findByIdAndUpdate({_id:prestation._id},req.body, { new: true }).then((cat) => {
                                    res.json({
                                        success: true,
                                        message: cat
                                    });
                                }).catch((error) => {
                                    return res.status(500).json({
                                        success: false,
                                        message: error
                                    });
                            });

                            }else{
                                return res.status(500).json({
                                    success: false,
                                    message: "Erreur lors de l'enregistrement du devis et des produits"
                                });
                            }
                        } catch (error) {
                            console.error(error);
                            return res.status(500).json({
                                success: false,
                                message: "Erreur lors de l'enregistrement du devis et des produits"
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

            getPrestation:function(req,res){
                acl.isAllowed(req.decoded.id,'box', 'create', async function(err,aclres){
                    if(aclres){

                        try {
                            let prestation = await Prestation.findOne({_id:req.params.id});
                            if(prestation){
                                res.json({
                                    success: true,
                                    message: prestation
                                });

                            }else{
                                return res.status(500).json({
                                    success: false,
                                    message: "Erreur lors de l'enregistrement du devis et des produits"
                                });
                            }
                        } catch (error) {
                            console.error(error);
                            return res.status(500).json({
                                success: false,
                                message: "Erreur lors de l'enregistrement du devis et des produits"
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

            getAll:function(req,res){
                acl.isAllowed(req.decoded.id,'box', 'create', async function(err,aclres){
                    if(aclres){

                        try {
                            let prestation = await Prestation.find();
                            res.json({
                                success: true,
                                message: prestation
                            });
                        } catch (error) {
                            console.error(error);
                            return res.status(500).json({
                                success: false,
                                message: "Erreur lors de l'enregistrement du devis et des produits"
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

            getAllByCategorie:function(req,res){
                acl.isAllowed(req.decoded.id,'box', 'create', async function(err,aclres){
                    if(aclres){

                        try {
                            let prestation = await Prestation.find({categorie:req.params.id});
                            res.json({
                                success: true,
                                message: prestation
                            });
                        } catch (error) {
                            console.error(error);
                            return res.status(500).json({
                                success: false,
                                message: "Erreur lors de l'enregistrement du devis et des produits"
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

            delete:function(req,res){
                acl.isAllowed(req.decoded.id,'box', 'create', async function(err,aclres){
                    if(aclres){

                        try {
                            let prestation = await Prestation.findOne({_id:req.params.id});
                            await prestation.deleteOne();
                            res.json({
                                success: true,
                                message: prestation
                            });
                        } catch (error) {
                            console.error(error);
                            return res.status(500).json({
                                success: false,
                                message: "Erreur lors de l'enregistrement du devis et des produits"
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
        }
    }
    
})();