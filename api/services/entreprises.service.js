
var Entreprise = require("../models/entreprises.model").EntrepriseModel;
var Dossiers = require("../models/dossiers.model").DossierModel;

module.exports={
  
    addNombreProjet:(projet)=>{
       return new Promise (async(resolve, reject)=>{

         let entreprise = await Entreprise.findOne({_id:projet.entreprise});
         if(entreprise){
            entreprise.nbr_projet = parseInt(entreprise.nbr_projet) + 1;

            Entreprise.findByIdAndUpdate({_id:entreprise._id},entreprise,{new:true}).then((res)=>{
                resolve({
                    status:'success',
                    body:res
                });
            }).catch((error)=>{
                 reject({
                    status:'error',
                    body:error.message
                 })
            })
         } 
       })
    }, 

    addDossierProjet:(user,projet)=>{
        return new Promise (async(resolve, reject)=>{

            let dossier = new Dossiers();
            dossier.date=new Date();
            dossier.dateLastUpdate=new Date();
            dossier.creator=user;
            dossier.project=projet._id;
            dossier.profondeur=0;
            dossier.nom = "PV de réception";

            let dossierEtat = new Dossiers();
            dossierEtat.date=new Date();
            dossierEtat.dateLastUpdate=new Date();
            dossierEtat.creator=user;
            dossierEtat.project=projet._id;
            dossierEtat.profondeur=0;
            dossierEtat.nom = "Etat de lieu";

            dossier.save();
            dossierEtat.save().then((data)=>{
                resolve({
                    status:'success',
                    body:data
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