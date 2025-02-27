// Importer les classes depuis les autres fichiers
import { Card, Deck } from './cards.js';
import { UnoGame, Player } from './gamePlay.js';

const playerNames = ["Ben", "Alex", "Fred"];
const game = new UnoGame(playerNames);
game.start();

//Cette fonction est responsable de l'affichage d'une boîte de dialogue modale (ou pop-up) 
// qui permet à un joueur de choisir un autre joueur avec qui échanger une carte.
showPlayerSwapModal((targetPlayerIndex) => {
  // callback qui sera appelé avec l'index du joueur sélectionné comme argument.
  performCardSwap(targetPlayerIndex)});

// Fonction pour afficher la modale de sélection de joueur
// modale permettant à un joueur de choisir un autre joueur avec qui échanger des cartes 
  function showPlayerSwapModal(callback) {
  const modal = document.querySelector("#player-swap-modal");
  const choices = document.querySelector("#player-choices");
  // Le contenu de choices est vidé (choices.innerHTML = "") 
  // pour s'assurer que la liste des joueurs est actualisée à chaque appel de la fonction.
  choices.innerHTML = "";

  game.players.forEach((player, index) => {
    // vérifie si l'index du joueur est différent de celui du joueur actuel 
    if (index !== game.currentPlayerIndex) {
      const button = document.createElement("button");
      button.className = "player-choice-btn";
      button.textContent = `Échanger avec ${player.name} (${player.hand.length} cartes)`;
      //  gestionnaire d'événement onclick
      button.onclick = () => {
        // Lorsque le bouton est cliqué, la modale est masquée
        modal.style.display = "none";
      // La fonction de callback est appelée avec l'index du joueur sélectionné
        callback(index);
      };
      choices.append(button);
    }
  });

  modal.style.display = "block";
}

// Fonction pour effectuer l'échange de cartes
function performCardSwap(targetPlayerIndex) {
  const currentPlayer = game.getCurrentPlayer();
// Le joueur cible est récupéré directement à partir de la liste des joueurs (game.players) 
// en utilisant l'index passé en paramètre (targetPlayerIndex).
  const targetPlayer = game.players[targetPlayerIndex];
// Les mains des deux joueurs sont échangées en utilisant une variable temporaire tempHand.
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
  // la fonction vérifie d'abord si la carte peut être jouée via game.playTurn(index).
    if (game.playTurn(index)) {
      // gére la sélection d'une nouvelle couleur par le joueur
      game.handleChoixCouleur().then(() => {
        updateUI();
      });
    }
  } else if (card.value === '7') {
    if (game.playTurn(index)) {
      const result = game.handleSevenCard();
      if (result === "CHOOSE_PLAYER_FOR_SWAP") {
        showPlayerSwapModal((targetPlayerIndex) => {
          performCardSwap(targetPlayerIndex);
        });
      }
      updateUI();
    }
  } else {
    // la fonction vérifie si la carte peut être jouée
    if (game.playTurn(index)) {
      updateUI();
      const gameLogElement = document.querySelector("#game-log");
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
// affiche les cartes piochées par un joueur 
function showDrawnCards(drawnCards, callback) {
    const drawnCardsDisplay = document.createElement('div');
    drawnCardsDisplay.className = 'drawn-cards-display';
    document.body.append(drawnCardsDisplay);

    drawnCards.forEach((card, index) => {
      // un délai est ajouté avec setTimeout pour créer un effet d'animation
        setTimeout(() => {
            const cardElement = document.createElement('div');
            cardElement.className = 'card drawn-card';
            cardElement.textContent = `${card.color} ${card.value}`;
            drawnCardsDisplay.append(cardElement);

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
// affichage du joueur actuel, la carte sur la pile de défausse, 
// la main du joueur actuel et le journal de jeu.
function updateUI() {
  // La fonction commence par sélectionner les éléments DOM nécessaires
  const discardPileElement = document.querySelector("#discard-pile");
  const currentPlayerElement = document.querySelector("#current-player");
  const playerHandElement = document.querySelector("#player-hand");
  const gameLogElement = document.querySelector("#game-log");

  // animation au changement de joueur
  // L'élément #current-player est temporairement rendu invisible
  currentPlayerElement.style.opacity = "0";
  setTimeout(() => {
    // Afficher le joueur actuel
    currentPlayerElement.innerHTML = `<strong>Joueur actuel :</strong> ${
      game.getCurrentPlayer().name
    }`;
  // Après un délai de 300 ms, le nom du joueur actuel est mis à jour et l'élément est réaffiché
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
    playerHandElement.append(cardElement);
  });

  // Afficher le log du jeu
  if (!gameLogElement.innerHTML) {
    gameLogElement.innerHTML = `<strong>Log du jeu :</strong><br>${
      game.getCurrentPlayer().name
    } joue...`;
  }
}

// Gestion de la fermeture de la modale
// Un gestionnaire d'événement est ajouté pour fermer la modale #player-swap-modal 
// lorsque l'utilisateur clique en dehors de celle-ci.
window.onclick = function (event) {
  const modal = document.querySelector("#player-swap-modal");
  if (event.target === modal) {
    modal.style.display = "none";
  }
};

// Initialiser l'interface
updateUI();
