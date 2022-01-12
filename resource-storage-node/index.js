require('@google-cloud/debug-agent');
const Storage = require('@google-cloud/storage');
const uuidv4 = require('uuid/v4');
const Google = require('googleapis');
const jwt = require('jsonwebtoken');
const Busboy = require('busboy');

const BUCKET = 'ms-ruangimaji-lab-assets'; // Replace with name of your bucket
const BUCKET_FUNCTION = 'profiles'; //profiles, contents, apps-web, app-mobile
const PRIVATE_KEY = require("./ms-ruangimaji-lab-f930bbb30acc.json");
const SECRET_KEY = '7K]qDl->I&g=8aZ'; // Replace with your secret key

/*------------------------------------------------------
- verify if the access token is valid or not
- create image storage
- store image on bucket
--------------------------------------------------------*/
/**
 *
 * @param header
 * @returns {*}
 */
function getAccessToken(header) {
    if (header) {
        let match = header.match(/^Bearer\s+([^\s]+)$/);
        if (match) {
            return match[1];
        }
    }
    return null;
}

/**
 *
 * @param token
 * @param cb
 */
function decodeJWTToken(token, cb) {
    jwt.verify(token, SECRET_KEY, function (err, decoded) {
        cb(err, decoded)
    });
}

/**
 *
 * @param cb
 */
function getAccessTokenGoogle(cb) {
    let jwtClient = new Google.auth.JWT(
        PRIVATE_KEY.client_email, null, PRIVATE_KEY.private_key,
        [
            'https://www.googleapis.com/auth/cloud-platform',
            'https://www.googleapis.com/auth/devstorage.read_write',
            'https://www.googleapis.com/auth/devstorage.full_control'
        ]);

    //authenticate request
    jwtClient.authorize(cb);
}

/**
 *
 * @param req
 * @param res
 * @returns {Promise<any>}
 */
function createImageOnStorage(req, res) {

    return new Promise(function (resolve, reject) {

        const storage = new Storage();

        if (req.method === 'POST') {
            const busboy = new Busboy({headers: req.headers});

            // This code will process each non-file field in the form.
            busboy
                .on('field', (fieldname, val) => {
                    // TODO(developer): Process submitted field values here
                })
                // This code will process each file uploaded.
                .on('file', (fieldname, file, filename, encoding, mimetype) => {
                    console.log(`Processed file ${filename}`);
                    let id = uuidv4();


                    filename = BUCKET_FUNCTION + '/' + id + '/image.' + filename.split('.').pop();
                    // filename = BUCKET_FUNCTION + '/' + id + '/thumbnail.' + filename.split('.').pop();

                    const myImageFile = storage.bucket(BUCKET).file(filename);
                    file
                        .pipe(myImageFile.createWriteStream({
                            metadata: {
                                contentType: mimetype
                            }
                        }))
                        .on('finish', function () {
                            myImageFile.makePublic();
                            console.log('image successfully created!');
                            resolve(filename);
                        })
                        .on('error', function (err) {
                            console.log(err);
                            console.log('Error during the writestream operation in the new file');
                            reject('Error: something goes wrong ! ' + err);
                        });
                })
                .on('finish', () => {
                    // TODO(developer): Finish doing processing field values here
                })
                .end(req.rawBody);

            req.pipe(busboy)
        } else {
            reject('Error: Method not allowed');
        }
    });
}

/***
 *
 * @param req
 * @param res
 */

function authorized(req, res) {
    createImageOnStorage(req, res)
        .then(function (fileName) {
            res.status(200).send({
                data: {
                    message: "The request was successfully authorized and resource writen. You can find your file in the cloud storage ",
                    fileName: fileName
                },
                status: 'ok'
            });
        })
        .catch(function (error) {
            console.error("Failed!" + error);
            res.status(400).send(
                {
                    data: {
                        message: error
                    },
                    status: 'error'
                });
        });
}

/**
 * Cloud Function.
 *
 * @param {Object} req Cloud Function request context.
 * @param {Object} res Cloud Function response context.
 */
exports.resourceStorageNode = function resourceStorageNode(req, res) {

    // var accessToken = getAccessToken(req.get('Authorization'));
    //
    // decodeJWTToken(accessToken, function (err, decode) {
    //     if (err) res.status(400).send(err);
    //     else {
    //         authorized(res, decode.sub);
    //     }
    // });


    getAccessTokenGoogle(function (err, tokens) {
        if (err) res.status(400).send({data: {message: err}, status: 'error'});
        else {

            var oauth = new Google.auth.OAuth2();
            oauth.setCredentials({access_token: tokens.access_token});
            var permission = 'storage.buckets.get';
            var gcs = Google.storage('v1');
            gcs.buckets.testIamPermissions(
                {bucket: BUCKET, permissions: [permission], auth: oauth}, {},
                function (err, response) {
                    if (response && response['permissions'] && response['permissions'].includes(permission)) {
                        authorized(req, res);
                    } else {
                        console.log('---Error below---');
                        console.log(err);
                        res.status(403).send({error: 'The request is forbidden.'});
                    }
                });
        }
    });
};