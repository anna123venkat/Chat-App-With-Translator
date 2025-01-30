const express = require('express');
const app = express();
const userRoutes = require('./routes/userRoutes');
const User = require('./models/User');
const Message = require('./models/Message');
const cors = require('cors');

const rooms = ['general', 'tech', 'finance', 'crypto'];

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());

// User routes
app.use('/users', userRoutes);

// Connect to MongoDB
require('./connection');

const server = require('http').createServer(app);
const PORT = 5001;

const io = require('socket.io')(server, {
    cors: {
        origin: 'http://localhost:3000',
        methods: ['GET', 'POST']
    }
});

// Fetch last messages from a room
async function getLastMessagesFromRoom(room) {
    let roomMessages = await Message.aggregate([
        { $match: { to: room } },
        { $group: { _id: '$date', messagesByDate: { $push: '$$ROOT' } } }
    ]);
    return roomMessages;
}

// Sort messages by date
function sortRoomMessagesByDate(messages) {
    return messages.sort((a, b) => {
        let date1 = a._id.split('/');
        let date2 = b._id.split('/');
        date1 = date1[2] + date1[0] + date1[1];
        date2 = date2[2] + date2[0] + date2[1];
        return date1 < date2 ? -1 : 1;
    });
}

// Socket.io connection
io.on('connection', (socket) => {
    console.log('New user connected');

    // When a new user joins
    socket.on('new-user', async () => {
        const members = await User.find();
        io.emit('new-user', members);
    });

    // Joining a room
    socket.on('join-room', async (newRoom, previousRoom) => {
        socket.join(newRoom);
        socket.leave(previousRoom);
        let roomMessages = await getLastMessagesFromRoom(newRoom);
        roomMessages = sortRoomMessagesByDate(roomMessages);
        socket.emit('room-messages', roomMessages);
    });

    // Sending a message
    socket.on('message-room', async (room, content, sender, time, date) => {
        const newMessage = await Message.create({ content, from: sender, time, date, to: room });
        let roomMessages = await getLastMessagesFromRoom(room);
        roomMessages = sortRoomMessagesByDate(roomMessages);

        // Broadcast message to room
        io.to(room).emit('room-messages', roomMessages);
        socket.broadcast.emit('notifications', room);
    });

    // User logout
    socket.on('logout', async (userId, newMessages) => {
        try {
            const user = await User.findById(userId);
            if (user) {
                user.status = "offline";
                user.newMessages = newMessages;
                await user.save();
            }
            const members = await User.find();
            socket.broadcast.emit('new-user', members);
        } catch (e) {
            console.log(e);
        }
    });
});

// Endpoint to get available rooms
app.get('/rooms', (req, res) => {
    res.json(rooms);
});

// Start the server
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
