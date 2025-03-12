// Importer les classes depuis cards.js
import { Card, Deck, mainDeck } from "./cards.js";

/*La classe Player pour un joueur, contient un nom et une main. */
//constructor, methode qui est appelée automatiquement lorsque une nouvelle instance 
// de la classe est créée avec (new Player(...))
export class Player {
  constructor(name) {
    this.name = name;
    this.hand = [];
    console.log(this.hand);
  }

  // methode pour ajouter des cartes à la main du joueur
  // ...cards est un opérateur de décomposition qui permet de décomposer le tableau cards
  //  en une liste d'élément individuelle
  // permet d'ajouter tous les éléments du tableau en 1 ligne
  // methode permettant de piocher les cartes
  drawCards(deckOrCards, amount = 1) {
   
    //- deckOrCards : Premier paramètre qui peut être soit un objet deck,
    //  soit un tableau de cartes- amount = 1 : Deuxième paramètre avec une valeur par défaut de 1,
    //  indiquant le nombre de cartes à piocher
    let drawnCards;
    //let drawnCards : Variable qui stockera les cartes piochées, déclarée sans valeur initiale
    // - deckOrCards : Vérifie si le paramètre existe (n'est pas null ou undefined)
//typeof deckOrCards.draw === 'function' : Vérifie si la propriété draw de l'objet est une fonction
//Si les deux conditions sont vraies, on utilise la méthode draw de l'objet pour piocher des cartes
    if (deckOrCards && typeof deckOrCards.draw === 'function') {
      drawnCards = deckOrCards.draw(amount);
    }
    // Array.isArray(deckOrCards) : Fonction JavaScript qui vérifie si la valeur est un tableau
//Si c'est un tableau, on l'utilise directement comme cartes piochées
    else if (Array.isArray(deckOrCards)) {
      drawnCards = deckOrCards;
    }
    // typeof mainDeck !== 'undefined' : Vérifie si la variable mainDeck existe
//typeof mainDeck.draw === 'function' : Vérifie si mainDeck a une méthode draw
//Si les deux sont vrais, on utilise mainDeck comme solution de repli
    else if (typeof mainDeck !== 'undefined' && typeof mainDeck.draw === 'function') {
      drawnCards = mainDeck.draw(amount);
    }
    // Cas d'erreur
    //Affiche un message d'erreur dans la console et retourne un tableau vide
    else {
      console.error('Aucun deck valide ou cartes fournies', deckOrCards);
      return [];
    }
    // this.hand.push(...drawnCards) : Ajoute les cartes piochées à la main du joueur
    this.hand.push(...drawnCards);
    // retourne les cartes piochées
    return drawnCards;
  }

  // Joue une carte de la main du joueur si elle est jouable
  // Vérifie l'index dans la main et si la carte est jouable
  // utilise isPlayable, methode de la class Card defini dans cards.js
  // si la carte est jouable elle est retirée de la main du joueur 
  // a l'aide de la méthode splice et retournée

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
  // appelle la methode isPlayable pour faire la vérification
  // peut être utilisée pour activer/désactiver des boutons ou afficher 
  // des messages appropriés dans l'interface utilisateur.
  hasValidMove(topCard) {
    return this.hand.some((card) => card.isPlayable(topCard));
  }
}

