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

async function update(lastname,firstname,email){

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
    const prestashopUrl = process.env.shopUrl;
    const prestashopApiKey = process.env.shopApiKey;

    try {
        const response = await axios.get(`${prestashopUrl}products/?display=[id,price,name,description_short]`, {
            params: {
                ws_key: prestashopApiKey,
                output_format: 'JSON'
            }
        });
        //console.log("Produits", response.data);
        return response.data;
    } catch (error) {
        if (error.code === 'ETIMEDOUT') {
            console.log("La requête a expiré en raison d'un délai d'attente.");
            return null; // ou renvoyer une valeur par défaut
        } else {
            console.log("Erreur", error.message);
            throw error;
        }
    }
}

/*async function getProduct(id){
    const prestashopUrl = process.env.shopUrl;
    const prestashopApiKey = process.env.shopApiKey;

    try {
        const response = await axios.get(`${prestashopUrl}products/${id}`, {
            params: {
                ws_key: prestashopApiKey,
                output_format: 'JSON'
            }
        });
        //console.log("Produits", response.data);
        let produit = {
            id:response.data.product?.id,
            name:response.data.product?.name,
            price:response.data.product?.price,
            priceunit:response.data.product?.wholesale_price,
            resume:response.data.product?.description_short,
            description:response.data.product?.description,
            poids:response.data.product?.weight,
            profondeur: response.data.product?.depth,
            largeur:response.data.product?.width,
            hauteur:response.data.product?.height,
            surface:parseInt(response.data.product?.width) * parseInt(response.data.product?.height),
            images:response.data.product?.associations?.images
        }
        return produit;
    } catch (error) {
        if (error.code === 'ETIMEDOUT') {
            console.log("La requête a expiré en raison d'un délai d'attente.");
            return null; // ou renvoyer une valeur par défaut
        } else {
            console.log("Erreur", error.message);
            throw error;
        }
    }
}*/


