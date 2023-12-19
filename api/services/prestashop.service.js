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
        console.log("response", response.data);
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
            console.log("responseAdd", responseAdd.data);
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
  };