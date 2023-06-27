(function(){
    "use strict";
    var Agenda = require("../models/agenda.model").AgendaModel;

    module.exports = function(acl){
        return {

            addAgenda(req,res){
                acl.isAllowed(req.decoded.id,'agenda', 'create', async function(err,aclres){
                    if(aclres){
                      
                        var agenda = new Agenda(req.body);
                        agenda.user = req.decoded.id;

                            agenda.save().then((agenda)=>{
                                res.json({
                                    success:true,
                                    message:agenda
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
            updateAgenda(req,res){
                acl.isAllowed(req.decoded.id,'agenda', 'update', async function(err,aclres){
                    if(aclres){
                        Agenda.findOneAndUpdate({_id:req.params.id},req.body,{new:true}).then((agenda)=>{
                            res.json({
                                success:true,
                                message:agenda
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

            deleteAgenda(req,res){
                acl.isAllowed(req.decoded.id,'agenda', 'delete', async function(err,aclres){

                    if(aclres){

                        let agenda = await Agenda.findOne({_id:req.params.id});
                        agenda.deleteOne().then((agenda)=>{
                            res.json({
                                success: true,
                                message:agenda
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

            getAllAgenda(req,res){
                acl.isAllowed(req.decoded.id,'agenda', 'retreive', async function(err,aclres){

                    if(aclres){
                        Agenda.find().then((agenda)=>{
                            res.json({
                                success: true,
                                message:agenda
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

            getAgenda(req,res){
                acl.isAllowed(req.decoded.id,'agenda', 'retreive', async function(err,aclres){

                    if(aclres){
                        Agenda.findOne({_id:req.params.id}).then((agenda)=>{
                            res.json({
                                success: true,
                                message:agenda
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