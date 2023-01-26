const router = require('express').Router();
const userController = require('../../controllers/controller');
// const { verifyToken } = require('../../authentication/auth');





// /**
//  * @swagger
//  * /api/v1/user/register:
//  *  post:
//  *    tags:
//  *       - USER
//  *    produces:
//  *      - application/json
//  *    parameters:
//  *       - name: iconSrc
//  *         description: iconSrc
//  *         in: formData
//  *         required: false
//  *       - name: theme
//  *         description: theme
//  *         in: formData
//  *         required: false
//  *       - name: name
//  *         description: name  
//  *         in: formData
//  *         required: false
//  *       - name: email
//  *         description: email
//  *         in: formData
//  *         required: false
//  *       - name: message
//  *         description: message
//  *         in: formData
//  *         required: true
//  *       - name: password
//  *         description: password
//  *         in: formData
//  *         required: false
//  *       - name: userName
//  *         description: userName
//  *         in: formData
//  *         required: false
//  *       - name: publicDidEndPoint
//  *         description: publicDidEndPoint
//  *         in: formData
//  *         required: false
//  *       - name: rustLog
//  *         description: rustLog
//  *         in: formData
//  *         required: false
//  *       - name: testPoolIp
//  *         description: testPoolIp
//  *         in: formData
//  *         required: false
//  *    responses:
//  *       200:
//  *         description: Thanks, You have successfully signed up.
//  *       409:
//  *         description: This mobile email/mobileNumber already exists.
//  *       500:
//  *         description: Internal Server Error.   
//  */

router.post('/register', userController.register)
// router.post('/login', userController.login)
// router.get('/profile', verifyToken, userController.profile)
// router.get('/writeData', verifyToken, userController.writeData)








// /**
//  * @swagger
//  * /api/v1/user/profile:
//  *  get:
//  *    tags:
//  *       - USER
//  *    produces:
//  *      - application/json
//  *    parameters:
//  *       - name: token
//  *         description: token
//  *         in: header
//  *         required: true
//  *    responses:
//  *       200:
//  *         description: Details have been fetched successfully.
//  *       404:
//  *         description: Requested data not found.
//  *       500:
//  *         description: Internal Server Error.   
//  */

// router.get('/profile', auth.verifyToken, userController.profile);






module.exports = router;
