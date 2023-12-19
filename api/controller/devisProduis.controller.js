(function(){
    "use strict";
    var DevisProduit = require('../models/devisProduits.model').DevisProduitsModel;
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
            update:function(req,res){
                acl.isAllowed(req.decoded.id,'box', 'create', async function(err,aclres){

                    if(aclres){

                        let devis = await DevisProduit.findOne({_id:req.params.id});

                        devis.createdAt=new Date();
                        devis.produit=req.body.produit;
                        devis.description=req.body.description;
                        devis.price=req.body.price;
                        devis.quantite=req.body.quantite;
                        devis.price_unitaire=req.body.price_unitaire;

                        try {
                            Devis.findByIdAndUpdate({_id:req.params.id},devis, { new: true }).then((module) => {
                                          res.json({
                                            success: true,
                                            message: module
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

                        let devis= await DevisProduit.findOne({_id:req.params.id});
                        devis.deleteOne().then((module)=>{
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