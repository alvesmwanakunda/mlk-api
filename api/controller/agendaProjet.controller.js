(function(){
    "use strict";
    var Agenda = require('../models/agendaProjet.model').AgendaProjetModel;
    var translationService = require('../services/deeplTranslation.service');

    function formatAgendaDate(date, time, web = false) {
        if (!date) return null;
        const day = date.toISOString().split('T')[0];
        return web ? day : `${day}T${time || ''}`;
    }

    function serializeAgendaProjet(data, requestedLanguage, web = false) {
        const agenda = translationService.withDisplayTitle(data, requestedLanguage);
        return {
            _id: agenda?._id,
            title: agenda?.title,
            originalTitle: agenda?.originalTitle,
            titleSourceLanguage: agenda?.titleSourceLanguage,
            titleTranslations: agenda?.titleTranslations || {},
            titleTranslation: agenda?.titleTranslation,
            displayTitle: agenda?.displayTitle,
            start: formatAgendaDate(agenda?.start, agenda?.heure_start, web),
            end: formatAgendaDate(agenda?.end, agenda?.heure_end, web),
            heure_start: agenda?.heure_start,
            heure_end: agenda?.heure_end,
            color: agenda?.color,
            isDay: agenda?.isDay,
            user: agenda?.user,
            projet: agenda?.projet,
            timeZoneOffset: agenda?.timeZoneOffset
        };
    }

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
                            Object.assign(
                                agenda,
                                await translationService.buildAgendaTitleTranslationFields(
                                    req.body.title || ''
                                )
                            );
                            agenda.color = req.body.color;
                            agenda.heure_end=req.body.heure_end;
                            agenda.heure_start=req.body.heure_start;
                            agenda.start = req.body.start;
                            agenda.timeZoneOffset = req.body.timeZoneOffset;

                            agenda.save().then(async (agenda)=>{
                                const requestedLanguage =
                                    await translationService.getRequestedLanguage(req);
                                res.json({
                                    success:true,
                                    message: translationService.withDisplayTitle(
                                        agenda,
                                        requestedLanguage
                                    )
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

                        if(req.body.isDay==false || req.body.isDay=="false"){
                            agenda.end=req.body.start;
                        }
                        if(req.body.isDay==true || req.body.isDay=="true"){
                            agenda.end=req.body.end;
                        }
                        agenda.user = req.decoded.id;
                        agenda.isDay = req.body.isDay;
                        if (req.body.title !== undefined) {
                            Object.assign(
                                agenda,
                                await translationService.buildAgendaTitleTranslationFields(
                                    req.body.title || ''
                                )
                            );
                        }
                        agenda.color = req.body.color;
                        agenda.heure_end=req.body.heure_end;
                        agenda.heure_start=req.body.heure_start;
                        agenda.start = req.body.start;
                        agenda.timeZoneOffset = req.body.timeZoneOffset;


                        Agenda.findOneAndUpdate({_id:req.params.id},agenda,{new:true}).then(async (agenda)=>{
                            const requestedLanguage =
                                await translationService.getRequestedLanguage(req);
                            res.json({
                                success:true,
                                message: translationService.withDisplayTitle(
                                    agenda,
                                    requestedLanguage
                                )
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
                        Agenda.find({projet:req.params.id}).then(async (agenda)=>{
                            const requestedLanguage =
                                await translationService.getRequestedLanguage(req);
                            let agendas = agenda.map((data)=>
                                serializeAgendaProjet(data, requestedLanguage)
                            )
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
                        Agenda.findOne({_id:req.params.id}).then(async (agenda)=>{
                            const requestedLanguage =
                                await translationService.getRequestedLanguage(req);
                            res.json({
                                success: true,
                                message: translationService.withDisplayTitle(
                                    agenda,
                                    requestedLanguage
                                )
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
                        Agenda.findOne({_id:req.params.id}).then(async (data)=>{
                            const requestedLanguage =
                                await translationService.getRequestedLanguage(req);
                            let agend = serializeAgendaProjet(data, requestedLanguage, true);
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