// Fonction pour convertir un tableau d'octets en base64
function arrayBufferToBase64(buffer) {
    let binary = '';
    let bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

async function getProduct(id) {
    const prestashopUrl = process.env.shopUrl;
    const prestashopApiKey = process.env.shopApiKey;

    try {
        const response = await axios.get(`${prestashopUrl}products/${id}`, {
            params: {
                ws_key: prestashopApiKey,
                output_format: 'JSON',
            }
        });

        let product = response.data.product;
        //console.log("Product". product);

        // Récupérez les informations sur le produit
        let produit = {
            id: product?.id,
            name: product?.name,
            price: product?.price,
            priceunit: product?.wholesale_price,
            resume: product?.description_short,
            description: product?.description,
            poids: product?.weight,
            profondeur: product?.depth,
            largeur: product?.width,
            hauteur: product?.height,
            surface: parseInt(product?.width) * parseInt(product?.height),
            images: []
        };

        // Parcourez les images associées au produit
        /*for (let image of product.associations.images) {
            // Pour chaque image, récupérez ses informations complètes
            const imageResponse = await axios.get(`${prestashopUrl}images/products/${id}/${image.id}`, {
                params: {
                    ws_key: prestashopApiKey,
                    output_format: 'JSON'
                }
            });

            //console.log("Image", imageResponse.data)

            // Ajoutez l'URL ou les données binaires de l'image à l'objet produit
            produit.images.push({
                id: image.id,
                url: imageResponse.data,
                //binary: imageResponse.data.image.content
            });
        }*/
        for (let image of product.associations.images) {
            const imageResponse = await axios.get(`${prestashopUrl}images/products/${id}/${image.id}`, {
                params: {
                    ws_key: prestashopApiKey,
                    output_format: 'JSON'
                },
                responseType: 'arraybuffer'
            });
        
            // Convertir les données binaires en base64 en tranches
            let base64Chunks = [];
            const chunkSize = 1024 * 1024; // Taille de chaque tranche (1 Mo)
            for (let i = 0; i < imageResponse.data.byteLength; i += chunkSize) {
                let chunk = imageResponse.data.slice(i, i + chunkSize);
                base64Chunks.push(arrayBufferToBase64(chunk));
            }
            // Concaténer les tranches de base64
            let base64String = base64Chunks.join('');
            produit.images.push({
                id: image.id,
                base64: base64String
            });
        }
        
        
        return produit;
    } catch (error) {
        if (error.code === 'ETIMEDOUT') {
            console.log("La requête a expiré en raison d'un délai d'attente.");
            return null; // ou renvoyer une valeur par défaut
        } else {
            console.log("Erreur", error.message);
            throw error;
        }
    }
}


async function getImagesProduct(id){
    const prestashopUrl = process.env.shopUrl;
    const prestashopApiKey = process.env.shopApiKey;

    try {
        ///images/products/{id_product}
        const response = await axios.get(`${prestashopUrl}images/products/${id}/365`, {
            params: {
                ws_key: prestashopApiKey,
                output_format: 'JSON'
            }
        });

        //console.log("Produits", response.data);
        return response.data;
    } catch (error) {
        if (error.code === 'ETIMEDOUT') {
            console.log("La requête a expiré en raison d'un délai d'attente.");
            return null; // ou renvoyer une valeur par défaut
        } else {
            console.log("Erreur", error.message);
            throw error;
        }
    }
}


async function getAllCategories(){

    const prestashopUrl=process.env.shopUrl;
    const prestashopApiKey=process.env.shopApiKey;

     try {
         const response=await axios.get(`${prestashopUrl}categories/?display=[id,name]`,{params:{
            ws_key:prestashopApiKey,
            output_format:'JSON'
         }}
        );
        //console.log("Produits", response.data);
        return response.data.categories;
     } catch (error) {
        console.log("Erreur ", error.message);
        throw error;
     }
}

async function getAllManufactures(){

    const prestashopUrl=process.env.shopUrl;
    const prestashopApiKey=process.env.shopApiKey;

     try {
         const response=await axios.get(`${prestashopUrl}manufacturers/?display=[id,name]`,{params:{
            ws_key:prestashopApiKey,
            output_format:'JSON'
         }}
        );
        //console.log("Produits", response.data);
        return response.data.manufacturers;
     } catch (error) {
        console.log("Erreur ", error.message);
        throw error;
     }
}

async function getAllSuppliers(){

    const prestashopUrl=process.env.shopUrl;
    const prestashopApiKey=process.env.shopApiKey;

     try {
         const response=await axios.get(`${prestashopUrl}suppliers/?display=[id,name]`,{params:{
            ws_key:prestashopApiKey,
            output_format:'JSON'
         }}
        );
        //console.log("Produits", response.data);
        return response.data.suppliers;
     } catch (error) {
        console.log("Erreur ", error.message);
        throw error;
     }
}

// --------------------------- LOCATION ---------------------------

async function addClientLocation(payload,adresse){
    let data={
        "customers":{
            "customer":payload
        }
    };

    const prestashopUrl=process.env.shopLocationUrl;
    const prestashopApiKey=process.env.shopLocationApiKey;
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

async function updatePasswordClientLocation(email,password){

    const prestashopUrl=process.env.shopLocationUrl;
    const prestashopApiKey=process.env.shopLocationApiKey;

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

async function updateClientLocation(oldEmail,lastname,firstname,email){

    const prestashopUrl=process.env.shopLocationUrl;
    const prestashopApiKey=process.env.shopLocationApiKey;

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

async function updateLocation(lastname,firstname,email){

    const prestashopUrl=process.env.shopLocationUrl;
    const prestashopApiKey=process.env.shopLocationApiKey;

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

async function deleteClientLocation(email){

    const prestashopUrl=process.env.shopLocationUrl;
    const prestashopApiKey=process.env.shopLocationApiKey;

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


module.exports = {
    addClient,
    getClient,
    getAllProducts,
    updatePasswordClient,
    deleteClient,
    updateClient,
    getAllCategories,
    getAllManufactures,
    getAllSuppliers,
    getProduct,
    getImagesProduct,
    update,
    addClientLocation,
    updateLocation,
    updatePasswordClientLocation,
    updateClientLocation,
    deleteClientLocation
  };