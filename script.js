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
  socket.emit("createRoom", { username }, (response) => {
    if (response.error) {
      alert(response.error);
      return;
    }

    roomId = response.roomId;
    document.getElementById("lobby").classList.add("hidden");
    document.getElementById("room").classList.remove("hidden");
    document.getElementById("roomIdDisplay").innerText = roomId;

    // Dono da sala vê botão "Iniciar"
    document.getElementById("startGameBtn").classList.remove("hidden");
  });
};

// ========== ENTRAR NA SALA EXISTENTE ==========
window.joinRoom = function () {
  const inputId = document.getElementById("roomIdInput").value.trim().toUpperCase();
  if (!inputId) return alert("Digite o ID da sala!");
  
  roomId = inputId;
  socket.emit("joinRoom", { roomId, username }, (response) => {
    if (response.error) {
      alert(response.error);
      return;
    }

    document.getElementById("lobby").classList.add("hidden");
    document.getElementById("room").classList.remove("hidden");
    document.getElementById("roomIdDisplay").innerText = roomId;
  });
};

// ========== ESCOLHER CARTELA ==========
socket.on("cardsGenerated", (cards) => {
  const container = document.getElementById("cardsContainer");
  container.innerHTML = "<h3>Escolha uma cartela:</h3>";

  cards.forEach((card, index) => {
    const div = document.createElement("div");
    div.classList.add("bingo-card");

    // Cabeçalho BINGO
    const header = document.createElement("div");
    header.classList.add("bingo-header");
    header.innerHTML = "<span>B</span><span>I</span><span>N</span><span>G</span><span>O</span>";
    div.appendChild(header);

    // Grade de números (3 linhas × 5 colunas)
    const grid = document.createElement("div");
    grid.classList.add("bingo-grid");

    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 5; col++) {
        const indexNum = row * 5 + col; // 0-14
        const cell = document.createElement("div");
        cell.classList.add("bingo-cell");
        cell.textContent = card[indexNum] !== undefined ? card[indexNum] : "";
        grid.appendChild(cell);
      }
    }

    div.appendChild(grid);

    // Clique para selecionar cartela
    div.onclick = () => selectCard(index, card);

    container.appendChild(div);
  });
});

function selectCard(index, card) {
  selectedCard = card;
  socket.emit("selectCard", { roomId, username, card });

  // Mostra cartela escolhida
  const container = document.getElementById("cardsContainer");
  container.innerHTML = "";

  const div = document.createElement("div");
  div.classList.add("bingo-card", "selected");

  // Cabeçalho BINGO
  const header = document.createElement("div");
  header.classList.add("bingo-header");
  header.innerHTML = "<span>B</span><span>I</span><span>N</span><span>G</span><span>O</span>";
  div.appendChild(header);

  // Grid números (3 linhas × 5 colunas)
  const grid = document.createElement("div");
  grid.classList.add("bingo-grid");

  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 5; col++) {
      const indexNum = row * 5 + col;
      const cell = document.createElement("div");
      cell.classList.add("bingo-cell");
      cell.textContent = card[indexNum] !== undefined ? card[indexNum] : "";
      grid.appendChild(cell);
    }
  }

  div.appendChild(grid);
  container.appendChild(div);
}

// ========== INICIAR JOGO ==========
window.startGame = function () {
  if (!selectedCard) return alert("Escolha uma cartela antes de iniciar!");
  socket.emit("startGame", { roomId });
  document.getElementById("startGameBtn").classList.add("hidden");
};

// Quando o jogo começa, exibe a cartela para marcar
socket.on("gameStarted", () => {
  bingoNumbers = selectedCard;
  renderBingoBoard(selectedCard);
  document.getElementById("bingoBoard").classList.remove("hidden");
  document.getElementById("bingoBtn").classList.remove("hidden");
  document.getElementById("gameStatus").innerText = "O jogo começou! Aguarde os números sorteados.";
});

// ========== SORTEIO DE NÚMEROS ==========
socket.on("numberDrawn", ({ number, allNumbers }) => {
  drawnNumbers = allNumbers;
  document.getElementById("drawnList").innerText = drawnNumbers.join(", ");
});

// Renderiza a cartela do bingo para marcar números
function renderBingoBoard(card) {
  const board = document.getElementById("bingoBoard");
  board.innerHTML = "";

  // Cabeçalho BINGO
  const header = document.createElement("div");
  header.classList.add("bingo-header");
  header.innerHTML = "<span>B</span><span>I</span><span>N</span><span>G</span><span>O</span>";
  board.appendChild(header);

  // Grid números (3 linhas × 5 colunas)
  const grid = document.createElement("div");
  grid.classList.add("bingo-grid");

  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 5; col++) {
      const indexNum = row * 5 + col;
      const cell = document.createElement("div");
      cell.classList.add("bingo-cell");

      if (card[indexNum] !== undefined) cell.textContent = card[indexNum];

      // Marcar clicando
      cell.onclick = () => {
        if (drawnNumbers.includes(card[indexNum])) {
          cell.classList.toggle("marked");
        } else {
          alert("Você só pode marcar números sorteados!");
        }
      };

      grid.appendChild(cell);
    }
  }

  board.appendChild(grid);
}

// ========== DECLARAR BINGO ==========
window.declareBingo = function () {
  const markedCells = document.querySelectorAll(".bingo-cell.marked").length;
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
