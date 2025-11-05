(function(){

     "use strict";
     var NoteModule = require('../models/noteModule.model').NoteModuleModel
     var uploadService = require('../services/upload.service');
     const bucket = require("../../firebase-config").bucket;

     module.exports=function(acl){

        return{

            create: async function (req, res) {
                try {
                    
                    acl.isAllowed(req.decoded.id, 'box', 'create', async function (err, aclres) {
                    if (err) {
                        console.error('Erreur ACL:', err);
                        return res.status(500).json({ success: false, message: 'Erreur ACL' });
                    }

                    if (!aclres) {
                        return res.status(401).json({
                        success: false,
                        message: 'Non autorisé à créer une note',
                        });
                    }

                    try {
                        const note = new NoteModule({
                        createdBy: req.decoded.id,
                        dateLastUpdate: new Date(),
                        module: req.params.id,
                        text: req.body.text || '',
                        type: req.body.type || 'mixed',
                        });

                        if (req.body.annotationJSON) {
                        try {
                            note.annotationJSON = JSON.parse(req.body.annotationJSON);
                        } catch (e) {
                            console.warn('annotationJSON non parsable, stocké brut');
                            note.annotationJSON = req.body.annotationJSON;
                        }
                        }

                        // ---- AUDIO ----
                        if (req.files?.audio?.[0]) {
                        const audioFile = req.files.audio[0];
                        try {
                            const audioUrl = await uploadService.uploadNotesModulesToFirebaseStorage(audioFile.filename);
                            note.audio = {
                            url: audioUrl,
                            mime: audioFile.mimetype,
                            duration: req.body.audioDuration || null,
                            };
                        } catch (err) {
                            console.error('Erreur upload audio:', err);
                            return res.status(500).json({
                            success: false,
                            message: 'Erreur lors de l’upload de l’audio',
                            });
                        }
                        }

                        // ---- IMAGE ----
                        if (req.files?.image?.[0]) {
                        const imageFile = req.files.image[0];
                        try {
                            const imageUrl = await uploadService.uploadNotesModulesToFirebaseStorage(imageFile.filename);
                            note.image = {
                            url: imageUrl,
                            width: req.body.imageWidth || null,
                            height: req.body.imageHeight || null,
                            };
                        } catch (err) {
                            console.error('Erreur upload image:', err);
                            return res.status(500).json({
                            success: false,
                            message: 'Erreur lors de l’upload de l’image',
                            });
                        }
                        }

                        // Sauvegarde en base
                        await note.save();
                        return res.status(201).json({
                        success: true,
                        message: note,
                        });
                    } catch (error) {
                        console.error('Erreur création note:', error);
                        return res.status(500).json({
                        success: false,
                        message: "Erreur lors de l'enregistrement de la note",
                        });
                    }
                    });
                } catch (globalError) {
                    console.error('Erreur globale:', globalError);
                    return res.status(500).json({
                    success: false,
                    message: 'Erreur interne du serveur',
                    });
                }
            },

            getAllNoteModule:function(req,res){
                acl.isAllowed(req.decoded.id,'box', 'create', async function(err,aclres){

                    if(aclres){
                        NoteModule.find({module:req.params.id}).populate('createdBy', 'nom prenom email').sort({ dateLastUpdate: -1 }).then((notes)=>{
                            res.json({
                                success: true,
                                message:notes
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

            getNote:function(req,res){
                acl.isAllowed(req.decoded.id,'box', 'create', async function(err,aclres){

                    if(aclres){
                        NoteModule.findById(req.params.id).populate('createdBy', 'nom prenom email').then((notes)=>{
                            res.json({
                                success: true,
                                message:notes
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

            delete:function(req,res){
                acl.isAllowed(req.decoded.id,'box', 'create', async function(err,aclres){

                    if(aclres){

                        let note = await NoteModule.findOne({_id:req.params.id});
                        if(note.image){
                            await uploadService.deleteNotesModulesFirebaseStorage(note.image.url);
                        }else if(note.audio){
                            await uploadService.deleteNotesModulesFirebaseStorage(note.audio.url);
                        }
                        
                        note.deleteOne().then((module)=>{
                            res.json({
                                success: true,
                                message:module
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

            update: async function (req, res) {
                acl.isAllowed(req.decoded.id, 'box', 'update', async (err, allowed) => {

                if (err) return res.status(500).json({ success: false, message: 'Erreur ACL' });
                if (!allowed) return res.status(401).json({ success: false, message: 'Non autorisé' });

                try {
                    const note = await NoteModule.findById(req.params.noteId);
                    if (!note) return res.status(404).json({ success: false, message: 'Note introuvable' });

                    note.text = req.body.text ?? note.text;
                    note.type = req.body.type ?? note.type;
                    note.dateLastUpdate = new Date();

                    if (req.body.annotationJSON) {
                    try {
                        note.annotationJSON = JSON.parse(req.body.annotationJSON);
                    } catch {
                        note.annotationJSON = req.body.annotationJSON;
                    }
                    }

                    if (req.files?.audio?.[0]) {
                            const audioFile = req.files.audio[0];
                            const audioUrl = await uploadService.uploadNotesModulesToFirebaseStorage(audioFile.filename);
                            note.audio = {
                            url: audioUrl,
                            mime: audioFile.mimetype,
                            duration: req.body.audioDuration || null,
                            };
                    }

                    if (req.files?.image?.[0]) {
                        const imageFile = req.files.image[0];
                        const imageUrl = await uploadService.uploadNotesModulesToFirebaseStorage(imageFile.filename);
                        note.image = {
                            url: imageUrl,
                            width: req.body.imageWidth || null,
                            height: req.body.imageHeight || null,
                        }
                    }

                    await note.save();
                    res.json({ success: true, message: note });

                } catch (error) {
                    console.error(error);
                    res.status(500).json({ success: false, message: 'Erreur lors de la mise à jour' });
                }
                });
            },



        }
     }

})();