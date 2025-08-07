const socket = io("https://bingo.punkilive.top");

let username = "";
let selectedCard = null;
let roomId = "";
let drawnNumbers = [];

window.enterGame = function () {
  username = document.getElementById("username").value.trim();
  if (!username) return alert("Digite seu nome!");

  socket.emit("joinGame", username);
  document.getElementById("login-screen").style.display = "none";
  document.getElementById("game-screen").style.display = "block";
};

socket.on("joinedGame", (room) => {
  roomId = room;
});

window.generateCards = function () {
  socket.emit("generateCards", roomId);
};

socket.on("cardsGenerated", (cards) => {
  const cardsContainer = document.getElementById("cards-container");
  cardsContainer.innerHTML = "";

  cards.forEach((card, index) => {
    const cardDiv = document.createElement("div");
    cardDiv.classList.add("bingo-card");
    cardDiv.addEventListener("click", () => selectCard(card));

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

    cardDiv.appendChild(grid);
    cardsContainer.appendChild(cardDiv);
  });
});

function selectCard(card) {
  selectedCard = card;

  const selectedCardContainer = document.getElementById("selected-card");
  selectedCardContainer.innerHTML = "";

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
        const number = card[numberIndex];
        cell.textContent = number;
        if (drawnNumbers.includes(number)) {
          cell.classList.add("marked");
        }
        numberIndex++;
      }

      grid.appendChild(cell);
    }
  }

  selectedCardContainer.appendChild(grid);
}

window.drawNumber = function () {
  socket.emit("drawNumber", roomId);
};

socket.on("numberDrawn", (number) => {
  if (!drawnNumbers.includes(number)) {
    drawnNumbers.push(number);
  }

  document.getElementById("drawn-numbers").textContent = drawnNumbers.join(", ");
  if (selectedCard) selectCard(selectedCard);
});

socket.on("gameReset", () => {
  drawnNumbers = [];
  document.getElementById("drawn-numbers").textContent = "";
  if (selectedCard) selectCard(selectedCard);
});

window.resetGame = function () {
  socket.emit("resetGame", roomId);
};
