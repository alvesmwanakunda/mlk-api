const QRCode = require('qrcode');
const { createCanvas, loadImage} = require('canvas')

module.exports={

    module_qrcode:async(module,width,cwidth)=>{

        //console.log("Module s", module);

        const canvas = createCanvas(width,width);
        const url = `https://mlka.app/modules/${module}`;
        QRCode.toCanvas(
            canvas,
            url,
            {
                errorCorrectionLevel:"H",
                margin:1,
                color:{
                    dark:"#000000",
                    light:"#ffffff"
                }
            }
        );
        return canvas.toDataURL("image/png")
    },

    // Pour recuperer plusieurs qrcode des modules
    
    modules_qrcodes: async (moduleIds, width = 200) => {
        try {
            const qrcodes = await Promise.all(
                moduleIds.map(async (moduleId) => {
                    const canvas = createCanvas(width, width);
                    const url = `https://mlka.app/modules/${moduleId}`;
                    
                    await QRCode.toCanvas(
                        canvas,
                        url,
                        {
                            errorCorrectionLevel: "H",
                            margin: 1,
                            color: {
                                dark: "#000000",
                                light: "#ffffff"
                            }
                        }
                    );
                    
                    return {
                        moduleId: moduleId,
                        qrcode: canvas.toDataURL("image/png")
                    };
                })
            );
            
            return qrcodes;
        } catch (error) {
            throw new Error(`Erreur lors de la génération des QR codes: ${error.message}`);
        }
    }
}