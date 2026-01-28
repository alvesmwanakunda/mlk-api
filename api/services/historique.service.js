var Historique = require('../models/historiqueTache.model').HistoriqueTacheModel;
var Tache = require('../models/taches.model').TacheModel;
var User = require("../models/users.model").UserModel;



module.exports={

     create:(idTask,idUser)=>{

         return new Promise (async(resolve, reject)=>{

            let tache = await Tache.findOne({_id:idTask});
            let user = await User.findOne({_id:idUser});
            let historique = new Historique();
            let statut='';

            if(tache?.statut=="En Cours"){
                statut = "en cours"
            }if(tache?.statut=="A Faire"){
                statut = "à faire"
            }if(tache?.statut=="Clôturer"){
                statut = "en clôture"
            }
            
            historique.tache= idTask;
            historique.user = idUser;
            historique.description= ''+user.nom+ ' '+user.prenom+ ' a changé le statut de la tâche '+statut+'.';

            historique.save().then((result)=>{
               resolve({
                    success:true,
                    message:result,
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