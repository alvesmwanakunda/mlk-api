var Agenda = require('../models/agenda.model').AgendaModel;
var Tache = require('../models/taches.model').TacheModel;

module.exports={

    addAgenda:(conge)=>{
        return new Promise(async(resolve,reject)=>{

              //console.log("Conge", conge);

                // Fonction helper pour formater l'heure
                const formatTime = (date) => {
                    const hours = date.getHours().toString().padStart(2, '0');
                    const minutes = date.getMinutes().toString().padStart(2, '0');
                    return `${hours}:${minutes}`;
                };

                const now = new Date();
                const heureStart = formatTime(now);
                const heureEnd = formatTime(new Date(now.getTime() + 20 * 60 * 1000));

              var agenda = new Agenda();

              agenda.end=conge.fin;
              agenda.user = conge.user;
              agenda.isDay = true;
              agenda.title = "Vacance";
              agenda.color = "#7f0638ff";
              agenda.heure_end=heureEnd;
              agenda.heure_start=heureStart;
              agenda.start = conge.debut;
              agenda.assigne = conge.user

              agenda.save().then((agenda)=>{
                                          
                resolve({
                    success:true,
                    message:agenda,
                });

                }).catch((error)=>{
                    reject({
                        status:'error',
                        body:error.message
                    })
                })
            })
    },

    addTask:(tache)=>{
        return new Promise(async(resolve,reject)=>{

              var task = new Tache(tache);

              /*agenda.end=conge.fin;
              agenda.user = conge.user;
              agenda.isDay = true;
              agenda.title = "Vacance";
              agenda.color = "#7f0638ff";
              agenda.heure_end=heureEnd;
              agenda.heure_start=heureStart;
              agenda.start = conge.debut;
              agenda.assigne = conge.user*/

              task.save().then((tache)=>{
                                          
                resolve({
                    success:true,
                    message:tache,
                });

                }).catch((error)=>{
                    reject({
                        status:'error',
                        body:error.message
                    })
                })
            })
    },
     updateTask:(idtache,tache)=>{
        return new Promise(async(resolve,reject)=>{

              //var task = await Tache.findOne({_id:idtache});

              /*agenda.end=conge.fin;
              agenda.user = conge.user;
              agenda.isDay = true;
              agenda.title = "Vacance";
              agenda.color = "#7f0638ff";
              agenda.heure_end=heureEnd;
              agenda.heure_start=heureStart;
              agenda.start = conge.debut;
              agenda.assigne = conge.user*/

              Tache.findOneAndUpdate({_id:idtache},tache,{new:true}).then((tache)=>{
                                          
                resolve({
                    success:true,
                    message:tache,
                });

                }).catch((error)=>{
                    reject({
                        status:'error',
                        body:error.message
                    })
                })
            })
    }
}