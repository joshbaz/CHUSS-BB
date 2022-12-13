const express = require('express')
const router = express.Router()
const opponentController = require('../controllers/opponent')
const multer = require('multer')
const { GridFsStorage } = require('multer-gridfs-storage')

const isAuth = require('../middleware/is-auth')

const path = require('path')
const crypto = require('crypto')
const mongoose = require('mongoose')

require('dotenv').config()
const mongoUri = process.env.MONGO_R_URL

const conn = mongoose.createConnection(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})

let gfs

conn.once('open', () => {
    gfs = new mongoose.mongo.GridFSBucket(conn.db, {
        bucketName: 'chussfiles',
    })
})

const storage = new GridFsStorage({
    url: mongoUri,
    options: {
        useUnifiedTopology: true,
    },
    file: (req, file) => {
        return new Promise((resolve, reject) => {
            crypto.randomBytes(16, (err, buf) => {
                if (err) {
                    return reject(err)
                }
                const filename =
                    buf.toString('hex') + path.extname(file.originalname)
                const filesExtenstions = path.extname(file.originalname)
                const extractNameOnly = path.basename(
                    file.originalname,
                    filesExtenstions
                )
                const fileInfo = {
                    filename: filename,
                    bucketName: 'chussfiles',
                    filesExtensions: filesExtenstions,
                    metadata: {
                        name: extractNameOnly,
                    },
                }
                resolve(fileInfo)
            })
        })
    },
})

const store = multer({
    storage: storage,
    // fileFilter: function (req, file, cb) {
    //     checkFileType(file, cb)
    // },
})

// function checkFileType(file, cb) {
//     const filetypes = /pdf|jpg|png|gif/
//     const extname = filetypes.test(
//         path.extname(file.originalname).toLowerCase()
//     )
//     const mimetype = filetypes.test(file.mimetype)
//     if (mimetype && extname) return cb(null, true)
//     cb('filetype')
// }

const uploadMiddleware = (req, res, next) => {
    const upload = store.array('projectFiles')
    // console.log('upload', upload)
    upload(req, res, function (err) {
        //     console.log('we are here')
        if (err instanceof multer.MulterError) {
            return res.status(400).send('File too large')
        } else if (err) {
            if (err === 'filetype')
                return res.status(400).send('Documents only')
            return res.sendStatus(500)
        }
        next()
    })
}

router.post(
    '/v1/project/create/:pid',
    //isAuth,
    uploadMiddleware,
    opponentController.createProjectOpponent
)

router.post(
    '/v1/project/assign/:pid',
    //isAuth,
    opponentController.assignOpponent
)

/** get all opponent */
router.get('/v1/getall', 
//isAuth, 
opponentController.getAllOpponents)

/** get individual opponent */
router.get(
    '/v1/individual/:id',
    //isAuth,
    opponentController.getIndividualOpponent
)

/** get paginated examiners */
router.get('/v1/popponents', 
//isAuth, 
opponentController.getPaginatedOpponents)

/** delete project App letter */
router.patch(
    '/v1/letter/projectopponent/delete/:pid/:fid',
    //isAuth,
    opponentController.deleteProjectAppLetter
)

router.patch(
    '/v1/letter/projectopponent/add/:pid/:eid',
    //isAuth,
    uploadMiddleware,
    opponentController.createProjectAppOpponentFile
)

router.patch(
    '/v1/projectopponent/remove/:pid/:eid/:secid',
    //isAuth,
    opponentController.removeProjectOpponentsR
)

module.exports = router
