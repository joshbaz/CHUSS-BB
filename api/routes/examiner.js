const express = require('express')
const router = express.Router()
const examinerController = require('../controllers/examiner')
const multer = require('multer')
const { GridFsStorage } = require('multer-gridfs-storage')
const Grid = require('gridfs-stream')
const path = require('path')
const crypto = require('crypto')
const mongoose = require('mongoose')
require('dotenv').config()
const mongoUri = process.env.MONGO_L_URL

const conn = mongoose.createConnection(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})

let gfs

conn.once('open', () => {
    gfs = Grid(conn.db, mongoose.mongo)
    gfs.collection('projectFiless')
})

const storage = new GridFsStorage({
    url: mongoUri,
    options: {
        useUnifiedTopology: true,
    },
    file: (req, file) => {
        console.log('req.type', req.type)
        return new Promise((resolve, reject) => {
            crypto.randomBytes(16, (err, buff) => {
                if (err) {
                    return reject(err)
                }
                const filename =
                    buff.toString('hex') + path.extname(file.originalname)
                const fileInfo = {
                    filename: filename,
                    bucketName: 'projectFiless',
                    metadata: req.body,
                }
                resolve(fileInfo)
            })
        })
    },
})

const upload = multer({ storage })
router.post(
    '/v1/project/create/:pid',
    upload.single('myfiles'),
    examinerController.createProjectExaminer
)

router.post('/v1/project/assign/:pid', examinerController.assignExaminer)

/** get all examiners */
router.get('/v1/getall', examinerController.getAllExaminers)

/** get individual examiners */
router.get('/v1/individual/:id', examinerController.getIndividualExaminer)

/** create examiners */
router.post(
    '/v1/create',

    examinerController.createExaminer
)

/** get paginated examiners */
router.get('/v1/pexaminers', examinerController.getPaginatedExaminers)

/** get students by examiners */
router.get('/v1/students/:e_id', examinerController.getStudentsByExaminer)

/** update examiners */
router.patch('/v1/update/:id', examinerController.updateExaminer)

router.post('/v1/trial', upload.single('myfiles'), (req, res) => {
    res.json({ file: req.file, text: req.body.type })
})

module.exports = router
