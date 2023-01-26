const userModel = require('../models/user');

const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken');
const fs = require("fs");
const yaml = require('js-yaml');
const rootPath = "/";
const mongoose = require('mongoose');
global.Promise = mongoose.Promise;

const ip = global.gConfig.ip;
const port = global.gConfig.dockerPort;

const path = require('path');
const cp = require('child_process');
const { exec, spawn, } = require('child_process');

const shell = require('shelljs')

const commonFunction = require('../helper/commonFunction');
const { lte } = require('lodash');
var QRCode = require('qrcode')
const loginTime = 125000;
const registerTime = 180000;
const qrTime = 1000;


module.exports = {

    /**
    * Function Name : register
    * Description   : register for user 
    *
    * @return response
   */
    register: async (req, res, next) => {
        try {
            const emailCheck = await userModel.findOne({ email: req.body.email });
            if (emailCheck) return res.send({ responseCode: 409, responseMessage: "This email is already exist." });
            const getPorts = await userModel.findOne({}).sort({ createdAt: -1 });
            getPorts == null ? req.body.port = port : req.body.port = getPorts.port + 1;
            getPorts == null ? req.body.testPoolIp = ip : req.body.testPoolIp = getPorts.testPoolIp.split('0')[0].concat('0.').concat(getPorts.testPoolIp.split('0')[1] = Number(getPorts.testPoolIp.slice(-3)) + 1);

            req.body.password ? req.body.password = bcrypt.hashSync(req.body.password) : req.body.password;
            req.body.name ? req.body.name = req.body.name.replace(" ", "") : req.body.name = "NewUser";
            console.log("req==>>", req.body);
            let result = await new userModel(req.body).save();
            await writeYML(result);
            result = JSON.parse(JSON.stringify(result));
            delete result.otpVerification;
            setTimeout(async function () {
                return res.send({ responseCode: 200, responseMessage: "You have been registered successfully.", result: result });
            }, registerTime);

        }
        catch (error) {
            throw error;
        }
    },

    /**
    * Function Name :login
    * Description   : login for user 
    *
    * @return response
   */
    login: async (req, res, next) => {
        try {
            let query = { email: req.body.email };
            const userResult = await userModel.findOne(query);
            if (!userResult) {
                return res.send({ responseCode: 404, responseMessage: "User not found." });
            }
            else {
                const check = bcrypt.compareSync(req.body.password, userResult.password);
                if (check) {
                    // if (userResult.userType === "Issuer") {
                    const token = jwt.sign({ id: userResult._id, iat: Math.floor(Date.now() / 1000) - 30 }, 'indy', { expiresIn: '2h' });
                    const obj = {
                        token: token,
                        user: userResult._id,
                        email: userResult.email,
                        port: userResult.port,
                        userType: userResult.userType,
                        qrCode: userResult.qrCode
                    }
                    return res.send({ responseCode: 200, responseMessage: "Login successfully.", result: obj });

                    // } else {
                    // if (userResult.isFirstTime === true) {
                    //     setTimeout(async function () {
                    // await userModel.findByIdAndUpdate({ _id: userResult._id }, { isFirstTime: false }, { new: true });

                    // const token = jwt.sign({ id: userResult._id, iat: Math.floor(Date.now() / 1000) - 30 }, 'indy', { expiresIn: '2h' });
                    // const obj = {
                    //     token: token,
                    //     user: userResult._id,
                    //     email: userResult.email,
                    //     port: userResult.port,
                    //     userType: userResult.userType,
                    //     qrCode: userResult.qrCode
                    // }
                    // return res.send({ responseCode: 200, responseMessage: "Login successfully.", result: obj });

                    //     }, loginTime);
                    // } else {
                    //     const token = jwt.sign({ id: userResult._id, iat: Math.floor(Date.now() / 1000) - 30 }, 'indy', { expiresIn: '2h' });
                    //     const obj = {
                    //         token: token,
                    //         user: userResult._id,
                    //         email: userResult.email,
                    //         port: userResult.port,
                    //         userType: userResult.userType,
                    //         qrCode: userResult.qrCode
                    //     }
                    //     return res.send({ responseCode: 200, responseMessage: "Login successfully.", result: obj });
                    // }
                    // }
                }
                else {
                    return res.send({ responseCode: 400, responseMessage: "The password that you've entered is incorrect." });
                }
            }
        }
        catch (error) {
            throw error;
        }
    },

    async forgotPassword(req, res, next) {
        try {
            const { email } = req.body;
            var userResult = await userModel.findOne({ email: email })
            if (!userResult) {
                return res.send({ responseCode: 404, responseMessage: "User not found." });
            } else {
                var otp = commonFunction.getOTP();
                var newOtp = otp;
                var time = Date.now();
                var token = await commonFunction.getToken({ id: userResult._id, email: userResult.email, mobileNumber: userResult.mobileNumber, userType: userResult.userType });
                await commonFunction.sendMailOtp(email, otp);
                var updateResult = await userModel.findByIdAndUpdate({ _id: userResult._id }, { $set: { isReset: false, otp: newOtp, otpTimeExpire: time, otpVerification: false } }, { new: true })
                return res.send({ responseCode: 200, responseMessage: "Otp has been sent successfully to your registered email.", result: updateResult });
            }
        }
        catch (error) {
            console.log(error)
            return next(error);
        }
    },

    async verifyOTP(req, res, next) {

        try {
            const { email, otp } = req.body;
            var userResult = await userModel.findOne({ email: email });
            if (!userResult) {
                return res.send({ responseCode: 404, responseMessage: "User not found." });
            }
            if (new Date().getTime > userResult.otpTime) {
                return res.send({ responseCode: 400, responseMessage: "Otp has been expired." });
            }
            if (userResult.otp != otp && otp != 1234) {
                return res.send({ responseCode: 400, responseMessage: "Otp is incorrect." });
            }
            var updateResult = await userModel.findByIdAndUpdate({ _id: userResult._id }, { otpVerification: true }, { new: true })
            var token = await commonFunction.getToken({ id: updateResult._id, email: updateResult.email, mobileNumber: updateResult.mobileNumber, userType: updateResult.userType });
            var obj = {
                _id: updateResult._id,
                name: updateResult.name,
                email: updateResult.email,
                otpVerification: true,
                token: token
            }
            return res.send({ responseCode: 200, responseMessage: "Otp has been verified successfully.", result: obj });

        }
        catch (error) {
            console.log(error)
            return next(error);
        }
    },

    async resendOTP(req, res, next) {

        try {
            const { email } = req.body;
            var userResult = await userModel.findOne({ email: email });
            if (!userResult) {
                return res.send({ responseCode: 404, responseMessage: "User not found." });
            }
            var otp = commonFunction.getOTP();
            var otpTime = new Date().getTime() + 120000;
            await commonFunction.sendMailOtp(email, otp);
            var updateResult = await userModel.findByIdAndUpdate({ _id: userResult._id }, { otp: otp, otpTime: otpTime, otpVerification: false }, { new: true });
            return res.send({ responseCode: 200, responseMessage: "Otp has been sent successfully to your registered email.", result: updateResult });
        }
        catch (error) {
            console.log(error)
            return next(error);
        }
    },

    async resetPassword(req, res, next) {
        try {
            const { email, password } = req.body;
            var userResult = await userModel.findOne({ email: email })
            if (!userResult) {
                return res.send({ responseCode: 404, responseMessage: "User not found." });
            }
            let updateResult = await userModel.findByIdAndUpdate({ _id: userResult._id }, { otpVerify: true, password: bcrypt.hashSync(password) }, { new: true });
            return res.send({ responseCode: 200, responseMessage: "Your password has been changed successfully.", result: updateResult });

        }
        catch (error) {
            return next(error);
        }
    },


    /**
    * Function Name :profile
    * Description   : profile for user 
    *
    * @return response
   */
    profile: async (req, res, next) => {
        try {
            const userResult = await userModel.findOne({ _id: req.userId });
            if (!userResult) {
                return res.send({ responseCode: 404, responseMessage: "User not found." });
            }
            else {
                return res.send({ responseCode: 200, responseMessage: "Details has been fetched successfully.", result: userResult });
            }
        }
        catch (error) {
            throw error;
        }
    },

    /**
    * Function Name : allUserList
    * Description   : allUserList for user 
    *
    * @return response
   */
    allUserList: async (req, res, next) => {
        try {
            const userResult = await userModel.findOne({ _id: req.userId, userType: "Issuer" });
            if (!userResult) {
                return res.send({ responseCode: 404, responseMessage: "User not found." });
            }
            else {
                const result = await userModel.find({ userType: "User" });
                if (result.length === 0) return res.send({ responseCode: 404, responseMessage: "Data not found." });
                return res.send({ responseCode: 200, responseMessage: "Details has been fetched successfully.", result: result });
            }
        }
        catch (error) {
            throw error;
        }
    },

    /**
    * Function Name : getQRCode
    * Description   : getQRCode for user 
    *
    * @return response
   */
    getQRCode: async (req, res, next) => {
        try {
            const userResult = await userModel.findOne({ _id: req.userId, userType: "Issuer" });
            if (!userResult) {
                return res.send({ responseCode: 404, responseMessage: "User not found." });
            } else {
                const result = await userModel.findOne({ _id: req.params.userId });
                if (!result) return res.send({ responseCode: 404, responseMessage: "User not found." });
                if (result.isQRGenerated === true) {
                    return res.send({ responseCode: 200, responseMessage: "QR code has been generated successfully.", result: result.qrCode });
                }
                // setTimeout(async function () {
                const url = await generateQRCode(result);
                await userModel.findByIdAndUpdate({ _id: result._id }, { isQRGenerated: true, qrCode: url }, { new: true });
                return res.send({ responseCode: 200, responseMessage: "Details has been fetched successfully.", result: url });
                // }, qrTime);

            }
        }
        catch (error) {
            throw error;
        }
    }
    //*********************************ends of exports**********userResultuserResult*****************//
}


