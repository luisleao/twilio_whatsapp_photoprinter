const { getPrinters, getDetaultPrinter, print } = require('pdf-to-printer');
const { ASSET_FOREGROUD, ASSET_BACKGROUND, OFFSET_X, OFFSET_Y } = process.env;





const fs = require('fs');
const tmp_dir = require('os').tmpdir();

const PDFDocument = require('pdfkit');

const downloadPicture = async (imageUrl) => {
    const axios = require('axios');
    console.log('Downloading...', imageUrl);
    return await axios.get(imageUrl, 
        { responseType: 'arraybuffer' }
    ).then(r => {
        console.log('DOWNLOADED!');
        return Buffer.from(r.data, 'binary')
    });
}


const printPhoto = async (fileId, pictureUrl) => {
    if (!fs.existsSync(`printings/`)) {
        console.log(`Creating folder 'printings/'`);
        fs.mkdirSync(`printings/`);
    }
    
    let BACKGROUND = fs.existsSync(`assets/${ASSET_BACKGROUND}`) ? `assets/${ASSET_BACKGROUND}` : null;
    let FOREGROUD = fs.existsSync(`assets/${ASSET_FOREGROUD}`) ? `assets/${ASSET_FOREGROUD}` : null;

    // const fileName = pictureUrl.split('/').reverse()[0]
    const pictureBin = await downloadPicture(pictureUrl);

    // TODO: verify if printer exists
    const width = 100/10;
    const height = 148/10;

    const doc = new PDFDocument({
        size: [width * 28.3465, height * 28.3465],
        // size: 'A6', 
        // size: [1748, 2480], 
        // size: [100, 148], 
        layout: 'portrait', //'landscape', 
        margins: {
          top: 0, bottom: 0, left: 0, right: 0
        }
    });

    const file = `./printings/${fileId}.pdf`;

    // verificar se arquivo já existe - bugfix: impressao duplicada
    if (fs.existsSync(file)) {
        console.log('!!! FILE ALREADY EXISTS !!! Removing...:', file)
        fs.rmSync(file);
    }

    const stream = doc.pipe(fs.createWriteStream(file));

    doc.info['Title'] = pictureUrl;

    if (BACKGROUND) {
        doc
            .moveTo(0, 0)
            .image(BACKGROUND, 0, 0, {width: doc.page.width, height: doc.page.height});
    }

    doc
        .moveTo(0, 0)
        .image(pictureBin, OFFSET_X, 0, { 
            // fit: [doc.page.width - (OFFSET_X * 2), doc.page.height], 
            cover:  [doc.page.width - (OFFSET_X * 2), doc.page.height], 
            align: 'center', 
            valign: 'center'
        });

    if (FOREGROUD) {
        doc
            .moveTo(0, 0)
            .image(FOREGROUD, 0, 0, {width: doc.page.width, height: doc.page.height});
    }

    doc.end();
    
    stream.on('finish', async function() {
        console.log('PDF COMPLETED. Printing...');
        
        const options = {
            // printer: 'PRINTER_NAME_HERE',
            printDialog: false,
            paperSize: '(6x4)',
            silent: true,
            orientation: 'landscape',
            scale: 'fit'
        }
    
        await print(file, options).then(res => {
            console.log('result', res);
        }).catch(err => {
            return false
        })

    });

    return true;

}

module.exports = {
    printPhoto
}