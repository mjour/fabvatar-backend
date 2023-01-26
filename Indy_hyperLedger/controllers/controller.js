const fs = require("fs");
const yaml = require('js-yaml');
const { exec } = require("child_process");
const usersPorts = require('../usersPorts/ports.json');
const portsDir = "usersPorts/"
var path = require('path');

module.exports = {

    /**
    * Function Name :register
    * Description   : register for user 
    *
    * @return response
   */
    register: async (req, res, next) => {
        try {
            const port = usersPorts.port;
            const ip = usersPorts.ip;
            const newPort = port + 1;
            const newIP = ip.split('0')[0].concat('0.').concat(ip.split('0')[1] = Number(ip.slice(-3)) + 1);
            req.body.port = port;
            req.body.testPoolIp = ip;


            await writeYML(req.body);
            const filePath = `${portsDir}ports`
            await writeJson(filePath, JSON.stringify({
                port: newPort,
                ip: newIP
            }))
            return res.send({ responseCode: 200, responseMessage: "You have been registered successfully.", result: req.body });
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
                    const token = jwt.sign({ id: userResult._id, iat: Math.floor(Date.now() / 1000) - 30 }, 'indy', { expiresIn: '2h' });
                    const obj = {
                        token: token,
                        user: userResult._id,
                        email: userResult.email
                    }
                    return res.send({ responseCode: 200, responseMessage: "Login successfully.", result: obj });
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
                return res.send({ responseCode: 200, responseMessage: "Details have been fetched successfully.", result: userResult });
            }
        }
        catch (error) {
            throw error;
        }
    },

    /**
    * Function Name :writeData
    * Description   : writeData for user 
    *
    * @return response
   */
    writeData: async (req, res, next) => {
        try {
            const userResult = await userModel.findOne({ _id: req.userId });
            if (!userResult) {
                return res.send({ responseCode: 404, responseMessage: "User not found." });
            }
            else {
                console.log("==>>", userResult);

                try {
                    const raw = fs.readFileSync("docker-compose.yml");
                    console.log("raw==>>", raw);
                    let data = yaml.load(raw);

                    // Show the YAML
                    console.log("data==>>>>", data);
                    data.services[`${userResult.name}`] = {
                        "image": "indy - agentjs",
                        "build": {
                            "context": ".",
                            "dockerfile": "agent.dockerfile"
                        },
                        "command": "bash -c 'sleep 10; npm start'",
                        "environment": [
                            '- PORT= 1951'
                        ],
                        "ports": [
                            // '-' + "1951": 1951
                            `- 1951: 1951`

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
                            '- node1-data:/home/indy/ledger'
                        ]
                    }
                    const yaml1 = yaml.dump(data);
                    fs.writeFileSync("docker-compose-test.yml", yaml1, function (err, file) {
                        if (err) throw err;
                        console.log("Saved!");
                    });

                } catch (ex) {
                    // Show error
                    console.log(ex);
                }

                // const doc = await yaml.safeLoad(fs.readFileSync('docker-compose-test.yml', 'utf8'));
                // console.log("doc==>>", doc);
                return res.send({ responseCode: 200, responseMessage: "Details have been written successfully.", result: userResult });
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

const writeJson = async (fileName, content) => {
    return new Promise((resolve, reject) => {
        fs.writeFile(`${fileName}.json`, content, (error, data) => {
            if (error) {
                reject(error);
            }
            resolve(data);
        });
    });
};

const writeYML = async (userResult) => {
    try {
        const raw = fs.readFileSync("docker-compose.yml");
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
        console.log("yaml1==>>", yaml1);
        fs.writeFileSync("docker-compose.yml", yaml1, function (err, file) {
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

const excuteShellScript = async () => {
    const path = `sudo ./manage up`;
    console.log("path==>>", path);
    exec(
        path,
        async (error, stdout, stderr) => {
            if (error) {
                console.log(`line no 251====>>>>: ${error.message}`);
                return;
            }
            if (stderr) {
                console.log("line no 256====>>", stderr);
            } else {
                console.log("257=====>>");
            }
        })
}


