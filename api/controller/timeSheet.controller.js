
(function(){
   "use strict";
   var TimeSheet = require('../models/timesheet.model').TimeSheetModel;
   var User = require('../models/users.model').UserModel;
   var ObjectId = require('mongoose').Types.ObjectId;
   const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

    // Fonction utilitaire pour calculer les statistiques
    function calculerStatistiques(timesheets) {
        const stats = {
            totalTimesheets: timesheets.length,
            totalHeures: 0,
            totalMinutes: 0,
            parUtilisateur: {},
            parProjet: {},
            parStatus: {},
            parPresence: {}
        };

        timesheets.forEach(ts => {
            // Totaux
            if (ts.heure) stats.totalHeures += ts.heure;
            if (ts.minute) stats.totalMinutes += ts.minute;

            // Par statut
            const status = ts.status || 'Non défini';
            stats.parStatus[status] = (stats.parStatus[status] || 0) + 1;

            // Par présence
            const presence = ts.presence || 'Non défini';
            stats.parPresence[presence] = (stats.parPresence[presence] || 0) + 1;

            // Par utilisateur
            if (ts.user && ts.user._id) {
                const userId = ts.user._id.toString();
                const userName = `${ts.user.prenom || ''} ${ts.user.nom || ''}`.trim();
                if (!stats.parUtilisateur[userId]) {
                    stats.parUtilisateur[userId] = {
                        nom: userName,
                        count: 0,
                        heures: 0,
                        minutes: 0
                    };
                }
                stats.parUtilisateur[userId].count++;
                if (ts.heure) stats.parUtilisateur[userId].heures += ts.heure;
                if (ts.minute) stats.parUtilisateur[userId].minutes += ts.minute;
            }

            // Par projet
            if (ts.projet && ts.projet._id) {
                const projetId = ts.projet._id.toString();
                const projetNom = ts.projet.projet || 'Sans nom';
                if (!stats.parProjet[projetId]) {
                    stats.parProjet[projetId] = {
                        nom: projetNom,
                        count: 0,
                        heures: 0,
                        minutes: 0
                    };
                }
                stats.parProjet[projetId].count++;
                if (ts.heure) stats.parProjet[projetId].heures += ts.heure;
                if (ts.minute) stats.parProjet[projetId].minutes += ts.minute;
            }
        });

        return stats;
    }

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
                          }).sort({ createdAt: 1 }).populate('responsable').populate('projet');
                       
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
        //Pour aperçu
        getAllTimeSheetUserByPeriod(req,res){
            acl.isAllowed(req.decoded.id,'agenda', 'retreive', async function(err,aclres){

                if(aclres){
                    try {
                        const startDate = new Date(req.params.start);
                        const endDate = new Date(req.params.end);
                        endDate.setDate(endDate.getDate() + 1);

                        const timesheets = await TimeSheet.aggregate([
                            {
                              $match: {
                                user: new ObjectId(req.params.id),
                                createdAt: {
                                  $gte: startDate,
                                  $lt: endDate
                                }
                              }
                            },
                            // Trier par ordre croissant suivant date
                            {
                              $sort : {createdAt : 1}
                            },
                            // Ajouter le jour de la semaine
                            {
                              $addFields: {
                                dayOfWeek: { 
                                  $subtract: [{ $dayOfWeek: "$createdAt" }, 1] // Ajustement: 1 (dimanche) devient 0 et ainsi de suite
                                }
                              }
                            },
                            //Faire une projection sur ces champs
                            {
                                $project: { 
                                    _id: 1,
                                    createdAt: 1,
                                    dayOfWeek: 1,
                                    tache: 1,
                                    heure: 1,
                                    deplacement: 1,
                                    projet: 1,
                                    motifs: 1,
                                    presence: 1,
                                    types_deplacement: 1
                                }
                            },
                        ])

                        const daysOfWeek = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
                          
                        timesheets.forEach(ts => {
                           ts.dayOfWeek = daysOfWeek[ts.dayOfWeek];
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
                                  },
                                },
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
                    let nbrMin =0;

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
                            if(workedMinutes <0){
                                console.log("Erreur: dateDebut est supérieure à dateFin");
                            }

                            if(heure > hPause){
                                workedMinutes -= 60;
                                const hoursWorked = Math.floor(workedMinutes / 60);
                                nbrHeure = hoursWorked;
                                const minutesWorked = workedMinutes % 60;
                                nbrMin = minutesWorked;
                            }else{
                                if(workedMinutes < 60){
                                    nbrHeure=0
                                }else{
                                    const hoursWorked = Math.floor(workedMinutes / 60);
                                    nbrHeure = hoursWorked;
                                    const minutesWorked = workedMinutes % 60;
                                    nbrMin = minutesWorked;
                                }
                            }
                            let body={
                                heureFin:heure,
                                pause:hPause,
                                heure:nbrHeure,
                                minute:nbrMin,
                            };
                            if (req.body.projet){
                                body.projet = req.body.projet;
                            }
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
                               let timeSheet = new TimeSheet({
                                user:user._id,
                                createdAt:req.body.createdAt,
                                heureDebut:heure,
                                localisation:req.body.position,
                                responsable:req.decoded.id,
                                presence:"Présent",
                               });
                               if (req.body.projet){
                                timeSheet.projet = req.body.projet;
                               }
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

        getAllTimeToDay(req,res){
            acl.isAllowed(req.decoded.id,'agenda', 'retreive', async function(err,aclres){

                if(aclres){
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    
                    const tomorrow = new Date(today);
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    // Construire la requête
                    const query = {
                        createdAt: {
                            $gte: today,
                            $lt: tomorrow
                        }
                    };
                    // Récupérer les timesheets avec population des relations
                   const timesheets = await TimeSheet.find(query).populate('user', 'nom prenom') .populate('projet', 'projet entreprise').sort({ createdAt: -1 });
                   return res.status(200).json({
                        success: true,
                        message: timesheets,
                   });
                }else{
                    return res.status(401).json({
                        success: false,
                        message: "401"
                    });
                }
            })
        },

        // ==================== FILTRES TEMPORELS ====================

        // 1. Filtrer par mois (YYYY-MM)
        getTimesheetsByMonth(req, res) {
            acl.isAllowed(req.decoded.id, 'agenda', 'retreive', async function(err, aclres) {
                if (err) {
                    return res.status(500).json({ 
                        success: false, 
                        message: 'ACL error', 
                        error: err.message 
                    });
                }
                
                if (!aclres) {
                    return res.status(401).json({
                        success: false,
                        message: "401"
                    });
                }

                try {
                    const { month } = req.params; // Format: 2024-02
                    
                    if (!month || !month.match(/^\d{4}-\d{2}$/)) {
                        return res.status(400).json({
                            success: false,
                            message: "Format de mois invalide. Utilisez YYYY-MM (ex: 2024-02)"
                        });
                    }

                    const [year, monthNum] = month.split('-');
                    
                    // Premier jour du mois
                    const startOfMonth = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
                    startOfMonth.setHours(0, 0, 0, 0);
                    
                    // Dernier jour du mois
                    const endOfMonth = new Date(parseInt(year), parseInt(monthNum), 1);
                    endOfMonth.setHours(0, 0, 0, 0);

                    const timesheets = await TimeSheet.find({
                        createdAt: {
                            $gte: startOfMonth,
                            $lt: endOfMonth
                        }
                    })
                    .populate('user', 'nom prenom email')
                    .populate('projet', 'projet entreprise')
                    .sort({ createdAt: -1 });

                    // Statistiques du mois
                    const stats = calculerStatistiques(timesheets);

                    return res.status(200).json({
                        success: true,
                        message: `Timesheets du mois ${month} récupérés avec succès`,
                        data: {
                            periode: {
                                type: 'mois',
                                mois: month,
                                debut: startOfMonth,
                                fin: endOfMonth
                            },
                            count: timesheets.length,
                            timesheets: timesheets,
                            statistiques: stats
                        }
                    });

                } catch (error) {
                    console.error('Erreur:', error);
                    return res.status(500).json({
                        success: false,
                        message: error.message
                    });
                }
            });
        },

        // 2. Filtrer par jour spécifique (YYYY-MM-DD)
        getTimesheetsByDay(req, res) {
            acl.isAllowed(req.decoded.id, 'agenda', 'retreive', async function(err, aclres) {
                if (err) {
                    return res.status(500).json({ 
                        success: false, 
                        message: 'ACL error', 
                        error: err.message 
                    });
                }
                
                if (!aclres) {
                    return res.status(401).json({
                        success: false,
                        message: "401"
                    });
                }

                try {
                    const { date } = req.params; // Format: 2024-02-15
                    
                    if (!date || !date.match(/^\d{4}-\d{2}-\d{2}$/)) {
                        return res.status(400).json({
                            success: false,
                            message: "Format de date invalide. Utilisez YYYY-MM-DD (ex: 2024-02-15)"
                        });
                    }

                    const targetDate = new Date(date);
                    if (isNaN(targetDate.getTime())) {
                        return res.status(400).json({
                            success: false,
                            message: "Date invalide"
                        });
                    }

                    const startOfDay = new Date(targetDate);
                    startOfDay.setHours(0, 0, 0, 0);
                    
                    const endOfDay = new Date(targetDate);
                    endOfDay.setDate(endOfDay.getDate() + 1);
                    endOfDay.setHours(0, 0, 0, 0);

                    const timesheets = await TimeSheet.find({
                        createdAt: {
                            $gte: startOfDay,
                            $lt: endOfDay
                        }
                    })
                    .populate('user', 'nom prenom')
                    .populate('projet', 'projet')
                    .sort({ createdAt: -1 });

                    return res.status(200).json({
                        success: true,
                        message: `Timesheets du ${date} récupérés avec succès`,
                        data: {
                            periode: {
                                type: 'jour',
                                date: date
                            },
                            count: timesheets.length,
                            timesheets: timesheets
                        }
                    });

                } catch (error) {
                    console.error('Erreur:', error);
                    return res.status(500).json({
                        success: false,
                        message: error.message
                    });
                }
            });
        },

        // 3. Filtrer par période (date de début - date de fin)
        getTimesheetsByPeriod(req, res) {
            acl.isAllowed(req.decoded.id, 'agenda', 'retreive', async function(err, aclres) {
                if (err) {
                    return res.status(500).json({ 
                        success: false, 
                        message: 'ACL error', 
                        error: err.message 
                    });
                }
                
                if (!aclres) {
                    return res.status(401).json({
                        success: false,
                        message: "401"
                    });
                }

                try {
                    const { startDate, endDate } = req.query; // Format: startDate=2024-02-01&endDate=2024-02-15
                    
                    if (!startDate || !endDate) {
                        return res.status(400).json({
                            success: false,
                            message: "Les paramètres startDate et endDate sont requis (format: YYYY-MM-DD)"
                        });
                    }

                    // Valider les dates
                    const start = new Date(startDate);
                    const end = new Date(endDate);
                    
                    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                        return res.status(400).json({
                            success: false,
                            message: "Dates invalides"
                        });
                    }

                    // Définir le début et fin de période
                    start.setHours(0, 0, 0, 0);
                    end.setDate(end.getDate() + 1);
                    end.setHours(0, 0, 0, 0);

                    const timesheets = await TimeSheet.find({
                        createdAt: {
                            $gte: start,
                            $lt: end
                        }
                    })
                    .populate('user', 'nom prenom')
                    .populate('projet', 'projet entreprise')
                    .sort({ createdAt: -1 });

                    // Statistiques de la période
                    const stats = calculerStatistiques(timesheets);

                    // Grouper par jour
                    const groupedByDay = {};
                    timesheets.forEach(ts => {
                        const day = ts.createdAt.toISOString().split('T')[0];
                        if (!groupedByDay[day]) {
                            groupedByDay[day] = {
                                date: day,
                                count: 0,
                                timesheets: [],
                                heures: 0,
                                minutes: 0
                            };
                        }
                        groupedByDay[day].count++;
                        groupedByDay[day].timesheets.push(ts);
                        if (ts.heure) groupedByDay[day].heures += ts.heure;
                        if (ts.minute) groupedByDay[day].minutes += ts.minute;
                    });

                    return res.status(200).json({
                        success: true,
                        message: `Timesheets du ${startDate} au ${endDate} récupérés`,
                        data: {
                            periode: {
                                type: 'periode',
                                debut: startDate,
                                fin: endDate
                            },
                            total: timesheets.length,
                            statistiques: stats,
                            parJour: groupedByDay,
                            timesheets: timesheets
                        }
                    });

                } catch (error) {
                    console.error('Erreur:', error);
                    return res.status(500).json({
                        success: false,
                        message: error.message
                    });
                }
            });
        },

        // 4. Filtrer par semaine (numéro de semaine)
        getTimesheetsByWeek(req, res) {
            acl.isAllowed(req.decoded.id, 'agenda', 'retreive', async function(err, aclres) {
                if (err) {
                    return res.status(500).json({ 
                        success: false, 
                        message: 'ACL error', 
                        error: err.message 
                    });
                }
                
                if (!aclres) {
                    return res.status(401).json({
                        success: false,
                        message: "401"
                    });
                }

                try {
                    const { year, week } = req.params; // Format: /2024/8 pour semaine 8 de 2024
                    
                    if (!year || !week) {
                        return res.status(400).json({
                            success: false,
                            message: "L'année et le numéro de semaine sont requis"
                        });
                    }

                    // Calculer le début et fin de semaine
                    const firstDayOfYear = new Date(year, 0, 1);
                    const daysOffset = (week - 1) * 7;
                    const startOfWeek = new Date(firstDayOfYear);
                    startOfWeek.setDate(firstDayOfYear.getDate() + daysOffset);
                    
                    // Ajuster pour commencer le lundi
                    const dayOfWeek = startOfWeek.getDay(); // 0 = dimanche
                    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
                    startOfWeek.setDate(startOfWeek.getDate() - diff);
                    startOfWeek.setHours(0, 0, 0, 0);
                    
                    const endOfWeek = new Date(startOfWeek);
                    endOfWeek.setDate(endOfWeek.getDate() + 7);
                    endOfWeek.setHours(0, 0, 0, 0);

                    const timesheets = await TimeSheet.find({
                        createdAt: {
                            $gte: startOfWeek,
                            $lt: endOfWeek
                        }
                    })
                    .populate('user', 'nom prenom')
                    .populate('projet', 'projet')
                    .sort({ createdAt: -1 });

                    return res.status(200).json({
                        success: true,
                        message: `Timesheets de la semaine ${week}/${year}`,
                        data: {
                            periode: {
                                type: 'semaine',
                                annee: year,
                                semaine: week,
                                debut: startOfWeek,
                                fin: endOfWeek
                            },
                            count: timesheets.length,
                            timesheets: timesheets
                        }
                    });

                } catch (error) {
                    console.error('Erreur:', error);
                    return res.status(500).json({
                        success: false,
                        message: error.message
                    });
                }
            });
        },

        // 5. Filtrer avec options avancées (filtres multiples)
        getTimesheetsAdvanced(req, res) {
            acl.isAllowed(req.decoded.id, 'agenda', 'retreive', async function(err, aclres) {
                if (err) {
                    return res.status(500).json({ 
                        success: false, 
                        message: 'ACL error', 
                        error: err.message 
                    });
                }
                
                if (!aclres) {
                    return res.status(401).json({
                        success: false,
                        message: "401"
                    });
                }

                try {
                    const { 
                        startDate, endDate, 
                        userId, projetId, 
                        status, 
                        presence,
                        page = 1, 
                        limit = 20 
                    } = req.query;

                    // Construire la requête dynamique
                    let query = {};

                    // Filtre par période
                    if (startDate || endDate) {
                        query.createdAt = {};
                        if (startDate) {
                            const start = new Date(startDate);
                            start.setHours(0, 0, 0, 0);
                            query.createdAt.$gte = start;
                        }
                        if (endDate) {
                            const end = new Date(endDate);
                            end.setDate(end.getDate() + 1);
                            end.setHours(0, 0, 0, 0);
                            query.createdAt.$lt = end;
                        }
                    }

                    // Filtre par utilisateur
                    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
                        query.user = userId;
                    }

                    // Filtre par projet
                    if (projetId && mongoose.Types.ObjectId.isValid(projetId)) {
                        query.projet = projetId;
                    }

                    // Filtre par statut
                    if (status) {
                        query.status = status;
                    }

                    // Filtre par présence
                    if (presence) {
                        query.presence = presence;
                    }

                    // Pagination
                    const skip = (parseInt(page) - 1) * parseInt(limit);
                    
                    // Exécuter la requête
                    const timesheets = await TimeSheet.find(query)
                        .populate('user', 'nom prenom email')
                        .populate('projet', 'projet entreprise')
                        .populate('responsable', 'nom prenom')
                        .sort({ createdAt: -1 })
                        .skip(skip)
                        .limit(parseInt(limit));

                    // Compter le total pour la pagination
                    const total = await TimeSheet.countDocuments(query);

                    return res.status(200).json({
                        success: true,
                        message: "Filtrage avancé réussi",
                        data: {
                            pagination: {
                                page: parseInt(page),
                                limit: parseInt(limit),
                                total: total,
                                pages: Math.ceil(total / limit)
                            },
                            filters: req.query,
                            timesheets: timesheets
                        }
                    });

                } catch (error) {
                    console.error('Erreur:', error);
                    return res.status(500).json({
                        success: false,
                        message: error.message
                    });
                }
            });
        }

       
    }
   }
})();