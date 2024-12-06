var ProjetModules = require("../models/projetModule.model").ProjetModulesModel;

module.exports={
    addModuleProjet:(mod,projet)=>{
        return new Promise (async(resolve, reject)=>{

            let module = new ProjetModules();
            module.dateLastUpdate=new Date();
            module.module=mod;
            module.projet=projet;

            module.save().then((data)=>{
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