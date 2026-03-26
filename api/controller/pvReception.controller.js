
(function(){
    "use strict";
    var pvReception = require("../models/pvReception.model").PVReceptionModel;
    var uploadService = require('../services/upload.service');
    var MailService = require('../services/mail.service');
    var fs = require("fs");



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
            let path;
            if (startIndex !== -1) {
                if (endIndex !== -1) {
                    // Extraire de "pvreception/" jusqu'à "?"
                    path = fullUrl.substring(startIndex, endIndex);
                } else {
                    // Pas de paramètres, prendre jusqu'à la fin
                    path = fullUrl.substring(startIndex);
                }
            }
            return decodeURIComponent(path);
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
    async function computeIsLeve(declaration, reserves) {
        if (declaration !== 'WITH_RESERVES') return undefined;
        const allLeve = Array.isArray(reserves) && reserves.length > 0 && reserves.every(r => r.etat === 'Levée');
        return allLeve;
    }

    function isValidEmail(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    }
    

    module.exports = function(acl){
        return{

           
            createPV(req,res){
                acl.isAllowed(req.decoded.id,'projets', 'create', async function(err,aclres){
                    if(aclres){
                        const payload = req.body;
                        // Vue que c'est une requête multipart, on va parser les {} contenus dans le body
                        if (payload.entreprise && typeof payload.entreprise === 'string') {
                            payload.entreprise = JSON.parse(payload.entreprise);
                        }
                        if (payload.societeCliente && typeof payload.societeCliente === 'string') {
                            payload.societeCliente = JSON.parse(payload.societeCliente);
                        }
                        if (payload.chantier && typeof payload.chantier === 'string') {
                            payload.chantier = JSON.parse(payload.chantier);
                        }
                        if (payload.travaux && typeof payload.travaux === 'string') {
                            payload.travaux = JSON.parse(payload.travaux);
                        }
                        if (payload.reserves && typeof payload.reserves === 'string') {
                            payload.reserves = JSON.parse(payload.reserves);
                        }
                        if (payload.reserveIndexes && typeof payload.reserveIndexes === 'string') {
                            payload.reserveIndexes = JSON.parse(payload.reserveIndexes);
                        }
                        if (payload.reserveLeveeIndexes && typeof payload.reserveLeveeIndexes === 'string') {
                            payload.reserveLeveeIndexes = JSON.parse(payload.reserveLeveeIndexes);
                        }
                    
                        //console.log("Files", req.files);
                        if(req.files?.planTravaux && req.files.planTravaux.length > 0){
                            try {
                                const url = await uploadService.uploadPVToFirebaseStorage(req.files.planTravaux[0].filename);
                                if (url) payload.travaux.planUrl = url;
                            } catch (e) {
                                console.error('Erreur upload plan travaux:', e);
                                return res.status(500).json({
                                    success: false,
                                    message: "Erreur lors de l’upload du plan des travaux",
                                });
                            }
                        }

                        if (!Array.isArray(payload.reserves)) payload.reserves = [];
                        const reserveFiles = req.files?.reservePhotos || []; // ex: [{filename...}, ...]
                        const reserveLevee = req.files?.reserveLevee || [];
                        const reserveIndexes = payload.reserveIndexes || [];
                        const reserveLeveeIndexes = payload.reserveLeveeIndexes || [];
                        if (reserveFiles.length > 0 && reserveIndexes.length > 0) {
                            // On upload chaque photo, puis on affecte par index
                            for (let i = 0; i < reserveFiles.length; i++) {
                                // Si la réserve n'existe pas à cet index, on ignore
                                const index = reserveIndexes[i];
                                if (Number.isNaN(index) || !payload.reserves[index]) continue;

                                const f = reserveFiles[i];
                                if (!f?.filename) continue;
                                try {
                                    const url = await uploadService.uploadPVToFirebaseStorage(f.filename);
                                    if (url) payload.reserves[index].photoUrl = url;
                                } catch (e) {
                                    console.error('Erreur upload reserve photo:', e);
                                    return res.status(500).json({
                                        success: false,
                                        message: "Erreur lors de l’upload d’une photo de réserve",
                                    });
                                }
                            }
                        }
                        if (reserveLevee.length > 0 && reserveLeveeIndexes.length > 0) {
                            // On upload chaque photo, puis on affecte par index
                            for (let i = 0; i < reserveLevee.length; i++) {
                                // Si la réserve n'existe pas à cet index, on ignore
                                const index = reserveLeveeIndexes[i];
                                if (Number.isNaN(index) || !payload.reserves[index]) continue;

                                const f = reserveLevee[i];
                                if (!f?.filename) continue;
                                try {
                                    const url = await uploadService.uploadPVToFirebaseStorage(f.filename);
                                    if (url) payload.reserves[index].photoLevee = url;
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
                        if (payload.personnesPresent && typeof payload.personnesPresent === 'string') {
                            payload.personnesPresent = JSON.parse(payload.personnesPresent);
                        }

                        
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
                        pvReception.find({projet:req.params.id}).sort({ createdBy: 1, createdAt: -1 }).then((pv)=>{
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
                });

                   
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
                            if (payload.entreprise && typeof payload.entreprise === 'string') {
                                payload.entreprise = JSON.parse(payload.entreprise);
                            }
                            if (payload.societeCliente && typeof payload.societeCliente === 'string') {
                                payload.societeCliente = JSON.parse(payload.societeCliente);
                            }
                            if (payload.chantier && typeof payload.chantier === 'string') {
                                payload.chantier = JSON.parse(payload.chantier);
                            }
                            if (payload.travaux && typeof payload.travaux === 'string') {
                                payload.travaux = JSON.parse(payload.travaux);
                            }
                            if (payload.reserves && typeof payload.reserves === 'string') {
                                payload.reserves = JSON.parse(payload.reserves);
                            }
                            
                            // 2. Récupérer le document existant
                            const existingDoc = await pvReception.findById(req.params.id);
                            if (!existingDoc) {
                                return res.status(404).json({
                                    success: false,
                                    message: "Document non trouvé"
                                });
                            }

                            //console.log("Files", req.files);
                            if(req.files?.planTravaux && req.files.planTravaux.length > 0){
                                try {
                                    const url = await uploadService.uploadPVToFirebaseStorage(req.files.planTravaux[0].filename);
                                    if (url) payload.travaux.planUrl = url;
                                } catch (e) {
                                    console.error('Erreur upload plan travaux:', e);
                                    return res.status(500).json({
                                        success: false,
                                        message: "Erreur lors de l’upload du plan des travaux",
                                    });
                                }
                            }else{
                                // Si pas de nouveau plan, garder l'ancien
                                if(existingDoc.travaux?.planUrl){
                                    payload.travaux.planUrl = extractFilePath(existingDoc.travaux.planUrl);
                                }
                            }

                            // 3. Parser les index des fichiers
                            let reserveIndexes = [];
                            if (payload.reserveIndexes && typeof payload.reserveIndexes === 'string') {
                                try {
                                    reserveIndexes = JSON.parse(payload.reserveIndexes);
                                } catch (e) {
                                    console.log('Erreur parsing reserveIndexes:', e);
                                }
                            }

                            let reserveLeveeIndexes = [];
                            if (payload.reserveLeveeIndexes && typeof payload.reserveLeveeIndexes === 'string') {
                                try {
                                    reserveLeveeIndexes = JSON.parse(payload.reserveLeveeIndexes);
                                } catch (e) {
                                    console.log('Erreur parsing reserveLeveeIndexes:', e);
                                }
                            }

                            // console.log("Reserves payload:", payload.reserves);
                            // console.log("Photo indexes:", reserveIndexes);
                            // console.log("Levée indexes:", reserveLeveeIndexes);

                            // 4. Gérer les fichiers uploadés
                            const reserveFiles = req.files?.reservePhotos || [];
                            const reserveLeveeFiles = req.files?.reserveLevee || [];
                            
                            // console.log(`Nombre de fichiers photo: ${reserveFiles.length}`);
                            // console.log(`Nombre de fichiers levée: ${reserveLeveeFiles.length}`);

                            // Upload des photos de réserve
                            for (let i = 0; i < reserveFiles.length; i++) {
                                const file = reserveFiles[i];
                                
                                // Utiliser l'index correspondant du tableau reserveIndexes
                                if (reserveIndexes[i] !== undefined) {
                                    const targetIndex = reserveIndexes[i];
                                    //console.log(`Photo ${i} -> Réserve index ${targetIndex}`);
                                    
                                    // Vérifier que la réserve existe
                                    if (payload.reserves[targetIndex] && file?.filename) {
                                        try {
                                            const url = await uploadService.uploadPVToFirebaseStorage(file.filename);
                                            if (url) {
                                                payload.reserves[targetIndex].photoUrl = url;
                                                console.log(`✓ Photo uploadée pour réserve ${targetIndex}`);
                                            }
                                        } catch (e) {
                                            console.error('Erreur upload photo:', e);
                                        }
                                    } else if (!payload.reserves[targetIndex]) {
                                        console.warn(`Réserve ${targetIndex} n'existe pas pour la photo ${i}`);
                                    }
                                } else {
                                    console.warn(`Pas d'index défini pour la photo ${i}`);
                                }
                            }

                            // Upload des photos de levée
                            for (let i = 0; i < reserveLeveeFiles.length; i++) {
                                const file = reserveLeveeFiles[i];
                                
                                // Utiliser l'index correspondant du tableau reserveLeveeIndexes
                                if (reserveLeveeIndexes[i] !== undefined) {
                                    const targetIndex = reserveLeveeIndexes[i];
                                    console.log(`Levée ${i} -> Réserve index ${targetIndex}`);
                                    
                                    // Vérifier que la réserve existe
                                    if (payload.reserves[targetIndex] && file?.filename) {
                                        try {
                                            const url = await uploadService.uploadPVToFirebaseStorage(file.filename);
                                            if (url) {
                                                payload.reserves[targetIndex].photoLevee = url;
                                                console.log(`✓ Levée uploadée pour réserve ${targetIndex}`);
                                            }
                                        } catch (e) {
                                            console.error('Erreur upload levée:', e);
                                        }
                                    } else if (!payload.reserves[targetIndex]) {
                                        console.warn(`Réserve ${targetIndex} n'existe pas pour la levée ${i}`);
                                    }
                                } else {
                                    console.warn(`Pas d'index défini pour la levée ${i}`);
                                }
                            }

                            // 5. Préserver les anciennes images pour les réserves non modifiées
                            payload.reserves.forEach((reserve, index) => {
                                // Si pas de nouvelle photo mais ancienne existe
                                if (!reserve.photoUrl && existingDoc.reserves[index] && existingDoc.reserves[index].photoUrl) {
                                    payload.reserves[index].photoUrl = extractFilePath(existingDoc.reserves[index].photoUrl);
                                }
                                
                                // Si pas de nouvelle levée mais ancienne existe
                                if (!reserve.photoLevee && existingDoc.reserves[index] && existingDoc.reserves[index].photoLevee) {
                                    payload.reserves[index].photoLevee = extractFilePath(existingDoc.reserves[index].photoLevee);
                                }
                            });

                            // 6. Parser les signatures
                            if (payload.signatures && typeof payload.signatures === 'string') {
                                payload.signatures = JSON.parse(payload.signatures);
                            }
                            
                            // 7. Parser les personnes présentes
                            if (payload.personnesPresent && typeof payload.personnesPresent === 'string') {
                                payload.personnesPresent = JSON.parse(payload.personnesPresent);
                            }

                            // 8. Mettre à jour le document
                            const updatedPv = await pvReception.findByIdAndUpdate(
                                req.params.id,
                                payload,
                                { new: true, runValidators: true }
                            );

                            res.json({
                                success: true,
                                message: updatedPv
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
                            message: "Non autorisé"
                        }); 
                    }
                });
            },

            // updatePV(req, res) {
            //     acl.isAllowed(req.decoded.id, 'agenda', 'create', async function(err, aclres) {
            //         if (aclres) {
            //         try {
            //             const payload = { ...req.body };
            //             //console.log("Payload Start", payload);

            //             // 1. Parser les réserves
            //             if (payload.reserves && typeof payload.reserves === 'string') {
            //             try {
            //                 payload.reserves = JSON.parse(payload.reserves);
            //             } catch (e) {
            //                 return res.status(400).json({
            //                 success: false,
            //                 message: "reserves doit être un JSON valide (tableau)."
            //                 });
            //             }
            //             }

            //             if (!Array.isArray(payload.reserves)) payload.reserves = [];

            //             // 2. Récupérer le document existant
            //             const existingDoc = await pvReception.findById(req.params.id);
            //             if (!existingDoc) {
            //             return res.status(404).json({
            //                 success: false,
            //                 message: "Document non trouvé"
            //             });
            //             }

            //             // 3. Parser les index des réserves à modifier
            //             let reserveIndexes = [];
            //             if (payload.reserveIndexes && typeof payload.reserveIndexes === 'string') {
            //             try {
            //                 reserveIndexes = JSON.parse(payload.reserveIndexes);
            //             } catch (e) {
            //                 console.log('Erreur parsing reserveIndexes:', e);
            //             }
            //             }

            //             let reserveLeveeIndexes = [];
            //             if (payload.reserveLeveeIndexes && typeof payload.reserveLeveeIndexes === 'string') {
            //             try {
            //                 reserveLeveeIndexes = JSON.parse(payload.reserveLeveeIndexes);
            //             } catch (e) {
            //                 console.log('Erreur parsing reserveIndexes:', e);
            //             }
            //             }

            //             //console.log("Reserves", payload.reserves);
            //             //console.log("index payload", payload.reserveIndexes)

            //             // 4. Gérer les fichiers uploadés
            //             const reserveFiles = req.files?.reservePhotos || [];
            //             const reserveLeveeFiles = req.files?.reserveLevee || [];
            //             //console.log("Reserve Files",reserveFiles);
            //             console.log("Reserve Levée Files",reserveLeveeFiles);
                        
            //             if (reserveFiles.length > 0) {
            //                 for (let i = 0; i < reserveFiles.length; i++) {
            //                     const f = reserveFiles[i];
                                
            //                     // Déterminer quel index de réserve ce fichier modifie
            //                     let targetReserveIndex = i; // Par défaut
            //                     //console.log("Index", i);
                                
            //                     // Si on a une liste d'index, l'utiliser
            //                     if (reserveIndexes[i] !== undefined) {
            //                     targetReserveIndex = reserveIndexes[i];
            //                     } else {
            //                     // Sinon, chercher dans les réserves celle qui a _index
            //                     // ou utiliser l'ordre d'arrivée des fichiers
            //                     }
                                
            //                     // Vérifier que la réserve existe à cet index
            //                     if (payload.reserves[targetReserveIndex]) {
            //                     try {
            //                         const url = await uploadService.uploadPVToFirebaseStorage(f.filename);
            //                         payload.reserves[targetReserveIndex].photoUrl = url;
            //                         console.log(`Photo uploadée pour réserve index ${targetReserveIndex}`);
            //                     } catch (e) {
            //                         console.error('Erreur upload reserve photo:', e);
            //                     }
            //                     }
            //                 }
            //             }
            //             if (reserveLeveeFiles.length > 0) {
            //                 for (let i = 0; i < reserveLeveeFiles.length; i++) {
            //                     const f = reserveLeveeFiles[i];
                                
            //                     // Déterminer quel index de réserve ce fichier modifie
            //                     let targetReserveIndex = i; // Par défaut
            //                     //console.log("Index", i);
                                
            //                     // Si on a une liste d'index, l'utiliser
            //                     if (reserveLeveeIndexes[i] !== undefined) {
            //                     targetReserveIndex = reserveLeveeIndexes[i];
            //                     } else {
            //                     // Sinon, chercher dans les réserves celle qui a _index
            //                     // ou utiliser l'ordre d'arrivée des fichiers
            //                     }
                                
            //                     // Vérifier que la réserve existe à cet index
            //                     if (payload.reserves[targetReserveIndex]) {
            //                     try {
            //                         const url = await uploadService.uploadPVToFirebaseStorage(f.filename);
            //                         payload.reserves[targetReserveIndex].photoLevee = url;
            //                         console.log(`Photo Levée uploadée pour réserve index ${targetReserveIndex}`);
            //                     } catch (e) {
            //                         console.error('Erreur upload reserve photo:', e);
            //                     }
            //                     }
            //                 }
            //             }

            //             // 5. Pour les réserves SANS nouvelle photo, garder l'ancienne
            //             payload.reserves.forEach((reserve, index) => {
            //             // Chercher l'index réel de la réserve (si _index existe)
            //             const reserveRealIndex = reserve._index !== undefined ? reserve._index : index;
                        
            //             // Si pas de nouvelle photo mais ancienne photo existante
            //             if (!reserve.photoUrl && 
            //                 existingDoc.reserves[reserveRealIndex] && 
            //                 existingDoc.reserves[reserveRealIndex].photoUrl) {
            //                 payload.reserves[index].photoUrl = extractFilePath(existingDoc.reserves[reserveRealIndex].photoUrl);
            //             }
            //             if (!reserve.photoLevee && 
            //                 existingDoc.reserves[reserveRealIndex] && 
            //                 existingDoc.reserves[reserveRealIndex].photoLevee) {
            //                 payload.reserves[index].photoLevee = extractFilePath(existingDoc.reserves[reserveRealIndex].photoLevee);
            //             }
                        
            //             // Nettoyer le champ _index
            //             delete payload.reserves[index]._index;
            //             });

            //              // signatures (OBLIGATOIRE)
            //             if (payload.signatures && typeof payload.signatures === 'string') {
            //               payload.signatures = JSON.parse(payload.signatures);
            //             }
            //             // convertir signedAt si besoin (ISO string -> Date)
            //             if (payload.signatures?.companyRep?.signedAt) {
            //             payload.signatures.companyRep.signedAt = new Date(payload.signatures.companyRep.signedAt);
            //             }
            //             if (payload.signatures?.client?.signedAt) {
            //             payload.signatures.client.signedAt = new Date(payload.signatures.client.signedAt);
            //             }

            //             if (payload.personnesPresent && typeof payload.personnesPresent === 'string') {
            //                 payload.personnesPresent = JSON.parse(payload.personnesPresent);
            //             }


            //             // pvReception.findOneAndUpdate(
            //             // { _id: req.params.id },
            //             // payload,
            //             // { new: true }
            //             // ).then(async (pv) => {
            //             // res.json({
            //             //     success: true,
            //             //     message: pv
            //             // });
            //             // }).catch((error) => {
            //             // return res.status(500).json({
            //             //     success: false,
            //             //     message: error.message
            //             // });
            //             //});

            //         } catch (error) {
            //             console.error('Erreur générale:', error);
            //             return res.status(500).json({
            //             success: false,
            //             message: error.message
            //             });
            //         }
            //         } else {
            //         return res.status(401).json({
            //             success: false,
            //             message: "401"
            //         }); 
            //         }
            //     });
            // },
          
            deletePV(req,res){
                acl.isAllowed(req.decoded.id,'agenda', 'delete', async function(err,aclres){

                    if(aclres){

                        let pv = await pvReception.findOne({_id:req.params.id});
                        if(!pv){
                            return res.status(404).json({
                                success: false,
                                message: "PV introuvable"
                            });
                        }

                        const hasChildren = await pvReception.exists({ parentPvId: pv._id });
                        
                        if(!hasChildren){
                            if(pv?.reserves){
                                for(const reserve of pv.reserves){
                                    if (reserve && reserve.photoUrl) {
                                        const fileName = extractFileName(reserve.photoUrl);
                                        if (fileName) await uploadService.deletePVFirebaseStorage(fileName);
                                    }
                                    if (reserve && reserve.photoLevee) {
                                        const fileName = extractFileName(reserve.photoLevee);
                                        if (fileName) await uploadService.deletePVFirebaseStorage(fileName);
                                    }
                                }
                            }
                            if(pv?.travaux?.planUrl){
                                const fileName = extractFileName(pv.travaux.planUrl);
                                if (fileName) await uploadService.deletePVFirebaseStorage(fileName);
                            }
                        }else{
                            console.log(`Suppression Firebase ignorée: le PV ${pv._id} est parent d'autres versions.`);
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

            // Levée les réserves

            // leveeReserve(req,res){
            //     acl.isAllowed(req.decoded.id,'agenda', 'delete', async function(err,aclres){

            //         if(aclres){
  
            //             try {
            //                 const source = await pvReception.findById(req.params.id).lean();
            //                 if(!source) return res.status(404).json({ success: false, message: "PV introuvable" });
            //                 const payload = {...req.body};

            //                 // 1. Parser les réserves
            //             if (payload.reserves && typeof payload.reserves === 'string') {
            //             try {
            //                 payload.reserves = JSON.parse(payload.reserves);
            //             } catch (e) {
            //                 return res.status(400).json({
            //                 success: false,
            //                 message: "reserves doit être un JSON valide (tableau)."
            //                 });
            //             }
            //             }

            //             if (!Array.isArray(payload.reserves)) payload.reserves = [];

            //             // 2. Récupérer le document existant
            //             const existingDoc = await pvReception.findById(req.params.id);
            //             if (!existingDoc) {
            //             return res.status(404).json({
            //                 success: false,
            //                 message: "Document non trouvé"
            //             });
            //             }

            //             // 3. Parser les index des réserves à modifier
            //             let reserveIndexes = [];
            //             if (payload.reserveIndexes && typeof payload.reserveIndexes === 'string') {
            //             try {
            //                 reserveIndexes = JSON.parse(payload.reserveIndexes);
            //             } catch (e) {
            //                 console.log('Erreur parsing reserveIndexes:', e);
            //             }
            //             }

            //             let reserveLeveeIndexes = [];
            //             if (payload.reserveLeveeIndexes && typeof payload.reserveLeveeIndexes === 'string') {
            //             try {
            //                 reserveLeveeIndexes = JSON.parse(payload.reserveLeveeIndexes);
            //             } catch (e) {
            //                 console.log('Erreur parsing reserveIndexes:', e);
            //             }
            //             }

            //             //console.log("Reserves", payload.reserves);
            //             //console.log("index payload", payload.reserveIndexes)

            //             // 4. Gérer les fichiers uploadés
            //             const reserveFiles = req.files?.reservePhotos || [];
            //             const reserveLeveeFiles = req.files?.reserveLevee || [];
            //             //console.log("Reserve Files",reserveFiles);
                        
            //             if (reserveFiles.length > 0) {
            //                 for (let i = 0; i < reserveFiles.length; i++) {
            //                     const f = reserveFiles[i];
                                
            //                     // Déterminer quel index de réserve ce fichier modifie
            //                     let targetReserveIndex = i; // Par défaut
            //                     //console.log("Index", i);
                                
            //                     // Si on a une liste d'index, l'utiliser
            //                     if (reserveIndexes[i] !== undefined) {
            //                     targetReserveIndex = reserveIndexes[i];
            //                     } else {
            //                     // Sinon, chercher dans les réserves celle qui a _index
            //                     // ou utiliser l'ordre d'arrivée des fichiers
            //                     }
                                
            //                     // Vérifier que la réserve existe à cet index
            //                     if (payload.reserves[targetReserveIndex]) {
            //                     try {
            //                         const url = await uploadService.uploadPVToFirebaseStorage(f.filename);
            //                         payload.reserves[targetReserveIndex].photoUrl = url;
            //                         console.log(`Photo uploadée pour réserve index ${targetReserveIndex}`);
            //                     } catch (e) {
            //                         console.error('Erreur upload reserve photo:', e);
            //                     }
            //                     }
            //                 }
            //             }
            //             if (reserveLeveeFiles.length > 0) {
            //                 for (let i = 0; i < reserveLeveeFiles.length; i++) {
            //                     const f = reserveLeveeFiles[i];
                                
            //                     // Déterminer quel index de réserve ce fichier modifie
            //                     let targetReserveIndex = i; // Par défaut
            //                     //console.log("Index", i);
                                
            //                     // Si on a une liste d'index, l'utiliser
            //                     if (reserveLeveeIndexes[i] !== undefined) {
            //                     targetReserveIndex = reserveLeveeIndexes[i];
            //                     } else {
            //                     // Sinon, chercher dans les réserves celle qui a _index
            //                     // ou utiliser l'ordre d'arrivée des fichiers
            //                     }
                                
            //                     // Vérifier que la réserve existe à cet index
            //                     if (payload.reserves[targetReserveIndex]) {
            //                     try {
            //                         const url = await uploadService.uploadPVToFirebaseStorage(f.filename);
            //                         payload.reserves[targetReserveIndex].photoLevee = url;
            //                         console.log(`Photo Levée uploadée pour réserve index ${targetReserveIndex}`);
            //                     } catch (e) {
            //                         console.error('Erreur upload reserve photo:', e);
            //                     }
            //                     }
            //                     }
            //                 }

            //                 // 5. Pour les réserves SANS nouvelle photo, garder l'ancienne
            //                 payload.reserves.forEach((reserve, index) => {
            //                 // Chercher l'index réel de la réserve (si _index existe)
            //                 const reserveRealIndex = reserve._index !== undefined ? reserve._index : index;
                            
            //                 // Si pas de nouvelle photo mais ancienne photo existante
            //                 if (!reserve.photoUrl && 
            //                     existingDoc.reserves[reserveRealIndex] && 
            //                     existingDoc.reserves[reserveRealIndex].photoUrl) {
            //                     payload.reserves[index].photoUrl = extractFilePath(existingDoc.reserves[reserveRealIndex].photoUrl);
            //                 }
            //                 if (!reserve.photoLevee && 
            //                     existingDoc.reserves[reserveRealIndex] && 
            //                     existingDoc.reserves[reserveRealIndex].photoLevee) {
            //                     payload.reserves[index].photoLevee = extractFilePath(existingDoc.reserves[reserveRealIndex].photoLevee);
            //                 }
                            
            //                 // Nettoyer le champ _index
            //                 delete payload.reserves[index]._index;
            //                 });



            //                 if (payload.personnesPresent && typeof payload.personnesPresent === 'string') {
            //                     payload.personnesPresent = JSON.parse(payload.personnesPresent);
            //                 }

            //                 const last = await pvReception
            //                 .find({ $or: [{ _id: source._id }, { parentPvId: source._id }] })
            //                 .sort({ version: -1 })
            //                 .limit(1)
            //                 .lean();

            //                 const nextVersion = (last?.[0]?.version || source.version || 1) + 1;
            //                 const rootId = source.parentPvId ? source.parentPvId : source._id;

            //                 // Construire le clone
            //                 const clone = {
            //                     projet: source.projet,
            //                     number: generatePvNumber(),
            //                     declaration: source.declaration,
            //                     effectiveDate: source.effectiveDate,
            //                     place: source.place,

            //                     refusalReason: source.refusalReason,
            //                     observation: source.observation,

            //                     nextReceptionDate: source.nextReceptionDate,
            //                     reservesExecutionDelayDays: source.reservesExecutionDelayDays,
            //                     reservesFromDate: source.reservesFromDate,
            //                     //allReservesLifted: source.allReservesLifted,

            //                     // IMPORTANT: on prend les réserves envoyées (qui incluent les photoUrl existants)
            //                     reserves: payload.reserves,

            //                     // Signatures: recommandé de réinitialiser pour re-signature
            //                     signatures: { companyRep: {}, client: {} },

            //                     status: 'DRAFT',
            //                     createdBy: req.decoded?.id,

            //                     parentPvId: rootId,
            //                     version: nextVersion,
            //                     revisionReason: payload.revisionReason || 'Levée de réserves'
            //                 };

            //                 // Calcul isLeve (seulement si WITH_RESERVES)
            //                 const isLeve = await computeIsLeve(clone.declaration, clone.reserves);
            //                 if (clone.declaration === 'WITH_RESERVES'){
            //                     clone.isLeve = isLeve;
            //                     clone.allReservesLifted = isLeve;
            //                 } 
            //                 else delete clone.isLeve;

            //                 const created = await pvReception.create(clone);

            //                 return res.json({ success: true, message: created });
                                
            //             } catch (error) {
            //                 return res.status(500).json({ success: false, message: error.message });
            //             }

            //         }else{
            //             return res.status(401).json({
            //                 success: false,
            //                 message: "401"
            //             });
            //         }
            //     })

            // },
            
            leveeReserve(req, res) {
                acl.isAllowed(req.decoded.id, 'agenda', 'delete', async function(err, aclres) {
                    if (aclres) {
                        try {
                            // 1. Récupérer le PV source
                            const source = await pvReception.findById(req.params.id).lean();
                            if (!source) {
                                return res.status(404).json({ 
                                    success: false, 
                                    message: "PV introuvable" 
                                });
                            }

                            const payload = { ...req.body };
                            //console.log("Payload", req.body);
                            const tryParseJSON = (value) => {
                                if (typeof value !== 'string') return value;
                                const trimmed = value.trim();
                                if (!trimmed || trimmed === 'undefined' || trimmed === 'null') return undefined;
                                try {
                                    return JSON.parse(trimmed);
                                } catch (e) {
                                    return value;
                                }
                            };

                            payload.entreprise = tryParseJSON(payload.entreprise);
                            payload.societeCliente = tryParseJSON(payload.societeCliente);
                            payload.personnesPresent = tryParseJSON(payload.personnesPresent);
                            payload.signatures = tryParseJSON(payload.signatures);

                            // 2. Parser les réserves
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

                            if (!Array.isArray(payload.reserves)) {
                                payload.reserves = [];
                            }

                            // 3. Récupérer le document existant (pour les anciennes images)
                            const existingDoc = await pvReception.findById(req.params.id);
                            if (!existingDoc) {
                                return res.status(404).json({
                                    success: false,
                                    message: "Document non trouvé"
                                });
                            }

                            // 4. Parser les index des fichiers
                            let reserveIndexes = [];
                            if (payload.reserveIndexes && typeof payload.reserveIndexes === 'string') {
                                try {
                                    reserveIndexes = JSON.parse(payload.reserveIndexes);
                                } catch (e) {
                                    console.log('Erreur parsing reserveIndexes:', e);
                                }
                            }

                            let reserveLeveeIndexes = [];
                            if (payload.reserveLeveeIndexes && typeof payload.reserveLeveeIndexes === 'string') {
                                try {
                                    reserveLeveeIndexes = JSON.parse(payload.reserveLeveeIndexes);
                                } catch (e) {
                                    console.log('Erreur parsing reserveLeveeIndexes:', e);
                                }
                            }

                            // console.log("=== LEVEE RESERVE DEBUG ===");
                            // console.log("Nombre de réserves:", payload.reserves.length);
                            // console.log("Index photos:", reserveIndexes);
                            // console.log("Index levées:", reserveLeveeIndexes);

                            // 5. Gérer les fichiers uploadés
                            const reserveFiles = req.files?.reservePhotos || [];
                            const reserveLeveeFiles = req.files?.reserveLevee || [];

                            // console.log(`Fichiers photo: ${reserveFiles.length}`);
                            // console.log(`Fichiers levée: ${reserveLeveeFiles.length}`);

                            // Upload des nouvelles photos de réserve
                            for (let i = 0; i < reserveFiles.length; i++) {
                                const file = reserveFiles[i];
                                
                                if (reserveIndexes[i] !== undefined) {
                                    const targetIndex = reserveIndexes[i];
                                    
                                    if (payload.reserves[targetIndex] && file?.filename) {
                                        try {
                                            const url = await uploadService.uploadPVToFirebaseStorage(file.filename);
                                            if (url) {
                                                payload.reserves[targetIndex].photoUrl = url;
                                                console.log(`✓ Photo uploadée pour réserve ${targetIndex}`);
                                            }
                                        } catch (e) {
                                            console.error('Erreur upload photo:', e);
                                        }
                                    }
                                }
                            }

                            // Upload des nouvelles photos de levée
                            for (let i = 0; i < reserveLeveeFiles.length; i++) {
                                const file = reserveLeveeFiles[i];
                                
                                if (reserveLeveeIndexes[i] !== undefined) {
                                    const targetIndex = reserveLeveeIndexes[i];
                                    
                                    if (payload.reserves[targetIndex] && file?.filename) {
                                        try {
                                            const url = await uploadService.uploadPVToFirebaseStorage(file.filename);
                                            if (url) {
                                                payload.reserves[targetIndex].photoLevee = url;
                                                console.log(`✓ Levée uploadée pour réserve ${targetIndex}`);
                                            }
                                        } catch (e) {
                                            console.error('Erreur upload levée:', e);
                                        }
                                    }
                                }
                            }

                            // 6. Préserver les anciennes images pour les réserves non modifiées
                            // ATTENTION: Pour la levée, on garde les anciennes images du document source
                            payload.reserves.forEach((reserve, index) => {
                                // Si la résource source a une photo et que la nouvelle n'en a pas
                                if (source.reserves && source.reserves[index]) {
                                    if ((!reserve.photoUrl && source.reserves[index].photoUrl) || (reserve.photoUrl && reserve.photoUrl.includes('storage.googleapis.com'))) {
                                        payload.reserves[index].photoUrl = extractFilePath(source.reserves[index].photoUrl);
                                    }
                                    
                                    if ((!reserve.photoLevee && source.reserves[index].photoLevee) || (reserve.photoLevee && reserve.photoLevee.includes('storage.googleapis.com'))) {
                                        payload.reserves[index].photoLevee = extractFilePath(source.reserves[index].photoLevee);
                                    }
                                }
                                
                                // Nettoyer le champ _index si présent
                                if (reserve._index !== undefined) {
                                    delete payload.reserves[index]._index;
                                }
                            });

                            // 8. Trouver la dernière version
                            const last = await pvReception
                                .find({ 
                                    $or: [
                                        { _id: source._id }, 
                                        { parentPvId: source._id }
                                    ] 
                                })
                                .sort({ version: -1 })
                                .limit(1)
                                .lean();

                            const nextVersion = (last?.[0]?.version || source.version || 1) + 1;
                            const rootId = source.parentPvId ? source.parentPvId : source._id;

                            // 9. Fonction pour calculer isLeve
                            const computeIsLeve = (declaration, reserves) => {
                                if (declaration !== 'WITH_RESERVES') {
                                    return undefined;
                                }
                                
                                return Array.isArray(reserves) && 
                                    reserves.length > 0 && 
                                    reserves.every(r => r.etat === 'Fait');
                            };
                            
                            const travaux = { ...source.travaux };
                            if (travaux?.planUrl){
                                travaux.planUrl = extractFilePath(travaux.planUrl);
                            }
                            
                            const clone = {
                                projet: source.projet,
                                number: generatePvNumber(), // Assurez-vous d'avoir cette fonction
                                declaration: source.declaration,
                                titre: payload.titre ?? source.titre,
                                entreprise: payload.entreprise ?? source.entreprise,
                                societeCliente: payload.societeCliente ?? source.societeCliente,
                                chantier: source.chantier,
                                travaux: travaux,
                                effectiveDate: payload.effectiveDate ?? source.effectiveDate,
                                place: payload.place ?? source.place,
                                refusalReason: source.refusalReason,
                                nextReceptionDate: payload.nextReceptionDate ?? source.nextReceptionDate,
                                reservesExecutionDelayDays: payload.reservesExecutionDelayDays ?? source.reservesExecutionDelayDays,
                                reservesFromDate: payload.reservesFromDate ?? source.reservesFromDate,

                                // Réserves mises à jour (avec photos)
                                reserves: payload.reserves,

                                // Personnes présentes (si envoyées, sinon garder les anciennes)
                                personnesPresent: payload.personnesPresent || source.personnesPresent,

                                // Signatures: réinitialiser pour re-signature
                                signatures: { 
                                    companyRep: payload.signatures?.companyRep ?? {}, 
                                    client: payload.signatures?.client ?? {}
                                },

                                status: 'DRAFT',
                                createdBy: req.decoded?.id,

                                parentPvId: rootId,
                                version: nextVersion,
                                // revisionReason: payload.revisionReason || 'Levée de réserves'
                            };

                            //console.log("Clone", clone);

                            // 11. Calculer si toutes les réserves sont levées
                            const isLeve = computeIsLeve(clone.declaration, clone.reserves);
                            const allReservesFait = Array.isArray(clone.reserves) &&
                                clone.reserves.length > 0 &&
                                clone.reserves.every(r => r.etat === 'Fait');
                            if (clone.declaration === 'WITH_RESERVES') {
                                clone.isLeve = isLeve;
                                clone.allReservesLifted = isLeve;
                            } else {
                                delete clone.isLeve;
                            }
                            clone.status = allReservesFait ? 'ARCHIVED' : 'DRAFT';

                            // console.log("=== CREATION NOUVEAU PV ===");
                            // console.log("Nouveau numéro:", clone.number);
                            // console.log("Version:", clone.version);
                            // console.log("Toutes levées?", clone.allReservesLifted);

                            // 12. Créer le nouveau document
                            const created = await pvReception.create(clone);

                            // 13. Optionnel: Mettre à jour le statut de l'ancien PV
                            if (source.status !== 'ARCHIVED') {
                                await pvReception.findByIdAndUpdate(
                                    req.params.id,
                                    { status: 'ARCHIVED' }
                                );
                            }

                            return res.json({ 
                                success: true, 
                                message: created 
                            });

                        } catch (error) {
                            console.error('Erreur dans leveeReserve:', error);
                            return res.status(500).json({ 
                                success: false, 
                                message: error.message 
                            });
                        }
                    } else {
                        return res.status(401).json({
                            success: false,
                            message: "Non autorisé"
                        });
                    }
                });
            },

            //
            // submitPV(req,res){
            //     acl.isAllowed(req.decoded.id,'projets', 'create', async function(err,aclres){
            //         if(aclres){

            //             let pv = await pvReception.findById(req.params.id);
            //             if(!pv) return res.json({success:true,message:"PV introuvables"});

            //             pv.status = 'SUBMITTED';

            //             pv.save().then(async (tache)=>{
            //                     res.json({
            //                         success:true,
            //                         message:tache
            //                     });
            //             }).catch((error)=>{
            //                     return res.status(500).json({
            //                         success:false,
            //                         message:error.message
            //                     })
            //             })
            //         }else{
            //            return res.status(401).json({
            //                 success: false,
            //                 message: "401"
            //             }); 
            //         }
            //     })
            // },

            // signaturePV(req,res){
            //     acl.isAllowed(req.decoded.id,'projets', 'create', async function(err,aclres){
            //         if(aclres){

            //             let {role, signerName, signerRoler, signatureUrl } = req.body;
            //             if (!['companyRep', 'client'].includes(role)) {
            //                 return res.status(400).json({ message: "role invalide" });
            //             }
            //             let pv = await pvReception.findById(req.params.id);
            //             if (!pv) return res.status(404).json({ message: "PV introuvable" });

                    
            //             pv.signatures[role] = {
            //                 signerName,
            //                 signerRole,
            //                 signatureUrl,
            //                 signedAt: new Date()
            //             };

            //             const hasCompany = !!pv.signatures.companyRep?.signedAt;
            //             const hasClient = !!pv.signatures.client?.signedAt;
            //             if (hasCompany && hasClient) pv.status = 'SIGNED';

            //             pv.save().then(async (tache)=>{
            //                     res.json({
            //                         success:true,
            //                         message:tache
            //                     });
            //             }).catch((error)=>{
            //                     return res.status(500).json({
            //                         success:false,
            //                         message:error.message
            //                     })
            //             })
            //         }else{
            //            return res.status(401).json({
            //                 success: false,
            //                 message: "401"
            //             }); 
            //         }
            //     })
            // },
              
            sendPvByMail(req,res){
                acl.isAllowed(req.decoded.id,'agenda', 'create', async function(err,aclres){
                    if(aclres){
                        let pv = await pvReception.findById(req.params.id);
                        if(!pv) {
                            return res.status(404).json({ 
                                success: false, 
                                message: "PV introuvable" 
                            });
                        }

                        let destinataires = [
                            {
                                email: pv.entreprise.representant.email || 'm.minthe@mlka.fr',
                                nom: pv.entreprise.representant.nom,
                                prenom: pv.entreprise.representant.prenom
                            },
                        ];

                        const payload = req.body;
                        if(payload.destinataires && typeof payload.destinataires === 'string') {
                            payload.destinataires = JSON.parse(payload.destinataires);
                            for (const personne of payload.destinataires) {
                                destinataires.push({
                                    email: personne.email,
                                    nom: personne.nom,
                                    prenom: personne.prenom
                                });
                                
                            }
                        }else{
                            return res.status(400).json({
                                success: false,
                                message: "Destinataires non trouvés"
                            });
                        }

                        
                        if(req.files?.pvReception && req.files.pvReception.length > 0){
                            try {
                                // Convertir le fichier en buffer
                                const fileName = req.files.pvReception[0].filename;

                                const file = req.files.pvReception[0];

                                const buffer = fs.readFileSync(file.path);
                            
                                // Envoyer le mail
                                for (const personne of destinataires) {
                                    if (
                                        personne.email &&
                                        personne.email.trim() !== '' &&
                                        isValidEmail(personne.email)
                                    ) {
                                        await MailService.mailPvReception({
                                            projet: pv.travaux?.projet || '',
                                            nomComplet: personne.prenom + ' ' + personne.nom,
                                            email: personne.email,
                                            pvBuffer: buffer,
                                            fileName: fileName
                                        });
                                    }
                                }
                                
                                return res.json({
                                    success: true,
                                    message: "PV envoyé aux personnes présentes"
                                });
                            } catch (error) {
                                return res.status(500).json({
                                    success: false,
                                    message: error.message
                                });
                            }
                        }else{
                            return res.status(400).json({
                                success: false,
                                message: "Fichier pv reception à envoyer non trouvé"
                            });
                        }

                        
                    }else{
                        return res.status(401).json({
                            success: false,
                            message: "401"
                        });
                    }
                });
            },

        }
    }
})();          
