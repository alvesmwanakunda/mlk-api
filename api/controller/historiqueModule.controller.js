(function(){
    "use strict";
    var Historique = require('../models/historiqueModule.model').HistoriqueModulesModel;

    module.exports=function(acl){
        return{
            create:function(req,res){
                acl.isAllowed(req.decoded.id,'box', 'create', async function(err,aclres){

                    if(aclres){

                        try {
                            let historique = new Historique();
                            historique.dateLastUpdate=new Date();
                            historique.observation=req.body.observation;
                            historique.user = req.decoded.id;
                            //historique.duree=req.body.duree; 
                            //historique.entreprise=req.body.entreprise;
                            historique.module=req.params.id;  
                            
                            const newHistorique = await historique.save();
                            return res.status(200).json({
                                success: true,
                                message: newHistorique,
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

                            let historique = await Historique.findOne({_id:req.params.id});
                            historique.dateLastUpdate=new Date();
                            historique.observation=req.body.observation;
                            //historique.duree=req.body.duree; 
                            //historique.entreprise=req.body.entreprise;

                            Historique.findByIdAndUpdate({_id:req.params.id},historique, { new: true }).then((module) => {
                                res.json({
                                  success: true,
                                  message: module
                                });
                            }).catch((error) => {
                                            console.error(error);
                                            return res.status(500).json({
                                            success: false,
                                            message: error.message
                                            });
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

                        let historique= await Historique.findOne({_id:req.params.id});
                        historique.deleteOne().then((module)=>{
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

            getAllHistorique:function(req,res){
                acl.isAllowed(req.decoded.id,'box', 'create', async function(err,aclres){

                    if(aclres){
                        Historique.find({module:req.params.id}).populate('user').then((module)=>{
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

            getHistorique:function(req,res){
                acl.isAllowed(req.decoded.id,'box', 'create', async function(err,aclres){

                    if(aclres){
                        Historique.findOne({_id:req.params.id}).populate("module").populate("user").then((module)=>{
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