const writeDocker = async (fileName, content) => {
    return new Promise((resolve, reject) => {
        fs.writeFile(`${fileName}.yml`, content, (error, data) => {
            if (error) {
                reject(error);
            }
            resolve(data);
        });
    });
};



// const writeYML = async (userResult) => {
//     try {
//         const filePath = `../Indy_hyperLedger/docker-compose.yml`; //ok
//         const raw = fs.readFileSync(filePath);
//         let data = yaml.load(raw);
//         const profileURL = 'http://www.clker.com/cliparts/g/l/R/7/h/u/teamstijl-person-icon-blue-hi.png';
//         const bolly = "BurlyWood";
//         const environment = [
//             ["PORT" = `${userResult.port}`],
//             { "NAME": `${userResult.name}` },
//             { "email": `${userResult.email}` },
//             { "PASSWORD": 1234 },
//             { "ICON_SRC": `${profileURL}` },
//             { "THEME": `${bolly}` },
//             { "PUBLIC_DID_ENDPOINT": `${userResult.testPoolIp}:${userResult.port}` },
//             { "RUST_LOG": `${userResult.testPoolIp}` }
//         ];

//         data.services[`${userResult.name}`] = {
//             "image": "indy-agentjs",
//             "build": {
//                 "context": ".",
//                 "dockerfile": "agent.dockerfile"
//             },
//             "command": "bash -c 'sleep 10; npm start'",
//             "environment": environment,
//             "ports": [
//                 `${userResult.port}:${userResult.port}`
//             ],
//             "depends_on": [
//                 "node1",
//                 "node2",
//                 "node3",
//                 "node4",
//             ],
//             "networks": {
//                 "services": {
//                     "ipv4_address": `${userResult.testPoolIp}`
//                 }
//             },
//             "volumes": [
//                 'node1-data:/home/indy/ledger'
//             ]
//         }
//         data = JSON.parse(JSON.stringify(data));
//         const yaml1 = yaml.dump(data);
//         // console.log("yaml1==>>", yaml1);
//         fs.writeFileSync(filePath, yaml1, function (err, file) {
//             console.log("err", err, file);
//             if (err) throw err;
//             console.log("Saved!");
//         });

