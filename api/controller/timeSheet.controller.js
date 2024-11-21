(function(){
   "use strict";
   var TimeSheet = require('../models/timesheet.model').TimeSheetModel;
   var User = require('../models/users.model').UserModel;
   var ObjectId = require('mongoose').Types.ObjectId;
   const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

   module.exports = function(acl){
    return{
        addTimeSheet(req,res){
            acl.isAllowed(req.decoded.id,'agenda', 'create', async function(err,aclres){
                if(aclres){
                    var timeSheet = new TimeSheet(req.body);
                    timeSheet.user = req.params.id;
                    timeSheet.responsable = req.decoded.id;
                    timeSheet.save().then((time)=>{
                            res.json({
                                success:true,
                                message:time
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
        updsteTimeSheet(req,res){
            acl.isAllowed(req.decoded.id,'agenda', 'create', async function(err,aclres){
                if(aclres){
                    TimeSheet.findOneAndUpdate({_id:req.params.id},req.body,{new:true}).then((conge)=>{
                        res.json({
                            success:true,
                            message:conge
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
        deleteTimeSheet(req,res){
            acl.isAllowed(req.decoded.id,'agenda', 'delete', async function(err,aclres){

                if(aclres){

                    let timesheet = await TimeSheet.findOne({_id:req.params.id});
                    timesheet.deleteOne().then((conge)=>{
                        res.json({
                            success: true,
                            message:conge
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
        getAllTimeSheet(req,res){
            acl.isAllowed(req.decoded.id,'agenda', 'retreive', async function(err,aclres){
                if(aclres){
                    TimeSheet.find({user:req.params.id}).then((time)=>{
                        res.json({
                            success: true,
                            message:time
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
        getTimeSheet(req,res){
            acl.isAllowed(req.decoded.id,'agenda', 'retreive', async function(err,aclres){

                if(aclres){
                    TimeSheet.findOne({_id:req.params.id}).populate('user').then((conge)=>{
                        res.json({
                            success: true,
                            message:conge
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
        getAllTimeSheetByUser(req,res){
            acl.isAllowed(req.decoded.id,'agenda', 'retreive', async function(err,aclres){

                if(aclres){
                    try {
                        const timesheets = await TimeSheet.aggregate([
                            { $match: { user: new ObjectId(req.params.id)} },
                            {
                              $group: {
                                _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
                                timesheets: { $push: '$$ROOT' },
                              },
                            },
                            {
                              $sort: { '_id.year': -1, '_id.month': -1 }
                            }
                        ]);
                        const formattedTimesheets = timesheets.map(item => ({
                            month: monthNames[item._id.month - 1], // Utilise le nom du mois
                            year: item._id.year,
                            monthChiffre:item._id.month
                        }));
                        //timesheets: item.timesheets
                        res.json({
                            success: true,
                            message:formattedTimesheets
                        });  
                    } catch (error) {
                        return res.status(500).json({
                            success:false,
                            message:error.message
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
        getAllTimeSheetUserByDate(req,res){
            acl.isAllowed(req.decoded.id,'agenda', 'retreive', async function(err,aclres){

                if(aclres){
                    try {
                        const year = parseInt(req.params.year);
                        const month = parseInt(req.params.month);
                        /*const timesheets = await TimeSheet.aggregate([
                            { $match: { 
                                user: new ObjectId(req.params.id),
                                createdAt: {
                                    $gte: new Date(year, month - 1, 1),
                                    $lt: new Date(year, month, 1)
                                }  
                              }
                            },
                            {
                              $group: {
                                _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' }, day: { $dayOfMonth: '$createdAt' } },
                                timesheets: { $push: '$$ROOT' },
                              },
                            },
                            {
                              $sort: { '_id.day': 1 }
                            }
                        ]);
                         const formattedTimesheets = timesheets.map(item => ({
                            date: `${item._id.day} ${monthNames[item._id.month - 1]} ${item._id.year}`,
                            timesheets: item.timesheets
                        }));
                        
                        */
                        const timesheets = await TimeSheet.find({
                            user: new ObjectId(req.params.id),
                            createdAt: {
                              $gte: new Date(year, month - 1, 1),
                              $lt: new Date(year, month, 1)
                            }
                          }).sort({ createdAt: 1 }).populate('responsable');
                       
                        res.json({
                            success: true,
                            message:timesheets
                        });  
                    } catch (error) {
                        return res.status(500).json({
                            success:false,
                            message:error.message
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
        // TimeSheet for user agent
        getAllTimeSheetByAgent(req,res){
            acl.isAllowed(req.decoded.id,'agenda', 'retreive', async function(err,aclres){

                if(aclres){
                    try {
                        const timesheets = await TimeSheet.aggregate([
                            { $match: { user: new ObjectId(req.decoded.id)} },
                            {
                              $group: {
                                _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
                                timesheets: { $push: '$$ROOT' },
                              },
                            },
                            {
                              $sort: { '_id.year': -1, '_id.month': -1 }
                            }
                        ]);
                        const formattedTimesheets = timesheets.map(item => ({
                            month: monthNames[item._id.month - 1], // Utilise le nom du mois
                            year: item._id.year,
                            monthChiffre:item._id.month
                        }));
                        //timesheets: item.timesheets
                        res.json({
                            success: true,
                            message:formattedTimesheets
                        });  
                    } catch (error) {
                        return res.status(500).json({
                            success:false,
                            message:error.message
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
        getAllTimeSheetAgentByDate(req,res){
            acl.isAllowed(req.decoded.id,'agenda', 'retreive', async function(err,aclres){

                if(aclres){
                    try {
                        const year = parseInt(req.params.year);
                        const month = parseInt(req.params.month);
                        const timesheets = await TimeSheet.find({
                            user: new ObjectId(req.decoded.id),
                            createdAt: {
                              $gte: new Date(year, month - 1, 1),
                              $lt: new Date(year, month, 1)
                            }
                          }).sort({ createdAt: 1 });
                       
                        res.json({
                            success: true,
                            message:timesheets
                        });  
                    } catch (error) {
                        return res.status(500).json({
                            success:false,
                            message:error.message
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
        // download excel

        downloadExecelTimeSheet(req,res){
             
            acl.isAllowed(req.decoded.id,'agenda', 'retreive', async function(err,aclres){

                if(aclres){
                    try {
                        const year = parseInt(req.params.year);
                        const month = parseInt(req.params.month);

                       
                        const timesheets = await TimeSheet.aggregate([
                            // Filtrer par date
                            {
                              $match: {
                                createdAt: {
                                  $gte: new Date(year, month - 1, 1),
                                  $lt: new Date(year, month, 1)
                                }
                              }
                            },
                            // Ajouter le jour de la semaine
                            {
                              $addFields: {
                                dayOfWeek: { 
                                  $subtract: [{ $dayOfWeek: "$createdAt" }, 1] // Ajustement: 1 (dimanche) devient 0 et ainsi de suite
                                }
                              }
                            },
                            {
                              $group: {
                                _id: "$user",
                                timesheets: {
                                  $push: {
                                    _id: "$_id",
                                    createdAt: "$createdAt",
                                    dayOfWeek: "$dayOfWeek", // Ajouter le jour de la semaine ajusté
                                    tache: "$tache",
                                    heure: "$heure",
                                    deplacement: "$deplacement",
                                    projet: "$projet",
                                    motifs: "$motifs",
                                    presence: "$presence",
                                    types_deplacement: "$types_deplacement"
                                  }
                                }
                              }
                            },
                            // Rejoindre avec la collection des utilisateurs
                            {
                              $lookup: {
                                from: "users", // Le nom de la collection des utilisateurs
                                localField: "_id",
                                foreignField: "_id",
                                as: "user"
                              }
                            },
                            // Dénormaliser le tableau d'utilisateurs
                            {
                              $unwind: "$user"
                            },
                            // Formater la réponse
                            {
                              $project: {
                                user: "$user",
                                timesheets:{
                                    $sortArray:{input:"$timesheets", sortBy:{createdAt:1}}
                                } 
                              }
                            }
                        ]);
                          
                          // Transformer le jour de la semaine en nom du jour
                          const daysOfWeek = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
                          
                          timesheets.forEach(userGroup => {
                            userGroup.timesheets.forEach(ts => {
                              ts.dayOfWeek = daysOfWeek[ts.dayOfWeek]; // On peut maintenant utiliser directement dayOfWeek ajusté
                            });
                          });
                          
                       
                        res.json({
                            success: true,
                            message:timesheets
                        });  
                    } catch (error) {
                        return res.status(500).json({
                            success:false,
                            message:error.message
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

       
        // Add and Update timesheet mobile

        getCurrentDateOnly() {
            const today = new Date();
            today.setHours(0, 0, 0, 0);  // Normaliser l'heure à minuit pour garder uniquement la date
            return today;
        },

        getCurrentTimeFormatted() {
            const now = new Date();
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            return `${hours}:${minutes}`;
        },
          
        addTimeSheetMobile(req,res){
            acl.isAllowed(req.decoded.id,'agenda', 'create', async function(err,aclres){
                if(aclres){
                   
                    let user = await User.findOne({_id:req.params.id});
                    let getToday =  new Date();
                    const today =  getToday.setHours(0, 0, 0, 0);
                    // Heure
                    const now = new Date(req.body.secondAt);
                    const hours = String(now.getHours()).padStart(2, '0');
                    const minutes = String(now.getMinutes()).padStart(2, '0');
                    const heure = `${hours}:${minutes}`;
                    let hPause = "13:00";
                    let nbrHeure = 0;
                    let nbreHeureSP = 0;

                    if(user){

                        let existingTime = await TimeSheet.findOne({user:user._id, createdAt:req.body.createdAt});

                        if(existingTime){

                            // calcul nombre d'heure
                            const [startHours, startMinutes] = existingTime.heureDebut.split(':').map(Number);
                            const [endHours, endMinutes] = heure.split(':').map(Number);
                            // Calculer le total en minutes depuis minuit pour chaque heure
                            const startTotalMinutes = startHours * 60 + startMinutes;
                            const endTotalMinutes = endHours * 60 + endMinutes;
                            // Calculer la différence totale en minutes
                            let workedMinutes = endTotalMinutes - startTotalMinutes;
                            // Soustraire 1 heure (60 minutes) pour la pause
                            if(workedMinutes < 60){
                                nbreHeureSP=0
                                //console.log("Sans Pause", nbreHeureSP);
                            }else{
                                workedMinutes -= 60;
                                const hoursWorked = Math.floor(workedMinutes / 60);
                                nbrHeure = hoursWorked;
                                //console.log("Pause", nbrHeure);
                            }
                            //const minutesWorked = workedMinutes % 60;
                            if(heure > hPause){

                                //console.log("Sup",heure);
                                let body={
                                    heureFin:heure,
                                    pause:hPause,
                                    heure:nbrHeure
                                };
                                TimeSheet.findOneAndUpdate({_id:existingTime._id},body,{new:true}).then((conge)=>{
                                    res.json({
                                        success:true,
                                        message:conge
                                    });
                                }).catch((error)=>{
                                    return res.status(500).json({
                                        success:false,
                                        message:error.message
                                    })
                                })
                            }else{
                                let body={
                                    heureFin:heure,
                                    heure:nbreHeureSP
                                };
                                TimeSheet.findOneAndUpdate({_id:existingTime._id},body,{new:true}).then((conge)=>{
                                    res.json({
                                        success:true,
                                        message:conge
                                    });
                                }).catch((error)=>{
                                    return res.status(500).json({
                                        success:false,
                                        message:error.message
                                    })
                                })
                            }
                        }else{
                               let timeSheet = new TimeSheet({
                                user:user._id,
                                createdAt:req.body.createdAt,
                                heureDebut:heure,
                                localisation:req.body.position,
                                responsable:req.decoded.id
                               });
                               await timeSheet.save();
                               res.json({
                                success:true,
                                message:timeSheet
                            });
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

       
    }
   }
})();