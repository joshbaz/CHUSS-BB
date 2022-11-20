const express = require('express')
const router = express.Router()
const examinerReport = require('../controllers/examinerReports')

const multer = require('multer')
const { GridFsStorage } = require('multer-gridfs-storage')
const Grid = require('gridfs-stream')

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
        console.log(file, 'fs', req.body.score)
        return new Promise((resolve, reject) => {
            crypto.randomBytes(16, (err, buf) => {
                if (err) {
                    console.log('errors', err)
                    return reject(err)
                }
                const filename =
                    buf.toString('hex') + path.extname(file.originalname)
                const filesExtenstions = path.extname(file.originalname)
                console.log('extensiond', path.extname(file.originalname))
                const fileInfo = {
                    filename: filename,
                    bucketName: 'chussfiles',
                    filesExtensions: filesExtenstions,
                    metadata: req.body,
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

const uploadMiddleware = (req, res, next) => {
    const upload = store.single('reportssFiles')
    console.log('upload', upload)
    upload(req, res, function (err) {
        console.log('we are here')
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
router.patch(
    '/v1/update/:rid',
    uploadMiddleware,
    examinerReport.updateExaminerReport
)
router.get('/v1/getReport/:rid', examinerReport.getExaminerReport)
/** get all reports */
router.get('/v1/allexaminerReports', examinerReport.getAllExaminerReports)
module.exports = router
