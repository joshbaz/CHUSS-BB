const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose')
const socketio = require('socket.io')

const app = express()

require('dotenv').config()
//import routes
const adminRoutes = require('./api/routes/administrator')
const projectRoutes = require('./api/routes/project')
const examinerRoutes = require('./api/routes/examiner')
//apply middleware
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader(
        'Access-Control-Allow-Headers',
        'Origin, A-Requested-Width, Content-Type, Accept, Authorization'
    )

    if (req.method === 'OPTIONS') {
        res.setHeader(
            'Access-Control-Allow-Methods',
            'PUT',
            'PATCH',
            'POST',
            'DELETE',
            'GET'
        )
        return res.status(200).json({})
    }
    next()
})

/** starter page */
app.get('/', (req, res, next) => {
    res.send('RUNNING THE SERVER')
})

//routes attachment to express app
app.use('/admin', adminRoutes)
app.use('/project', projectRoutes)
app.use('/examiner', examinerRoutes)
/** global error handling */
app.use((error, req, res, next) => {
    const status = error.statusCode || 500
    const message = error.message
    const data = error.data

    res.status(status).json(message)
})

//apply database
mongoose.Promise = require('bluebird')

mongoose
    .connect(process.env.MONGO_L_URL, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then((result) => {
        //run on port
        const port = process.env.PORT || 6000

        const server = app.listen(port)

        if (server) {
            console.log('successfully running on port:', port)
            console.log('connected to database:', result.connections[0].name)
        } else {
            console.log('failed to run ', port)
        }
    })
    .catch(() => {
        console.log('connection to db failed')
    })