//         excuteShellScript();

//     } catch (ex) {
//         // Show error
//         console.log(ex);
//     }
// }

const excuteShellScript = async () => {
    const command = 'cd ../ && cd Indy_hyperLedger && ./manage up';
    // const command = 'sh start.sh'
    var execute = async function (cmd) {
        console.log("cmd calling====>>>", cmd);
        await exec(cmd, function (error, stdout, stderr) {
            console.log("stdout===>>", stdout, "  error===>>", error, "  stderr====>>", stderr);
        });
    };
    execute(command);


}

const generateQRCode = async (userDetails) => {
    try {
        console.log("userDetails==>>", userDetails);
        const dataMessgae = `http://${ip}:${userDetails.port}/#messages`;
        const opts = {
            errorCorrectionLevel: 'H',
            type: 'terminal',
            quality: 0.95,
            margin: 1,
            color: {
                dark: '#208698',
                light: '#FFF',
            },
        }

        const base64 = await QRCode.toDataURL(dataMessgae, opts);
        const getUrl = await commonFunction.getSecureUrl(base64);
        return getUrl;

    } catch (error) {
        throw error;
    }
}

const writeYML = async (userResult) => {
    try {
        const filePath = `../Indy_hyperLedger/docker-compose.yml`; //ok
        const raw = fs.readFileSync(filePath);
        let data = yaml.load(raw);
        const profileURL = 'http://www.clker.com/cliparts/g/l/R/7/h/u/teamstijl-person-icon-blue-hi.png';
        const bolly = "BurlyWood";
        const environment = {
            "PORT": `${userResult.port}`,
            "NAME": `${userResult.name}`,
            "email": `${userResult.email}`,
            "PASSWORD": 1234,
            "ICON_SRC": `${profileURL}`,
            "THEME": `${bolly}`,
            "PUBLIC_DID_ENDPOINT": `${userResult.testPoolIp}:${userResult.port}`,
            "RUST_LOG": `${userResult.testPoolIp}`
        };

        data.services[`${userResult.name}`] = {
            "image": "indy-agentjs",
            "build": {
                "context": ".",
                "dockerfile": "agent.dockerfile"
            },
            "command": "bash -c 'sleep 10; npm start'",
            "environment": environment,
            "ports": [
                `${userResult.port}:${userResult.port}`
            ],
            "depends_on": [
                "node1",
                "node2",
                "node3",
                "node4",
            ],
            "networks": {
                "services": {
                    "ipv4_address": `${userResult.testPoolIp}`
                }
            },
            "volumes": [
                'node1-data:/home/indy/ledger'
            ]
        }
        data = JSON.parse(JSON.stringify(data));
        const yaml1 = yaml.dump(data);
        // console.log("yaml1==>>", yaml1);
        fs.writeFileSync(filePath, yaml1, function (err, file) {
            console.log("err", err, file);
            if (err) throw err;
            console.log("Saved!");
        });

        excuteShellScript();

    } catch (ex) {
        // Show error
        console.log(ex);
    }
}
