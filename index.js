const path = require('path');
const fs = require('fs');
const { MongoClient } = require('mongodb')
const Tesseract =  require('tesseract.js');
const PDFDocument = require('pdfkit')
const sizeOf = require('image-size')
//joining path of directory 
const directoryPath = __dirname;



const url = 'mongodb://localhost:27017';
const dbName = 'DivorceStuff';


const client = new MongoClient(url)


//passsing directoryPath and callback function
fs.readdir(directoryPath, function (err, files) {
    //handling error
    if (err) {
        return console.log('Unable to scan directory: ' + err);
    } 
    //listing all files using forEach
    files.forEach(async function (file) {
        if(path.extname(file) == '.png'){
            console.log("files being processed: "+file)

            function run(file) {
                    const db = client.db("DivorceStuff")
                    const table = db.collection('OCReader')

                    Tesseract.recognize(
                        file,
                        'eng'
                        // { logger: m => console.log(m) }
                    ).then(async ({ data: { text } }) => {
                        let filenameonly = path.parse(file).name
                        const dimensions = sizeOf(file);
                        const newRecord =
                            {
                                name: file,
                                summary: text,
                                size: [dimensions.width, dimensions.height],
                                timeScraped: new Date()
                            };
                        const insert = await table.insertOne(newRecord);
                        console.log(`We scraped a picture, the result was created with the following id: ${insert.insertedId}`);
                        console.log("dims: " + dimensions.width, dimensions.height)
                        const dimw = dimensions.width;
                        // const dimw = 55
                        const dimh = dimensions.height;
                        // const dimh = 255
                        const doc = new PDFDocument({
                            size: [dimw,dimh],
                            margins: {
                                top:10,
                                bottom:10,
                                left:10,
                                right:10
                            }
                        });
                        doc.pipe(fs.createWriteStream(filenameonly +'.pdf'));
                        doc.image(file);
                        doc.end();
                    })
                    

                }
                run(file)

            //Because we need to have the data from the generator to put the text in, we are placing the insert here. This is probably blocking and will have some issues, but this is a rapid develop, not a polish
            //Lawyer Needs this quickly
        }
         
    });
});

