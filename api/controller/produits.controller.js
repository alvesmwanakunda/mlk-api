(function(){

    "use strict";
    var Produit = require('../models/produits.model').ProduitsModel;
    var prestashopService = require('../services/prestashop.service');

    module.exports = function(acl){
        return{

            getProduits:function(req,res){
                    acl.isAllowed(req.decoded.id,'box', 'create', async function(err,aclres){
                        if(aclres){
                            let produits = await prestashopService.getAllProducts();
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

            getProduit:function(req,res){
                acl.isAllowed(req.decoded.id,'box', 'create', async function(err,aclres){
                    if(aclres){
                        let produit = await prestashopService.getProduct(req.params.id);
                        res.json({
                            success: true,
                            message:produit
                        });
                    }else{
                        return res.status(401).json({
                            success: false,
                            message: "401"
                        });  
                    }
                })

            },
            
            getImagesProduit:function(req,res){
                acl.isAllowed(req.decoded.id,'box', 'create', async function(err,aclres){
                    if(aclres){
                        let produit = await prestashopService.getImagesProduct(req.params.id);
                        res.json({
                            success: true,
                            message:produit
                        });
                    }else{
                        return res.status(401).json({
                            success: false,
                            message: "401"
                        });  
                    }
                })

            },

            addProduit(req,res){
                    acl.isAllowed(req.decoded.id,'projets', 'create', async function(err,aclres){
                        if(aclres){
                            let produit = new Produit();
                            produit.createdAt = new Date();

                            // categories: [2, 3],

                            let prestashop={
                                name: {
                                    value: req.body.name
                                },
                                description: {
                                    value: req.body.description
                                },
                                price: req.body.price,
                                reference: req.body.reference,
                                active: 1,
                                id_category_default: req.body.category_default,
                                categories:req.body.categories, // Tableau des ID des catégories associées
                                quantity: req.body.quantity,
                                available_for_order: 1,
                                visibility: 'both',
                                condition: 'new',
                                id_supplier: req.body.supplier, // ID du fournisseur
                                id_manufacturer: req.body.manufacture, // ID du fabricant
                                id_tax_rules_group: req.body.tax // ID du groupe de règles de taxes
                            }
                        }else{
                            return res.status(401).json({
                                success: false,
                                message: "401"
                            });  
                        }
                    })
            },

            getAllCategories(req,res){
                acl.isAllowed(req.decoded.id,'projets', 'create', async function(err,aclres){
                    if(aclres){
                        let categories = await prestashopService.getAllCategories();
                        res.json({
                            success: true,
                            message:categories
                        });
                    }else{
                        return res.status(401).json({
                            success: false,
                            message: "401"
                        }); 
                    }
                })
            },

            getAllManufactures(req,res){
                acl.isAllowed(req.decoded.id,'projets', 'create', async function(err,aclres){
                    if(aclres){
                        let categories = await prestashopService.getAllManufactures();
                        res.json({
                            success: true,
                            message:categories
                        });
                    }else{
                        return res.status(401).json({
                            success: false,
                            message: "401"
                        }); 
                    }
                })
            },

            getAllSuppliers(req,res){
                acl.isAllowed(req.decoded.id,'projets', 'create', async function(err,aclres){
                    if(aclres){
                        let categories = await prestashopService.getAllSuppliers();
                        res.json({
                            success: true,
                            message:categories
                        });
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