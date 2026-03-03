(function(){

    'use strict';
    var Dossier = require('../models/dossiers.model').DossierModel,
        Fichier = require('../models/fichiers.model').FichierModel,
        Module = require('../models/planModule.model').PlanModuleModel,
        Project = require('../models/projets.model').ProjetModel;
        var ObjectId = require('mongoose').Types.ObjectId;
        var fs = require("fs");
        var uploadService = require('../services/upload.service');
        const bucket = require("../../firebase-config").bucket;

    function decodeUtf8(value){
        return Buffer.from(value || "", "latin1").toString("utf8");
    }

    function parseRelativePaths(rawValue){
        if(!rawValue){
            return [];
        }
        if(Array.isArray(rawValue)){
            return rawValue;
        }
        if(typeof rawValue === "string"){
            try{
                const parsed = JSON.parse(rawValue);
                return Array.isArray(parsed) ? parsed : [rawValue];
            }catch(error){
                return [rawValue];
            }
        }
        return [];
    }

    function normalizeRelativePath(path){
        return (path || "").replace(/\\/g, "/").replace(/^\/+|\/+$/g, "");
    }

    function extractFilesPath(pathOrUrl){
        if(!pathOrUrl){
            return null;
        }
        if(pathOrUrl.startsWith("files/")){
            return pathOrUrl;
        }
        try{
            const decoded = decodeURIComponent(pathOrUrl);
            const match = decoded.match(/files\/[^?]+/);
            return match ? match[0] : null;
        }catch(error){
            return null;
        }
    }

    module.exports=function(acl){
    return{
            create:function(req,res){
                acl.isAllowed(req.decoded.id,'box', 'create', async function(err,aclres){

                    if(aclres){

                        //console.log("File", req.files);

                        req.body.creator=req.decoded.id;
                        req.body.date=new Date();
                        req.body.dateLastUpdate=new Date();
                        let profondeur=0;
                        let files = req.files;

                        try {

                            if(!files || files.length===0){
                                return res.status(400).json({
                                    success: false,
                                    message: 'Aucun fichier n\'a été téléchargé.',
                                });
                            }
                            const uploadPromises = files.map(async(file)=>{

                                req.body.size=file.size;
                                let on=file.originalname.split('.');
                                let extension=on[on.length -1];
                                req.body.extension=extension;
                                req.body.nom=Buffer.from(file.filename, 'latin1').toString('utf8');;

                                if(req.body.dossierParent){

                                    const dossier = await  Dossier.findOne({_id:req.body.dossierParent});
                                    if (!dossier) {
                                        return{
                                            success:false,
                                            code:"404",
                                            message:"le dossier parent spécifié est introuvable"
                                        };
                                    }

                                    profondeur=dossier.profondeur+1;
                                }
                                req.body.profondeur=profondeur;
                                let fichier=new Fichier(req.body);
                                const savedFichier = await fichier.save();
                                const downloadUrl = await uploadService.uploadFileToFirebaseStorage(file.filename);
                                const updatedFile = await Fichier.findByIdAndUpdate(savedFichier._id,{chemin:downloadUrl},{new:true});
                                return {
                                    success:true,
                                    message:updatedFile
                                };
                            });
                            Promise.all(uploadPromises)
                            .then((results) => {
                              return res.json({
                                success: true,
                                message: results,
                              });
                            })
                            .catch((error) => {
                              console.error(error);
                              return res.status(500).json({
                                success: false,
                                message: error.message,
                              });
                            });
                        } catch (error) {
                            return res.status(500).json({
                                success:false,
                                message:error
                            })
                        }
                    }else{
                        return res.status(401).json({
                            success: false,
                            message: "401"
                        }); 
                    }
                })
            },

            createProject:function(req,res){
                acl.isAllowed(req.decoded.id,'box', 'create', async function(err,aclres){

                    if(aclres){

                        //console.log("File", req.files);
                        req.body.creator=req.decoded.id;
                        req.body.date=new Date();
                        req.body.dateLastUpdate=new Date();
                        req.body.project=req.params.id;
                        let profondeur=0;
                        let files = req.files;

                        try {

                            if(!files || files.length===0){
                                return res.status(400).json({
                                    success: false,
                                    message: 'Aucun fichier n\'a été téléchargé.',
                                });
                            }
                            const uploadPromises = files.map(async(file)=>{

                                req.body.size=file.size;
                                let on=file.originalname.split('.');
                                let extension=on[on.length -1];
                                req.body.extension=extension;
                                req.body.nom= Buffer.from(file.filename, 'latin1').toString('utf8');
                                //console.log("Origin", file.originalname.split('.'));
                                //console.log("file name",Buffer.from(file.originalname, 'latin1').toString('utf8'));
                                //console.log("file", Buffer.from(file.filename, 'latin1').toString('utf8'));

                                if(req.body.dossierParent){

                                    const dossier = await  Dossier.findOne({_id:req.body.dossierParent});
                                    if (!dossier) {
                                        return{
                                            success:false,
                                            code:"404",
                                            message:"le dossier parent spécifié est introuvable"
                                        };
                                    }

                                    profondeur=dossier.profondeur+1;
                                }
                                req.body.profondeur=profondeur;
                                let fichier=new Fichier(req.body);
                                const savedFichier = await fichier.save();
                                const downloadUrl = await uploadService.uploadFileToFirebaseStorageByProject(file.filename, req.params.id);
                                //const downloadUrl = await uploadService.uploadFileToFirebaseStorage(file.filename);
                                const updatedFile = await Fichier.findByIdAndUpdate(savedFichier._id,{chemin:downloadUrl},{new:true});
                                return {
                                    success:true,
                                    message:updatedFile
                                };
                            });
                            Promise.all(uploadPromises)
                            .then((results) => {
                              return res.json({
                                success: true,
                                message: results,
                              });
                            })
                            .catch((error) => {
                              console.error(error);
                              return res.status(500).json({
                                success: false,
                                message: error.message,
                              });
                            });
                        } catch (error) {
                            return res.status(500).json({
                                success:false,
                                message:error
                            })
                        }
                    }else{
                        return res.status(401).json({
                            success: false,
                            message: "401"
                        }); 
                    }

                   
                })
            },

            createProjectTree:function(req,res){
                acl.isAllowed(req.decoded.id,'box', 'create', async function(err,aclres){
                    if(aclres){
                        const files = req.files || [];
                        const now = new Date();
                        const projectId = req.params.id;
                        try{
                            if(!files.length){
                                return res.status(400).json({
                                    success: false,
                                    message: "Aucun fichier n'a ete telecharge."
                                });
                            }

                            const projet = await Project.findOne({_id: projectId});
                            if(!projet){
                                return res.status(404).json({
                                    success: false,
                                    message: "Projet introuvable."
                                });
                            }

                            const relativePaths = parseRelativePaths(req.body.relativePaths || req.body.relativePath || req.body.paths);

                            let rootParent = null;
                            let rootDepth = 0;
                            if(req.body.dossierParent){
                                rootParent = await Dossier.findOne({_id: req.body.dossierParent, project: projectId});
                                if(!rootParent){
                                    return res.status(404).json({
                                        success: false,
                                        message: "Le dossier parent specifie est introuvable."
                                    });
                                }
                                rootDepth = rootParent.profondeur + 1;
                            }

                            const dossierCache = new Map();

                            const ensureFolder = async (folderName, parentFolder, depth) => {
                                const parentKey = parentFolder ? parentFolder._id.toString() : "root";
                                const cacheKey = `${parentKey}:${folderName}`;
                                if(dossierCache.has(cacheKey)){
                                    return dossierCache.get(cacheKey);
                                }

                                let query = { nom: folderName, project: projectId };
                                if(parentFolder){
                                    query.dossierParent = parentFolder._id;
                                }else{
                                    query.$or = [{ dossierParent: { $exists: false } }, { dossierParent: null }];
                                }

                                let dossier = await Dossier.findOne(query);
                                if(!dossier){
                                    dossier = new Dossier({
                                        nom: folderName,
                                        profondeur: depth,
                                        date: now,
                                        dateLastUpdate: now,
                                        dossierParent: parentFolder ? parentFolder._id : undefined,
                                        creator: req.decoded.id,
                                        project: projectId
                                    });
                                    dossier = await dossier.save();
                                }
                                dossierCache.set(cacheKey, dossier);
                                return dossier;
                            };

                            const results = [];
                            for(let i = 0; i < files.length; i++){
                                const file = files[i];
                                const relativePath = normalizeRelativePath(relativePaths[i] || file.originalname);
                                const segments = relativePath.split("/").filter(Boolean);
                                const folders = segments.slice(0, -1);
                                const fileDisplayName = decodeUtf8(segments.length ? segments[segments.length - 1] : file.originalname);

                                let parentFolder = rootParent;
                                let currentDepth = rootDepth;
                                for(const segment of folders){
                                    parentFolder = await ensureFolder(decodeUtf8(segment), parentFolder, currentDepth);
                                    currentDepth = parentFolder.profondeur + 1;
                                }

                                const extensionParts = file.originalname.split(".");
                                const extension = extensionParts.length > 1 ? extensionParts[extensionParts.length - 1] : "";

                                const storagePath = await uploadService.uploadFileToFirebaseStorageByProject(file.filename, projectId);

                                const createdFile = await new Fichier({
                                    nom: fileDisplayName,
                                    chemin: storagePath,
                                    extension: extension,
                                    profondeur: parentFolder ? parentFolder.profondeur + 1 : rootDepth,
                                    size: file.size,
                                    date: now,
                                    dateLastUpdate: now,
                                    dossierParent: parentFolder ? parentFolder._id : (rootParent ? rootParent._id : undefined),
                                    creator: req.decoded.id,
                                    project: projectId
                                }).save();

                                results.push(createdFile);
                            }

                            return res.json({
                                success: true,
                                message: results
                            });
                        }catch(error){
                            return res.status(500).json({
                                success: false,
                                message: error.message
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

            migrateProjectStoragePaths:function(req,res){
                acl.isAllowed(req.decoded.id,'box', 'update', async function(err,aclres){
                    if(aclres){
                        const projectId = req.params.id;
                        try{
                            const projet = await Project.findOne({_id: projectId});
                            if(!projet){
                                return res.status(404).json({
                                    success: false,
                                    message: "Projet introuvable."
                                });
                            }

                            const projectObjectId = new ObjectId(projectId);
                            const files = await Fichier.collection.find({ project: projectObjectId }).toArray();
                            let migrated = 0;
                            let skipped = 0;
                            let normalized = 0;
                            let failed = 0;
                            const errors = [];

                            for(const file of files){
                                const targetFilename = file.nom;
                                if(!targetFilename){
                                    skipped++;
                                    continue;
                                }

                                try{
                                    const expectedPath = `files/${projectId}/${targetFilename}`;
                                    const currentPath = extractFilesPath(file.chemin);

                                    if(!currentPath){
                                        await Fichier.collection.updateOne(
                                            { _id: file._id },
                                            { $set: { chemin: expectedPath, dateLastUpdate: new Date() } }
                                        );
                                        normalized++;
                                        continue;
                                    }

                                    if(currentPath === expectedPath){
                                        if(file.chemin !== expectedPath){
                                            await Fichier.collection.updateOne(
                                                { _id: file._id },
                                                { $set: { chemin: expectedPath, dateLastUpdate: new Date() } }
                                            );
                                            normalized++;
                                        }else{
                                            skipped++;
                                        }
                                        continue;
                                    }

                                    const newPath = await uploadService.moveFileToExactProjectPath(currentPath, projectId, targetFilename);
                                    if(newPath === currentPath && file.chemin === expectedPath){
                                        skipped++;
                                        continue;
                                    }
                                    await Fichier.collection.updateOne(
                                        { _id: file._id },
                                        { $set: { chemin: expectedPath, dateLastUpdate: new Date() } }
                                    );
                                    migrated++;
                                }catch(error){
                                    failed++;
                                    errors.push({
                                        id: file._id.toString(),
                                        nom: file.nom,
                                        error: error.message
                                    });
                                }
                            }

                            return res.json({
                                success: true,
                                message: {
                                    projectId: projectId,
                                    total: files.length,
                                    migrated: migrated,
                                    normalized: normalized,
                                    skipped: skipped,
                                    failed: failed,
                                    errors: errors
                                }
                            });
                        }catch(error){
                            return res.status(500).json({
                                success: false,
                                message: error.message
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

            renameProjetFile:function(req,res){
                acl.isAllowed(req.decoded.id,'box', 'create', async function(err,aclres){

                    if(aclres){

                        let fichier = await Fichier.findOne({_id:req.params.id});
                        let notfound={
                            success:false,
                            code:"404",
                            message:"le fichier spécifié est introuvable"
                        };
                        if(fichier){
                            req.body.creator=req.decoded.id;
                            req.body.date=new Date();
                            req.body.dateLastUpdate=new Date();

                            
                            try {
                                    const currentPath = extractFilesPath(fichier.chemin) || fichier.nom;
                                    uploadService.renameFileProjetFromFirebaseStorage(currentPath, req.body.nom, fichier.project)
                                    .then((downloadUrl) => {
                                      req.body.chemin=downloadUrl;
                                      Fichier.findByIdAndUpdate({_id:fichier._id}, req.body, { new: true })
                                        .then((updatedFile) => {
                                          res.json({
                                            success: true,
                                            message: updatedFile
                                          });
                                        })
                                        .catch((error) => {
                                          console.error(error);
                                          return res.status(500).json({
                                            success: false,
                                            message: error.message
                                          });
                                        });
                                    });
                                
                            } catch (error) {
                                return res.status(500).json({
                                    success:false,
                                    message:error.message
                                })
                            }


                        }else{
                          res.json(notfound);
                        }  
                    }else{
                        return res.status(401).json({
                            success: false,
                            message: "401"
                        }); 
                    }
                })
            },

            updateProjetFile:function(req,res){
                acl.isAllowed(req.decoded.id,'box', 'create', async function(err,aclres){

                    if(aclres){

                        let fichier = await Fichier.findOne({_id:req.params.id});
                        //console.log("Fichier", fichier);
                        let notfound={
                            success:false,
                            code:"404",
                            message:"le dossier parent spécifié est introuvable"
                        };
                        if(fichier){
                            req.body.creator=req.decoded.id;
                            req.body.date=new Date();
                            req.body.dateLastUpdate=new Date();

                            req.body.size=req.file.size;
                            let on=req.file.originalname.split('.');
                            let extension=on[on.length -1];
                            req.body.extension=extension;
                            req.body.nom=req.file.filename;

                            try {

                                    //const currentPath = extractFilesPath(fichier.chemin) || fichier.nom;
                                    uploadService.deleteFirebaseStorageByProject(fichier.nom, fichier.project);
                                    uploadService.uploadFileToFirebaseStorageByProject(req.file.filename, fichier.project)
                                    .then((downloadUrl) => {
                                      req.body.chemin=downloadUrl;
                                      Fichier.findByIdAndUpdate({_id:fichier._id}, req.body, { new: true })
                                        .then((updatedFile) => {
                                          res.json({
                                            success: true,
                                            message: updatedFile
                                          });
                                        })
                                        .catch((error) => {
                                          console.error(error);
                                          return res.status(500).json({
                                            success: false,
                                            message: error.message
                                          });
                                        });
                                    });
                                
                            } catch (error) {
                                return res.status(500).json({
                                    success:false,
                                    message:error.message
                                })
                            }


                        }else{
                          res.json(notfound);
                        }  
                    }else{
                        return res.status(401).json({
                            success: false,
                            message: "401"
                        }); 
                    }
                })
            },

            deleteProjetFile(req,res){
                acl.isAllowed(req.decoded.id,'box', 'delete', async function(err,aclres){

                    if(aclres){

                        let fichier = await Fichier.findOne({_id:req.params.id});
                        //const currentPath = extractFilesPath(fichier.chemin) || fichier.nom;
                        await uploadService.deleteFirebaseStorageByProject(fichier.nom,fichier.project);
                        fichier.deleteOne().then((data)=>{
                            res.json({
                                success: true,
                                message:data
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

            donwloadProjetFile:function(req,res){

                acl.isAllowed(req.decoded.id,'box', 'create', async function(err,aclres){

                    if(aclres){
                        let fichier = await Fichier.findOne({_id:req.params.id});
                        try {
                            const storagePath = extractFilesPath(fichier.chemin) || `files/${fichier.project}/${fichier.nom}`;
                            const file = bucket.file(storagePath);
                            const [fileStream] = await file.createReadStream();
                            res.set('Content-Disposition', `attachment; filename="${fichier.nom}"`);
                            fileStream.pipe(res);
                        } catch (error) {
                            console.error('Erreur lors de la récupération du fichier :', error);
                            res.status(500).send('Erreur lors de la récupération du fichier');
                        }
                    }else{
                        return res.status(401).json({
                            success: false,
                            message: "401"
                        });  
                    }

                })

            },
            // Fin

            renameFile:function(req,res){
                acl.isAllowed(req.decoded.id,'box', 'create', async function(err,aclres){

                    if(aclres){

                        let fichier = await Fichier.findOne({_id:req.params.id});
                        let notfound={
                            success:false,
                            code:"404",
                            message:"le fichier spécifié est introuvable"
                        };
                        if(fichier){
                            req.body.creator=req.decoded.id;
                            req.body.date=new Date();
                            req.body.dateLastUpdate=new Date();

                            
                            try {
                                    uploadService.renameFileFromFirebaseStorage(fichier.nom, req.body.nom)
                                    .then((downloadUrl) => {
                                      req.body.chemin=downloadUrl;
                                      Fichier.findByIdAndUpdate({_id:fichier._id}, req.body, { new: true })
                                        .then((updatedFile) => {
                                          res.json({
                                            success: true,
                                            message: updatedFile
                                          });
                                        })
                                        .catch((error) => {
                                          console.error(error);
                                          return res.status(500).json({
                                            success: false,
                                            message: error.message
                                          });
                                        });
                                    });
                                
                            } catch (error) {
                                return res.status(500).json({
                                    success:false,
                                    message:error.message
                                })
                            }


                        }else{
                          res.json(notfound);
                        }  
                    }else{
                        return res.status(401).json({
                            success: false,
                            message: "401"
                        }); 
                    }
                })
            },

            update:function(req,res){
                acl.isAllowed(req.decoded.id,'box', 'create', async function(err,aclres){

                    if(aclres){

                        let fichier = await Fichier.findOne({_id:req.params.id});
                        let notfound={
                            success:false,
                            code:"404",
                            message:"le dossier parent spécifié est introuvable"
                        };
                        if(fichier){
                            req.body.creator=req.decoded.id;
                            req.body.date=new Date();
                            req.body.dateLastUpdate=new Date();

                            req.body.size=req.file.size;
                            let on=req.file.originalname.split('.');
                            let extension=on[on.length -1];
                            req.body.extension=extension;
                            req.body.nom=req.file.filename;

                            try {

                                    uploadService.deleteFirebaseStorage(fichier.nom);
                                    uploadService.uploadFileToFirebaseStorage(req.file.filename)
                                    .then((downloadUrl) => {
                                      req.body.chemin=downloadUrl;
                                      Fichier.findByIdAndUpdate({_id:fichier._id}, req.body, { new: true })
                                        .then((updatedFile) => {
                                          res.json({
                                            success: true,
                                            message: updatedFile
                                          });
                                        })
                                        .catch((error) => {
                                          console.error(error);
                                          return res.status(500).json({
                                            success: false,
                                            message: error.message
                                          });
                                        });
                                    });
                                
                            } catch (error) {
                                return res.status(500).json({
                                    success:false,
                                    message:error.message
                                })
                            }


                        }else{
                          res.json(notfound);
                        }  
                    }else{
                        return res.status(401).json({
                            success: false,
                            message: "401"
                        }); 
                    }
                })
            },
            /*update:function(req,res){
                acl.isAllowed(req.decoded.id,'box', 'create', async function(err,aclres){

                    if(aclres){

                        let fichier = await Fichier.findOne({_id:req.params.id});

                        req.body.creator=req.decoded.id;
                        req.body.date=new Date();
                        req.body.dateLastUpdate=new Date();
                        let profondeur=0;

                        req.body.size=req.file.size;
                        let on=req.file.originalname.split('.');
                        let extension=on[on.length -1];
                        req.body.extension=extension;
                        req.body.nom=req.file.filename;

                        try {

                            let path="./public/"+req.file.filename;
                            if(req.body.dossierParent){

                                let notfound={
                                    success:false,
                                    code:"404",
                                    message:"le dossier parent spécifié est introuvable"
                                };

                                Dossier.findOne({_id:req.body.dossierParent}).then((data)=>{

                                    if(!data){
                                        res.json(notfound);
                                    }
                                    profondeur=data.profondeur+1;
                                    req.body.profondeur=profondeur;

                                    Fichier.findOneAndUpdate({_id:req.params.id},req.body,new true).then((data)=>{

                                        uploadService.uploadFileToFirebaseStorage(req.file.filename)
                                        .then((downloadUrl) => {
                                          Fichier.findByIdAndUpdate(data._id, { chemin: downloadUrl }, { new: true })
                                            .then((updatedFile) => {
                                             uploadService.deleteFirebaseStorage(fichier.nom).then((data)=>{})
                                              res.json({
                                                success: true,
                                                message: updatedFile
                                              });
                                            })
                                            .catch((error) => {
                                              console.error(error);
                                              return res.status(500).json({
                                                success: false,
                                                message: error.message
                                              });
                                            });
                                        });
                                    }).catch((error)=>{
                                        return res.status(500).json({
                                            success:false,
                                            message:error.message
                                        })
                                    })
                                }).catch((error)=>{
                                    return res.status(500).json({
                                        success:false,
                                        message:error.message
                                    })
                                })
                            }else{
                                req.body.profondeur=profondeur;
                                Fichier.findOneAndUpdate({_id:req.params.id},req.body,new true).then((data)=>{
                                    uploadService.uploadFileToFirebaseStorage(req.file.filename)
                                        .then((downloadUrl) => {
                                          Fichier.findByIdAndUpdate(data._id, { chemin: downloadUrl }, { new: true })
                                            .then((updatedFile) => {
                                              uploadService.deleteFirebaseStorage(fichier.nom).then((data)=>{})  
                                              res.json({
                                                success: true,
                                                message: updatedFile
                                              });
                                            })
                                            .catch((error) => {
                                              console.error(error);
                                              return res.status(500).json({
                                                success: false,
                                                message: error.message
                                              });
                                            });
                                        });
                                }).catch((error)=>{
                                    return res.status(500).json({
                                        success:false,
                                        message:error.message
                                    })
                                })
                            }

                        } catch (error) {
                            return res.status(500).json({
                                success:false,
                                message:error
                            })
                        }
                    }else{
                        return res.status(401).json({
                            success: false,
                            message: "401"
                        }); 
                    }
                })
            },*/
            
            delete(req,res){
                acl.isAllowed(req.decoded.id,'box', 'delete', async function(err,aclres){

                    if(aclres){

                        let fichier = await Fichier.findOne({_id:req.params.id});
                        await uploadService.deleteFirebaseStorage(fichier.nom);
                        fichier.deleteOne().then((data)=>{
                            res.json({
                                success: true,
                                message:data
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

            read:function(req,res){
                acl.isAllowed(req.decoded.id,'box', 'create', async function(err,aclres){

                    if(aclres){

                        let fichier = await Fichier.findOne({_id:req.params.id});
                        if(!fichier){
                            return res.status(404).json({
                                success: false,
                                message: '404'
                              });
                        }else{
                            return res.json({
                                success: true,
                                message: fichier
                            })
                        }
                    }else{
                        return res.status(401).json({
                            success: false,
                            message: "401"
                        }); 
                    }
                })
            },

            donwload:function(req,res){

                acl.isAllowed(req.decoded.id,'box', 'create', async function(err,aclres){

                    if(aclres){
                        let fichier = await Fichier.findOne({_id:req.params.id});
                        try {
                            console.log("chemin",`files/${fichier.nom}`)
                            const file = bucket.file(`files/${fichier.nom}`);
                            const [fileStream] = await file.createReadStream();
                            res.set('Content-Disposition', `attachment; filename="${fichier.nom}"`);
                            fileStream.pipe(res);
                        } catch (error) {
                            console.error('Erreur lors de la récupération du fichier :', error);
                            res.status(500).send('Erreur lors de la récupération du fichier');
                        }
                    }else{
                        return res.status(401).json({
                            success: false,
                            message: "401"
                        });  
                    }

                })

            },

            moveFile:function(req,res){
                acl.isAllowed(req.decoded.id,'box', 'create', async function(err,aclres){
                    if(aclres){
                        let file = await Fichier.findOne({_id:req.params.id});
                        let parent = await Dossier.findOne({_id:req.params.parent});
                        if(parent){
                         file.dossierParent = parent._id;
                         file.profondeur = parent.profondeur + 1;

                         Fichier.findOneAndUpdate({_id:req.params.id},file,{new:true}).then((data)=>{
                             return res.json({
                                 success : true,
                                 message:data
                             })
                         }).catch((error)=>{
                             return res.status(500).json({
                                 success:false,
                                 message:error.message
                             })
                         })

                        }
                 }else{
                     return res.status(401).json({
                         success: false,
                         message: "401"
                     });
                 }

                })
            },

            openAllFile:function(req,res){
                acl.isAllowed(req.decoded.id,'box', 'create', async function(err,aclres){
                    if(aclres){
                        const filePath = decodeURIComponent(req.params.url); // Décoder l'URL
                        //console.log('Chemin du fichier:', filePath);
                        const downloadUrl = await uploadService.getSignedUrl(filePath);
                        res.json({
                            success: true,
                            message:downloadUrl
                        });
                    }else{
                        return res.status(401).json({
                            success: false,
                            message: "401"
                        });
                    }
                })
            },

        
  
        // Fonction pour extraire le chemin "files/nom_fichier.png" depuis l'URL complète
        // Mise à jour des documents dans MongoDB
         updatePhotoPaths: async function() {
            try {
            // Récupérer tous les projets avec un champ photo
            const projets = await Module.find({ chemin: { $exists: true, $ne: null } });
        
            for (let projet of projets) {
                const newPath = uploadService.extractFilePath(projet.chemin);
                if (newPath) {
                await Module.updateOne({ _id: projet._id }, { $set: { chemin: newPath } });
                console.log(`Mise à jour de l'ID ${projet._id} avec ${newPath}`);
                }
            }
        
            console.log("Mise à jour terminée !");
            } catch (error) {
            console.error("Erreur lors de la mise à jour :", error);
            } 
        }
    }
    }

})();
