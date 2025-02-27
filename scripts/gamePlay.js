// Importer les classes depuis cards.js
import { Card, Deck, mainDeck } from "./cards.js";

/*La classe Player pour un joueur, contient un nom et une main. */
//constructor, methode qui est appeléec automatiquement lorsque une nouvelle instance de la classe est créée avec(new Player(...))
export class Player {
  constructor(name) {
    this.name = name;
    this.hand = [];
    console.log(this.hand);
  }

  // methode pour ajouter des cartes à la main du joueur
  // ...cards est un opérateur de décomposition qui permet de décomposer le tableau cards en une liste d'élément individuelle
  // permet d'ajouter tous les éléments du tableau en 1 ligne
  // methode permettant de piocher les cartes
  drawCards(cards) {
    this.hand.push(...cards);
  }

  // Joue une carte de la main du joueur si elle est jouable
  // Vérifie l'index dans la main et si la carte est jouable
  // utilise isPlayable, methode de la class Card defini dans cards.js
  // si la carte est jouable elle est retirée de la main du joueur a l'aide de la méthode splice et retournée

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
  // some, méthode qui teste si au moins un élément du tableau satisfait une condition donnée
  // prend une fonction de rappel (callback) en argument et retourne true ou false
  // appell la methode isPlayable pour faire la vérification
  hasValidMove(topCard) {
    return this.hand.some((card) => card.isPlayable(topCard));
  }
}

/*La classe UnoGame, classe principale qui gère le déroulement du jeu, contient le paquet de cartes,
 la pile de défausse, les joueurs, et les méthodes pour démarrer le jeu, jouer un tour, et gérer les cartes spéciales.*/
