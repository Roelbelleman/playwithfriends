const express = require("express");
const app = express();
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const admin = require("firebase-admin");
const serviceAccount = require("./outhgame-firebase-adminsdk-263ae-98a3f6efd7.json");
const { ref, update, remove, get } = require("firebase/database");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL:
    "https://outhgame-default-rtdb.europe-west1.firebasedatabase.app",
});

const db = admin.database();
const activeRooms = {}; // Track active rooms for each socket

app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "http://10.0.0.14:3000"],
  },
});

server.listen(3001, () => {
  console.log("Server is running");
});

io.on("connection", (socket) => {
  console.log("Connected");

  socket.on("join_room", (roomName, user) => {
    console.log(`${user} is joining room: ${roomName}`);
    socket.join(roomName);

    // Store the joined room for the socket
    if (!activeRooms[socket.id]) {
      activeRooms[socket.id] = [];
    }
    activeRooms[socket.id].push(roomName);

    const numberOfPeopleInRoom = io.sockets.adapter.rooms.get(roomName).size;
    console.log(numberOfPeopleInRoom);

    update(ref(db, `rooms/${roomName}/users`), { [socket.id]: user });

    if (numberOfPeopleInRoom === 0) {
      remove(ref(db, `/rooms/${roomName}`)); // Delete the room from the database
    } else {
      update(ref(db, `/rooms/${roomName}`), {
        currentPlayers: numberOfPeopleInRoom,
      });
    }
  });

  async function checkLeader(room, user) {
    const leaderPromise = get(ref(db, `/rooms/${room}/leader`));

    const leader = (await leaderPromise).val(); // Get the value from the leaderSnapshot

    if (user === leader) {
      await update(ref(db, `/rooms/${room}/users`), { [socket.id]: null });
      const newLeaderPromise = get(ref(db, `/rooms/${room}/users/`));
      const newLeaderSnapshot = await newLeaderPromise;
      const newLeader = Object.values(newLeaderSnapshot.val())[0]; // Get the value from the newLeaderSnapshot
      console.log(newLeader);
      update(ref(db, `/rooms/${room}`), {
        leader: newLeader,
      });
      console.log("Leader disconnected");
    }
  }

  async function leaveAllRooms() {
    // Retrieve the list of rooms the socket has joined
    const rooms = activeRooms[socket.id];

    // Leave all the rooms
    if (rooms) {
      rooms.forEach(async (room) => {
        const userPromise = get(ref(db, `/rooms/${room}/users/${socket.id}`));
        const user = (await userPromise).val();

        socket.leave(room);

        const numberOfPeopleInRoom =
          io.sockets.adapter.rooms.get(room)?.size || 0;

        console.log("Left room:", room);

        update(ref(db, "/users/" + user), { roomName: null });

        if (numberOfPeopleInRoom === 0) {
          remove(ref(db, `/rooms/${room}`)); // Delete the room from the database
        } else {
          await checkLeader(room, user);

          update(ref(db, `/rooms/${room}/users`), { [socket.id]: null });

          update(ref(db, `/rooms/${room}`), {
            currentPlayers: numberOfPeopleInRoom,
          });
        }
      });
      delete activeRooms[socket.id]; // Remove the socket's room list from activeRooms
    }
  }

  socket.on("leave-rooms", leaveAllRooms);
  socket.on("disconnect", () => {
    leaveAllRooms(); // Update the database when the user disconnects
    console.log("Disconnected");
  });
  socket.on("start_game", (roomName) => {
    // Handle the "start game" event
    io.to(roomName).emit("game_started");
    console.log(roomName);
  });
  socket.on("draw", ({ x0, y0, x1, y1, roomName }) => {
   socket.to(roomName).emit("draw", { x0, y0, x1, y1 });
  });
});
