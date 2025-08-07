// Conectar ao backend via Socket.IO
const socket = io("https://bingo.punkilive.top/");

// Variáveis globais
let username = "";
let roomId = "";
let selectedCard = null;
let bingoNumbers = [];
let drawnNumbers = [];
let isRoomOwner = false; // novo: saber se o jogador é dono da sala

// ====== VOZ (Speech API) ======
function falar(texto) {
  const utterance = new SpeechSynthesisUtterance(texto);
  utterance.lang = "pt-BR";

  const voices = window.speechSynthesis.getVoices();
  const vozFeminina = voices.find(v => v.lang === 'pt-BR' && v.name.toLowerCase().includes('feminina'));
  if (vozFeminina) utterance.voice = vozFeminina;

  speechSynthesis.speak(utterance);
}

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
    if (response.error) return alert(response.error);

    roomId = response.roomId;
    isRoomOwner = true; // marca dono da sala

    document.getElementById("lobby").classList.add("hidden");
    document.getElementById("room").classList.remove("hidden");
    document.getElementById("roomIdDisplay").innerText = roomId;
    document.getElementById("startGameBtn").classList.remove("hidden");
  });
};

// ========== ENTRAR NA SALA EXISTENTE ==========
window.joinRoom = function () {
  const inputId = document.getElementById("roomIdInput").value.trim().toUpperCase();
  if (!inputId) return alert("Digite o ID da sala!");

  roomId = inputId;
  socket.emit("joinRoom", { roomId, username }, (response) => {
    if (response.error) return alert(response.error);

    isRoomOwner = response.isOwner || false; // backend deve informar

    document.getElementById("lobby").classList.add("hidden");
    document.getElementById("room").classList.remove("hidden");
    document.getElementById("roomIdDisplay").innerText = roomId;

    if (isRoomOwner) {
      document.getElementById("startGameBtn").classList.remove("hidden");
    }
  });
};

// ========== ESCOLHER CARTELA ==========
socket.on("cardsGenerated", (cards) => {
  const container = document.getElementById("cardsContainer");
  container.classList.remove("hidden");
  container.innerHTML = "<h3>Escolha uma cartela:</h3>";

  cards.forEach((card, index) => {
    const div = document.createElement("div");
    div.classList.add("bingo-card");

    const sortedCard = [...card].sort((a, b) => a - b);

    const header = document.createElement("div");
    header.classList.add("bingo-header");
    header.innerHTML = "<span>B</span><span>I</span><span>N</span><span>G</span><span>O</span>";
    div.appendChild(header);

    const grid = document.createElement("div");
    grid.classList.add("bingo-grid");

    let numberIndex = 0;
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 5; col++) {
        const cell = document.createElement("div");
        cell.classList.add("bingo-cell");

        if (row === 2 && col === 2) {
          cell.textContent = "★";
          cell.classList.add("free", "marked");
        } else {
          cell.textContent = sortedCard[numberIndex];
          numberIndex++;
        }

        grid.appendChild(cell);
      }
    }

    div.appendChild(grid);
    div.onclick = () => selectCard(index, sortedCard);
    container.appendChild(div);
  });
});

