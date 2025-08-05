// Conectar ao backend via Socket.IO
const socket = io("https://bingo.punkilive.top/");

// Variáveis globais
let username = "";
let roomId = "";
let selectedCard = null;
let bingoNumbers = [];
let drawnNumbers = [];

// ========== LOGIN ==========
window.enterGame = function () {
  username = document.getElementById("username").value.trim();
  if (!username) return alert("Digite um nome!");

  document.getElementById("login").classList.add("hidden");
  document.getElementById("lobby").classList.remove("hidden");
  document.getElementById("playerName").innerText = username;
};

// ========== CRIAR SALA ==========
window.createRoom = function () {
  roomId = Math.random().toString(36).substring(2, 6).toUpperCase();
  joinCreatedRoom(roomId, true);
};

// ========== ENTRAR NA SALA EXISTENTE ==========
window.joinRoom = function () {
  const inputId = document.getElementById("roomIdInput").value.trim().toUpperCase();
  if (!inputId) return alert("Digite o ID da sala!");
  roomId = inputId;
  joinCreatedRoom(roomId, false);
};

// Função auxiliar para entrar na sala (seja criador ou participante)
function joinCreatedRoom(id, isOwner) {
  document.getElementById("lobby").classList.add("hidden");
  document.getElementById("room").classList.remove("hidden");
  document.getElementById("roomIdDisplay").innerText = id;

  socket.emit("joinRoom", { roomId: id, username, isOwner });

  // Dono da sala vê botão "Iniciar"
  if (isOwner) {
    document.getElementById("startGameBtn").classList.remove("hidden");
  }
}

// ========== ESCOLHER CARTELA ==========
socket.on("cardsGenerated", (cards) => {
  const container = document.getElementById("cardsContainer");
  container.innerHTML = "<h3>Escolha uma cartela:</h3>";

  cards.forEach((card, index) => {
    const div = document.createElement("div");
    div.textContent = card.join(", ");
    div.onclick = () => selectCard(index, card);
    container.appendChild(div);
  });
});

function selectCard(index, card) {
  selectedCard = card;
  socket.emit("selectCard", { roomId, username, card });

  document.getElementById("cardsContainer").innerHTML =
    `<h3>Sua cartela:</h3><p>${card.join(", ")}</p>`;
}

// ========== INICIAR JOGO ==========
window.startGame = function () {
  if (!selectedCard) return alert("Escolha uma cartela antes de iniciar!");
  socket.emit("startGame", { roomId });
  document.getElementById("startGameBtn").classList.add("hidden");
};

// Quando o jogo começa, exibe a cartela para marcar
socket.on("gameStarted", (card) => {
  bingoNumbers = card;
  renderBingoBoard(card);
  document.getElementById("bingoBoard").classList.remove("hidden");
  document.getElementById("bingoBtn").classList.remove("hidden");
  document.getElementById("gameStatus").innerText = "O jogo começou! Aguarde os números sorteados.";
});

// ========== SORTEIO DE NÚMEROS ==========
socket.on("numberDrawn", ({ number, allNumbers }) => {
  drawnNumbers = allNumbers;
  document.getElementById("drawnList").innerText = drawnNumbers.join(", ");
});

// Renderiza a cartela do bingo
function renderBingoBoard(card) {
  const board = document.getElementById("bingoBoard");
  board.innerHTML = "";

  card.forEach((num) => {
    const cell = document.createElement("div");
    cell.classList.add("cell");
    cell.textContent = num;

    cell.onclick = () => {
      // Só pode marcar se o número foi sorteado
      if (drawnNumbers.includes(num)) {
        cell.classList.toggle("marked");
      } else {
        alert("Você só pode marcar números sorteados!");
      }
    };

    board.appendChild(cell);
  });
}

// ========== DECLARAR BINGO ==========
window.declareBingo = function () {
  const markedCells = document.querySelectorAll(".cell.marked").length;
  if (markedCells === bingoNumbers.length) {
    socket.emit("declareBingo", { roomId, username });
  } else {
    alert("Você ainda não marcou todos os números!");
  }
};

socket.on("bingoDeclared", (winner) => {
  document.getElementById("gameStatus").innerText = `${winner} fez BINGO!`;
  document.getElementById("bingoBtn").classList.add("hidden");
});
