let io

module.exports = {
    init: (httpServer, corsAcceptlink) => {
        io = require('socket.io')(httpServer, corsAcceptlink)
        return io
    },
    getIO: () => {
        if (!io) {
            throw new Error('socket.io not initialized')
        }
        return io
    },
}
