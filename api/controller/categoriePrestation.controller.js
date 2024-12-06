(function(){
    "use strict";
    var Categorie = require('../models/categoriePrestation.model').CategoriePrestationModel;

    module.exports=function(acl){
        return{

            create:function(req,res){
                acl.isAllowed(req.decoded.id,'box', 'create', async function(err,aclres){
                    if(aclres){

                        try {
                            let categorie = new Categorie();
                            categorie.createdAt=new Date();
                            categorie.nom=req.body.nom;
                            categorie.reference=req.body.reference;
                            const categorieNew = await categorie.save(categorie);
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
                            let categorie = await Categorie.findOne({_id:req.params.id});
                            if(categorie){

                                Categorie.findByIdAndUpdate({_id:categorie._id},req.body, { new: true }).then((cat) => {
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

            getCategorie:function(req,res){
                acl.isAllowed(req.decoded.id,'box', 'create', async function(err,aclres){
                    if(aclres){

                        try {
                            let categorie = await Categorie.findOne({_id:req.params.id});
                            if(categorie){
                                res.json({
                                    success: true,
                                    message: categorie
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
                            let categorie = await Categorie.find();
                            res.json({
                                success: true,
                                message: categorie
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
                            let categorie = await Categorie.findOne({_id:req.params.id});
                            await categorie.deleteOne();
                            res.json({
                                success: true,
                                message: categorie
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