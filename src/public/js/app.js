const socket = io();

const welcome = document.getElementById("welcome");
const room = document.getElementById("room");

room.hidden = true;

let roomName;
const form = welcome.querySelector("form");

function addMessage(message) {
  const ul = room.querySelector("ul");
  const li = document.createElement("li");
  console.log("addmessage");
  li.innerText = message;
  ul.appendChild(li);
}
function handleMessageSubmit(event) {
  event.preventDefault();
  const input = room.querySelector("#msg input");
  const value = input.value;
  socket.emit("new_message", input.value, roomName, () => {
    addMessage(`You: ${value}`);
  });
  input.value = "";
}

function handleNameSubmit(event) {
  event.preventDefault();
  const input = room.querySelector("#name input");
  const value = input.value;
  socket.emit("nickname", input.value);
  input.value = "";
}

function showRoom() {
  welcome.hidden = true;
  room.hidden = false;
  const h3 = room.querySelector("h3");
  h3.innerText = `Room: ${roomName}`;

  const msgForm = room.querySelector("#msg");
  const nameForm = room.querySelector("#name");

  nameForm.addEventListener("submit", handleNameSubmit);

  msgForm.addEventListener("submit", handleMessageSubmit);
}

function handleRoomSubmit(event) {
  event.preventDefault();
  const input = form.querySelector("input");
  socket.emit("enter_room", input.value, showRoom);
  roomName = input.value;
  input.value = "";
}

form.addEventListener("submit", handleRoomSubmit);

socket.on("welcome", (user,newCount) => {
  addMessage(`${user} arrived!`);

  const h3 = room.querySelector("h3");
  h3.innerText = `Room: ${roomName} (${newCount})`;
});

socket.on("bye", (left,newCount) => {
  addMessage(`${left} left ㅠㅠ`);


  const h3 = room.querySelector("h3");
  h3.innerText = `Room: ${roomName} (${newCount})`;
});

socket.on("new_message", addMessage);

socket.on("room_chage", (rooms) => {
  const roomList = welcome.querySelector("ul");    roomList.innerHTML = "";

  if (rooms.length === 0) {
    return;
  }
  rooms.forEach((room) => {
    const li = document.createElement("li");
    li.innerText = room;
    roomList.appendChild(li);
  });
});
