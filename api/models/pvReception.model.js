(function(){
    "use strict";
    var mongoose = require("mongoose");
    var Schema = mongoose.Schema;
    var PV_DECLARATION  = require("../services/pv.constants");
    var uploadService = require('../services/upload.service');


    const SignatureSchema = new mongoose.Schema({
        signerName: { type: String },
        signerEmail: {type: String, required: false},
        signerRole: { type: String }, // ex: "Entreprise", "Maître d'ouvrage"
        signedAt: { type: Date },
        signatureUrl: { type: String }, 
    }, { _id: false });

   
    const PersonnePresentSchema = new mongoose.Schema({
       nom:{type:String},
       prenom:{type:String},
       email: {type: String, required: false},
       telephone: {type: String, required: false},
       profession: {type: String, required: false}
    },{_id:false});

    const ReserveItemSchema = new mongoose.Schema({
        index: { type: Number }, // #
        nature: { type: String, required: true },           // "Nature des réserves"
        travauxAExecuter: { type: String, required: false }, // "Travaux à exécuter"
        photoUrl: { type: String },                         // "Photo"
        etat: { type: String, enum: ['A Faire', 'Fait','Observation'], default: 'A Faire' }, // "Etat réserve"
        leveeDate: { type: Date },
        photoLevee: { type: String }, 
    }, { _id: true, timestamps: true });


    var pvReceptionSchema = new Schema({
        titre: {type: String, required: false}, //! Le titre du pv 
        entrepriseCode: { 
            type: String, 
            enum: ['MLKA', 'INNOV'], 
            default: 'MLKA' 
        },
        entreprise:{
            nom : {type: String, required: true},
            adresse: {type: String, required: false },
            representant: {type: PersonnePresentSchema, default: {}}
        },
        societeCliente:{
            nom : {type: String, required: true},
            adresse: {type: String, required: false },
            maitreOuvrage: {type: PersonnePresentSchema, default: {}}
        },
        chantier:{
            adresse: {type: String, required: true},
            longitude: {type: Number, required: false},
            latitude: {type: Number, required: false}
        },
        travaux: {
            dateExecution: { type: Date },
            projet: {type: String, required: false },
            objet: {type: String},
            planUrl: { type: String },
        },
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
        //observation: { type: String },

        // Cas WITH_RESERVES
        nextReceptionDate: { type: Date },             // "Date prochaine réception"
        reserves: { type: [ReserveItemSchema], default: [] }, // Tableau état des réserves
        personnesPresent:{type:[PersonnePresentSchema], default:[]},
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
            enum: ['DRAFT', 'SUBMITTED', 'SIGNED','ARCHIVED'], 
            default: 'DRAFT' 
        },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
        isLeve: { type: Boolean },
        parentPvId: { type: mongoose.Schema.Types.ObjectId, ref: 'PvReception', default: null },
        version: { type: Number, default: 1 },
        
        // Code de validation de la signature
        signatureCode: { type: String, required: false },
        signatureCodeExpireAt: { type: Date, required: false },
        commentaire: { type: String, required: false },
    },{ timestamps: true });
    
    pvReceptionSchema.index({ projet: 1, createdAt: -1 });
    pvReceptionSchema.index({ parentPvId: 1, version: 1 });
    // Validation conditionnelle (serveur)
   
    pvReceptionSchema.pre('validate', function(next) {
        const pv = this;

        if (pv.declaration === 'WITH_RESERVES') {
            console.log("WITH_RESERVES détecté");
            const allFait =
            Array.isArray(pv.reserves) &&
            pv.reserves.length > 0 &&
            pv.reserves.every(r => r.etat === 'Fait');

            console.log("Toutes réserves faites?", allFait);
            pv.isLeve = allFait; // true ou false
        } else {
            // Champ absent si pas WITH_RESERVES
            console.log("Pas WITH_RESERVES - isLeve = undefined");
            pv.isLeve = undefined;
        }

        const hasCompanySig = !!pv.signatures?.companyRep?.signatureUrl;
        const hasClientSig = !!pv.signatures?.client?.signatureUrl;

        // Commun
        if (!pv.effectiveDate) return next(new Error("effectiveDate est obligatoire"));
        if (!pv.place) return next(new Error("place (Fait à) est obligatoire"));
        if (!hasCompanySig) {
            return next(new Error("La signature du représentant de l'entreprise est obligatoire"));
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
    async function hydrateSignedUrls(doc) {
        if (!doc) return;

        if (doc.travaux && doc.travaux.planUrl) {
            doc.travaux.planUrl = await uploadService.getSignedUrl(doc.travaux.planUrl);
        }

        if (Array.isArray(doc.reserves)) {
            for (const reserve of doc.reserves) {
                if (reserve && reserve.photoUrl) {
                    reserve.photoUrl = await uploadService.getSignedUrl(reserve.photoUrl);
                }
                if (reserve && reserve.photoLevee) {
                    reserve.photoLevee = await uploadService.getSignedUrl(reserve.photoLevee);
                }
            }
        }
    }

    pvReceptionSchema.post('find', async function (docs, next) { 
        try {
            // Recuperer l'utl signée du plan travaux et des photos de réserves
            for (const doc of docs) {
                await hydrateSignedUrls(doc);
            }
            next();
        } catch (error) {
            console.error('❌ Erreur dans post-find hook:', error);
            next(error);
        }
    }); 

    // Middleware pour modifier le champ "photo" après avoir récupéré un document par son ID
    pvReceptionSchema.post('findById', async function (doc, next) {
        try {
            await hydrateSignedUrls(doc);
            next();
        } catch (error) {
            next(error);
        }
    });

    pvReceptionSchema.post('findOne', async function (doc, next) {
        try {
            await hydrateSignedUrls(doc);
            next();
        } catch (error) {
            next(error);
        }
    });
module.exports = {
    pvReceptionSchema: pvReceptionSchema,
    PVReceptionModel: mongoose.model('PvReception',pvReceptionSchema)
}
})();
