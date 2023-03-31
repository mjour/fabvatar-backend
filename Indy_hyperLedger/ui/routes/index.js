const path = require('path');
const uuid = require('uuid');
const express = require('express');
const prettyStringify = require('json-stringify-pretty-compact');
const router = express.Router();
const indy = require('../../indy/index');
const config = require('../../config');
const messageParsers = require('../messageParsers');
const auth = require('../authentication');
const messageTypes = {
    connections: indy.connections.MESSAGE_TYPES,
    credentials: indy.credentials.MESSAGE_TYPES,
    proofs: indy.proofs.MESSAGE_TYPES
};

const THEME = process.env["THEME"] || "black"

/* GET home page. */
router.get('/', auth.isLoggedIn, async function (req, res) {
    // res.sendFile(path.join(__dirname + '/../views/index.html'));
    let rawMessages = indy.store.messages.getAll();
    let messages = [];
    for (let message of rawMessages) {
        console.log("message ==================================|  ", message)
        if (message.message !== undefined && message.message.type !== undefined) {
            if (messageParsers[message.message.type]) {
                messages.push(await messageParsers[message.message.type](message));
            } else {
                messages.push(message);
            }

        }
    }

    let proofRequests = await indy.proofs.getProofRequests(true);
    for(let prKey of Object.keys(proofRequests)) {
        proofRequests[prKey].string = prettyStringify(proofRequests[prKey]);
    }
    
    let images = [];

    let credentials = await indy.credentials.getAll();
    if (credentials) {
        credentials.map((item,index)=>{
            Object.keys(item.attrs).map(attr=>{
                if (attr.includes('photo_url')) {
                    let photo_url = attr.replace("photo_url:", "");
                    credentials[index].attrs['photo_url'] = photo_url;
                    images.push(photo_url);
                    delete credentials[index].attrs[attr];
                }
            })
        })
    }
    console.log("credentials = ", credentials)

    let relationships = await indy.pairwise.getAll();
    let schemas = await indy.issuer.getSchemas();

    // if (schemas && config.userInformation.name == "Issuer Agency")  {
        schemas.map(item => {
            item.attrNames.map(attr=>{
                if (attr.includes('photo_url')) {
                    let photo_url = attr.replace("photo_url:", "");
                    images.push(photo_url);
                }
            })
        })
    // }
    console.log("images = ", images)

    res.render('index', {
        messages: messages,
        messageTypes: messageTypes,
        relationships: relationships,
        credentials: credentials,
        schemas,
        credentialDefinitions: await indy.did.getEndpointDidAttribute('credential_definitions'),
        endpointDid: await indy.did.getEndpointDid(),
        proofRequests: proofRequests,
        name: config.userInformation.name,
        srcId: config.userInformation.icon_src,
        images,
        theme: THEME
    });

    for(let prKey of Object.keys(proofRequests)) {
        delete proofRequests[prKey].string;
    }
});



router.post('/login', async function(req, res) {
    if(req.body.username === config.userInformation.username &&
    req.body.password === config.userInformation.password) {
        let token = uuid();
        req.session.token = token;
        req.session.save((err) => {
            auth.validTokens.push(token);
            res.redirect('/');
        });
    } else {
        res.redirect('/login?msg=Authentication Failed. Please try again.');
    }
});

router.get('/logout', async function(req, res, next) {
    for(let i = 0; i < auth.validTokens.length; i++) {
        if(auth.validTokens[i] === req.session.token) {
            auth.validTokens.splice(i, 1);
        }
    }
    req.session.destroy(function(err) {
        if(err) {
            console.error(err);
        } else {
            auth.session = null;
            res.redirect('/login');
        }
    });
});

module.exports = router;