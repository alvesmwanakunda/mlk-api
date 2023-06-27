(function(){
    'use strict';
    var User = require('../models/users.model').UserModel;
    var crypto = require('crypto');
    var jwt = require('jsonwebtoken');
    var Encryption = require('../../utils/Encryption');
    var config = require('../../config');
    var Role = require('../models/roles.model');

    module.exports = function(acl){
        return{

            signup:function(req,res){
                var query = {};

                query = {
                    email:req.body.email
                }
                req.body.email = req.body.email
                req.body.role = 'admin';

                var user = new User(req.body);
                User.findOne(query).then((result)=>{
                    if(result){
                        return res.json({
                            success:false,
                            message: "already exists"
                        })
                    } 
                    User.deleteOne(query)
                    .then((result) => {
                        user.password = crypto.createHash('md5').update(user.password).digest("hex");
                        user.save().then((result)=>{
                            res.json({
                                success:true,
                                message:result
                            });
                        }).catch((error)=>{
                            return res.status(500).json({
                                success:false,
                                message: error.message
                            });
                        })
                    })
                    .catch((error) => {
                        return res.status(500).json({
                            success:false,
                            message: error.message
                        });
                    });

                }).catch((error)=>{
                    
                    return res.status(500).json({
                        success:false,
                        message: error.message
                    });
                })
            },

            auth:function(req,res){

                if(!req.body.email){
                    return res.send({
                        success: false,
                        message: "L'authentification a échoué"
                      });
                }
                var query={
                    email:req.body.email,
                    desactive:false,
                    valid:true
                };

                query.password = crypto.createHash('md5').update(req.body.password).digest("hex");

                User.findOne(query).then((user)=>{

                    if(!user){
                        return res.json({
                            success: false,
                            message: "User not found"
                       })
                    }
                    var token = jwt.sign({id:user._id,role:Encryption.encrypt(user.role)}, config.certif,{expiresIn:'1h'});

                    Role.findOne({roles:user.role}).then((role)=>{

                        res.json({
                            success: true,
                            message:{
                                token:token,
                                 user:user,
                            }
                        })

                    }).catch((error)=>{
                        return res.send({
                            success: false,
                            message: error.message
                        });
                    })

                }).catch((error)=>{
                    return res.send({
                        success: false,
                        message: error.message
                    });
                })
            }
        }
    }

})();