const adresseLivraisonModel = require("../models/adresseLivraison.model");

(function(){
    "use strict";
    var Contact = require("../models/contacts.model").ContactModel;
    var Projet = require("../models/projets.model").ProjetModel;
    var User = require('../models/users.model').UserModel;
    var crypto = require('crypto');
    var ObjectId = require('mongoose').Types.ObjectId;
    var prestashopService = require('../services/prestashop.service');
    var Entreprise = require('../models/entreprises.model').EntrepriseModel;
    var odooService = require('../services/odoo.service');
    var userService = require('../services/user.service');
    var AdresseLivraison = require('../models/adresseLivraison.model').AdresseLivraisonModel;
    var codes = require('voucher-code-generator');



    module.exports = function(acl){

        return{

            addContact(req,res){
                acl.isAllowed(req.decoded.id,'projets', 'create', async function(err,aclres){
                    if(aclres){

                        let gender='';
                        let genderOdoo='';
                        var query = {email:req.body.email};
                        let entreprise = await Entreprise.findOne({_id:new ObjectId(req.body.entreprise)});

                        /*var password = codes.generate({
                            length: 9,
                            count: 1,
                            charset: "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"
                        });
                        password = password[0];*/

                        if(entreprise){

                            let password="mlka@2024";
                            var user = new User();
                            user.email = req.body.email;
                            user.nom = req.body.nom;
                            user.prenom = req.body.prenom;
                            user.role = "user";
                            user.valid = true;
                            user.entreprise=new ObjectId(entreprise._id);
                            user.phone = req.body.phone;

                            var contact = new Contact(req.body);
                            contact.entreprise= new ObjectId(entreprise._id);
                            contact.createdDate = new Date();
                            contact.rue= entreprise.rue;
                            contact.numero= entreprise.numero;
                            contact.postal=entreprise.postal;

                            if(req.body.genre=='Mr'){
                                gender=1;
                                genderOdoo=3;
                                user.genre = "Mr";
                                contact.genre = "Mr";
                            }else{
                                gender=2;
                                genderOdoo=1;
                                user.genre = "Mlle";
                                contact.genre = "Mlle"
                            }

                            let payload={
                                lastname: req.body.nom,
                                firstname: req.body.prenom,
                                email : req.body.email,
                                active:"1",
                                company:entreprise.societe,
                                siret: entreprise.siret,
                                passwd: password,
                                id_gender:gender,
                                id_default_group:3,
                                phone:req.body.indicatif+""+req.body.phone
                            };
                            let adresse={
                                id_country:8,
                                alias:req.body.prenom+""+req.body.nom,
                                lastname: req.body.nom,
                                firstname: req.body.prenom,
                                adress1:entreprise.rue+" "+entreprise.numero,
                                postcode:req.body.postal,
                                phone:req.body.indicatif+""+req.body.phone,
                                city:entreprise.rue,
                                company:entreprise.societe,
                            }

                            let payloadContact={
                                'name':req.body.prenom+" "+req.body.nom,
                                'parent_id':parseInt(entreprise.company_id),
                                'type':"contact",
                                'email':req.body.email,
                                'phone':req.body.indicatif+""+req.body.phone,
                                'title': genderOdoo,
                                'function':req.body.poste,
                                'street': entreprise.rue,
                                'city': entreprise.numero,
                                'zip': entreprise.postal,
                            }
                        
                            //console.log("payload", payload);
                            //console.log("payload 1", adresse);
                            //console.log("payload 2", payloadContact);



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
                                        contact.save().then((contact)=>{
                                            //mailService.signup(result, password);
                                            odooService.addContact(payloadContact,password,contact);
                                            prestashopService.addClient(payload,adresse);
                                            prestashopService.addClientLocation(payload,adresse);
                                            res.json({
                                                success:true,
                                                message:contact,
                                                user:result
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
                            return res.status(500).json({
                                success:false,
                                message: error.message
                            });
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

                        let contact = await Contact.findOne({_id:req.params.id});
                        let isUpdate=false;
                        let isEmail=false;
                        let gender="";
                        let oldEmail=contact.email;
                        if(req.body.genre=='Mr'){
                            gender=3;
                            contact.genre = "Mr";
                        }else{
                            gender=1;
                            contact.genre = "Mlle";
                        }

                        let payload={
                            'name':req.body.prenom+" "+req.body.nom,
                            'email': req.body.email,
                            'phone':req.body.indicatif+""+req.body.phone,
                            'function':req.body.poste,
                            'title': gender,
                         }
                        
                        if(req.body.nom!=contact.nom || req.body.prenom!=contact.prenom || req.body.poste!=contact.poste || req.body.phone!=contact.phone || req.body.indicatif!=contact.indicatif || req.body.email!=contact.email || req.body.genre!=contact.genre){
                             isUpdate = true;
                        }
                        if(req.body.email!=contact.email){
                            isEmail=true;

                        }

                        Contact.findOneAndUpdate({_id:req.params.id},req.body,{new:true}).then((contact)=>{
                            if(isUpdate){
                                odooService.updateContact(payload,contact,oldEmail);
                                prestashopService.updateClient(oldEmail,contact.nom, contact.prenom, contact.email);
                                prestashopService.updateClientLocation(oldEmail,contact.nom, contact.prenom, contact.email);
                            }if(isEmail){
                                userService.updateEmailUser(oldEmail,contact.email);
                            }
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

            updateContactAdresse(req,res){
                acl.isAllowed(req.decoded.id,'projets', 'update', async function(err,aclres){
                    if(aclres){

                        let contact = await Contact.findOne({_id:req.params.id});
                        let payload={
                            'street': req.body.rue,
                            'city': req.body.numero,
                            'zip': req.body.postal,
                            'type':'invoice'
                        }
                        
                        Contact.findOneAndUpdate({_id:req.params.id},req.body,{new:true}).then((contact)=>{
                            odooService.updateContact(payload,contact);
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

                        let cont = await Contact.findOne({_id:req.params.id});

                        if(cont){
                            let user = await User.findOne({email:cont.email});

                            cont.deleteOne().then((contact)=>{
                                user.deleteOne().then(async (user)=>{
                                    odooService.deletePartner(cont.contact_id,cont.client_id),
                                    prestashopService.deleteClient(cont.email),
                                    prestashopService.deleteClientLocation(cont.email),
                                    await AdresseLivraison.deleteOne({contact:req.params.id});
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

            getAllContact(req,res){
                acl.isAllowed(req.decoded.id,'projets', 'retreive', async function(err,aclres){

                    if(aclres){
                        Contact.find()
                        .populate({ path: "entreprise", select: "_id societe" })
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
                        Contact.findOne({_id:req.params.id}) .populate({ path: "entreprise", select: "_id societe" }).then((contact)=>{
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
                        .populate({ path: "entreprise", select: "_id societe" })
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

            // adresse livraison pour un contact

            addAdresseLivraison(req,res){
                acl.isAllowed(req.decoded.id,'projets', 'create', async function(err,aclres){
                    if(aclres){

                        let contact = await Contact.findOne({_id:new ObjectId(req.params.id)});

                        if(contact){
                            var adresse = new  AdresseLivraison(req.body);
                            adresse.contact= new ObjectId(contact._id);
                            adresse.createdDate = new Date();
                            adresse.contact_id= contact.contact_id;
                            
                            let payloadContact={
                                'type': 'delivery',
                                'street': req.body.rue,
                                'city': req.body.numero,
                                'zip': req.body.postal,
                            }
                            adresse.save().then((adresse)=>{
                                odooService.updateContact(payloadContact,contact);
                                res.json({
                                    success:true,
                                    message:adresse,
                                });

                            }).catch((error)=>{
                                return res.status(500).json({
                                    success:false,
                                    message:error.message
                                })
                        })
  
                        }else{
                            return res.status(500).json({
                                success:false,
                                message: error.message
                            });
                        }

                    }else{
                        return res.status(401).json({
                            success: false,
                            message: "401"
                        }); 
                    }
                })
            },

            updateAdresseLivraison(req,res){
                acl.isAllowed(req.decoded.id,'projets', 'create', async function(err,aclres){
                    if(aclres){

                        let adresse = await AdresseLivraison.findOne({_id:new ObjectId(req.params.id)});

                        if(adresse){ 
                            let payloadContact={
                                'type': 'delivery',
                                'street': req.body.rue,
                                'city': req.body.numero,
                                'zip': req.body.postal,
                            }
                            AdresseLivraison.findOneAndUpdate({_id:req.params.id},req.body,{new:true}).then((contact)=>{
                                odooService.updateContact(payloadContact,contact);
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
                            return res.status(500).json({
                                success:false,
                                message: error.message
                            });
                        }

                    }else{
                        return res.status(401).json({
                            success: false,
                            message: "401"
                        }); 
                    }
                })
            },

            getAdresseLivraison(req,res){
                acl.isAllowed(req.decoded.id,'projets', 'create', async function(err,aclres){
                    if(aclres){

                        let adresse = await AdresseLivraison.findOne({contact:new ObjectId(req.params.id)});
                        if(adresse){ 
                            res.json({
                                success:true,
                                message:adresse
                            });
                        }else{
                            return res.status(200).json({
                                success:false,
                            });
                        }
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