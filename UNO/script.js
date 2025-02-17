/*classe Card carte Uno, deux propriétés : color et value .*/
class Card {
  constructor(color, value) {
    this.color = color; // 'red', 'blue', 'green', 'yellow'
    this.value = value; // 0-9, +2, ...
  }

  isPlayable(topCard) {
    // Règles de base pour jouer une carte
    if (this.color === "black") return true; // Les cartes noires peuvent toujours être jouées
    if (this.color === topCard.color || this.value === topCard.value)
      return true; // Même couleur ou meme valeur
    return false;
  }
}

/*La classe Deck contient un tableau de cartes et des méthodes pour initialiser le paquet,
 mélanger les cartes, et piocher des cartes. */
class Deck {
  constructor() {
    this.cards = [];
    this.initializeDeck();
  }

  // Initialise le paquet de cartes avec toutes les cartes nécessaires
  initializeDeck() {
    const colors = ["red", "blue", "green", "yellow"];

    // Configuration des cartes avec leur quantité
    const cardConfig = {
      numbers: {
        values: ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"],
        countPerColor: {
          0: 1, // Un seul 0 par couleur
          default: 2, // Deux de chaque autre nombre par couleur
        },
      },

      actions: {
        // Cartes d'action colorées avec leur quantité par couleur
        PoserTout: 3, // Tout poser (12 total)
        skip: 3, // Sauter (12 total)
        reverse: 3, // Inverse (12 total)
        "+2": 2, //  (8 total)
        "+4": 2, // (8 total)
        Rejouer: 2, // Sauter tout le monde
      },
      blackCards: {
        // Cartes spéciales noires avec leur quantité totale

        ChoixCouleur: 8, // Roulette de couleurs
        "Black+4Reverse": 8, // +4 inverse
        "Black+6": 4,
        "Black+10": 4,
      },
    };

    // Ajout des cartes numérotées
    colors.forEach((color) => {
      cardConfig.numbers.values.forEach((num) => {
        const count =
          num === "0"
            ? cardConfig.numbers.countPerColor["0"]
            : cardConfig.numbers.countPerColor["default"];

        for (let i = 0; i < count; i++) {
          this.cards.push(new Card(color, num));
        }
      });
    });
    // Ajout des cartes d'action colorées
    colors.forEach((color) => {
      Object.entries(cardConfig.actions).forEach(([action, count]) => {
        for (let i = 0; i < count; i++) {
          this.cards.push(new Card(color, action));
        }
      });
    });

    // Ajout des cartes noires
    Object.entries(cardConfig.blackCards).forEach(([action, count]) => {
      for (let i = 0; i < count; i++) {
        this.cards.push(new Card("black", action));
      }
    });
  }

  // Mélange les cartes du paquet
  shuffle() {
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
    }
  }

  // Pioche un nombre spécifié de cartes du paquet
  draw(amount = 1) {
    if (this.cards.length < amount) {
      return [];
    }
    return this.cards.splice(0, amount);
  }

  // Méthode pour compter le nombre total de cartes
  countCards() {
    return this.cards.length;
  }
}

/*La classe Player pour un joueur, contient un nom et une main. */
class Player {
  constructor(name) {
    this.name = name;
    this.hand = [];
  }

  // Ajoute des cartes à la main du joueur
  drawCards(cards) {
    this.hand.push(...cards);
  }

  // Joue une carte de la main du joueur si elle est jouable
  playCard(cardIndex, topCard) {
    if (cardIndex >= 0 && cardIndex < this.hand.length) {
      const card = this.hand[cardIndex];
      if (card.isPlayable(topCard)) {
        return this.hand.splice(cardIndex, 1)[0];
      }
    }
    return null;
  }

  // Vérifie si le joueur a au moins une carte jouable
  hasValidMove(topCard) {
    return this.hand.some((card) => card.isPlayable(topCard));
  }
}

/*La classe UnoGame, classe principale qui gère le déroulement du jeu, contient le paquet de cartes,
 la pile de défausse, les joueurs, et les méthodes pour démarrer le jeu, jouer un tour, et gérer les cartes spéciales.*/
class UnoGame {
  constructor(playerNames) {
    this.deck = new Deck();
    this.discardPile = [];
    this.players = playerNames.map((name) => new Player(name));
    this.currentPlayerIndex = 0;
    this.direction = 1; // 1 pour sens horaire, -1 pour anti-horaire
    this.currentColor = null; // Pour suivre la couleur actuelle
  }

  // Démarre le jeu en mélangeant le paquet, distribuant les cartes, et plaçant la première carte sur la pile de défausse
  start() {
    this.deck.shuffle();

    // Distribution des cartes initiales (7 cartes par joueur)
    this.players.forEach((player) => {
      player.drawCards(this.deck.draw(7));
    });

    // Première carte
    let firstCard;
    do {
      firstCard = this.deck.draw(1)[0];
      this.discardPile.push(firstCard);
      this.currentColor = firstCard.color;
    } while (firstCard.color === "black"); // Évite de commencer par une carte noire
    this.currentColor = firstCard.color;
  }
  // Retourne le joueur actuel
  getCurrentPlayer() {
    return this.players[this.currentPlayerIndex];
  }

  // Passe au joueur suivant en fonction de la direction du jeu
  nextPlayer() {
    this.currentPlayerIndex =
      (this.currentPlayerIndex + this.direction + this.players.length) %
      this.players.length;
  }

