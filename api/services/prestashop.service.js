const axios = require('axios');
const xml2js = require('xml2js');

async function addClient(payload){
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

module.exports = {
    addClient,
    getClient,
  };