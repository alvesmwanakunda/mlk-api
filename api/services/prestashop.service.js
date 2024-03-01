const axios = require('axios');
const xml2js = require('xml2js');

async function addClient(payload,adresse){
    let data={
        "customers":{
            "customer":payload
        }
    };

    const prestashopUrl=process.env.shopUrl;
    const prestashopApiKey=process.env.shopApiKey;
    try {
        const response=await axios.post(
            `${prestashopUrl}customers`,
            data,
            {params:{
                ws_key:prestashopApiKey,
                output_format:'JSON'
             }}
        );
        //console.log("response", response.data);
        if(response.data){
            let adress={
                   id_customer:response.data.customer.id,
                    id_country:8,
                    alias:adresse.alias,
                    lastname: adresse.lastname,
                    firstname: adresse.firstname,
                    address1:adresse.adress1,
                    postcode:adresse.postcode,
                    phone:adresse.phone,
                    city:adresse.city,
                    company:adresse.company,
            }
            let dataAdresse={
                "addresses":{
                    "addresse":adress
                }
            };
            const responseAdd=await axios.post(
                `${prestashopUrl}addresses`,
                dataAdresse,
                {params:{
                    ws_key:prestashopApiKey,
                    output_format:'JSON'
                 }}
            );
            //console.log("responseAdd", responseAdd.data);
        }
     } catch (error) {
        console.log("Erreur ", error.message);
        throw error;
     }
}

async function updatePasswordClient(email,password){

    const prestashopUrl=process.env.shopUrl;
    const prestashopApiKey=process.env.shopApiKey;

    try {
        const idUser=await axios.get(`${prestashopUrl}customers/?filter[email]=[${email}]`,{params:{
           ws_key:prestashopApiKey,
           output_format:'JSON'
        }});
        //console.log("response", idUser.data);
        if(idUser.data && idUser.data.customers && idUser.data.customers.length > 0){
            let idClient = idUser.data?.customers[0]?.id;
            //const client=await axios.get(`${prestashopUrl}customers/${idClient}`,{params:{ws_key:prestashopApiKey,output_format:'JSON'}});
            const data={
                "customers":{
                    "customer":{
                      "id":idClient,
                      "passwd":password
                    }
                  }
            }
            const updateClient=await axios.patch(`${prestashopUrl}customers/${idClient}`,data,{params:{ws_key:prestashopApiKey,output_format:'JSON'}});
            //console.log("update client",updateClient.data);
        }else{
            console.log("Pas d'utilisateur");
        }
       
    } catch (error) {
       console.log("Erreur ", error.message);
       throw error;
    }
}

async function updateClient(oldEmail,lastname,firstname,email){

    const prestashopUrl=process.env.shopUrl;
    const prestashopApiKey=process.env.shopApiKey;

    try {
        const idUser=await axios.get(`${prestashopUrl}customers/?filter[email]=[${oldEmail}]`,{params:{
           ws_key:prestashopApiKey,
           output_format:'JSON'
        }});
        //console.log("response", idUser.data);
        if(idUser.data && idUser.data.customers && idUser.data.customers.length > 0){
            let idClient = idUser.data?.customers[0]?.id;
            //const client=await axios.get(`${prestashopUrl}customers/${idClient}`,{params:{ws_key:prestashopApiKey,output_format:'JSON'}});
            const data={
                "customers":{
                    "customer":{
                      "id":idClient,
                      "email":email,
                      "lastname":lastname,
                      "firstname":firstname
                    }
                  }
            }
            const updateClient=await axios.patch(`${prestashopUrl}customers/${idClient}`,data,{params:{ws_key:prestashopApiKey,output_format:'JSON'}});
            //console.log("update client",updateClient.data);
        }else{
            console.log("Pas d'utilisateur");
        }
       
    } catch (error) {
       console.log("Erreur ", error.message);
       throw error;
    }
}

async function deleteClient(email){

    const prestashopUrl=process.env.shopUrl;
    const prestashopApiKey=process.env.shopApiKey;

    try {
        const idUser=await axios.get(`${prestashopUrl}customers/?filter[email]=[${email}]`,{params:{
           ws_key:prestashopApiKey,
           output_format:'JSON'
        }});
        //console.log("response", idUser.data);
        if(idUser.data && idUser.data.customers && idUser.data.customers.length > 0){
            let idClient = idUser.data?.customers[0]?.id;
            //const client=await axios.get(`${prestashopUrl}customers/${idClient}`,{params:{ws_key:prestashopApiKey,output_format:'JSON'}});
            const deleteClient=await axios.delete(`${prestashopUrl}customers/${idClient}`,{params:{ws_key:prestashopApiKey,output_format:'JSON'}});
            console.log("update client",deleteClient.data);
        }else{
            console.log("Pas d'utilisateur");
        }
       
    } catch (error) {
       console.log("Erreur ", error.message);
       throw error;
    }
}

async function getClient(){

    const prestashopUrl=process.env.shopUrl;
    const prestashopApiKey=process.env.shopApiKey;

     try {
         const response=await axios.get(`${prestashopUrl}customers/3`,{params:{
            ws_key:prestashopApiKey,
            output_format:'JSON'
         }}
        );
        console.log("response", response.data);
     } catch (error) {
        console.log("Erreur ", error.message);
        throw error;
     }
}

async function getAllProducts(){

    const prestashopUrl=process.env.shopUrl;
    const prestashopApiKey=process.env.shopApiKey;

     try {
         const response=await axios.get(`${prestashopUrl}products/?display=[id,price,name,description_short]`,{params:{
            ws_key:prestashopApiKey,
            output_format:'JSON'
         }}
        );
        //console.log("Produits", response.data);
        return response.data;
     } catch (error) {
        console.log("Erreur ", error.message);
        throw error;
     }
}

module.exports = {
    addClient,
    getClient,
    getAllProducts,
    updatePasswordClient,
    deleteClient,
    updateClient
  };