(function(){
    "use strict";
    var Facture = require('../models/facture.mode').FacturesModel;
    var Devis = require('../models/devis.model').DevisModel;

    module.exports=function(acl){

        return{
             create:function(req,res){
                acl.isAllowed(req.decoded.id,'box', 'create', async function(err,aclres){

                    if(aclres){

                        let devis = await Devis.findOne({_id:req.params.id});
                        let facture = new Facture();

                        facture.dateLastUpdate=new Date();
                        facture.numero=devis.numero;
                        facture.devis=devis._id;
                            
                        facture.save().then((data)=>{
                              res.json({
                                    success: true,
                                    message: data
                              });
                            }).catch((error)=>{
                                return res.status(500).json({
                                    success:false,
                                    message:error
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
           /*  
             update:function(req,res){
                acl.isAllowed(req.decoded.id,'box', 'create', async function(err,aclres){

                    if(aclres){

                        let facture = await Facture.findOne({_id:req.params.id});

                        facture.dateLastUpdate=new Date();
                        facture.numero=req.body.numero;
                        facture.devis= req.body.devis;
                        
                        Facture.findByIdAndUpdate({_id:req.params.id},facture, { new: true }).then((module) => {
                                res.json({
                                    success: true,
                                    message: module
                                });
                            }).catch((error) => {
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
             delete:function(req,res){
                acl.isAllowed(req.decoded.id,'box', 'create', async function(err,aclres){

                    if(aclres){

                        let facture= await Facture.findOne({_id:req.params.id});
                        facture.deleteOne().then((module)=>{
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
             getFacture:function(req,res){
                acl.isAllowed(req.decoded.id,'box', 'create', async function(err,aclres){

                    if(aclres){
                        Facture.findOne({_id:req.params.id}).populate("devis").populate({path:'devis', populate:{path:'projet'}}).populate({path:'devis', populate:{path:'entreprise'}}).then((module)=>{
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

             getAllFactures:function(req,res){
                acl.isAllowed(req.decoded.id,'box', 'create', async function(err,aclres){

                    if(aclres){
                        Facture.find().populate("devis").populate({path:'devis', populate:{path:'projet'}}).populate({path:'devis', populate:{path:'entreprise'}}).then((module)=>{
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

             getAllFacturesByProjet:function(req,res){
                acl.isAllowed(req.decoded.id,'box', 'create', async function(err,aclres){

                    if(aclres){
                        Facture.find({projet:req.params.id}).populate("devis").populate({path:'devis', populate:{path:'projet'}}).populate({path:'devis', populate:{path:'entreprise'}}).then((module)=>{
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
          */
             
        }
    }
})();