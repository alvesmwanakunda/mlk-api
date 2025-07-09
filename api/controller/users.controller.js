(function(){
    'use strict';
    var User = require('../models/users.model').UserModel;
    var Entreprise = require('../models/entreprises.model').EntrepriseModel;
    var Contact = require('../models/contacts.model').ContactModel;
    var crypto = require('crypto');
    var jwt = require('jsonwebtoken');
    var Encryption = require('../../utils/Encryption');
    var config = require('../../config');
    var Role = require('../models/roles.model');
    var mailService = require('../services/mail.service');
    var Codes = require('voucher-code-generator');
    var ObjectId = require('mongoose').Types.ObjectId;
    var prestashopService = require('../services/prestashop.service');
    var odooService = require('../services/odoo.service');
    var codes = require('voucher-code-generator');
    var userService = require('../services/user.service');
    const speakeasy = require('speakeasy');
    const QRCode = require('qrcode');

    const { OAuth2Client } = require('google-auth-library');
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);




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

                    Role.findOne({roles:user.role}).then( async (role)=>{
                        //prestashopService.getClient();
                        if(user.twoFactorEnabled && user.twoFactorType == "email"){
                            var code = Math.floor(100000 + Math.random() * 900000);
                            user.code = code;
                            user.codeExpiration = new Date(Date.now() + 10 * 60 * 1000);
                            await user.save();
                            mailService.mailCodeAuthentication(user, user.code);
                        }
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
                        if(user.role=="user"){
                            prestashopService.updatePasswordClient(user.email,req.body.password);
                            prestashopService.updatePasswordClientLocation(user.email,req.body.password);
                            odooService.updateUserPassword(req.body.password,user.email);
                        }
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

                /*var password = codes.generate({
                    length: 9,
                    count: 1,
                    charset: "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"
                });
                password = password[0];*/

                var password = req.body.password;

                var user = new User();
                user.email = req.body.email;
                user.nom = req.body.nom;
                user.prenom = req.body.prenom;
                user.role = "user";
                user.valid = true;
                user.password = req.body.password;

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
                    passwd: password,
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
                    city:req.body.rue,
                    company:req.body.societe,
                }

                let payloadOdoo={
                    'name': req.body.societe,
                    'company_type':"company",//req.body.company, // Type de l'entreprise
                    'is_company': true, // Indique qu'il s'agit d'une entreprise
                    'street': req.body.rue+" "+req.body.numero,
                    'city': req.body.rue,
                    'zip': req.body.postal,
                    'country_id': false, // ID du pays (peut être défini si nécessaire)
                    'phone': req.body.indicatif+""+req.body.telephone,
                    'email': req.body.email,
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
                          user.password = crypto.createHash('md5').update(password).digest("hex");
                          user.save().then((result)=>{
                                    mailService.signup(result, password);
                                    prestashopService.addClient(payload,adresse);
                                    prestashopService.addClientLocation(payload,adresse);
                                    odooService.addCompany(payloadOdoo,entreprise);
                                    res.json({
                                        success:true,
                                        message:result,
                                        signature:password
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

            signupUserParticulier:function(req,res){

                let gender='';

                var query = {email:req.body.email}

                var password = req.body.password;

                var user = new User();
                user.email = req.body.email;
                user.nom = req.body.nom;
                user.prenom = req.body.prenom;
                user.role = "user";
                user.valid = false;
                user.password = password;
                user.isPerson = true;

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
                    passwd: password,
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
                    city:req.body.rue,
                }

                let payloadOdoo={
                    'name': req.body.prenom+" "+req.body.nom,
                    'company_type':"person", // Type de l'entreprise
                    'is_company': false, // Indique qu'il s'agit d'une entreprise
                    'street': req.body.rue+" "+req.body.numero,
                    'city': req.body.rue,
                    'zip': req.body.postal,
                    'country_id': false, // ID du pays (peut être défini si nécessaire)
                    'phone': req.body.indicatif+""+req.body.telephone,
                    'email': req.body.email,
                }

                User.findOne(query).then((result)=>{
                    if(result){
                        return res.json({
                            success:false,
                            message: "already exists"
                        })
                    }else{
                        user.password = crypto.createHash('md5').update(password).digest("hex");
                        user.save().then((result)=>{
                            mailService.signupParticulier(result, password);
                            prestashopService.addClient(payload,adresse);
                            prestashopService.addClientLocation(payload,adresse);
                            odooService.addPerson(payloadOdoo);
                            res.json({
                                success:true,
                                message:result,
                                signature:password
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

                        let user = User.findOne({_id:req.decoded.id});
                        if(user){
                            let contact = await Contact.findOne({email:user.email});
                            let payload={
                                'name':req.body.prenom+" "+req.body.nom,
                             };
                             
                            User.findOneAndUpdate({_id:req.decoded.id},req.body,{new:true}).then(async (user)=>{
                                if(user.role=='user'){
                                    if(req.body.nom!=contact.nom || req.body.prenom!=contact.prenom  || req.body.phone!=contact.phone){
                                        contact.nom=req.body.nom;
                                        contact.prenom=req.body.prenom;
                                        if(req.body.phone){
                                            contact.phone=req.body.phone;
                                            payload.phone = contact.indicatif + "" + req.body.phone;
                                        };
                                        await Contact.findOneAndUpdate({_id:contact._id},contact,{new:true});
                                        odooService.update(payload,contact);
                                        prestashopService.update(req.body.nom, req.body.prenom, contact.email);
                                        prestashopService.updateLocation(req.body.nom, req.body.prenom, contact.email);
                                     }
                                 }
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

                        }
                    }else{
                        return res.status(401).json({
                            success: false,
                            message: "401"
                        }); 
                    }
                })
            },
            updateIdPhone(req,res){
                acl.isAllowed(req.decoded.id,'projets', 'create', async function(err,aclres){
                    if(aclres){

                        let user = User.findOne({_id:req.decoded.id});
                        if(user){ 
                            User.findOneAndUpdate({_id:req.decoded.id},req.body,{new:true}).then(async (user)=>{
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
                        }
                    }else{
                        return res.status(401).json({
                            success: false,
                            message: "401"
                        }); 
                    }
                })
            },

            updatePassword(req,res){
                acl.isAllowed(req.decoded.id,'projets', 'create', async function(err,aclres){
                    if(aclres){

                        let user = await User.findOne({_id:req.decoded.id});
                        user.password = crypto.createHash('md5').update(req.body.password).digest("hex");
                    
                        User.findOneAndUpdate({_id:req.decoded.id},user,{new:true}).then((user)=>{

                            if(user.role=="user"){
                                prestashopService.updatePasswordClient(user.email,req.body.password);
                                prestashopService.updatePasswordClientLocation(user.email,req.body.password);
                                odooService.updateUserPassword(req.body.password,user.email);
                            }
                           
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
            },
            // Text odoo
            addCompany:function(req,res){

                let payload={
                    name: req.body.name,
                    street: req.body.street,
                    city:req.body.city,
                    country_id: false,
                };
                odooService.addCompany(payload);
                res.json({
                    success:true,
                    message:payload
                });
            },

            allUser:async function(req,res){

                let user = await odooService.getAllUser();
                res.json({
                    success:true,
                    message:user
                });
            },

            addTransporteur(req,res){
                acl.isAllowed(req.decoded.id,'projets', 'create', async function(err,aclres){
                    if(aclres){
                            let password="mlka@2024";
                            var user = new User();
                            user.email = req.body.email;
                            user.nom = req.body.nom;
                            user.prenom = req.body.prenom;
                            user.role = "transporteur";
                            user.valid = true;
                            var query = {email:req.body.email};

                            User.findOne(query).then((result)=>{
                                if(result){
                                    return res.json({
                                        success:false,
                                        message: "already exists"
                                    })
                                } 
                                User.deleteOne(query)
                                .then((result) => {
                                    user.password = crypto.createHash('md5').update(password).digest("hex");
                                    user.save().then((result)=>{
                                        //mailService.signup(result, password);
                                        res.json({
                                            success:true,
                                            user:result
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
                    }else{
                        return res.status(401).json({
                            success: false,
                            message: "401"
                        }); 
                    }
                })
            },

            addEmploye(req,res){
                acl.isAllowed(req.decoded.id,'projets', 'create', async function(err,aclres){
                    if(aclres){


                            let password="mlka@2024";
                            var user = new User();
                            user.email = req.body.email;
                            user.nom = req.body.nom;
                            user.prenom = req.body.prenom;
                            user.type_contrat = req.body.type_contrat;
                            user.heure = req.body.heure;
                            user.role = "agent";
                            user.valid = true;
                            var query = {email:req.body.email};

                            User.findOne(query).then((result)=>{
                                if(result){
                                    return res.json({
                                        success:false,
                                        message: "already exists"
                                    })
                                } 
                                User.deleteOne(query)
                                .then((result) => {
                                    user.password = crypto.createHash('md5').update(password).digest("hex");
                                    user.save().then((result)=>{
                                        mailService.signup(result, password);
                                        res.json({
                                            success:true,
                                            user:result
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
                    }else{
                        return res.status(401).json({
                            success: false,
                            message: "401"
                        }); 
                    }
                })
            },

            updateEmploye(req,res){
                acl.isAllowed(req.decoded.id,'projets', 'create', async function(err,aclres){
                    if(aclres){
                        User.findOneAndUpdate({_id:req.params.id},req.body,{new:true}).then((contact)=>{
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

            dissableEmploye(req,res){
                acl.isAllowed(req.decoded.id,'projets', 'create', async function(err,aclres){
                    if(aclres){
                        User.findOneAndUpdate({_id:req.params.id},{valid:false},{new:true}).then((contact)=>{
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

            activeEmploye(req,res){
                acl.isAllowed(req.decoded.id,'projets', 'create', async function(err,aclres){
                    if(aclres){
                        User.findOneAndUpdate({_id:req.params.id},{valid:true},{new:true}).then((contact)=>{
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

            allEmploye(req,res){
                acl.isAllowed(req.decoded.id,'projets', 'create', async function(err,aclres){
                    if(aclres){
                        User.find({role:"agent"}).then((contact)=>{
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

            allTransporteur(req,res){
                acl.isAllowed(req.decoded.id,'projets', 'create', async function(err,aclres){
                    if(aclres){
                        User.find({role:"transporteur"}).then((contact)=>{
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

            getEmploye(req,res){
                acl.isAllowed(req.decoded.id,'projets', 'create', async function(err,aclres){
                    if(aclres){
                        User.findOne({_id:req.params.id}).then((contact)=>{
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

            googleAuth:async function(req,res){
                const { credential } = req.body;
                try {
                    // Vérification du token auprès de Google
                    const ticket = await client.verifyIdToken({
                        idToken: credential,
                        audience: process.env.GOOGLE_CLIENT_ID,
                    });
                    const payload = ticket.getPayload();

                    if(payload.email_verified){
                        const values = {
                            prenom: payload.given_name,
                            nom: payload.family_name,
                            source_id: payload.sub,
                            source: "google"
                        }
                        const query={
                            email:payload.email,
                            desactive:false,
                            valid:true
                        };
                        let user = await User.findOneAndUpdate(query,values,{new:true})
                        .then( async (user)=>{
                            if(!user){
                                return res.status(404).json({
                                    success: false,
                                    message: "User not found",
                                });
                            }else{
                                var token = jwt.sign({id:user._id,role:Encryption.encrypt(user.role)}, config.certif,{expiresIn:'7d'});

                                if(user.twoFactorEnabled && user.twoFactorType == "email"){
                                    var code = Math.floor(100000 + Math.random() * 900000);
                                    user.code = code;
                                    user.codeExpiration = new Date(Date.now() + 10 * 60 * 1000);
                                    await user.save();
                                    mailService.mailCodeAuthentication(user, user.code);
                                }
                                return res.status(200).json({
                                    success: true,
                                    message:{
                                        token:token,
                                        user:user,
                                    }
                                });
                            }
                        }).catch((error)=>{
                            return res.status(500).json({
                                success: false,
                                message: error.message,
                            });
                        });
                    }else{
                        return res.status(400).json({
                            success: false,
                            message: "Email non vérifié",
                        });
                    }
                    
                } catch (error) {
                    res.status(400).json({ 
                        success: false,
                        message: "Exception :"+error.message,
                    });
                }
            },

            googleSignup:async function(req,res){
                const { credential } = req.body;
                try {
                    // Vérification du token auprès de Google
                    const ticket = await client.verifyIdToken({
                        idToken: credential,
                        audience: process.env.GOOGLE_CLIENT_ID,
                    });
                    const payloadGoogle = ticket.getPayload();

                    if(payloadGoogle.email_verified){
                        
                        var user = new User();
                        user.email = payloadGoogle.email;
                        user.nom = payloadGoogle.family_name;
                        user.prenom = payloadGoogle.given_name;
                        user.role = "user";
                        user.valid = false;
                        user.isPerson = true;
                        user.source_id = payloadGoogle.sub;
                        user.source = "google";
                        user.genre = "Mr"

                        let gender=1;

                        let payload={
                            lastname: payloadGoogle.family_name,
                            firstname: payloadGoogle.given_name,
                            email : payloadGoogle.email,
                            active:"1",
                            passwd: '',
                            id_gender:gender,
                            id_default_group:3,
                            phone:''
                        };
                        let adresse={
                            id_country:8,
                            alias:payloadGoogle.name,
                            lastname: payloadGoogle.family_name,
                            firstname: payloadGoogle.given_name,
                            adress1:'',
                            postcode:'',
                            phone:'',
                            city:'',
                        }

                        let payloadOdoo={
                            'name': payloadGoogle.name,
                            'company_type':"person", // Type de l'entreprise
                            'is_company': false, // Indique qu'il s'agit d'une entreprise
                            'street': '',
                            'city': '',
                            'zip': '',
                            'country_id': false, // ID du pays (peut être défini si nécessaire)
                            'phone': '',
                            'email': payloadGoogle.email,
                        }

                        var query = {email:payloadGoogle.email}

                        User.findOne(query).then((result)=>{
                            if(result){
                                return res.json({
                                    success:false,
                                    message: "already exists"
                                })
                            }else{
                                user.save().then((result)=>{
                                    mailService.signupParticulierSource(result, "Google");
                                    prestashopService.addClient(payload,adresse);
                                    prestashopService.addClientLocation(payload,adresse);
                                    odooService.addPerson(payloadOdoo);
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
                            } 
                        }).catch((error)=>{
                            
                            return res.status(500).json({
                                success:false,
                                message: error.message
                            });
                        })

                    }else{
                        return res.status(400).json({
                            success: false,
                            message: "Email non vérifié",
                        });
                    }
                    
                } catch (error) {
                    res.status(400).json({ 
                        success: false,
                        message: "Exception :"+error.message,
                    });
                }
            },

            linkedInAuth:async function(req,res){
                const { code } = req.body;
                try {
                    var redirect_uri = process.env.MLKA_APP_URL + "/login";
                    userService.getLinkedInUserInfos(code, redirect_uri).then((userInfos)=>{
                        if(userInfos.message.email && userInfos.success == true){
                            const values = {
                                prenom: userInfos.message.given_name,
                                nom: userInfos.message.family_name,
                                source_id: userInfos.message.sub,
                                source: "linkedin"
                            }
                            const query={
                                email:userInfos.message.email,
                                desactive:false,
                                valid:true
                            };
                            
                            User.findOneAndUpdate(query,values,{new:true})
                            .then( async (user)=>{
                                if(!user){
                                    return res.status(404).json({
                                        success: false,
                                        message: "User not found",
                                    });
                                }else{
                                    var token = jwt.sign({id:user._id,role:Encryption.encrypt(user.role)}, config.certif,{expiresIn:'7d'});

                                    if(user.twoFactorEnabled && user.twoFactorType == "email"){
                                        var code = Math.floor(100000 + Math.random() * 900000);
                                        user.code = code;
                                        user.codeExpiration = new Date(Date.now() + 10 * 60 * 1000);
                                        await user.save();
                                        mailService.mailCodeAuthentication(user, user.code);
                                    }

                                    return res.status(200).json({
                                        success: true,
                                        message:{
                                            token:token,
                                            user:user,
                                        }
                                    });
                                }
                            }).catch((error)=>{
                                return res.status(500).json({
                                    success: false,
                                    message: error.message,
                                });
                            });
                        }else{
                            return res.status(400).json({
                                success: false,
                                message: "Email non trouvé",
                            });
                        }
                    }).catch((error)=>{
                        console.log("ERROR :", error);
                        res.status(400).json({ 
                            success: false,
                            message: "Exception :"+error.message,
                        });
                    });
                    
                } catch (error) {
                    res.status(400).json({ 
                        success: false,
                        message: "Exception :"+error.message,
                    });
                }
            },

            linkedInSignup:async function(req,res){
                const { code } = req.body;
                try {
                    var redirect_uri = process.env.MLKA_APP_URL + "/signup";
                    userService.getLinkedInUserInfos(code, redirect_uri).then((userInfos)=>{
                        if(userInfos.message.email && userInfos.success == true){
                            var user = new User();
                            user.email = userInfos.message.email;
                            user.nom = userInfos.message.family_name;
                            user.prenom = userInfos.message.given_name;
                            user.role = "user";
                            user.valid = false;
                            user.isPerson = true;
                            user.source_id = userInfos.message.sub;
                            user.source = "linkedin";
                            user.genre = "Mr"

                            let gender=1;

                            let payload={
                                lastname: userInfos.message.family_name,
                                firstname: userInfos.message.given_name,
                                email : userInfos.message.email,
                                active:"1",
                                passwd: '',
                                id_gender:gender,
                                id_default_group:3,
                                phone:''
                            };
                            let adresse={
                                id_country:8,
                                alias:userInfos.message.name,
                                lastname: userInfos.message.family_name,
                                firstname: userInfos.message.given_name,
                                adress1:'',
                                postcode:'',
                                phone:'',
                                city:'',
                            }

                            let payloadOdoo={
                                'name': userInfos.message.name,
                                'company_type':"person", // Type de l'entreprise
                                'is_company': false, // Indique qu'il s'agit d'une entreprise
                                'street': '',
                                'city': '',
                                'zip': '',
                                'country_id': false, // ID du pays (peut être défini si nécessaire)
                                'phone': '',
                                'email': userInfos.message.email,
                            }

                            var query = {email:userInfos.message.email}

                            User.findOne(query).then((result)=>{
                                if(result){
                                    return res.json({
                                        success:false,
                                        message: "already exists"
                                    })
                                }else{
                                    user.save().then((result)=>{
                                        mailService.signupParticulierSource(result, "LinkedIn");
                                        prestashopService.addClient(payload,adresse);
                                        prestashopService.addClientLocation(payload,adresse);
                                        odooService.addPerson(payloadOdoo);
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
                                } 
                            }).catch((error)=>{
                                
                                return res.status(500).json({
                                    success:false,
                                    message: error.message
                                });
                            })
                            
                        }else{
                            return res.status(400).json({
                                success: false,
                                message: "Email non trouvé",
                            });
                        }
                    }).catch((error)=>{
                        console.log("ERROR :", error);
                        res.status(400).json({ 
                            success: false,
                            message: "Exception :"+error.message,
                        });
                    });
                } catch (error) {
                    res.status(400).json({ 
                        success: false,
                        message: "Exception :"+error.message,
                    });
                }
            },

            updateA2FAuthentication(req,res){
                acl.isAllowed(req.decoded.id,'projets', 'create', async function(err,aclres){
                    if(aclres){

                        let qrCode = null;
                        let user = await User.findOne({_id:req.decoded.id});
                        user.twoFactorEnabled = req.body.twoFactorEnabled;
                        if (req.body.twoFactorEnabled){
                            user.twoFactorType = req.body.twoFactorType;
                            if(req.body.twoFactorType == "application"){
                                const secret = speakeasy.generateSecret({ name: "Mlka App: " + user.email });
                                user.twoFactorSecret = secret.base32;
                                const otpauthUrl = secret.otpauth_url;
                                // Generate QR code
                                qrCode = await QRCode.toDataURL(otpauthUrl);
                            }else{
                                user.twoFactorSecret = null;
                            }
                        }else{
                            user.twoFactorType = null;
                            user.twoFactorSecret = null;
                        }
                    
                        User.findOneAndUpdate({_id:req.decoded.id},user,{new:true}).then((user)=>{
                            res.json({
                                success:true,
                                message:{
                                    user : user,
                                    qrCode: qrCode
                                }
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

            verifyA2FAuthentication:async function(req,res){
                if(req.body.user_id && req.body.code && req.body.type){
                    let user = await User.findOne({_id:req.body.user_id}).select('+code');
                    if(user){
                        if(req.body.type == "email"){
                            if(user.code == req.body.code.toString() && user.codeExpiration > new Date()){
                                user.code = null;
                                user.codeExpiration = null;
                                await user.save();

                                var token = jwt.sign({id:user._id,role:Encryption.encrypt(user.role)}, config.certif,{expiresIn:'1h'});

                                return res.status(200).json({
                                    success: true,
                                    message: {
                                        token:token,
                                        user:user
                                    }
                                });
                            }else{
                                return res.status(400).json({
                                    success: false,
                                    message: "Code invalid"
                                });
                            }
                        }else if(req.body.type == "application"){
                            const isValid = speakeasy.totp.verify({
                                secret: user.twoFactorSecret,
                                encoding: 'base32',
                                token: req.body.code
                            });
                            if(isValid){

                                var token = jwt.sign({id:user._id,role:Encryption.encrypt(user.role)}, config.certif,{expiresIn:'1h'});
                                return res.status(200).json({
                                    success: true,
                                    message: {
                                        token:token,
                                        user:user
                                    }
                                });
                            }else{
                                return res.status(400).json({   
                                    success: false,
                                    message: "Code invalid"
                                });
                            }
                        }
                    }else{
                        return res.status(404).json({
                            success: false,
                            message: "User not found"
                        });
                    }
                }else{
                    return res.status(400).json({
                        success: false,
                        message: "Bad request"
                    });
                }
            },

            resendAuthenticationEmailCode:async function(req,res){
                if(req.body.user_id){
                    let user = await User.findOne({_id:req.body.user_id});
                    if(user){
                        if(user.twoFactorEnabled && user.twoFactorType == "email"){
                            var code = Math.floor(100000 + Math.random() * 900000);
                            user.code = code;
                            user.codeExpiration = new Date(Date.now() + 10 * 60 * 1000);
                            await user.save();
                            mailService.mailCodeAuthentication(user, user.code);
                            return res.status(200).json({
                                success: true,
                                message: "Code sent"
                            });
                        }
                    }else{
                        return res.status(404).json({
                            success: false,
                            message: "User not found"   
                        });
                    }
                }else{
                    return res.status(400).json({
                        success: false,
                        message: "Bad request"
                    });
                }
            }

        }
    }

})();