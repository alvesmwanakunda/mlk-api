(function(){
    "use strict";
    var Chat = require('../models/chat.model').ChatModel;

    module.exports=function(acl){

        return{

            create:function(req,res){
                acl.isAllowed(req.decoded.id,'box', 'create', async function(err,aclres){
                    if(aclres){

                       let chat = new Chat();
                       chat.message = req.body.message;
                       chat.createdAt = new Date();
                       chat.senderId = req.decoded.id;
                       chat.isRead = true;
                       chat.isReadAdmin = false;
                       chat.isAdmin=false;

                       chat.save().then((data)=>{
                        global.socket.broadcast.emit("new_message", data);
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

            response:function(req,res){
                acl.isAllowed(req.decoded.id,'box', 'create', async function(err,aclres){
                    if(aclres){

                       let chat = new Chat();
                       chat.message = req.body.message;
                       chat.createdAt = new Date();
                       chat.senderId = req.params.id;
                       chat.isRead = false;
                       chat.isReadAdmin = true;
                       chat.isAdmin=true;
                       chat.receviedId = req.decoded.id;

                       chat.save().then((data)=>{
                        global.socket.broadcast.emit("response_message", data);
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

            getAllMessageByClient:function(req,res){
                acl.isAllowed(req.decoded.id,'box', 'create', async function(err,aclres){
                    if(aclres){

                       Chat.find({senderId:req.decoded.id}).populate('senderId').populate('receviedId').then((data)=>{
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

            allMessageAdminByClient:function(req,res){
                acl.isAllowed(req.decoded.id,'box', 'create', async function(err,aclres){
                    if(aclres){

                       Chat.find({senderId:req.params.id}).populate('senderId').populate('receviedId').then((data)=>{
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

            getAllMessageSender:function(req,res){
                acl.isAllowed(req.decoded.id,'box', 'create', async function(err,aclres){

                    if(aclres){

                        Chat.aggregate([
                            {
                                $group: {
                                    _id: "$senderId",
                                    number: {
                                        $sum: {
                                            $cond: {
                                                if: { $eq: ["$isReadAdmin", false] },
                                                then: 1,
                                                else: 0
                                            }
                                        }
                                    }
                                }
                            },
                            {
                                $lookup: {
                                    from: "users", // Le nom de votre collection Users
                                    localField: "_id",
                                    foreignField: "_id",
                                    as: "user"
                                }
                            },
                            {
                                $unwind: {
                                    path: "$user",
                                    preserveNullAndEmptyArrays: true
                                }
                            },
                            {
                                $project: {
                                    senderId: "$_id",
                                    _id: 0,
                                    nom: { $ifNull: ["$user.nom", "Unknown"] },
                                    prenom: { $ifNull: ["$user.prenom", "Unknown"] },
                                    user:"$user._id",
                                    number: 1
                                }
                            },
                            {
                                $sort: {
                                    number: 1 // 1 pour trier par ordre croissant, -1 pour décroissant
                                }
                            }
                        ]).then((data) => {
                            res.json({
                                success: true,
                                message: data
                            });
                        }).catch((error) => {
                            return res.status(500).json({
                                success: false,
                                message: error
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

            getNumberMessageNonLus:function(req,res){
                acl.isAllowed(req.decoded.id,'box', 'create', async function(err,aclres){

                    if(aclres){

                        Chat.countDocuments({isRead:false, senderId:req.decoded.id}).then((data)=>{
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

            getNumberMessageNonLusAdmin:function(req,res){
                acl.isAllowed(req.decoded.id,'box', 'create', async function(err,aclres){

                    if(aclres){

                        Chat.countDocuments({isReadAdmin:false}).then((data)=>{
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
                                isRead: false,
                                senderId: req.decoded.id
                            },
                            {
                                $set: { isRead: true }
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
                                isReadAdmin: false,
                                senderId: req.params.id
                            },
                            {
                                $set: { isReadAdmin: true }
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