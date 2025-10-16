var ProjetModules = require("../models/projetModule.model").ProjetModulesModel;
var Dossier = require('../models/dossiersModule.model').DossierModuleModel;
var Projet = require('../models/projets.model').ProjetModel;


module.exports={
    /*addModuleProjet:(mod,projet)=>{
        return new Promise (async(resolve, reject)=>{

            let module = new ProjetModules();
            let dossier = new Dossier();

            module.dateLastUpdate=new Date();
            module.module=mod;
            module.projet=projet;

            module.save().then(async (data)=>{

                let proj = await Projet.findOne({_id:projet});
                console.log("Projet", proj)
                dossier.date=new Date();
                dossier.dateLastUpdate=new Date();
                dossier.creator=req.decoded.id;
                dossier.profondeur=0;
                dossier.module=mod;
                dossier.nom = proj.projet;
                dossier.project = projet;
                dossier.projetmodule = data._id
                await dossier.save();

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
    }*/
   addModuleProjet: (mod, projet, userId) => {
    return new Promise(async (resolve, reject) => {
        try {
            // Vérifier que le module n'est pas déjà associé à ce projet
            const existingModule = await ProjetModules.findOne({
                module: mod,
                projet: projet
            });

            if (existingModule) {
                reject({
                    status: 'error',
                    body: "Ce module est déjà associé à ce projet"
                });
                return;
            }

            // Créer le ProjetModules
            const projetModule = new ProjetModules({
                dateLastUpdate: new Date(),
                module: mod,
                projet: projet
            });

            const savedProjetModule = await projetModule.save();
            //console.log("ProjetModules créé:", savedProjetModule);

            // Récupérer les infos du projet
            const project = await Projet.findById(projet);
            if (!project) {
                // Si le projet n'existe pas, supprimer le ProjetModules créé
                await ProjetModules.findByIdAndDelete(savedProjetModule._id);
                reject({
                    status: 'error',
                    body: "Projet non trouvé"
                });
                return;
            }

            // Créer le dossier
            const newDossier = new Dossier({
                date: new Date(),
                dateLastUpdate: new Date(),
                creator: userId,
                profondeur: 0,
                module: mod,
                nom: project.projet,
                project: projet,
                projetmodule: savedProjetModule._id
            });

            const savedDossier = await newDossier.save();
            //console.log("Dossier créé:", savedDossier);

            resolve({
                status: 'success',
                body: {
                    projetModule: savedProjetModule,
                    dossier: savedDossier
                }
            });

        } catch (error) {
            console.error("Erreur détaillée:", error);
            reject({
                status: 'error',
                body: `Erreur lors de l'ajout: ${error.message}`
            });
        }
    });
}
}