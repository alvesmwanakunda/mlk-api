
var Entreprise = require("../models/entreprises.model").EntrepriseModel;

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
    } 
}