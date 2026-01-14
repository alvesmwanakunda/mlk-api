(function(){
    "use strict";
    var mongoose = require("mongoose");
    var Schema = mongoose.Schema;
    var PV_DECLARATION  = require("../services/pv.constants");
    var uploadService = require('../services/upload.service');


    const SignatureSchema = new mongoose.Schema({
        signerName: { type: String },
        signerRole: { type: String }, // ex: "Entreprise", "Maître d'ouvrage"
        signedAt: { type: Date },
        signatureUrl: { type: String }, 
    }, { _id: false });

    const ReserveItemSchema = new mongoose.Schema({
        index: { type: Number }, // #
        nature: { type: String, required: true },           // "Nature des réserves"
        travauxAExecuter: { type: String, required: true }, // "Travaux à exécuter"
        photoUrl: { type: String },                         // "Photo"
        etat: { type: String, enum: ['Non levée', 'Levée','Observation'], default: 'Non levée' } // "Etat réserve"
    }, { _id: true, timestamps: true });

    var pvReceptionSchema = new Schema({

        projet: { type: mongoose.Schema.Types.ObjectId, ref: 'Projets', required: false },
        number: { type: String, unique: true, index: true },
        declaration: { 
            type: String, 
            enum: Object.values(PV_DECLARATION), 
            required: true 
        },
        // Champs communs visibles dans toutes les captures
        effectiveDate: { type: Date, required: true }, // "Avec effet à la date du"
        place: { type: String, required: true },       // "Fait à"

        // Cas REFUSED
        refusalReason: { type: String },               // "Précisez les motifs du refus..."

        // Cas WITHOUT_RESERVE_WITH_OBSERVATION
        observation: { type: String },

        // Cas WITH_RESERVES
        nextReceptionDate: { type: Date },             // "Date prochaine réception"
        reserves: { type: [ReserveItemSchema], default: [] }, // Tableau état des réserves
        reservesExecutionDelayDays: { type: Number },  // "Dans un délai de (en jours)"
        reservesFromDate: { type: Date },              // "À compter du"
        allReservesLifted: { type: Boolean, default: false }, // "Les réserves ... ont toutes été levées"

        // Signatures (obligatoires dans vos captures)
        signatures: {
            companyRep: { type: SignatureSchema, default: {} },
            client: { type: SignatureSchema, default: {} },
        },

        status: { 
            type: String, 
            enum: ['DRAFT', 'SUBMITTED', 'SIGNED'], 
            default: 'DRAFT' 
        },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
    },{ timestamps: true });
    // Validation conditionnelle (serveur)
    pvReceptionSchema.pre('validate', function(next) {
        const pv = this;
        const hasCompanySig = !!pv.signatures?.companyRep?.signatureUrl;
        const hasClientSig = !!pv.signatures?.client?.signatureUrl;

 

        // Commun
        if (!pv.effectiveDate) return next(new Error("effectiveDate est obligatoire"));
        if (!pv.place) return next(new Error("place (Fait à) est obligatoire"));
        if (!hasCompanySig || !hasClientSig) {
        return next(new Error("Les deux signatures sont obligatoires"));
        };
                
        // Par type
        if (pv.declaration === PV_DECLARATION.REFUSED) {
            if (!pv.refusalReason) return next(new Error("refusalReason est obligatoire (réception refusée)"));
        }

        if (pv.declaration === PV_DECLARATION.WITHOUT_RESERVE_WITH_OBSERVATION) {
            if (!pv.observation) return next(new Error("observation est obligatoire (sans réserve avec observation)"));
            //if (!pv.reserves || pv.reserves.length === 0) return next(new Error("reserves est obligatoire (au moins une réserve)"));

        }

        if (pv.declaration === PV_DECLARATION.WITH_RESERVES) {
            // Dans vos captures: prochaine réception + état des réserves + délai + à compter du
            if (!pv.nextReceptionDate) return next(new Error("nextReceptionDate est obligatoire (avec réserves)"));
            if (!pv.reserves || pv.reserves.length === 0) return next(new Error("reserves est obligatoire (au moins une réserve)"));
            if (pv.reservesExecutionDelayDays == null) return next(new Error("reservesExecutionDelayDays est obligatoire"));
            if (!pv.reservesFromDate) return next(new Error("reservesFromDate est obligatoire"));
        }

        next();
    });
    pvReceptionSchema.post('find', async function (docs, next) { 
        try {
            for (const doc of docs) {
                for(const reserve of doc.reserves){
                  if (reserve && reserve.photoUrl) {
                    reserve.photoUrl = await uploadService.getSignedUrl(reserve.photoUrl);
                  }
                } 
            }
            next();
        } catch (error) {
            console.error('❌ Erreur dans post-find hook:', error);
            next(error);
        }
    }); 
    // Middleware pour modifier le champ "photo" après avoir récupéré un document par son ID
    pvReceptionSchema.post('findById', async function (doc, next) {
        for(const reserve of doc.reserves){
            if (reserve && reserve.photoUrl) {
                reserve.photoUrl = await uploadService.getSignedUrl(reserve.photoUrl);
            }
        } 
        next();
    });
    pvReceptionSchema.post('findOne', async function (doc, next) {
        for(const reserve of doc.reserves){
            if (reserve && reserve.photoUrl) {
                reserve.photoUrl = await uploadService.getSignedUrl(reserve.photoUrl);
            }
        } 
        next();
    });
module.exports = {
    pvReceptionSchema: pvReceptionSchema,
    PVReceptionModel: mongoose.model('PvReception',pvReceptionSchema)
}
})();