(function(){
    "use strict";
    var Chat = require('../models/chatProjets.model').ChatProjetsModel;

    module.exports=function(acl){
        return{

            create:function(req,res){
                acl.isAllowed(req.decoded.id,'box', 'create', async function(err,aclres){
                    if(aclres){

                       let chat = new Chat();
                       chat.message = req.body.message;
                       chat.projet = req.params.id;
                       chat.createdAt = new Date();
                       chat.user = req.decoded.id;
                       chat.isClient = req.body.isClient;
                       chat.isAdmin=req.body.isAdmin;

                       chat.save().then((data)=>{
                        global.socket.broadcast.emit("newProjet_message", data);
                        res.json({
                            success: true,
                            message: data
                          });

                       }).catch((error)=>{
                            return res.status(500).json({
                                success:false,
                                message:error
                            });
                       })
                    }else{
                        return res.status(401).json({
                            success: false,
                            message: "401"
                        });
                    }
                })
            },

            getAllMessageByProjet:function(req,res){
                acl.isAllowed(req.decoded.id,'box', 'create', async function(err,aclres){
                    if(aclres){

                       Chat.find({projet:req.params.id}).populate('user').then((data)=>{
                        res.json({
                            success: true,
                            message: data
                          });

                       }).catch((error)=>{
                            return res.status(500).json({
                                success:false,
                                message:error
                            });
                       })
                    }else{
                        return res.status(401).json({
                            success: false,
                            message: "401"
                        });
                    }
                })  
            },

            getMessageLireClient:function(req,res){
                acl.isAllowed(req.decoded.id,'box', 'create', async function(err,aclres){

                    if(aclres){

                        Chat.countDocuments({isClient:false,projet:req.params.id}).then((data)=>{
                            res.json({
                                success: true,
                                message: data
                            });
                        }).catch((error)=>{
                            return res.status(500).json({
                                success:false,
                                message:error
                            });
                        })
                    }else{
                        return res.status(401).json({
                            success: false,
                            message: "401"
                        });
                    }
                })
            },

            getMessageLireAdmin:function(req,res){
                acl.isAllowed(req.decoded.id,'box', 'create', async function(err,aclres){

                    if(aclres){

                        Chat.countDocuments({isAdmin:false,projet:req.params.id}).then((data)=>{
                            res.json({
                                success: true,
                                message: data
                            });
                        }).catch((error)=>{
                            return res.status(500).json({
                                success:false,
                                message:error
                            });
                        })
                    }else{
                        return res.status(401).json({
                            success: false,
                            message: "401"
                        });
                    }
                })
            },

            updateClientMessage:function(req,res){
                acl.isAllowed(req.decoded.id,'box', 'update', async function(err,aclres){

                    if(aclres){

                        Chat.updateMany(
                            {
                                isClient: false,
                                projet : req.params.id,
                            },
                            {
                                $set: { isClient: true }
                            }
                        )
                        .then(result => {
                            res.json({
                                success: true,
                                message: result
                            });
                        })
                        .catch(err => {
                            return res.status(500).json({
                                success:false,
                                message:err
                            });
                        });

                    }else{
                        return res.status(401).json({
                            success: false,
                            message: "401"
                        });
                    }
                })

            },

            updateAdminMessage:function(req,res){
                acl.isAllowed(req.decoded.id,'box', 'update', async function(err,aclres){

                    if(aclres){

                        Chat.updateMany(
                            {
                                isAdmin: false,
                                projet : req.params.id,
                            },
                            {
                                $set: { isAdmin: true }
                            }
                        )
                        .then(result => {
                            res.json({
                                success: true,
                                message: result
                            });
                        })
                        .catch(err => {
                            return res.status(500).json({
                                success:false,
                                message:err
                            });
                        });

                    }else{
                        return res.status(401).json({
                            success: false,
                            message: "401"
                        });
                    }
                })

            }



        }
    }
})();