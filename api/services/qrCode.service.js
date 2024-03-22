const QRCode = require('qrcode');
const { createCanvas, loadImage} = require('canvas')

module.exports={

    module_qrcode:async(module,width,cwidth)=>{

        const canvas = createCanvas(width,width);
        QRCode.toCanvas(
            canvas,
            module,
            {
                errorCorrectionLevel:"H",
                margin:1,
                color:{
                    dark:"#243665",
                    light:"#ffffff"
                }
            }
        );
        return canvas.toDataURL("image/png")
    }
}