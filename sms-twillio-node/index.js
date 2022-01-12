const fs = require('fs');
const request = require('request');
const uuidv4 = require('uuid/v4');
const jwt = require('jsonwebtoken');

/*------------------------------------------------------
- Configuration function
--------------------------------------------------------*/
const SECRET_KEY = '7K]qDl->I&g=8aZ'; // Replace with your secret key

const EXPIRATION_ACCESS_TOKEN = 60 * 60;
const SENDER_ID = 'sender-1234';
const RECIPIENT_ID = 'recipients-1234';
const RECIPIENT_URL = 'https://evodms-dev.clientsolve.com/evoDMSDev/api/api_event_all.php';

/*------------------------------------------------------
- verify if the access token is valid or not
- generate access token
- decode access token
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

function encodeJWTToken(user_id, sender_id, recipients_id) {
    let payload = {
        'exp': (Math.floor(Date.now() / 1000) - 30) + EXPIRATION_ACCESS_TOKEN,
        'iat': (Math.floor(Date.now() / 1000) - 30), //(issued at)
        'sub': user_id, //(subject)
        'iss': sender_id, //(issuer)
        // 'aud': recipients_id,(audience)
        'recipient': recipients_id //(audience)
    };
    return jwt.sign(payload, SECRET_KEY);
}

function decodeJWTToken(token, cb) {
    // invalid token
    console.log(SECRET_KEY);
    jwt.verify(token, SECRET_KEY, function (err, decoded) {
        cb(err, decoded)
    });
}


function getUserList(user_id) {
// Return a new promise.
    return new Promise(function (resolve, reject) {
        let token = encodeJWTToken(user_id, SENDER_ID, RECIPIENT_ID);
        request({
            url: RECIPIENT_URL,
            headers: {
                'Authorization': 'Bearer ' + token
            },
            rejectUnauthorized: false
        }, function (err, res) {
            if (err) {
                reject('Error: something goes wrong ! ' + err);
            } else {
                resolve(res.body);
            }

        });
    });
}

function authorized(res, user_id) {
    getUserList(user_id)
        .then(function (users) {
            res.status(200).send({'data': {'message': users}, 'status': 'error'});
        })
        .catch(function (error) {
            console.error("Failed!" + error);
            res.status(400).send({'data': {'message': 'Error: get user list failed!'}, 'status': 'error'});
        });
}

/**
 * Cloud Function.
 *
 * @param {Object} req Cloud Function request context.
 * @param {Object} res Cloud Function response context.
 */
exports.smsTwillioNode = function smsTwillioNode(req, res) {


    /*Continue with function code*/
    var accessToken = getAccessToken(req.get('Authorization'));
    // authorized(res);
    decodeJWTToken(accessToken, function (err, decode) {
        console.log(err);
        console.log(decode);
        //TODO: validate sender and recipient
        if (err) res.status(400).send(err);
        else {
            authorized(res, decode.sub);
        }
    });
    console.log()

    // res.status(400).send({'data': {'message': 'something error'}, 'status': 'error'});
};
