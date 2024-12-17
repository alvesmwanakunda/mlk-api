(function(){

    "use strict";

    var mongoose = require('mongoose');
    var Schema = mongoose.Schema;

    var ficheTechniqueSchema = new Schema({

        module:{
            type:Schema.ObjectId,
            ref:"Modules",
            required:false
         },
        createdAt:{
            type: Date,
            required: false
        },
        isolation: {
            toiture: {
                typeToiture: { type: String, enum: ['','Bac acier', 'Membrane EPDM', 'Tôle soudée'],default: '' },
                epaisseurIsolation: { type: Number },
                typeIsolation: { type: String, enum: ['','Laine de verre', 'Laine de roche', 'Panneau PU'] ,default: ''}
            },
            sol: {
                epaisseurPlancher: { type: Number },
                typePlancher: { type: String, enum: ['','Contreplaque', 'Contre plaquée marine', 'Aggloméré', 'Bois ciment'],default: '' },
                epaisseurIsolation: { type: Number },
                typeIsolation: { type: String, enum: ['','Laine de verre', 'Laine de roche', 'Panneau PU', 'Polystyrène'],default: '' },
                surface: { type: Number }
            },
            panneaux: {
                epaisseurIsolation: { type: Number },
                typeIsolation: { type: String, enum: ['','PUR', 'PIR', 'Polystyrène', 'Laine de roche'],default: '' },
                couleur:{
                    faceInterieure: { type: String },
                    faceExterieure: { type: String },
                },
                revetementPanneau: {
                    interieur: { type: String, enum: ['','Lisse', 'Gaufrée', 'Rainurée'] ,default: ''},
                    exterieur: { type: String, enum: ['','Lisse', 'Gaufrée', 'Rainurée'] ,default: ''},
                    dimension:{
                        longueur: { type: Number },
                        largeur: { type: Number },
                    },
                    quantite: { type: Number }
                },
            }
        },
        menuiserieExterieur: {
            fenetre: {
                longueur: { type: Number },
                largeur: { type: Number },
                epaisseur: { type: Number },
                type: { type: String },
                matiere: { type: String, enum: ['','PVC', 'Alu'],default: ''},
                couleur: { type: String },
                typeVitrage: { type: String },
                quantite: { type: Number }
               
            },
            porte: {
                largeur: { type: Number },
                hauteur:{ type: Number },
                epaisseur:{ type: Number },
                ouvrant: { type: String },
                matiere: { type: String, enum: ['','Bois', 'Alu', 'PVC', 'Métal'] ,default: ''},
                couleur: { type: String },
                isVitree: { type: Boolean },
                vitree:{
                    couleur: { type: String },
                    touteVitree: { type: String },
                    semiVitree:{
                        typeVitrage:{type: String, enum: ['','Simple vitrage', 'Double vitrage', 'Autre'],default: ''},
                        longueur:{ type: Number },
                        largeur:{ type: Number },
                        epaisseur: { type: Number },
                    },
                    ocutus:{
                        typeVitrage:{type: String, enum: ['','Simple vitrage', 'Double vitrage', 'Autre'],rdefault: ''},
                        longueur:{ type: Number },
                        largeur:{ type: Number },
                        epaisseur: { type: Number },
                    }  
                },
                quantite: { type: Number }
            }
        },
        menuiserieInterieur:{
            revetementSol: {
                typeSol: { type: String },
            },
            plafond: {
                typePlafond: { type: String, enum: ['','Métallique', 'Faux plafond en Dalle 600x600','BA13','Bois ciment','Contreplaque'],default: '' },
            },
            couleur: { type: String },
            surface: { type: Number }
        },
        electricite: {
            quantitePC: { type: Number },
            quantiteSortieCable: { type: Number },
            quantitePriseRJ45: { type: Number },
            quantiteInterrupteur: { type: Number },
            quantiteDetecteurMouvement: { type: Number },
            typeEclairage: { type: String },
            quantiteEclairage: { type: Number },
            quantiteBAES: { type: Number },
            convecteur: {
                typeMarque: { type: String },
                puissance: { type: Number },
                quantite: { type: Number }
            },
            climatisation: {
                referenceType: { type: String },
                quantite: { type: Number }
            }
        },
        plomberie: {
            toilette: { type: String },
            toilettePMR: { type: String },
            wcTurc: { type: String },
            lavabo: { type: String },
            lavaboPMR: { type: String },
            laveMain: { type: String },
            auge: { type: String },
            urinoir:{ type: String },
            douche: { type: String },
            ballonEauChaude:{
                referenceType: { type: String },
                quantite: { type: Number }
            },
            extracteur:{
                referenceType: { type: String },
                quantite: { type: Number }
            }
        }
    });
    module.exports = {
        FicheTechniqueSchema: ficheTechniqueSchema,
        FicheTechniqueModel: mongoose.model("FicheTechniques",ficheTechniqueSchema)
      }

})();