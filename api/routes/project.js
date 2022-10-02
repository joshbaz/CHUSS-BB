const express = require('express')
const router = express.Router()
const projectController = require('../controllers/project')
const multer = require('multer')
const { GridFsStorage } = require('multer-gridfs-storage')

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
        bucketName: 'projectFiless',
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
    const upload = store.single('file')
    upload(req, res, function (err) {
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

router.post('/v1/create', uploadMiddleware, projectController.createProject)

router.get('/vl/pprojects', projectController.getPaginatedProjects)

router.get('/v1/projects/:id', projectController.getIndividualProjects)

//DeleteFiles
const deleteFile = (id) => {
    if (!id || id === 'undefined') return res.status(400).send('no file found')
    const _id = new mongoose.Types.ObjectId(id)
    gfs.delete(_id, (err) => {
        if (err) return res.status(500).send('File deletion error')
    })
}

router.get('/files/:id', (req, res) => {
    const id = req.params.id
    if (!id || id === 'undefined') return res.status(400).send('no file found')
    const _id = new mongoose.Types.ObjectId(id)
    gfs.find({ _id }).toArray((err, files) => {
        if (!files || files.length === 0)
            return res.status(400).send('no files exists')
        gfs.openDownloadStream(_id).pipe(res);
    })
})

module.exports = router
