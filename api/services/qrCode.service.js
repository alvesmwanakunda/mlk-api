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
    }
}