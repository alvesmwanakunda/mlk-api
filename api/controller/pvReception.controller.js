(function(){
    "use strict";
    var pvReception = require("../models/pvReception.model").PVReceptionModel;
    var uploadService = require('../services/upload.service');
    var PV_DECLARATION = require("../services/pv.constants");
    function generatePvNumber(){
        const y = new Date().getFullYear();
        return `PV-${y}-${Math.random().toString(16).slice(2, 8).toUpperCase()}`;
    };
    function extractFilePath(fullUrl) {
        if (!fullUrl) return null;

        // Vérifier si c'est une URL Firebase Storage
        if (fullUrl.includes('pvreception/')) {
            // Trouver le début de "pvreception/"
            const startIndex = fullUrl.indexOf('pvreception/');

            // Trouver la fin (soit '?', soit fin de string)
            const endIndex = fullUrl.indexOf('?', startIndex);

            if (startIndex !== -1) {
            if (endIndex !== -1) {
                // Extraire de "pvreception/" jusqu'à "?"
                return fullUrl.substring(startIndex, endIndex);
            } else {
                // Pas de paramètres, prendre jusqu'à la fin
                return fullUrl.substring(startIndex);
            }
            }
        }

        // Si ce n'est pas une URL Firebase, retourner telle quelle
        // (pour les data URLs ou autres formats)
        return fullUrl;
    };
    function extractFileName(fullUrl) {
        if (!fullUrl) return null;

        // Vérifier si c'est une URL Firebase Storage
        if (fullUrl.includes('pvreception/')) {
            // Trouver le début de "pvreception/"
            const startIndex = fullUrl.indexOf('pvreception/');
            
            // Trouver la fin (soit '?', soit fin de string)
            const endIndex = fullUrl.indexOf('?', startIndex);
            
            if (startIndex !== -1) {
            let path = '';
            
            if (endIndex !== -1) {
                // Extraire de "pvreception/" jusqu'à "?"
                path = fullUrl.substring(startIndex, endIndex);
            } else {
                // Pas de paramètres, prendre jusqu'à la fin
                path = fullUrl.substring(startIndex);
            }
            
            // Maintenant extraire seulement le nom du fichier
            // "pvreception/calendar-dashboard-app-design.png" → "calendar-dashboard-app-design.png"
            const parts = path.split('/');
            if (parts.length > 1) {
                return parts[parts.length - 1]; // Dernière partie = nom du fichier
            }
            return path;
            }
        }

        // Si ce n'est pas une URL Firebase, retourner l'URL complète
        return fullUrl;
    };
    

    module.exports = function(acl){
        return{

           
            createPV(req,res){
                acl.isAllowed(req.decoded.id,'projets', 'create', async function(err,aclres){
                    if(aclres){
                        const payload = req.body;
                        if (payload.reserves && typeof payload.reserves === 'string') {
                            try {
                            payload.reserves = JSON.parse(payload.reserves);
                            } catch (e) {
                            return res.status(400).json({
                                success: false,
                                message: "reserves doit être un JSON valide (tableau)."
                            });
                            }
                        }
                        if (!Array.isArray(payload.reserves)) payload.reserves = [];
                        const reserveFiles = req.files?.reservePhotos || []; // ex: [{filename...}, ...]
                        if (reserveFiles.length > 0) {
                            // On upload chaque photo, puis on affecte par index
                            for (let i = 0; i < reserveFiles.length; i++) {
                            // Si la réserve n'existe pas à cet index, on ignore
                            if (!payload.reserves[i]) continue;

                            const f = reserveFiles[i];
                            try {
                                const url = await uploadService.uploadPVToFirebaseStorage(f.filename);
                                payload.reserves[i].photoUrl = url;
                            } catch (e) {
                                console.error('Erreur upload reserve photo:', e);
                                return res.status(500).json({
                                success: false,
                                message: "Erreur lors de l’upload d’une photo de réserve",
                                });
                            }
                            }
                        }
                        // signatures (OBLIGATOIRE)
                        if (payload.signatures && typeof payload.signatures === 'string') {
                        payload.signatures = JSON.parse(payload.signatures);
                        }

                        // convertir signedAt si besoin (ISO string -> Date)
                        if (payload.signatures?.companyRep?.signedAt) {
                        payload.signatures.companyRep.signedAt = new Date(payload.signatures.companyRep.signedAt);
                        }
                        if (payload.signatures?.client?.signedAt) {
                        payload.signatures.client.signedAt = new Date(payload.signatures.client.signedAt);
                        }

                        //console.log('SIGNATURES (raw):', req.body.signatures);
                        //console.log('SIGNATURES (parsed):', payload.signatures);

                        

                        await pvReception.create({
                            ...payload,
                            projet:req.params.id,
                            number: generatePvNumber(),
                            status: 'DRAFT',
                            createdBy: req.decoded?.id
                        }).then(async (pv)=>{
                            res.json({
                                success:true,
                                message:pv
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
            getAllPVProjet(req,res){
                acl.isAllowed(req.decoded.id,'agenda', 'retreive', async function(err,aclres){

                    if(aclres){
                        pvReception.find({projet:req.params.id}).then((pv)=>{
                            res.json({
                                success: true,
                                message:pv
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
            getPV(req,res){
                acl.isAllowed(req.decoded.id,'agenda', 'retreive', async function(err,aclres){

                    if(aclres){
                        pvReception.findOne({_id:req.params.id}).populate('projet').then((pv)=>{
                            res.json({
                                success: true,
                                message:pv
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

            updatePV(req, res) {
                acl.isAllowed(req.decoded.id, 'agenda', 'create', async function(err, aclres) {
                    if (aclres) {
                    try {
                        const payload = { ...req.body };
                        //console.log("Payload Start", payload);

                        // 1. Parser les réserves
                        if (payload.reserves && typeof payload.reserves === 'string') {
                        try {
                            payload.reserves = JSON.parse(payload.reserves);
                        } catch (e) {
                            return res.status(400).json({
                            success: false,
                            message: "reserves doit être un JSON valide (tableau)."
                            });
                        }
                        }

                        if (!Array.isArray(payload.reserves)) payload.reserves = [];

                        // 2. Récupérer le document existant
                        const existingDoc = await pvReception.findById(req.params.id);
                        if (!existingDoc) {
                        return res.status(404).json({
                            success: false,
                            message: "Document non trouvé"
                        });
                        }

                        // 3. Parser les index des réserves à modifier
                        let reserveIndexes = [];
                        if (payload.reserveIndexes && typeof payload.reserveIndexes === 'string') {
                        try {
                            reserveIndexes = JSON.parse(payload.reserveIndexes);
                        } catch (e) {
                            console.log('Erreur parsing reserveIndexes:', e);
                        }
                        }

                        //console.log("Reserves", payload.reserves);
                        //console.log("index payload", payload.reserveIndexes)

                        // 4. Gérer les fichiers uploadés
                        const reserveFiles = req.files?.reservePhotos || [];
                        //console.log("Reserve Files",reserveFiles);
                        
                        if (reserveFiles.length > 0) {
                            for (let i = 0; i < reserveFiles.length; i++) {
                                const f = reserveFiles[i];
                                
                                // Déterminer quel index de réserve ce fichier modifie
                                let targetReserveIndex = i; // Par défaut
                                //console.log("Index", i);
                                
                                // Si on a une liste d'index, l'utiliser
                                if (reserveIndexes[i] !== undefined) {
                                targetReserveIndex = reserveIndexes[i];
                                } else {
                                // Sinon, chercher dans les réserves celle qui a _index
                                // ou utiliser l'ordre d'arrivée des fichiers
                                }
                                
                                // Vérifier que la réserve existe à cet index
                                if (payload.reserves[targetReserveIndex]) {
                                try {
                                    const url = await uploadService.uploadPVToFirebaseStorage(f.filename);
                                    payload.reserves[targetReserveIndex].photoUrl = url;
                                    console.log(`Photo uploadée pour réserve index ${targetReserveIndex}`);
                                } catch (e) {
                                    console.error('Erreur upload reserve photo:', e);
                                }
                                }
                            }
                        }

                        // 5. Pour les réserves SANS nouvelle photo, garder l'ancienne
                        payload.reserves.forEach((reserve, index) => {
                        // Chercher l'index réel de la réserve (si _index existe)
                        const reserveRealIndex = reserve._index !== undefined ? reserve._index : index;
                        
                        // Si pas de nouvelle photo mais ancienne photo existante
                        if (!reserve.photoUrl && 
                            existingDoc.reserves[reserveRealIndex] && 
                            existingDoc.reserves[reserveRealIndex].photoUrl) {
                            payload.reserves[index].photoUrl = extractFilePath(existingDoc.reserves[reserveRealIndex].photoUrl);
                        }
                        
                        // Nettoyer le champ _index
                        delete payload.reserves[index]._index;
                        });

                         // signatures (OBLIGATOIRE)
                        if (payload.signatures && typeof payload.signatures === 'string') {
                          payload.signatures = JSON.parse(payload.signatures);
                        }
                        // convertir signedAt si besoin (ISO string -> Date)
                        if (payload.signatures?.companyRep?.signedAt) {
                        payload.signatures.companyRep.signedAt = new Date(payload.signatures.companyRep.signedAt);
                        }
                        if (payload.signatures?.client?.signedAt) {
                        payload.signatures.client.signedAt = new Date(payload.signatures.client.signedAt);
                        }


                        pvReception.findOneAndUpdate(
                        { _id: req.params.id },
                        payload,
                        { new: true }
                        ).then(async (pv) => {
                        res.json({
                            success: true,
                            message: pv
                        });
                        }).catch((error) => {
                        return res.status(500).json({
                            success: false,
                            message: error.message
                        });
                        });

                    } catch (error) {
                        console.error('Erreur générale:', error);
                        return res.status(500).json({
                        success: false,
                        message: error.message
                        });
                    }
                    } else {
                    return res.status(401).json({
                        success: false,
                        message: "401"
                    }); 
                    }
                });
            },
          
            deletePV(req,res){
                acl.isAllowed(req.decoded.id,'agenda', 'delete', async function(err,aclres){

                    if(aclres){

                        let pv = await pvReception.findOne({_id:req.params.id});
                        if(pv?.reserves){
                        for(const reserve of pv.reserves){
                            if (reserve && reserve.photoUrl) {
                                   await uploadService.deletePVFirebaseStorage(extractFileName(reserve.photoUrl));
                                }
                            } 
                        }
                        pv.deleteOne().then((pv)=>{
                            res.json({
                                success: true,
                                message:pv
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

            // 
            submitPV(req,res){
                acl.isAllowed(req.decoded.id,'projets', 'create', async function(err,aclres){
                    if(aclres){

                        let pv = await pvReception.findById(req.params.id);
                        if(!pv) return res.json({success:true,message:"PV introuvables"});

                        pv.status = 'SUBMITTED';

                        pv.save().then(async (tache)=>{
                                res.json({
                                    success:true,
                                    message:tache
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

            signaturePV(req,res){
                acl.isAllowed(req.decoded.id,'projets', 'create', async function(err,aclres){
                    if(aclres){

                        let {role, signerName, signerRoler, signatureUrl } = req.body;
                        if (!['companyRep', 'client'].includes(role)) {
                            return res.status(400).json({ message: "role invalide" });
                        }
                        let pv = await pvReception.findById(req.params.id);
                        if (!pv) return res.status(404).json({ message: "PV introuvable" });

                    
                        pv.signatures[role] = {
                            signerName,
                            signerRole,
                            signatureUrl,
                            signedAt: new Date()
                        };

                        const hasCompany = !!pv.signatures.companyRep?.signedAt;
                        const hasClient = !!pv.signatures.client?.signedAt;
                        if (hasCompany && hasClient) pv.status = 'SIGNED';

                        pv.save().then(async (tache)=>{
                                res.json({
                                    success:true,
                                    message:tache
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


        }
    }
})();            // updatePV(req,res){
