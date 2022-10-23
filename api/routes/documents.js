const express = require('express')
const mongoose = require('mongoose')
const router = express.Router()
const multer = require('multer')
let mongo = require('mongodb')
const { GridFsStorage } = require('multer-gridfs-storage')
var Grid = require('gridfs-stream')
//Grid.mongo = mongoose.mongo

const path = require('path')
const crypto = require('crypto')

require('dotenv').config()
const mongoUri = process.env.MONGO_R_URL

const conn = mongoose.createConnection(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})

let gfs
let gridfsBucket
conn.once('open', () => {
    gridfsBucket = new mongoose.mongo.GridFSBucket(conn.db, {
        bucketName: 'chussfiles',
    })

    gfs = Grid(conn.db, mongo)
    gfs.collection('chussfiles')
    // gfs = Grid(conn.db)
    // gfs.collection('reportFiless')
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
                    bucketName: 'chussfiles',
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

router.get('/files/:id', (req, res) => {
    const id = req.params.id
    if (!id || id === 'undefined')
        return res.status(400).send('no document found')
    const _id = new mongoose.Types.ObjectId(id)
    gfs.files.find({ _id }).toArray((err, files) => {
        //console.log('files', files)
        if (!files || files.length === 0)
            return res.status(400).send('no files exists')

        let data = []
        // let readstream = gridfsBucket.createReadStream({
        //     filename: files[0].filename,
        // })

        let readstream = gridfsBucket.openDownloadStream(_id)
       // console.log('readStream', readstream)
        readstream.on('data', function (chunk) {
            data.push(chunk)
        })
        readstream.on('error', function () {
            res.end()
        })

        readstream.on('end', function () {
            data = Buffer.concat(data)
            let fileOutput =
                `data:${files[0].contentType};base64,` +
                Buffer(data).toString('base64')
            res.end(fileOutput)
        })

        res.set('Content-Type', files[0].contentType)
        res.set(
            'Content-Disposition',
            'attachment; filename="' + files[0].originalname + '"'
        )
        return readstream.pipe(res)
        //gridfsBucket.openDownloadStream(_id).pipe(res)
    })
})

router.get('/download/:id', (req, res) => {
    const id = req.params.id
    if (!id || id === 'undefined')
        return res.status(400).send('no document found')
    const _id = new mongoose.Types.ObjectId(id)
    gfs.files.find({ _id }).toArray((err, files) => {
        //console.log('files', files)
        if (!files || files.length === 0)
            return res.status(400).send('no files exists')

        let data = []
        // let readstream = gridfsBucket.createReadStream({
        //     filename: files[0].filename,
        // })

        let readstream = gridfsBucket.openDownloadStream(_id)
        //console.log('readStream', readstream)
        readstream.on('data', function (chunk) {
            data.push(chunk)
        })
        readstream.on('error', function () {
            res.end()
        })

        readstream.on('end', function () {
            data = Buffer.concat(data)
            // let fileOutput =
            //     `data:${files[0].contentType};base64,` +
            //     Buffer(data).toString('base64')

            let fileOutput = Buffer(data).toString('base64')
            let extension = path.extname(files[0].filename).slice(1)
            res.set('Content-Type', files[0].contentType)
            res.status(200).json({ data: fileOutput, extension })
        })

        // res.set(
        //     'Content-Disposition',
        //     'attachment; filename="' + files[0].originalname + '"'
        // )
        // return readstream.pipe(res)
        //gridfsBucket.openDownloadStream(_id).pipe(res)
    })
})

module.exports = router
