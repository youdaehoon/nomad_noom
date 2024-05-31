import express from "express";
import http from "http";
import { Server } from "socket.io";
import { instrument } from "@socket.io/admin-ui";
const app = express();

app.set("view engine", "pug");
app.set("views", __dirname + "/views");
app.use("/public", express.static(__dirname + "/public"));
app.get("/", (req, res) => res.render("home"));
app.get("/*", (req, res) => res.redirect("/"));
const handleListen = () => {
  console.log("Listening on http://localhost:3000");
};

const httpServer = http.createServer(app);

const wsServer = new Server(httpServer, {
  cors: {
    origin: ["https://admin.socket.io"],
    credentials: true,
  },
});

instrument(wsServer, { auth: false });

function publicRooms() {
  const {
    sockets: {
      adapter: { sids, rooms },
    },
  } = wsServer;

  const publicRooms = [];
  rooms.forEach((_, key) => {
    if (sids.get(key) === undefined) publicRooms.push(key);
  });
  return publicRooms;
}

function countRoom(roomName) {
  const {
    sockets: {
      adapter: { rooms },
    },
  } = wsServer;
  return rooms.get(roomName)?.size;
}

wsServer.on("connection", (socket) => {
  socket["nickname"] = "Anon";
  socket.onAny((event) => {
    console.log(`Socket Evet:${event}`);
  });
  socket.on("enter_room", (roomName, done) => {
    socket.join(roomName);
    done();
    socket
      .to(roomName)
      .emit("welcome", socket["nickname"], countRoom(roomName));
    wsServer.sockets.emit("room_chage", publicRooms());
  });

  socket.on("disconnecting", () => {
    // console.log(socket.rooms)
    socket.rooms.forEach((room) =>
      socket.to(room).emit("bye", socket["nickname"], countRoom(room) - 1)
    );
  });
  socket.on("disconnect", () => {
    wsServer.sockets.emit("room_chage", publicRooms());
  });

  socket.on("new_message", (msg, room, done) => {
    socket.to(room).emit("new_message", `${socket.nickname}:${msg}`);
    done();
  });

  socket.on("nickname", (nickname) => {
    socket["nickname"] = nickname;
  });
});

// const wss = new WebSocket.Server({ server });

// const sockets = [];

// wss.on("connection", (socket) => {
//   sockets.push(socket);
//   socket["nickname"] = "Anon";

//   console.log("Connected to Brewser ✔");
//   socket.on("close", () => {
//     console.log("Disconnected from Browser❌");
//   });
//   socket.on("message", (msg) => {
//     const message = JSON.parse(msg.toString("utf-8"));
//     switch (message.type) {
//       case "new_message":
//         sockets.forEach((aSocket) => aSocket.send(`${socket.nickname}: ${message.payload}`));
//       case "nickname":
//         socket["nickname"] = message.payload;
//     }

//     console.log(message);
//     // socket.send(msg.toString("utf-8"))
//   });
// });

httpServer.listen(3000, handleListen);
