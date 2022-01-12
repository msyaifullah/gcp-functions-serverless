require('@google-cloud/debug-agent');
const Storage = require('@google-cloud/storage');
const PdfPrinter = require('pdfmake/src/printer');
const uuidv4 = require('uuid/v4');
const Google = require('googleapis');
const BUCKET = 'ms-pdf-bucket'; // Replace with name of your bucket
/*------------------------------------------------------
- verify if the access token is valid or not
- create pdf
- store pdf on bucket 
--------------------------------------------------------*/
function getAccessToken(header) {
    if (header) {
        let match = header.match(/^Bearer\s+([^\s]+)$/);
        if (match) {
            return match[1];
        }
    }
    return null;
}

function createPDF() {
// Return a new promise.
    return new Promise(function (resolve, reject) {
        let pdfCreation = false;
        let docDefinition = {
            pageSize: 'A4',
            pageMargins: [40, 60, 40, 60],
            content: [
                'First paragraph',
                'Another paragraph, this time a little bit longer to make sure, this line will be divided into at least two lines'
            ]
        };
        const fontDescriptors = {
            Roboto: {
                normal: './fonts/Roboto-Regular.ttf',
                bold: './fonts/Roboto-Medium.ttf',
                italics: './fonts/Roboto-Italic.ttf',
                bolditalics: './fonts/Roboto-MediumItalic.ttf',
            }
        };
        const printer = new PdfPrinter(fontDescriptors);
        const pdfDoc = printer.createPdfKitDocument(docDefinition);
        const storage = new Storage();
        let file_name = uuidv4() + '.pdf';
        const myPdfFile = storage.bucket(BUCKET).file(file_name);
        pdfDoc
            .pipe(myPdfFile.createWriteStream())
            .on('finish', function () {
                console.log('Pdf successfully created!');
                resolve(file_name);
            })
            .on('error', function (err) {
                console.log('Error during the wirtestream operation in the new file');
                reject('Error: something goes wrong ! ' + err);
            });
        pdfDoc.end();
    });
}

function authorized(res) {
    createPDF()
        .then(function (file_name) {
            res.status(200).send("The request was successfully authorized and pdf generated.\n You can find your pdf in the cloud storage " + file_name);
        })
        .catch(function (error) {
            console.error("Failed!" + error);
            res.status(400).send("Error: Pdf generation failed!");
        });
}

/**
 * Cloud Function.
 *
 * @param {Object} req Cloud Function request context.
 * @param {Object} res Cloud Function response context.
 */
exports.pdfGeneratorNode = function pdfGeneratorNode(req, res) {
    console.log('this is the request');
    console.log(req);

    var accessToken = getAccessToken(req.get('Authorization'));
    var oauth = new Google.auth.OAuth2();
    oauth.setCredentials({access_token: accessToken});
    var permission = 'storage.buckets.get';
    var gcs = Google.storage('v1');
    gcs.buckets.testIamPermissions(
        {bucket: BUCKET, permissions: [permission], auth: oauth}, {},
        function (err, response) {
            if (response && response['permissions'] && response['permissions'].includes(permission)) {
                authorized(res);
            } else {
                console.log('---Error below---');
                console.log(err);
                res.status(403).send({error: 'The request is forbidden.'});
            }
        });
};