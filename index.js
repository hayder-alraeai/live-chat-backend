const express = require('express');
const socketio = require('socket.io')
const http = require('http')
const router = require('./router')
const {addUser, removeUser, getUser, getUsersInRoom} = require('./users')
const PORT = process.env.PORT || 5000
const app = express()
const server = http.createServer(app)
const io = socketio(server, {
    cors: {
      origin: "https://www.chat.alraeai.se",
      methods: ["GET", "POST"]
    }
  }) //this line is to deal with cors!!!
io.on('connection', (socket) => {
    socket.on('join', ({name, room}, callback) => {
        try {
            const {error, user} = addUser({id: socket.id, name, room})
            if(error) return callback(error)
            //this message is made to the user from admin
            socket.emit('message', {user: 'admin', text: `${user.name}, Welcom to the room ${user.room}`})
            //this message is for anyone else in the chat room
            socket.broadcast.to(user.room).emit('message', {user: 'admin', text: `${user.name}, has joined!`})
            socket.join(user.room)
            //get users in the room
            io.to(user.room).emit('roomData', {room: user.room, users: getUsersInRoom(user.room)})
            callback()
        }catch(e) {
            console.log(e);
        }
    })

    socket.on('sendMessage', (message, callback) => {
        try{
            const user = getUser(socket.id)
            io.to(user.room).emit('message', {user: user.name, text: message})
            io.to(user.room).emit('roomData', {room: user.room, users: getUsersInRoom(user.room)})
            callback()
        }catch(e){
            console.log(e);
        }
    })

    socket.on('disconnect', () => {
        try{
            const user = removeUser(socket.id)
            socket.broadcast.to(user.room).emit('message', {user: 'admin', text: `${user.name}, has left!`})
        }catch(e){
            console.log(e);
        }
    })
})

app.use(router)
server.listen(PORT, () => console.log(`Server has started on port ${PORT}`))