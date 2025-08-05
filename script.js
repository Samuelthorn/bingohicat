// CONECTAR AO BACKEND
const socket = io("http://172.237.54.177:3000"); // seu IP VPS

let username = "";
let currentRoomId = "";
let selectedCard = [];
let isHost = false;

// Gerar 4 cartelas com 25 números aleatórios cada
function generateCards() {
  let cards = [];
  for (let i = 0; i < 4; i++) {
    let numbers = Array.from({ length: 25 }, () => Math.floor(Math.random() * 75) + 1);
    cards.push(numbers);
  }
  return cards;
}

function displayCards(cards) {
  const container = document.getElementById("cardsContainer");
  container.innerHTML = "";
  cards.forEach((card, index) => {
    const div = document.createElement("div");
    div.innerHTML = `<p>Cartela ${index + 1}</p><p>${card.join(", ")}</p>`;
    div.onclick = () => selectCard(card);
    container.appendChild(div);
  });
}

function selectCard(card) {
  selectedCard = card;
  document.getElementById("cardsContainer").innerHTML = `<p>Cartela escolhida!</p>`;
  socket.emit("selectCard", { roomId: currentRoomId, card });
  if (isHost) document.getElementById("startGameBtn").classList.remove("hidden");
}

window.enterGame = function() {
  username = document.getElementById("username").value.trim();
  if (!username) return alert("Digite um nome!");
  document.getElementById("login").classList.add("hidden");
  document.getElementById("lobby").classList.remove("hidden");
  document.getElementById("playerName").innerText = username;
};

window.createRoom = function() {
  socket.emit("createRoom", (roomId) => {
    isHost = true;
    enterRoom(roomId);
  });
};

window.joinRoom = function() {
  const roomIdInput = document.getElementById("roomIdInput").value.trim();
  if (!roomIdInput) return alert("Digite o ID da sala!");
  enterRoom(roomIdInput);
};

function enterRoom(roomId) {
  currentRoomId = roomId;
  socket.emit("joinRoom", { roomId, username }, (response) => {
    if (response.error) return alert(response.error);

    document.getElementById("lobby").classList.add("hidden");
    document.getElementById("room").classList.remove("hidden");
    document.getElementById("roomIdDisplay").innerText = roomId;

    const cards = generateCards();
    displayCards(cards);
  });
}

window.startGame = function() {
  socket.emit("startGame", currentRoomId);
};

socket.on("gameStarted", () => {
  document.getElementById("gameStatus").innerText = "Jogo iniciado!";
  renderBoard(selectedCard);
});

function renderBoard(numbers) {
  const board = document.getElementById("bingoBoard");
  board.classList.remove("hidden");
  board.innerHTML = "";
  numbers.forEach(num => {
    const cell = document.createElement("div");
    cell.className = "cell";
    cell.innerText = num;
    cell.onclick = () => cell.classList.toggle("marked");
    board.appendChild(cell);
  });
  document.getElementById("bingoBtn").classList.remove("hidden");
}

window.declareBingo = function() {
  socket.emit("declareBingo", currentRoomId);
};

socket.on("winner", (winner) => {
  alert(`BINGO! ${winner} venceu!`);
});
