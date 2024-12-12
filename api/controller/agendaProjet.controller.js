(function(){
    "use strict";
    var Agenda = require('../models/agendaProjet.model').AgendaProjetModel;

    module.exports = function(acl){

        return{

            addAgenda(req,res){
                acl.isAllowed(req.decoded.id,'agenda', 'create', async function(err,aclres){
                    if(aclres){
                      
                       

                        var agenda = new Agenda();

                            if(req.body.end){
                                agenda.end=req.body.end;
                            }
                            if(req.body.isDay==false){
                                agenda.end=req.body.start;
                            }
                            agenda.user = req.decoded.id;
                            agenda.projet = req.params.id;
                            agenda.isDay = req.body.isDay;
                            agenda.title = req.body.title;
                            agenda.color = req.body.color;
                            agenda.heure_end=req.body.heure_end;
                            agenda.heure_start=req.body.heure_start;
                            agenda.start = req.body.start;

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

                        let agenda = await Agenda.findOne({_id:req.params.id});

                        if(req.body.isDay==false){
                            agenda.end=req.body.start;
                        }
                        if(req.body.isDay==true){
                            agenda.end=req.body.end;
                        }
                        agenda.user = req.decoded.id;
                        agenda.isDay = req.body.isDay;
                        agenda.title = req.body.title;
                        agenda.color = req.body.color;
                        agenda.heure_end=req.body.heure_end;
                        agenda.heure_start=req.body.heure_start;
                        agenda.start = req.body.start;


                        Agenda.findOneAndUpdate({_id:req.params.id},agenda,{new:true}).then((agenda)=>{
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

            getAllAgendaByProjet(req,res){
                acl.isAllowed(req.decoded.id,'agenda', 'retreive', async function(err,aclres){

                    if(aclres){
                        Agenda.find({projet:req.params.id}).then((agenda)=>{

                            let agendas = agenda.map((data)=>({
                                _id:data?._id,
                                title:data?.title,
                                start: data?.start.toISOString().split('T')[0]+"T"+data?.heure_start,
                                end: data?.end.toISOString().split('T')[0]+"T"+data?.heure_end,
                                heure_start: data?.heure_start,
                                heure_end:data?.heure_end,
                                color:data?.color,
                                isDay:data?.isDay,
                                user:data?.user,
                                projet:data?.projet
                            }))
                            res.json({
                                success: true,
                                message:agendas
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
            },
            getAgendaWeb(req,res){
                acl.isAllowed(req.decoded.id,'agenda', 'retreive', async function(err,aclres){

                    if(aclres){
                        Agenda.findOne({_id:req.params.id}).then((data)=>{
                            let agend = {
                                _id:data?._id,
                                title:data?.title,
                                start: data?.start.toISOString().split('T')[0],
                                end: data?.end.toISOString().split('T')[0],
                                heure_start: data?.heure_start,
                                heure_end:data?.heure_end,
                                color:data?.color,
                                isDay:data?.isDay,
                                user:data?.user
                            }
                            res.json({
                                success: true,
                                message:agend
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