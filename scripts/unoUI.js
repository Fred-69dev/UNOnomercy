// Importer les classes depuis les autres fichiers
import { Card, Deck } from './cards.js';
import { UnoGame, Player } from './gamePlay.js';

// Initialisation du jeu
let game;
let gameStarted = false;

// Fonction d'initialisation du jeu
function initializeGame() {
  const playerNames = ["Ben", "Alex", "Fred"];
  game = new UnoGame(playerNames);
  const startResult = game.start();
  
  // Afficher un message indiquant qui commence
  const gameLogElement = document.querySelector("#game-log");
  gameLogElement.innerHTML = `<strong>Log du jeu :</strong><br>Le joueur ${startResult.startingPlayer.name} commence la partie!<br>Choisissez une carte pour commencer.`;
  
  gameStarted = true;
  updateUI();
}

// Fonction pour afficher la modale de sélection de joueur
function showPlayerSwapModal(callback) {
  const modal = document.querySelector("#player-swap-modal");
  const choices = document.querySelector("#player-choices");
  
  if (!modal || !choices) {
    console.error("Modal elements not found");
    return;
  }
  
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
      choices.append(button);
    }
  });

  modal.style.display = "block";
}

// Fonction pour afficher la modale de sélection de couleur
function showColorChoiceModal(callback) {
  const modal = document.querySelector("#color-choice-modal");
  
  if (!modal) {
    console.error("Color choice modal not found");
    return;
  }
  
  const buttons = modal.querySelectorAll(".color-btn");
  
  buttons.forEach(button => {
    const color = button.getAttribute("data-color");
    button.onclick = () => {
      modal.style.display = "none";
      callback(color);
    };
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

// Fonction pour piocher une carte
function drawCard() {
  const player = game.getCurrentPlayer();
  const drawnCards = player.drawCards(game.deck, 1);
  
  if (drawnCards.length > 0) {
    showDrawnCards(drawnCards, () => {
      const gameLogElement = document.querySelector("#game-log");
      gameLogElement.innerHTML += `<br>${player.name} pioche une carte.`;
      
      // Vérifier si la carte piochée peut être jouée
      if (game.discardPile && game.discardPile.length > 0) {
        const topCard = game.discardPile[game.discardPile.length - 1];
        if (drawnCards[0].isPlayable(topCard)) {
          if (confirm(`Voulez-vous jouer la carte ${drawnCards[0].color} ${drawnCards[0].value} que vous venez de piocher?`)) {
            const cardIndex = player.hand.length - 1;
            handleCardClick(drawnCards[0], cardIndex);
            return;
          }
        }
      }
      
      game.nextPlayer();
      updateUI();
    });
  }
}

// Fonction de gestion du clic sur une carte
function handleCardClick(card, index) {
  // Si c'est la première carte à jouer (pas de carte dans la pile de défausse)
  if (!game.discardPile || game.discardPile.length === 0) {
    // Vérifier si la carte n'est pas noire (selon les règles du jeu)
    if (card.color === "black") {
      alert("Vous ne pouvez pas commencer avec une carte noire.");
      return;
    }
    
    // Jouer la première carte
    game.discardPile = [card];
    game.getCurrentPlayer().hand.splice(index, 1);
    
    const gameLogElement = document.querySelector("#game-log");
    gameLogElement.innerHTML += `<br>${game.getCurrentPlayer().name} a commencé avec ${card.color} ${card.value}`;
    
    game.nextPlayer();
    updateUI();
    return;
  }
  
  const topCard = game.discardPile[game.discardPile.length - 1];
  
  // Vérifier si la carte est jouable
  if (!card.isPlayable(topCard)) {
    alert("Carte non jouable. Choisissez une autre carte ou piochez.");
    return;
  }
  
  // Traitement des cartes noires (qui nécessitent de choisir une couleur)
  if (card.color === "black") {
    showColorChoiceModal(chosenColor => {
      if (game.playTurn(index, chosenColor)) {
        const gameLogElement = document.querySelector("#game-log");
        gameLogElement.innerHTML += `<br>${game.players[(game.currentPlayerIndex + game.players.length - 1) % game.players.length].name} a joué ${card.value} et a choisi la couleur ${chosenColor}`;
        updateUI();
      }
    });
    return;
  }
  
  // Traitement de la carte 7 (échange de mains)
  if (card.value === '7') {
    if (game.playTurn(index)) {
      const result = game.handleSevenCard();
      if (result === "CHOOSE_PLAYER_FOR_SWAP") {
        showPlayerSwapModal(targetPlayerIndex => {
          performCardSwap(targetPlayerIndex);
        });
      }
      updateUI();
    }
    return;
  }
  
  // Traitement des autres cartes
  if (game.playTurn(index)) {
    const gameLogElement = document.querySelector("#game-log");
    const previousPlayer = game.players[(game.currentPlayerIndex + game.players.length - 1) % game.players.length].name;
    gameLogElement.innerHTML += `<br>${previousPlayer} a joué ${card.color} ${card.value}`;
    updateUI();
  }
}

// Fonction pour afficher les cartes piochées
function showDrawnCards(drawnCards, callback) {
  const overlay = document.createElement('div');
  overlay.className = 'drawn-cards-overlay';
  
  const drawnCardsDisplay = document.createElement('div');
  drawnCardsDisplay.className = 'drawn-cards-display';
  
  overlay.appendChild(drawnCardsDisplay);
  document.body.appendChild(overlay);

  drawnCards.forEach((card, index) => {
    setTimeout(() => {
      const cardElement = document.createElement('div');
      cardElement.className = `card drawn-card ${card.color}`;
      cardElement.innerHTML = `<span>${card.value}</span>`;
      drawnCardsDisplay.appendChild(cardElement);

      if (index === drawnCards.length - 1) {
        setTimeout(() => {
          overlay.remove();
          if (callback) callback();
        }, 1500);
      }
    }, index * 500);
  });
}

// Fonction de mise à jour de l'interface
function updateUI() {
  if (!gameStarted) return;
  
  const discardPileElement = document.querySelector("#discard-pile");
  const currentPlayerElement = document.querySelector("#current-player");
  const playerHandElement = document.querySelector("#player-hand");
  const gameLogElement = document.querySelector("#game-log");
  const otherPlayersElement = document.querySelector("#other-players");
  
  if (!discardPileElement || !currentPlayerElement || !playerHandElement || !gameLogElement || !otherPlayersElement) {
    console.error("UI elements not found");
    return;
  }

  // Animation au changement de joueur
  currentPlayerElement.style.opacity = "0";
  setTimeout(() => {
    // Afficher le joueur actuel
    currentPlayerElement.innerHTML = `<strong>Joueur actuel :</strong> ${game.getCurrentPlayer().name}`;
    
    // Ajouter un indicateur de direction
    const directionIndicator = document.createElement("span");
    directionIndicator.className = "direction-indicator";
    directionIndicator.innerHTML = ` (Direction : ${game.direction === 1 ? "→" : "←"})`;
    currentPlayerElement.appendChild(directionIndicator);
    
    currentPlayerElement.style.opacity = "1";
  }, 300);

  // Afficher la carte sur la pile de défausse
  discardPileElement.innerHTML = "<strong>Carte sur la pile :</strong>";
  
  if (game.discardPile && game.discardPile.length > 0) {
    const topCard = game.discardPile[game.discardPile.length - 1];
    
    const cardElement = document.createElement("div");
    cardElement.className = `card top-card ${topCard.color}`;
    cardElement.innerHTML = `<span>${topCard.value}</span>`;
    discardPileElement.appendChild(cardElement);
  } else {
    // Si pas de carte dans la pile de défausse, afficher un placeholder
    const placeholderElement = document.createElement("div");
    placeholderElement.className = "card-placeholder";
    placeholderElement.textContent = "Aucune carte jouée";
    discardPileElement.appendChild(placeholderElement);
  }

  // Afficher les autres joueurs et le nombre de cartes qu'ils ont
  otherPlayersElement.innerHTML = "<strong>Autres joueurs :</strong><br>";
  game.players.forEach((player, index) => {
    if (index !== game.currentPlayerIndex) {
      const playerInfo = document.createElement("div");
      playerInfo.className = "player-info";
      playerInfo.innerHTML = `${player.name}: ${player.hand.length} cartes`;
      otherPlayersElement.appendChild(playerInfo);
    }
  });

  // Afficher la main du joueur actuel
  const player = game.getCurrentPlayer();
  playerHandElement.innerHTML = "<strong>Votre main :</strong><br>";
  
  const cardsContainer = document.createElement("div");
  cardsContainer.className = "cards-container";
  
  // Vérifier s'il y a des cartes dans la pile de défausse pour déterminer la jouabilité
  const topCard = game.discardPile && game.discardPile.length > 0 
    ? game.discardPile[game.discardPile.length - 1] 
    : null;
  
  player.hand.forEach((card, index) => {
    const cardElement = document.createElement("div");
    cardElement.className = `card ${card.color}`;
    
    // Vérifier la jouabilité seulement s'il y a une carte sur le dessus
    if (topCard) {
      cardElement.className += ` ${card.isPlayable(topCard) ? "playable" : "unplayable"}`;
    } else {
      // Si c'est la première carte à jouer, toutes les cartes sont jouables sauf les noires
      cardElement.className += card.color !== "black" ? " playable" : " unplayable";
    }
    
    cardElement.innerHTML = `<span>${card.value}</span>`;
    cardElement.onclick = () => handleCardClick(card, index);
    cardsContainer.appendChild(cardElement);
  });
  
  playerHandElement.appendChild(cardsContainer);
  
  // Ajouter un bouton pour piocher
  const drawButton = document.createElement("button");
  drawButton.id = "draw-button";
  drawButton.textContent = "Piocher une carte";
  drawButton.onclick = drawCard;
  playerHandElement.appendChild(drawButton);
}

// Gestion de la fermeture des modales
window.onclick = function(event) {
  const playerSwapModal = document.querySelector("#player-swap-modal");
  const colorChoiceModal = document.querySelector("#color-choice-modal");
  
  if (event.target === playerSwapModal) {
    playerSwapModal.style.display = "none";
  }
  
  if (event.target === colorChoiceModal) {
    colorChoiceModal.style.display = "none";
  }
};

// Initialiser l'interface
document.addEventListener("DOMContentLoaded", () => {
  // Créer les modales si elles n'existent pas
  if (!document.querySelector("#player-swap-modal")) {
    createPlayerSwapModal();
  }
  
  if (!document.querySelector("#color-choice-modal")) {
    createColorChoiceModal();
  }
  
  initializeGame();
});

// Fonction pour créer la modale d'échange de joueurs
function createPlayerSwapModal() {
  const modal = document.createElement("div");
  modal.id = "player-swap-modal";
  modal.className = "modal";
  
  const modalContent = document.createElement("div");
  modalContent.className = "modal-content";
  
  const title = document.createElement("h2");
  title.textContent = "Choisissez un joueur pour échanger vos cartes";
  
  const choices = document.createElement("div");
  choices.id = "player-choices";
  choices.className = "player-choices";
  
  modalContent.appendChild(title);
  modalContent.appendChild(choices);
  modal.appendChild(modalContent);
  
  document.body.appendChild(modal);
}

// Fonction pour créer la modale de choix de couleur
function createColorChoiceModal() {
  const modal = document.createElement("div");
  modal.id = "color-choice-modal";
  modal.className = "modal";
  
  const modalContent = document.createElement("div");
  modalContent.className = "modal-content";
  
  const title = document.createElement("h2");
  title.textContent = "Choisissez une couleur";
  
  const choices = document.createElement("div");
  choices.className = "color-buttons";
  
  const colors = ["red", "blue", "green", "yellow"];
  colors.forEach(color => {
    const button = document.createElement("button");
    button.className = `color-btn ${color}`;
    button.setAttribute("data-color", color);
    button.textContent = color.charAt(0).toUpperCase() + color.slice(1);
    choices.appendChild(button);
  });
  
  modalContent.appendChild(title);
  modalContent.appendChild(choices);
  modal.appendChild(modalContent);
  
  document.body.appendChild(modal);
}

// Ajouter un gestionnaire d'événements pour le bouton UNO
document.addEventListener("DOMContentLoaded", () => {
  const unoButton = document.querySelector("#uno-button");
  if (unoButton) {
    unoButton.addEventListener("click", () => {
      if (!game || !gameStarted) return;
      
      const currentPlayer = game.getCurrentPlayer();
      if (currentPlayer.hand.length === 1) {
        alert("UNO! Bien joué!");
      } else if (currentPlayer.hand.length === 2) {
        alert("Vous avez dit UNO trop tôt!");
        currentPlayer.drawCards(game.deck, 2);
        updateUI();
      } else {
        alert("Vous ne pouvez pas dire UNO maintenant!");
      }
    });
  }
});