function selectCard(index, card) {
  selectedCard = card;
  socket.emit("selectCard", { roomId, username, card });

  const container = document.getElementById("cardsContainer");
  container.innerHTML = "";

  const div = document.createElement("div");
  div.classList.add("bingo-card", "selected");

  const header = document.createElement("div");
  header.classList.add("bingo-header");
  header.innerHTML = "<span>B</span><span>I</span><span>N</span><span>G</span><span>O</span>";
  div.appendChild(header);

  const grid = document.createElement("div");
  grid.classList.add("bingo-grid");

  let numberIndex = 0;
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 5; col++) {
      const cell = document.createElement("div");
      cell.classList.add("bingo-cell");

      if (row === 2 && col === 2) {
        cell.textContent = "★";
        cell.classList.add("free", "marked");
      } else {
        cell.textContent = card[numberIndex];
        numberIndex++;
      }

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

socket.on("gameStarted", () => {
  bingoNumbers = selectedCard;

  document.getElementById("cardsContainer").style.display = "none";
  renderBingoBoard(selectedCard);

  document.getElementById("bingoBoard").classList.remove("hidden");
  document.getElementById("bingoBtn").classList.remove("hidden");
  document.getElementById("gameStatus").innerText = "O jogo começou! Marque seus números.";
});

// ========== SORTEIO DE NÚMEROS ==========
socket.on("numberDrawn", ({ number, allNumbers }) => {
  drawnNumbers = allNumbers;

  const drawnContainer = document.getElementById("drawnList");
  drawnContainer.innerHTML = "";

  drawnNumbers.forEach(num => {
    const ball = document.createElement("div");
    ball.classList.add("bingo-ball");
    ball.textContent = num;
    drawnContainer.prepend(ball);
  });

  // 🔊 Fala o número sorteado
  falar(`Número ${number}`);
});

// Renderiza a cartela 5x5 para marcar
function renderBingoBoard(card) {
  const board = document.getElementById("bingoBoard");
  board.innerHTML = "";

  const header = document.createElement("div");
  header.classList.add("bingo-header");
  header.innerHTML = "<span>B</span><span>I</span><span>N</span><span>G</span><span>O</span>";
  board.appendChild(header);

  const grid = document.createElement("div");
  grid.classList.add("bingo-grid");

  let numberIndex = 0;
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 5; col++) {
      const cell = document.createElement("div");
      cell.classList.add("bingo-cell");

      if (row === 2 && col === 2) {
        cell.textContent = "★";
        cell.classList.add("free", "marked");
      } else {
        const cellNumber = card[numberIndex];
        cell.textContent = cellNumber;
        cell.onclick = () => {
          if (drawnNumbers.includes(cellNumber)) {
            cell.classList.toggle("marked");
          } else {
            alert("Você só pode marcar números sorteados!");
          }
        };
        numberIndex++;
      }

      grid.appendChild(cell);
    }
  }

  board.appendChild(grid);
}

// ========== DECLARAR BINGO ==========
document.getElementById("bingoBtn").addEventListener("click", () => {
  const marked = document.querySelectorAll("#bingoBoard .bingo-cell.marked").length;
  const required = 24;

  if (marked === required) {
    socket.emit("declareBingo", { roomId });
  } else {
    alert("Você ainda não marcou todos os números!");
  }
});

// Nova funcionalidade: mostrar modal com vencedor
socket.on("bingoDeclared", (winnerData) => {
  // winnerData: { winnerName: string, roomOwner: string }
  const winnerModal = document.getElementById("winnerModal");
  const winnerText = document.getElementById("winnerText");
  const newGameBtn = document.getElementById("newGameBtn");

  winnerText.innerText = `${winnerData.winnerName} fez BINGO!`;
  winnerModal.classList.remove("hidden");

  // Se eu for dono da sala, mostro botão novo jogo
  if (username === winnerData.roomOwner) {
    newGameBtn.classList.remove("hidden");
  } else {
    newGameBtn.classList.add("hidden");
  }

  // Desabilita botão bingo para todos
  document.getElementById("bingoBtn").classList.add("hidden");

  // 🔊 Grita BINGOU!
  falar("BINGOU!");
});

// Botão iniciar nova partida (só dono da sala)
document.getElementById("newGameBtn").addEventListener("click", () => {
  socket.emit("startNewGame", { roomId });
  closeWinnerModal();
});

// Fechar modal (opcional, pode adicionar depois se quiser)
// function closeWinnerModal() {
//   const winnerModal = document.getElementById("winnerModal");
//   winnerModal.classList.add("hidden");
// }

function closeWinnerModal() {
  const winnerModal = document.getElementById("winnerModal");
  winnerModal.classList.add("hidden");
}

// Ouvir evento para resetar jogo (nova partida)
socket.on("newGameStarted", () => {
  closeWinnerModal();
  drawnNumbers = [];
  selectedCard = null;
  bingoNumbers = [];

  // Voltar para seleção de cartelas
  document.getElementById("cardsContainer").style.display = "flex";
  document.getElementById("cardsContainer").innerHTML = "";
  document.getElementById("bingoBoard").classList.add("hidden");
  document.getElementById("bingoBtn").classList.add("hidden");
  document.getElementById("gameStatus").innerText = "";

  // Mostra botão iniciar se for dono da sala
  if (isRoomOwner) {
    document.getElementById("startGameBtn").classList.remove("hidden");
  }
});
