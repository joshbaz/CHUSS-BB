const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose')
const socketio = require('socket.io')
const bodyparser = require('body-parser')
const jwt = require('jsonwebtoken')
const AdminModel = require('./api/models/administrator')

const app = express()

require('dotenv').config()
//import routes
const adminRoutes = require('./api/routes/administrator')
const projectRoutes = require('./api/routes/project')
const examinerRoutes = require('./api/routes/examiner')
const tagRoutes = require('./api/routes/tags')
const preferenceRoutes = require('./api/routes/preferences')
const reportRoutes = require('./api/routes/examinerReports')
const paymentRoutes = require('./api/routes/payments')
const documentRoutes = require('./api/routes/documents')
const opponentRoutes = require('./api/routes/opponent')
const opponentReportRoutes = require('./api/routes/opponentReports')
const supervisorRoutes = require('./api/routes/supervisors')
const doctoralMemberRoutes = require('./api/routes/doctoralmembers')
const schoolRoutes = require('./api/routes/schools')
const departmentRoutes = require('./api/routes/schoolDepartments')
const registrationRoutes = require('./api/routes/registration')
//apply middleware
app.use(cors())
app.use(bodyparser.json())
app.use(bodyparser.urlencoded({ extended: true }))

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
app.use('/tags', tagRoutes)
app.use('/preferences', preferenceRoutes)
app.use('/reports', reportRoutes)
app.use('/payments', paymentRoutes)
app.use('/docs', documentRoutes)
app.use('/opponent', opponentRoutes)
app.use('/opponentreports', opponentReportRoutes)
app.use('/supervisor', supervisorRoutes)
app.use('/doctoralmember', doctoralMemberRoutes)
app.use('/school', schoolRoutes)
app.use('/department', departmentRoutes)
app.use('/registration', registrationRoutes)
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
    .connect(process.env.MONGO_R_URL, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then((result) => {
        //run on port
        const port = process.env.PORT || 8000

        const server = app.listen(port)

        if (server) {
            console.log('successfully running on port:', port)
            console.log('connected to database:', result.connections[0].name)
            const io = require('./socket').init(server, {
                origins: ['*'],
            })

            //   const io = require('./socket').init(server, {
            //       allowRequest: (req, callback) => {
            //           const noOriginHeader = req.headers.origin === undefined
            //           callback(null, noOriginHeader)
            //       },
            //   })

            io.on('connection', async (socket) => {
                console.log('client connected')
                //  console.log('client connected', socket.handshake.auth.token)
                let token = socket.handshake.auth.token
                let decodedToken = token
                    ? jwt.verify(token, process.env.SECRET, {
                          ignoreExpiration: true,
                      })
                    : null

                if (decodedToken) {
                    const findAdmin = await AdminModel.findById(
                        decodedToken.userId
                    )
                    if (findAdmin) {
                        findAdmin.status = 'online'
                        await findAdmin.save()
                    }
                } else {
                }

                socket.on('disconnect', async () => {
                    console.log('user disconnected')

                    if (decodedToken) {
                        const findAdmin = await AdminModel.findById(
                            decodedToken.userId
                        )
                        if (findAdmin) {
                            findAdmin.status = 'offline'
                            await findAdmin.save()
                        }
                    } else {
                    }
                })
            })
        } else {
            console.log('failed to run ', port)
        }
    })
    .catch(() => {
        console.log('connection to db failed')
    })
