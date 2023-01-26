const mongoose = require('mongoose');
const schema = mongoose.Schema;
const tableName = 'user';
const options = {
    collection: tableName,
    timestamps: true
};

const userSchema = new schema({
    iconSrc: {
        type: String
    },
    theme: {
        type: String
    },
    name: {
        type: String
    },
    email: {
        type: String
    },
    message: {
        type: String
    },
    password: {
        type: String
    },
    port: {
        type: Number
    },
    userName: {
        type: String
    },
    publicDidEndPoint: {
        type: String
    },
    rustLog: {
        type: String
    },
    testPoolIp: {
        type: String
    },
    qrCode: { type: String },
    isQRGenerated: { type: Boolean, default: false },
    isFirstTime: { type: Boolean, default: true },
    otp: { type: Number },
    otpTime: { type: Number },
    otpVerification: { type: Boolean, default: false },
    userType: { type: String, default: "User", enum: ["User", "Issuer", "Verifier"] }
}, options);

module.exports = mongoose.model(tableName, userSchema);

(async () => {
    try {
        const result = await mongoose.model(tableName, userSchema).find({ userType: { $in: ["Issuer", "Verifier"] } });
        if (result.length != 0) {
            console.log("Default Issuer and Verifier 😀 .");
        } else {
            const obj1 = {
                "iconSrc": "https://cdn2.iconfinder.com/data/icons/bubble-education-icons-1/360/School-512.png",
                "theme": "https://cdn2.iconfinder.com/data/icons/bubble-education-icons-1/360/School-512.png",
                "name": "Issuer Agency",
                "email": "issuer@issuer.com",
                "message": "Issuer of the platform",
                "password": "$2a$10$hPvK5u2LdJNPxEQlKxbLv.aEL6kXnPiBIvJDFGk3kfxRHPhkf4AXi",
                "port": 3000,
                "userName": "Issuer",
                "testPoolIp": "173.17.0.150",
                "isQRGenerated": false,
                "otpVerification": true,
                "userType": "Issuer",
            }
            const obj2 = {
                "iconSrc": "https://cdn2.iconfinder.com/data/icons/bubble-education-icons-1/360/School-512.png",
                "theme": "https://cdn2.iconfinder.com/data/icons/bubble-education-icons-1/360/School-512.png",
                "name": "Verifier Agency",
                "email": "verifier@verifier.com",
                "message": "Verifier of the platform",
                "password": "$2a$10$hPvK5u2LdJNPxEQlKxbLv.aEL6kXnPiBIvJDFGk3kfxRHPhkf4AXi",
                "port": 3001,
                "userName": "Verifier",
                "testPoolIp": "173.17.0.151",
                "isQRGenerated": false,
                "otpVerification": true,
                "userType": "Verifier",
            }
            const createdRes = await mongoose.model(tableName, userSchema).create(obj1, obj2);
            if (createdRes) {
                console.log("DEFAULT Issuer and Verifier Created 😀 ", createdRes);
            }
        }
    } catch (error) {
        console.log("Admin error===>>", error);
    }
}).call();





