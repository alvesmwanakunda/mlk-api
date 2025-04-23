var User = require('../models/users.model').UserModel; 
var Contact = require('../models/contacts.model').ContactModel; 
var prestashopService = require('../services/prestashop.service');
var codes = require('voucher-code-generator');
var crypto = require('crypto');
var mailService = require('../services/mail.service');
var ObjectId = require('mongoose').Types.ObjectId;

module.exports={

    createContactEntreprise:(entreprise, body)=>{
        return new Promise (async(resolve, reject)=>{
            let names = body.name.trim().split(' ') || [];
            let password="mlka@2024";

            var user = new User();
            user.email = body.email;
            user.nom = names[names.length-1] || '';
            user.prenom = names.slice(0,-1).join(' ') || '';
            user.role = "user";
            user.valid = true;
            user.entreprise=new ObjectId(entreprise._id);
            user.phone = body.phone;

            var contact = new Contact();
            contact.nom = names[names.length-1] || '';
            contact.prenom = names.slice(0,-1).join(' ') || '';
            contact.email = body.email;
            contact.phone = body.phone;
            contact.indicatif = body.indicatif;
            contact.entreprise= new ObjectId(entreprise._id);
            contact.createdDate = new Date();
            contact.rue= body.street;
            contact.postal=body.zip;
            contact.client_id = body.id;
            contact.contact_id = entreprise.company_id;
            contact.poste = body.poste;

            let gender= 1;
            if(body.titre=='Monsieur'){
                gender=1;
                user.genre = "Mr";
                contact.genre = "Mr";
            }else{
                if(body.titre=='Madame'){
                    gender=2;
                    user.genre = "Mlle";
                    contact.genre = "Mlle"
                } 
            }

            let payload={
                lastname: names[names.length-1] || '',
                firstname: names.slice(0,-1).join(' ') || '',
                email : body.email,
                active:"1",
                company:entreprise.societe,
                passwd: password,
                id_gender:gender,
                id_default_group:3,
                phone:body.indicatif+""+body.phone
            };
            let adresse={
                id_country:8,
                alias:(names.slice(0,-1).join(' ') || '')+" "+(names[names.length-1] || ''),
                lastname: names[names.length-1] || '',
                firstname: names.slice(0,-1).join(' ') || '',
                adress1:body.street,
                postcode:body.zip,
                phone:body.indicatif+""+body.phone,
                city:body.city,
                company:entreprise.societe,
            }

            User.findOne({email:body.email}).then((result)=>{
                if(result){
                    resolve({
                        success:false,
                        message: "already exists"
                    });
                } 
                User.deleteOne({email:body.email})
                .then((result) => {
                    user.password = crypto.createHash('md5').update(password).digest("hex");
                    user.save().then((result)=>{
                        contact.save().then((contact)=>{
                            //mailService.signup(result, password);
                            //odooService.addContact(payloadContact,password,contact);
                            prestashopService.addClient(payload,adresse);
                            prestashopService.addClientLocation(payload,adresse);
                            
                            resolve({
                                success:true,
                                message:contact,
                                user:result
                            });

                        }).catch((error)=>{
                            reject({
                                status:'error',
                                body:error.message
                            })
                    })
                        
                    }).catch((error)=>{
                        reject({
                            status:'error',
                            body:error.message
                        })
                    })
                })
                .catch((error) => {
                    reject({
                        status:'error',
                        body:error.message
                    })
                });

            }).catch((error)=>{
                reject({
                     status:'error',
                     body:error.message
                })
            })
 
        })
    }, 

    createContact:(body)=>{
        return new Promise (async(resolve, reject)=>{
            let names = body.name.trim().split(' ') || [];
            var password = codes.generate({
                            length: 9,
                            count: 1,
                            charset: "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"
                        });
            password = password[0];

            var user = new User();
            user.email = body.email;
            user.nom = names[names.length-1] || '';
            user.prenom = names.slice(0,-1).join(' ') || '';
            user.role = "user";
            user.valid = false;
            user.isPerson = true;
            user.phone = body.phone;

            var contact = new Contact();
            contact.nom = names[names.length-1] || '';
            contact.prenom = names.slice(0,-1).join(' ') || '';
            contact.email = body.email;
            contact.phone = body.phone;
            contact.indicatif = body.indicatif;
            contact.createdDate = new Date();
            contact.rue= body.street;
            contact.postal=body.zip;
            contact.client_id = body.id;
            contact.poste = body.poste;
            
            let gender= 1;
            if(body.titre=='Monsieur'){
                gender=1;
                user.genre = "Mr";
                contact.genre = "Mr";
            }else{
                if(body.titre=='Madame'){
                    gender=2;
                    user.genre = "Mlle";
                    contact.genre = "Mlle"
                } 
            }

            let payload={
                lastname: names[names.length-1] || '',
                firstname: names.slice(0,-1).join(' ') || '',
                email : body.email,
                active:"1",
                passwd: password,
                id_gender:gender,
                id_default_group:3,
                phone:body.indicatif+""+body.phone
            };
            let adresse={
                id_country:8,
                alias:(names.slice(0,-1).join(' ') || '')+" "+(names[names.length-1] || ''),
                lastname: names[names.length-1] || '',
                firstname: names.slice(0,-1).join(' ') || '',
                adress1:body.street,
                postcode:body.zip,
                phone:body.indicatif+""+body.phone,
                city:body.city,
            }

            User.findOne({email:body.email}).then((result)=>{
                if(result){
                    resolve({
                        success:false,
                        message: "already exists"
                    });
                } 
                User.deleteOne({email:body.email})
                .then((result) => {
                    user.password = crypto.createHash('md5').update(password).digest("hex");
                    user.save().then((result)=>{
                        contact.save().then((contact)=>{
                            mailService.signupParticulier(result, password);
                            //odooService.addContact(payloadContact,password,contact);
                            prestashopService.addClient(payload,adresse);
                            prestashopService.addClientLocation(payload,adresse);

                            resolve({
                                success:true,
                                message:contact,
                                user:result
                            });

                        }).catch((error)=>{
                            reject({
                                status:'error',
                                body:error.message
                            })
                    })
                        
                    }).catch((error)=>{
                        reject({
                            status:'error',
                            body:error.message
                        })
                    })
                })
                .catch((error) => {
                    reject({
                        status:'error',
                        body:error.message
                    })
                });

            }).catch((error)=>{
                reject({
                     status:'error',
                     body:error.message
                })
            })
 
        })
    }, 
}