  // Joue un tour pour le joueur actuel
  playTurn(cardIndex, chosenColor = null) {
    const player = this.getCurrentPlayer();
    const topCard = this.discardPile[this.discardPile.length - 1];
    const card = player.playCard(cardIndex, topCard);

    if (card) {
      this.discardPile.push(card);

      // Mise à jour de la couleur courante
      if (card.color === "black" && chosenColor) {
        this.currentColor = chosenColor;
      } else if (card.color !== "black") {
        this.currentColor = card.color;
      }
      this.handleSpecialCard(card);
      // Si la carte n'est pas une carte spéciale qui gère déjà le nextPlayer()
      if (
        ![
          "skip",
          "+2",
          "+4",
          "7",
          "Black+4Reverse",
          "Black+6",
          "Black+10",
        ].includes(card.value)
      ) {
        this.nextPlayer();
      }
      return true;
    }
    return false;
  }
  // Prompt pour choisir la couleur
  promptColorChoice() {
    const color = prompt("Choisissez une couleur (red, blue, green, yellow) :");
    if (["red", "blue", "green", "yellow"].includes(color)) {
      this.currentColor = color;
      this.handleSpecialCard(this.discardPile[this.discardPile.length - 1]);
      this.nextPlayer();
      return true;
    } else {
      alert("Couleur invalide. Veuillez réessayer.");
      this.promptColorChoice();
      return false;
    }
  }
  // Gère les effets des cartes spéciales
  handleSpecialCard(card) {
    const currentPlayer = this.getCurrentPlayer();

    switch (card.value) {
      case "reverse":
        this.direction *= -1;
        break;

      case "skip":
        this.nextPlayer();
        break;

      case "+2":
        this.nextPlayer();
        this.getCurrentPlayer().drawCards(this.deck.draw(2));
        break;
      case "+4":
        this.nextPlayer();
        this.getCurrentPlayer().drawCards(this.deck.draw(4));
        break;

      case "7":
        this.handleSevenCard();
        break;

      case "0":
        this.handleZeroCard();
        break;

      case "PoserTout":
        this.handlePoserTout();
        break;
      case "Rejouer":
        this.handleRejouer();
        break;

      case "Black+4Reverse":
        this.direction *= -1;
        this.nextPlayer();
        this.getCurrentPlayer().drawCards(this.deck.draw(4));
        break;

      case "Black+6":
        this.nextPlayer();
        this.getCurrentPlayer().drawCards(this.deck.draw(6));
        break;

      case "Black+10":
        this.nextPlayer();
        this.getCurrentPlayer().drawCards(this.deck.draw(10));
        break;

      case "ChoixCouleur":
        this.handleChoixCouleur();
        break;
    }
  }

  handleSevenCard() {
    // On ne fait rien immédiatement, on attend le choix du joueur via l'interface
    return "CHOOSE_PLAYER_FOR_SWAP";
  }

  handleZeroCard() {
      const hands = this.players.map(player => [...player.hand]);
      for (let i = 0; i < this.players.length; i++) {
          const nextIndex = (i + 1) % this.players.length;
          this.players[i].hand = hands[nextIndex];
      }
  }

  handlePoserTout() {
    const currentPlayer = this.getCurrentPlayer();
    const currentColor = this.currentColor;

    // Trouve toutes les cartes de la même couleur
    const sameColorCards = currentPlayer.hand.filter(
      (card) => card.color === currentColor
    );

    // Pose toutes les cartes de la même couleur
    sameColorCards.forEach((card) => {
      this.discardPile.push(card);
      currentPlayer.hand = currentPlayer.hand.filter((c) => c !== card);
    });
  }

  handleRejouer() {
    // Réinitialise le jeu tout en gardant les mêmes joueurs
    this.deck = new Deck();
    this.discardPile = [];
    this.start();
  
 console.log('Passage au joueur suivant...');
                this.nextPlayer();
                const currentPlayer = this.getCurrentPlayer();

                // Pioche des cartes jusqu'à trouver la bonne couleur
                const drawnCards = [];
                let foundColorCard = false;

                while (!foundColorCard && this.deck.cards.length > 0) {
                    const card = this.deck.draw(1)[0];
                    drawnCards.push(card);

                    if (card.color === chosenColor) {
                        foundColorCard = true;
                    }
                }
            }
 handleChoixCouleur() {
    return new Promise((resolve) => {
        const modal = document.querySelector('#color-choice-modal');
        console.log(modal);
        modal.style.display = 'block';

        const buttons = modal.querySelectorAll('.color-btn');
        buttons.forEach(button => {
            button.onclick = () => {
                const chosenColor = button.dataset.color;
                modal.style.display = 'none';
                
// Définir la couleur actuelle du jeu
this.currentColor = chosenColor;
 // Mise à jour de l'interface pour afficher la nouvelle couleur
 const colorIndicator = document.querySelector('#current-color');
 if (colorIndicator) {
     colorIndicator.textContent = `Couleur actuelle: ${chosenColor}`;
     colorIndicator.style.backgroundColor = chosenColor;
 }

                // Ajoute toutes les cartes piochées à la main du joueur
                const currentPlayer = this.getCurrentPlayer();
                currentPlayer.drawCards(drawnCards);
                
                // Mettre à jour le log
                const gameLogElement = document.querySelector('#game-log');
                gameLogElement.innerHTML += `<br>${currentPlayer.name} pioche ${drawnCards.length} cartes pour trouver du ${chosenColor}`;
                
                 // Passage au joueur suivant
    this.nextPlayer();
    console.log('Passage au joueur suivant après la pioche');

                resolve();
                updateUI();
            };
        });
    });
}
}
