(function(){

     "use strict";
     var Tache = require('../models/taches.model').TacheModel;


     module.exports = function(acl){
        return {
                 
            addTache(req,res,next){
                acl.isAllowed(req.decoded.id,'projets', 'create', async function(err,aclres){
                    if(aclres){

                        var tache = new Tache(req.body);
                        tache.projet = req.params.id;
                        tache.save().then((tache)=>{
                                res.json({
                                    success:true,
                                    message:tache
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

            updateTache(req,res){
                acl.isAllowed(req.decoded.id,'agenda', 'create', async function(err,aclres){
                    if(aclres){
                        Tache.findOneAndUpdate({_id:req.params.id},req.body,{new:true}).then((tache)=>{
                            res.json({
                                success:true,
                                message:tache
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

            deleteTache(req,res){
                acl.isAllowed(req.decoded.id,'agenda', 'delete', async function(err,aclres){

                    if(aclres){

                        let tache = await Tache.findOne({_id:req.params.id});
                        tache.deleteOne().then((tache)=>{
                            res.json({
                                success: true,
                                message:tache
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

            getTache(req,res){
                acl.isAllowed(req.decoded.id,'agenda', 'retreive', async function(err,aclres){

                    if(aclres){
                        Tache.findOne({_id:req.params.id}).populate('assignes').populate('projet').then((tache)=>{
                            res.json({
                                success: true,
                                message:tache
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

            getAllTacheByProjet(req,res){
                acl.isAllowed(req.decoded.id,'agenda', 'retreive', async function(err,aclres){

                    if(aclres){
                        Tache.find({projet:req.params.id}).populate('assignes').then((tache)=>{
                            res.json({
                                success: true,
                                message:tache
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