// uno.js
const playerNames = ["Ben", "Alex", "Fred"];
const game = new UnoGame(playerNames);
game.start();

// Fonction pour afficher la modale de sélection de joueur
function showPlayerSwapModal(callback) {
  const modal = document.querySelector("#player-swap-modal");
  const choices = document.querySelector("#player-choices");
  choices.innerHTML = "";

  game.players.forEach((player, index) => {
    if (index !== game.currentPlayerIndex) {
      const button = document.createElement("button");
      button.className = "player-choice-btn";
      button.textContent = `Échanger avec ${player.name} (${player.hand.length} cartes)`;
      button.onclick = () => {
        modal.style.display = "none";
        callback(index);
      };
      choices.appendChild(button);
    }
  });

  modal.style.display = "block";
}

// Fonction pour effectuer l'échange de cartes
function performCardSwap(targetPlayerIndex) {
  const currentPlayer = game.getCurrentPlayer();
  const targetPlayer = game.players[targetPlayerIndex];

  const tempHand = [...currentPlayer.hand];
  currentPlayer.hand = [...targetPlayer.hand];
  targetPlayer.hand = tempHand;

  const gameLogElement = document.querySelector("#game-log");
  gameLogElement.innerHTML += `<br>${currentPlayer.name} échange ses cartes avec ${targetPlayer.name}!`;

  game.nextPlayer();
  updateUI();
}

// Fonction de gestion du clic sur une carte
function handleCardClick(card, index) {
    if (card.value === 'ChoixCouleur') {
        if (game.playTurn(index)) {
            game.handleChoixCouleur().then(() => {
                updateUI();
            });
        }
    } else if (card.value === '7') {
    if (game.playTurn(index)) {
      showPlayerSwapModal((targetPlayerIndex) => {
        performCardSwap(targetPlayerIndex);
      });
    }
  } else {
    if (game.playTurn(index)) {
      updateUI();
      // Ajouter un message dans le log
      const gameLogElement = document.getElementById("game-log");
      gameLogElement.innerHTML += `<br>${
        game.players[
          (game.currentPlayerIndex + game.players.length - 1) %
            game.players.length
        ].name
      } a joué ${card.color} ${card.value}`;
    } else {
      alert("Carte non jouable. Choisissez une autre carte ou piochez.");
    }
  }
}

// animation pour montrer les cartes piochées
function showDrawnCards(drawnCards, callback) {
    const drawnCardsDisplay = document.createElement('div');
    drawnCardsDisplay.className = 'drawn-cards-display';
    document.body.appendChild(drawnCardsDisplay);

    drawnCards.forEach((card, index) => {
        setTimeout(() => {
            const cardElement = document.createElement('div');
            cardElement.className = 'card drawn-card';
            cardElement.textContent = `${card.color} ${card.value}`;
            drawnCardsDisplay.appendChild(cardElement);

            if (index === drawnCards.length - 1) {
                setTimeout(() => {
                    drawnCardsDisplay.remove();
                    if (callback) callback();
                }, 1500);
            }
        }, index * 500);
    });
}

// Fonction de mise à jour de l'interface
function updateUI() {
  const discardPileElement = document.querySelector("#discard-pile");
  const currentPlayerElement = document.querySelector("#current-player");
  const playerHandElement = document.querySelector("#player-hand");
  const gameLogElement = document.querySelector("#game-log");

  // Ajouter une animation au changement de joueur
  currentPlayerElement.style.opacity = "0";
  setTimeout(() => {
    // Afficher le joueur actuel
    currentPlayerElement.innerHTML = `<strong>Joueur actuel :</strong> ${
      game.getCurrentPlayer().name
    }`;
    currentPlayerElement.style.opacity = "1";
  }, 300);

  // Ajouter un indicateur de direction
  const directionIndicator = document.createElement("div");
  directionIndicator.className = "direction-indicator";
  directionIndicator.innerHTML = `Direction : ${
    game.direction === 1 ? "→" : "←"
  }`;
  currentPlayerElement.appendChild(directionIndicator);

  // Afficher la carte sur la pile de défausse
  const topCard = game.discardPile[game.discardPile.length - 1];
  discardPileElement.innerHTML = `<strong>Carte sur la pile :</strong> ${topCard.color} ${topCard.value}`;

  // Afficher le joueur actuel
  currentPlayerElement.innerHTML = `<strong>Joueur actuel :</strong> ${
    game.getCurrentPlayer().name
  }`;

  // Afficher la main du joueur actuel
  const player = game.getCurrentPlayer();
  playerHandElement.innerHTML = "<strong>Votre main :</strong><br>";
  player.hand.forEach((card, index) => {
    const cardElement = document.createElement("div");
    cardElement.className = `card ${
      card.isPlayable(topCard) ? "playable" : "unplayable"
    }`;
    cardElement.textContent = `${card.color} ${card.value}`;
    cardElement.onclick = () => handleCardClick(card, index);
    playerHandElement.appendChild(cardElement);
  });

  // Afficher le log du jeu
  if (!gameLogElement.innerHTML) {
    gameLogElement.innerHTML = `<strong>Log du jeu :</strong><br>${
      game.getCurrentPlayer().name
    } joue...`;
  }
}

// Gestion de la fermeture de la modale
window.onclick = function (event) {
  const modal = document.querySelector("#player-swap-modal");
  if (event.target === modal) {
    modal.style.display = "none";
  }
};

// Initialiser l'interface
updateUI();
