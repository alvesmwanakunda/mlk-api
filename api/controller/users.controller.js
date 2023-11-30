(function(){
    'use strict';
    var User = require('../models/users.model').UserModel;
    var Entreprise = require('../models/entreprises.model').EntrepriseModel;
    var crypto = require('crypto');
    var jwt = require('jsonwebtoken');
    var Encryption = require('../../utils/Encryption');
    var config = require('../../config');
    var Role = require('../models/roles.model');
    var mailService = require('../services/mail.service');
    var Codes = require('voucher-code-generator');
    var ObjectId = require('mongoose').Types.ObjectId;
    var prestashopService = require('../services/prestashop.service');


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
                        //prestashopService.getClient();
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
            },
            resetPassword:function(req,res){

                User.findOne({email:req.body.email}).then((user)=>{

                    if(!user){
                        return res.json({
                            success:false,
                            message: "notfound"
                        });
                    }else{
                        var code = Codes.generate({
                            length:128,
                            count:1,
                            charset:Codes.charset("alphanumeric")
                        });
                        code = code[0];
                        user.code = code;
                        user.save().then((user)=>{
                            mailService.reset(user);
                            res.json({
                                success:true,
                                message:"ok"
                            });
                        }).catch((error)=>{
                            return res.status(500).json({
                                success:false,
                                message: error.message
                            }); 
                        })

                    }

                }).catch((error)=>{
                    return res.status(500).json({
                        success:false,
                        message: error.message
                    });
                })
            },
            changePassword:function(req,res){
                User.findOne({
                    email:req.body.email,
                    code:req.body.code
                }).then((user)=>{

                    if(!user){
                        return res.json({
                            success:false,
                            message: "notfound"
                        });
                    }else{
                       user.code="",
                       user.password = crypto.createHash('md5').update(req.body.password).digest("hex");
                       user.save().then((user)=>{
                        res.json({
                            success:true,
                            message:user
                        });
                    }).catch((error)=>{
                        return res.status(500).json({
                            success:false,
                            message: error.message
                        }); 
                    })
                       

                    }
                }).catch((error)=>{
                    return res.status(500).json({
                        success:false,
                        message: error.message
                    }); 
                })
            },
            signupUser:function(req,res){

                let gender='';

                var query = {email:req.body.email}
                var entreprise = new Entreprise();
                entreprise.societe = req.body.societe;
                entreprise.nom= req.body.nom;
                entreprise.prenom= req.body.prenom;
                entreprise.email = req.body.email;
                entreprise.genre= req.body.genre;
                entreprise.siret= req.body.siret;
                entreprise.postal= req.body.postal;
                entreprise.rue= req.body.rue;
                entreprise.numero= req.body.numero;
                entreprise.adresse= req.body.adresse;
                entreprise.indicatif = req.body.indicatif;
                entreprise.telephone = req.body.telephone;
                entreprise.pays = req.body.pays;

               

                var user = new User();
                user.email = req.body.email;
                user.nom = req.body.nom;
                user.prenom = req.body.prenom;
                user.role = "user";
                user.valid = true;

                if(req.body.genre=='Mr'){
                    gender=1;
                    user.genre = "Mr"
                }else{
                    gender=2;
                    user.genre = "Mlle"
                }

                let payload={
                    lastname: req.body.nom,
                    firstname: req.body.prenom,
                    email : req.body.email,
                    active:"1",
                    company:req.body.societe,
                    siret: req.body.siret,
                    passwd: req.body.password,
                    id_gender:gender,
                    id_default_group:3,
                    phone:req.body.indicatif+""+req.body.telephone
                };
                let adresse={
                    id_country:8,
                    alias:req.body.prenom+""+req.body.nom,
                    lastname: req.body.nom,
                    firstname: req.body.prenom,
                    adress1:req.body.rue+" "+req.body.numero,
                    postcode:req.body.postal,
                    phone:req.body.indicatif+""+req.body.telephone,
                    city:req.body.adresse,
                    company:req.body.societe,
                }

                User.findOne(query).then((result)=>{
                    if(result){
                        return res.json({
                            success:false,
                            message: "already exists"
                        })
                    }else{
                         entreprise.save().then((entreprise)=>{
                          //console.log("Entreprise", entreprise);  
                          user.entreprise=new ObjectId(entreprise._id);
                          user.password = crypto.createHash('md5').update(req.body.password).digest("hex");
                          user.save().then((result)=>{
                                    mailService.signup(result);
                                    prestashopService.addClient(payload,adresse);
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
                         }).catch((error)=>{
                            return res.status(500).json({
                                success:false,
                                message: error.message
                            })
                         })
                    } 
                }).catch((error)=>{
                    
                    return res.status(500).json({
                        success:false,
                        message: error.message
                    });
                })
            },
            userExist:function(req,res){

                var query={email : req.params.email};
                User.findOne(query).then((result)=>{
                    if(result){
                        return res.json({
                            exists:true,
                        })
                    }else{
                        return res.json({
                            exists:false,
                        }) 
                    } 
                }).catch((error)=>{
                    return res.status(500).json({
                        success:false,
                        message: error.message
                    });
                })
            },
            updateProfil(req,res){
                acl.isAllowed(req.decoded.id,'projets', 'create', async function(err,aclres){
                    if(aclres){

                        User.findOneAndUpdate({_id:req.decoded.id},req.body,{new:true}).then((user)=>{
                            res.json({
                                success:true,
                                message:user
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
            }
        }
    }

})();