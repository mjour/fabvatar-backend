const userModel = require('../models/user');


const jwt = require('jsonwebtoken');


module.exports = {

    /**
  * Function Name :verifyToken
  * Description   : verifyToken for user
  *
  * @return response
  */

    verifyToken: (req, res, next) => {
        if (!req.headers.token) {
            return res.send({ responseCode: 400, responseMessage: "Please provide token." });
        }
        else {
            jwt.verify(req.headers.token, 'indy', (err, result) => {
                if (err) {
                    return res.send({ responseCode: 405, responseMessage: "Invalid token" });
                }
                else {
                    userModel.findOne({ _id: result.id }, (error, userDetails) => {
                        if (error) {
                            return res.send({ responseCode: 500, responseMessage: "Internal server error" });
                        }
                        else if (!userDetails) {
                            return res.send({ responseCode: 404, responseMessage: "Data not found" });
                        }
                        else {
                            req.userId = result.id;
                            next();
                        }
                    })
                }
            })
        }
    },


}