export class UnoGame {
  constructor(playerNames = []) {
    // condition pour vérifier que playerNames est bien un tableau
    if (!Array.isArray(playerNames)) {
      throw new Error("playerNames doit être un tableau de noms de joueurs.");
    }
    // Deck contient toutes les cartes du jeu
    this.deck = new Deck();
    // discardPile contient les cartes jouées
    this.discardPile = [];
    // transforme chaque nom de joueur en une instance de la classe Player.
    this.players = playerNames.map((name) => new Player(name));
    this.currentPlayerIndex = 0; // index du joueur actuel dans le tableau this.players
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

    // firstCard stocke la première carte tirée du paquet.
    // garantit que la partie commence avec une carte valide et une couleur définie
    /* Boucle do...while
La boucle do...while est utilisée pour s'assurer que la première carte sur la pile de défausse n'est pas une carte noire 
La boucle continue à tirer des cartes jusqu'à ce qu'une carte non noire soit obtenue.
*/
    let firstCard;
    do {
      firstCard = this.deck.draw(1)[0];
      this.discardPile.push(firstCard); // La carte tirée (firstCard) est ajoutée à la pile de défausse (this.discardPile).
      this.currentColor = firstCard.color; // La propriété currentColor est mise à jour avec la couleur de la carte tirée (firstCard.color).
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
    // Utilise l'opérateur modulo (%) pour s'assurer que l'index reste dans les limites du tableau
  }

  // Joue un tour pour le joueur actuel
  playTurn(cardIndex, chosenColor = null) {
    const player = this.getCurrentPlayer();
    const topCard = this.discardPile[this.discardPile.length - 1]; //  méthode vérifie si la carte peut être jouée sur la carte topCard
    const card = player.playCard(cardIndex, topCard);

    if (card) {
      // Si la carte a été jouée avec succès (card n'est pas null), elle est ajoutée à la pile de défausse.
      this.discardPile.push(card);

      // Mise à jour de la couleur
      // si la carte jouée est une carte noire, la couleur est mise à jour avec la couleur choisie par le joueur
      if (card.color === "black" && chosenColor) {
        this.currentColor = chosenColor;
      } else if (card.color !== "black") {
        this.currentColor = card.color;
      }
      // handleSpecialCard(card) méthode qui gère les effets des cartes spéciales
      this.handleSpecialCard(card);
      // Cette condition vérifie si la carte jouée ne fait pas partie des cartes spéciales qui empêchent le tour de passer au joueur suivant
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
  // a revoir et gérer avec l'interface
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
        currentPlayer.hand.push(this.deck.draw(2));
        break;
      case "+4":
        this.nextPlayer();
        this.getCurrentPlayer().drawCards(this.deck.draw(4));
        currentPlayer.hand.push(this.deck.draw(4));
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
        currentPlayer.hand.push(this.deck.draw(6));
        break;

      case "Black+10":
        this.nextPlayer();
        this.getCurrentPlayer().drawCards(this.deck.draw(10));
        currentPlayer.hand.push(this.deck.draw(10));
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
    // Cette ligne crée une copie des mains de tous les joueurs. Chaque main est stockée dans un tableau hands,
    //  où chaque élément est un tableau représentant les cartes d'un joueur.
    // L'utilisation de [...player.hand] permet de créer une copie superficielle (shallow copy) de la main du joueur,
    //  pour éviter de modifier directement les données originales.
    const hands = this.players.map((player) => [...player.hand]);
    // Cette boucle parcourt tous les joueurs et attribue à chaque joueur la main du joueur suivant.
    for (let i = 0; i < this.players.length; i++) {
      // nextIndex est calculé en utilisant (i + 1) % this.players.length, ce qui permet de gérer le cas où le joueur suivant est le premier joueur
      const nextIndex = (i + 1) % this.players.length;
      this.players[i].hand = hands[nextIndex];
    }
  }

  handlePoserTout() {
    const currentPlayer = this.getCurrentPlayer();
    const currentColor = this.currentColor;

    // Cette ligne filtre les cartes dans la main du joueur actuel
    // pour ne garder que celles qui ont la même couleur que currentColor.
    const sameColorCards = currentPlayer.hand.filter(
      (card) => card.color === currentColor
    );

    // Pose toutes les cartes de la même couleur
    sameColorCards.forEach((card) => {
      // La carte est ajoutée à la pile de défausse
      this.discardPile.push(card);
      // La carte est retirée de la main du joueu
      currentPlayer.hand = currentPlayer.hand.filter((c) => c !== card);
    });
  }

  //TODO: Méthode a revoir
  // Réinitialise le jeu

  // handleRejouer() {
  //   // Un nouveau deck est créé en instanciant une nouvelle instance de la classe Deck.
  //   // Cela signifie que toutes les cartes sont réinitialisées et mélangées.
  //   this.deck = new Deck();
  //   // La pile de défausse est vidée, ce qui signifie qu'aucune carte n'a été jouée dans la nouvelle partie.
  //   this.discardPile = [];
  //   // La méthode start() est appelée pour démarrer une nouvelle partie.
  //   this.start();
  //   console.log("Passage au joueur suivant...");
  //   this.nextPlayer();
  // }

  // méthode pour gérer le choix de couleur après une carte noire
  handleChoixCouleur() {
    // La méthode retourne une promesse (Promise),
    // ce qui permet de gérer de manière asynchrone la sélection de couleur.
    // La promesse est résolue (resolve()) une fois que le joueur a choisi une couleur.
    return new Promise((resolve) => {
      // La méthode récupère la modale de sélection de couleur
      const modal = document.querySelector("#color-choice-modal");
      // Si la modale existe, elle est affichée en changeant son style
      if (modal) {
        modal.style.display = "block";
        // La méthode récupère tous les boutons de couleur dans la modale

        const buttons = modal.querySelectorAll(".color-btn");
        buttons.forEach((button) => {
          // un gestionnaire d'événement onclick est défini
          button.onclick = () => {
            const chosenColor = button.dataset.color; // La couleur choisie est récupérée à partir de l'attribut data-color
            modal.style.display = "none"; // La modale est masquée en changeant son style
            this.currentColor = chosenColor;
            // La méthode met à jour un indicateur de couleur dans l'interface utilisateur
            // (par exemple, un élément avec l'ID current-color) pour afficher la couleur choisie.
            const colorIndicator = document.querySelector("#current-color");
            if (colorIndicator) {
              colorIndicator.textContent = `Couleur actuelle: ${chosenColor}`;
              colorIndicator.style.backgroundColor = chosenColor;
            }

            this.nextPlayer();
            // La méthode ajoute une entrée dans le journal du jeu (par exemple, un élément avec l'ID game-log)
            // pour indiquer que le joueur a choisi une couleur.
            const gameLogElement = document.querySelector("#game-log");
            if (gameLogElement) {
              gameLogElement.innerHTML += `<br>${
                this.players[this.currentPlayerIndex].name
              } a choisi la couleur ${chosenColor}`;
            }
            resolve();
            if (typeof updateUI === "function") {
              // la fonction updateUI est appelée pour mettre à jour l'interface utilisateur.
              updateUI();
            }
          };
        });
      } else {
        console.error("Modal de choix de couleur non trouvé");
        // La promesse est résolue une fois que le joueur a choisi une couleur et que toutes les actions ont été effectuées.
        resolve();
      }
    });
  }
}
// Créer une instance par défaut du deck si nécessaire
export const game = new UnoGame();