/*La classe UnoGame, classe principale qui gère le déroulement du jeu, contient le paquet de cartes,
 la pile de défausse, les joueurs, et les méthodes pour démarrer le jeu, jouer un tour, 
 et gérer les cartes spéciales.*/
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
    // index du joueur actuel dans le tableau this.players
    this.currentPlayerIndex = 0;
    this.direction = 1; // 1 pour sens horaire, -1 pour anti-horaire
    this.currentColor = null; // Pour suivre la couleur actuelle
  }

  // Démarre le jeu en mélangeant le paquet et distribuant les cartes
  start() {
    this.deck.shuffle();

    // Distribution des cartes initiales (7 cartes par joueur)
    this.players.forEach((player) => {
      player.drawCards(this.deck.draw(7));
    });

    // Sélection aléatoire du joueur qui commence
    this.currentPlayerIndex = Math.floor(Math.random() * this.players.length);
    
    // Retourne le joueur qui commence pour l'interface
    return {
      startingPlayer: this.getCurrentPlayer()
    };
  }

  // méthode pour définir la carte de départ choisie par le joueur
  setStartingCard(cardIndex) {
    const player = this.getCurrentPlayer();
    
    if (cardIndex >= 0 && cardIndex < player.hand.length) {
      const selectedCard = player.hand[cardIndex];
      
      // Vérifier que la carte n'est pas noire
      if (selectedCard.color === "black") {
        return {
          success: false,
          message: "Vous ne pouvez pas commencer avec une carte noire."
        };
      }
      
      // Retirer la carte de la main du joueur
      const card = player.hand.splice(cardIndex, 1)[0];
      
      // Ajouter la carte à la pile de défausse
      this.discardPile.push(card);
      
      // Définir la couleur actuelle
      this.currentColor = card.color;
      
      return {
        success: true,
        card: card
      };
    }
    
    return {
      success: false,
      message: "Index de carte invalide."
    };
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
    const topCard = this.discardPile[this.discardPile.length - 1]; 
    const card = player.playCard(cardIndex, topCard);

    if (card) {
      // Si la carte a été jouée avec succès (card n'est pas null), 
      // elle est ajoutée à la pile de défausse.
      this.discardPile.push(card);

      // Mise à jour de la couleur
      // si la carte jouée est une carte noire, la couleur est mise à jour 
      // avec la couleur choisie par le joueur
      if (card.color === "black" && chosenColor) {
        this.currentColor = chosenColor;
      } else if (card.color !== "black") {
        this.currentColor = card.color;
      }
      // handleSpecialCard(card) méthode qui gère les effets des cartes spéciales
      this.handleSpecialCard(card);
      // Cette condition vérifie si la carte jouée ne fait pas partie 
      // des cartes spéciales qui empêchent le tour de passer 
      // au joueur suivant
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
  
  // Gère les effets des cartes spéciales
  handleSpecialCard(card) {
    const currentPlayer = this.getCurrentPlayer();

    switch (card.value) {
      case "reverse":
        this.direction = -1;
        break;

      case "skip":
        this.nextPlayer();
        break;

      case "+2":
      case "+4":
      case "Black+4Reverse":
      case "Black+6":
      case "Black+10":
        // Déterminer la valeur numérique de la carte
        let drawAmount = 0;
        if (card.value === "+2") drawAmount = 2;
        else if (card.value === "+4") drawAmount = 4;
        else if (card.value === "Black+4Reverse") {
          drawAmount = 4;
          this.direction *= -1;
        }
        else if (card.value === "Black+6") drawAmount = 6;
        else if (card.value === "Black+10") drawAmount = 10;
        
        // Passer au joueur suivant
        this.nextPlayer();
        
        // Vérifier si le joueur suivant peut jouer une carte de valeur égale ou supérieure
        const nextPlayer = this.getCurrentPlayer();
        const hasCounterCard = nextPlayer.hand.some(c => {
          // Extraire la valeur numérique des cartes +N
          if (["+2", "+4", "Black+4Reverse", "Black+6", "Black+10"].includes(c.value)) {
            const counterValue = parseInt(c.value.match(/\d+/)[0] || "0");
            return counterValue >= drawAmount;
          }
          return false;
        });
        
        // Si le joueur n'a pas de carte pour contrer, il pioche
        if (!hasCounterCard) {
          nextPlayer.drawCards(this.deck.draw(drawAmount));
        }
        // Sinon, l'interface devra permettre au joueur de choisir s'il joue une carte ou pioche
        // Le traitement de ce choix sera géré dans l'interface utilisateur
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
