const xmlrpc = require('xmlrpc');
const odooUrl = process.env.odooHost;
const odooDb = process.env.odooDb;
const odooUsername = process.env.odooUsername;
const odooPassword = process.env.odooPassword;

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

async function addCompany(payload){
    

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
                }
            });
        }
    });
} 

module.exports = {
    addCompany,
  };