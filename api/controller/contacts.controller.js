(function(){
    "use strict";
    var Contact = require("../models/contacts.model").ContactModel;
    var Projet = require("../models/projets.model").ProjetModel;

    module.exports = function(acl){

        return{

            addContact(req,res){
                acl.isAllowed(req.decoded.id,'projets', 'create', async function(err,aclres){
                    if(aclres){
                      
                        var contact = new Contact(req.body);
                        contact.createdDate = new Date();

                            contact.save().then((contact)=>{
                                res.json({
                                    success:true,
                                    message:contact
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

            addContactToProjet(req,res){
                acl.isAllowed(req.decoded.id,'projets', 'create', async function(err,aclres){
                    if(aclres){
                      
                        var contact = await Contact.findOne({_id:req.params.id});
                        var projet = await Projet.findOne({_id:req.body.entreprise});

                        if(entreprise && contact){

                            Contact.findByIdAndUpdate({_id:contact._id},{$pull:{projet:projet._id}},{new:true}).then((contact)=>{
                                res.json({
                                    success:true,
                                    message:contact
                                });
    
                            }).catch((error)=>{
                                return res.status(500).json({
                                    success:false,
                                    message:error.message
                                })
                            })

                        }else{
                            return res.json({
                                success:false,
                                message:"Entreprise not found"
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

            updateContact(req,res){
                acl.isAllowed(req.decoded.id,'projets', 'update', async function(err,aclres){
                    if(aclres){
                        Contact.findOneAndUpdate({_id:req.params.id},req.body,{new:true}).then((contact)=>{
                            res.json({
                                success:true,
                                message:contact
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

            deleteContact(req,res){
                acl.isAllowed(req.decoded.id,'projets', 'delete', async function(err,aclres){

                    if(aclres){

                        let contact = await Contact.findOne({_id:req.params.id});
                        contact.deleteOne().then((contact)=>{
                            res.json({
                                success: true,
                                message:contact
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

            getAllContact(req,res){
                acl.isAllowed(req.decoded.id,'projets', 'retreive', async function(err,aclres){

                    if(aclres){
                        Contact.find()
                        .populate({ path: "entreprise", select: "_id nom" })
                        .populate({ path: "projet", select: "_id nom" })
                        .then((contacts)=>{
                            res.json({
                                success: true,
                                message:contacts
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

            getContact(req,res){
                acl.isAllowed(req.decoded.id,'projets', 'retreive', async function(err,aclres){

                    if(aclres){
                        Contact.findOne({_id:req.params.id}).then((contact)=>{
                            res.json({
                                success: true,
                                message:contact
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

            getAllContactByProjet(req,res){
                acl.isAllowed(req.decoded.id,'projets', 'retreive', async function(err,aclres){

                    if(aclres){
                        Contact.find({projet:req.params.id})
                        .populate({ path: "entreprise", select: "_id nom" })
                        .populate({ path: "projet", select: "_id nom" })
                        .then((contact)=>{
                            res.json({
                                success: true,
                                message:contact
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

            getAllContactByEntreprise(req,res){
                acl.isAllowed(req.decoded.id,'projets', 'retreive', async function(err,aclres){

                    if(aclres){
                        Contact.find({entreprise:req.params.id})
                        .populate({ path: "entreprise", select: "_id nom" })
                        .populate({ path: "projet", select: "_id nom" })
                        .then((contact)=>{
                            res.json({
                                success: true,
                                message:contact
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
})();