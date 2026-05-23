const { Server } = require("socket.io");

let connections = {};
let messages = {};
let timeOnline = {};
const MAX_USERS_PER_ROOM = 4;

const connectToSocket = (server) => {
  // initialising the the CORS
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
      allowedHeaders: ["*"],
      credentials: true,
    },
  });

  // for each connection
  io.on("connection", (socket) => {
    console.log("got something connected");

    // when user joins the call/meeting
    socket.on("join-call", (path) => {
      if (connections[path] === undefined) {
        connections[path] = [];
      }

      // checking the size of the meeting room before adding new socket.id
      if (connections[path].length >= MAX_USERS_PER_ROOM) {
        socket.emit("room-full", "This meeting room is full.");
        socket.disconnect();
        return;
      }
      // all available connections/socket.id present in a meeting room
      connections[path].push(socket.id);

      // gets the time a user joins a room
      timeOnline[socket.id] = new Date();

      // when a user joins a call we emit the "user-joined" message to avaiable connections in the room

      for (let a = 0; a < connections[path].length; a++) {
        io.to(connections[path][a]).emit(
          "user-joined",
          socket.id,
          connections[path],
        );
      }

      if (messages[path] !== undefined) {
        for (let a = 0; a < messages[path].length; ++a) {
          io.to(socket.id).emit(
            "chat-message",
            messages[path][a]["data"],
            messages[path][a]["sender"],
            messages[path][a]["socket-id-sender"],
          );
        }
      }
    });

    socket.on("signal", (toId, message) => {
      io.to(toId).emit("signal", socket.id, message);
    });

    socket.on("chat-message", (data, sender) => {
      // checking the room id in available room and checks if the user is in that room
      const [matchingRoom, found] = Object.entries(connections).reduce(
        ([room, isFound], [roomKey, roomValue]) => {
          // if matching room is found and the room includes the user we return roomID
          if (!isFound && roomValue.includes(socket.id)) {
            return [roomKey, true];
          }

          return [room, isFound];
        },
        ["", false],
      );

      // if room is found and the message is not invalid
      if (found === true) {
        if (messages[matchingRoom] === undefined) {
          messages[matchingRoom] = [];
        }

        // we add the message to the mathing roomID along with the sender details
        messages[matchingRoom].push({
          sender: sender,
          data: data,
          "socket-id-sender": socket.id,
        });
        console.log("message", matchingRoom, ":", sender, data);

        // we emit the notification to all the users in the room
        connections[matchingRoom].forEach((elem) => {
          io.to(elem).emit("chat-message", data, sender, socket.id);
        });
      }
    });

    socket.on("disconnect", () => {
      // checking for the time a user is Online
      var diffTime = Math.abs(timeOnline[socket.id] - new Date());

      var key;

      // we are getting the current room and connected users
      for (const [room, person] of JSON.parse(
        JSON.stringify(Object.entries(connections)),
      )) {
        // we are checking all persons and trying to match the socket.id to find their roomID
        for (let a = 0; a < person.length; ++a) {
          if (person[a] === socket.id) {
            key = room;

            // we are notifying all the other users available in that room that user is left
            for (let a = 0; a < connections[key].length; ++a) {
              io.to(connections[key][a]).emit("user-left", socket.id);
            }

            // we are getting the index of user's socket.id
            var index = connections[key].indexOf(socket.id);

            // deleting the user's ID from the connections array
            connections[key].splice(index, 1);

            // checking if there is no user left in the room we delete the room/connection
            if (connections[key].length === 0) {
              delete connections[key];
            }
          }
        }
      }
    });
  });

  return io;
};

module.exports = { connectToSocket };
