const xmlrpc = require('xmlrpc');
const odooUrl = process.env.odooHost || "https://mlka-groupe.odoo.com/";
const odooDb = process.env.odooDb || "mlka-groupe";
const odooUsername = process.env.odooUsername || "support@mlka.fr";
const odooPassword = process.env.odooPassword || "alvesMwanza1504";
const Entreprise = require('../models/entreprises.model').EntrepriseModel;
const Contact = require('../models/contacts.model').ContactModel;

const odooClient = xmlrpc.createSecureClient({
    url: odooUrl+"xmlrpc/2/common",
    basic_auth: {
        user: odooUsername,
        pass: odooPassword,
    },
});
const xmlrpcClientObject = xmlrpc.createSecureClient({
    url: odooUrl+"xmlrpc/2/object",
    basic_auth: {
        user: odooUsername,
        pass: odooPassword,
    },
});

async function addCompany(payload,entreprise){

    odooClient.methodCall('authenticate', [odooDb, odooUsername, odooPassword, {}], (error, uid) => {
        console.log("Auth", uid);
        if (error) {
            console.error('Erreur d\'authentification:', error);
        } else {
            xmlrpcClientObject.methodCall('execute_kw', [odooDb, uid, odooPassword, 'res.partner', 'create', [payload]], (error, company_id) => {
                if (error) {
                    console.error('Erreur lors de la création de l\'entreprise:', error);
                } else {
                    console.log('Entreprise créée avec l\'ID:', company_id);
                    Entreprise.findOneAndUpdate({_id:entreprise._id},{company_id:company_id},{new:true}).then((entreprise)=>{
                        console.log('Entreprise update',entreprise);
                    }).catch((error)=>{
                        console.log('Entreprise erreur',error.message);
                    })
                }
            });
        }
    });
} 

async function addContact(payload, contact){
    odooClient.methodCall('authenticate', [odooDb, odooUsername, odooPassword, {}], (error, uid) => {
        console.log("Auth", uid);
        if (error) {
            console.error('Erreur d\'authentification:', error);
        } else {
            xmlrpcClientObject.methodCall('execute_kw', [odooDb, uid, odooPassword, 'res.partner', 'create', [payload]], (error, company_id) => {
                if (error) {
                    console.error('Erreur lors de la création de l\'entreprise:', error);
                } else {
                    console.log('Entreprise créée avec l\'ID:', company_id);
                    Contact.findOneAndUpdate({_id:contact._id},{contact_id:company_id},{new:true}).then((contact)=>{
                        console.log('Entreprise update',contact);
                    }).catch((error)=>{
                        console.log('Entreprise erreur',error.message);
                    })
                }
            });
        }
    });
} 

async function updateContact(payload, contact){
    let _id = parseInt(contact.contact_id);
    console.log("ID", _id);
    odooClient.methodCall('authenticate', [odooDb, odooUsername, odooPassword, {}], (error, uid) => {
        console.log("Auth", uid);
        if (error) {
            console.error('Erreur d\'authentification:', error);
        } else {
            xmlrpcClientObject.methodCall('execute_kw', [odooDb, uid, odooPassword, 'res.partner', 'write', [[_id],payload]], (error, company_id) => {
                if (error) {
                    console.error('Erreur lors de la création de l\'entreprise:', error);
                } else {
                    console.log('Entreprise créée avec l\'ID:', company_id);
                }
            });
        }
    });
} 

async function deletePartner(id){
    let _id = parseInt(id);
    odooClient.methodCall('authenticate', [odooDb, odooUsername, odooPassword, {}], (error, uid) => {
        console.log("Auth", uid);
        if (error) {
            console.error('Erreur d\'authentification:', error);
        } else {
            xmlrpcClientObject.methodCall('execute_kw', [odooDb, uid, odooPassword, 'res.partner', 'unlink', [[_id]]], (error, company_id) => {
                if (error) {
                    console.error('Erreur lors de la création de l\'entreprise:', error);
                } else {
                    console.log('Entreprise créée avec l\'ID:', company_id);
                }
            });
        }
    });
} 




async function getCompany(){
    odooClient.methodCall('authenticate', [odooDb, odooUsername, odooPassword, {}], (error, uid) => {
        console.log("Auth", uid);
        if (error) {
            console.error('Erreur d\'authentification:', error);
        } else {
            xmlrpcClientObject.methodCall('execute_kw', [odooDb, uid, odooPassword, 'res.partner', 'search_read',[[['id','=', 126]]]], (error, company) => {
                if (error) {
                    console.error('Erreur lors de la création de l\'entreprise:', error);
                } else {
                    console.log('Entreprise créée avec l\'ID:', company);
                }
            });
        }
    });
} 

module.exports = {
    addCompany,
    getCompany,
    addContact,
    updateContact,
    deletePartner,
  };