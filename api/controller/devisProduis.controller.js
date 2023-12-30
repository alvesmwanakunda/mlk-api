(function(){
    "use strict";
    var DevisProduit = require('../models/devisProduits.model').DevisProduitsModel;
    var Devis = require('../models/devis.model').DevisModel;
    var prestashopService = require('../services/prestashop.service');



    module.exports=function(acl){

        return{

            getProduits:function(req,res){
                acl.isAllowed(req.decoded.id,'box', 'create', async function(err,aclres){

                    if(aclres){

                        let produits = await prestashopService.getAllProducts();
                        //console.log("Produits", produits);
                        res.json({
                            success: true,
                            message:produits
                        });
                    }else{
                        return res.status(401).json({
                            success: false,
                            message: "401"
                        });  
                    }
                })

            },

            create:function(req,res){
                acl.isAllowed(req.decoded.id,'box', 'create', async function(err,aclres){

                    if(aclres){

                        let produit = new  DevisProduit();
                        let devis = await Devis.findOne({_id:req.params.id});

                        produit.createdAt=new Date();
                        produit.produit=req.body.produit;
                        produit.devis=req.params.id;
                        produit.description=req.body.description;
                        produit.price=req.body.price;
                        produit.quantite=req.body.quantite;
                        produit.price_unitaire=req.body.price_unitaire;
                        produit.tva=req.body.tva;
                        produit.unites=req.body.unites;
                        produit.total=req.body.total;

                        produit.save().then(async (produit) => {
                            devis.total= devis.total + produit.total;
                            let updateDevis = await Devis.findByIdAndUpdate({_id:devis._id},devis,{new:true});
                            res.json({
                                success: true,
                                message: produit,
                                devis:updateDevis
                            });
                        }).catch((error) => {
                            console.error(error);
                            return res.status(500).json({
                                success: false,
                                message: error
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

            update:function(req,res){
                acl.isAllowed(req.decoded.id,'box', 'create', async function(err,aclres){

                    if(aclres){

                        let produit = await DevisProduit.findOne({_id:req.params.id});

                        if(produit){
                            let devis = await Devis.findOne({_id:produit.devis});
                            let total = parseInt(devis.total)- parseInt(produit.total);
                            produit.createdAt=new Date();
                            produit.price=req.body.price;
                            produit.quantite=req.body.quantite;
                            produit.tva=req.body.tva;
                            produit.total=req.body.total;

                            try {
                                DevisProduit.findByIdAndUpdate({_id:req.params.id},produit, { new: true }).then(async (produit) => {

                                    devis.total= total + produit.total;
                                    let updateDevis = await Devis.findByIdAndUpdate({_id:devis._id},devis,{new:true});
    
                                    res.json({
                                        success: true,
                                        message: produit,
                                        devis:updateDevis
                                    });
                                }).catch((error) => {
                                    console.error(error);
                                    return res.status(500).json({
                                        success: false,
                                        message: error
                                    });
                                });
                               
                            } catch (error) {
                                return res.status(500).json({
                                    success:false,
                                    message:error
                                })
                            }
                        }

                    }else{
                        return res.status(401).json({
                            success: false,
                            message: "401"
                        });  
                    }
                })

            },

            updateUnites:function(req,res){
                acl.isAllowed(req.decoded.id,'box', 'create', async function(err,aclres){

                    if(aclres){

                        let produit = await DevisProduit.findOne({_id:req.params.id});

                        if(produit){
                    
                            produit.createdAt=new Date();
                            produit.unites=req.body.unites;

                            try {
                                DevisProduit.findByIdAndUpdate({_id:req.params.id},produit, { new: true }).then(async (produit) => {

                                    res.json({
                                        success: true,
                                        message: produit,
                                    });
                                }).catch((error) => {
                                    console.error(error);
                                    return res.status(500).json({
                                        success: false,
                                        message: error
                                    });
                                });
                               
                            } catch (error) {
                                return res.status(500).json({
                                    success:false,
                                    message:error
                                })
                            }
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

                        let produit= await DevisProduit.findOne({_id:req.params.id});
                        if(produit){
                            let devis = await Devis.findOne({_id:produit.devis});
                            devis.total = devis.total - produit.total;

                            produit.deleteOne().then(async (module)=>{
                                let updateDevis = await Devis.findByIdAndUpdate({_id:devis._id},devis,{new:true});
                                res.json({
                                    success: true,
                                    message:module,
                                    devis:updateDevis
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

            getDevis:function(req,res){
                acl.isAllowed(req.decoded.id,'box', 'create', async function(err,aclres){

                    if(aclres){
                        DevisProduit.findOne({_id:req.params.id}).then((module)=>{
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

            getAllDevisProduit:function(req,res){
                acl.isAllowed(req.decoded.id,'box', 'create', async function(err,aclres){

                    if(aclres){
                        DevisProduit.find({devis:req.params.id}).then((module)=>{
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