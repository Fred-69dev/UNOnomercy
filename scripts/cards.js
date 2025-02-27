/*classe Card carte Uno, deux propriétés : color et value .*/
export class Card {
    constructor(color, value) {
      this.color = color; // 'red', 'blue', 'green', 'yellow'
      this.value = value; // 0-9, +2, ...
    }
    isPlayable(topCard) {
      // Règles de base pour jouer une carte
      // TODO: si carte +2 ajouter sum= topCard + card >= topCard
      if (this.color === "black") return true; // Les cartes noires peuvent toujours être jouées
      if (this.color === topCard.color || this.value === topCard.value)
        return true; // Même couleur ou meme valeur
      return false;
    }
  };

  /*La classe Deck contient un tableau de cartes et des méthodes pour initialiser le paquet,
 mélanger les cartes, et piocher des cartes. */
export class Deck {
    constructor() {
      this.cards = [];
      this.initializeDeck();
    }
  
    // Initialise le paquet de cartes avec toutes les cartes nécessaires
    initializeDeck() {
      const colors = ["red", "blue", "green", "yellow"];
  
      // Configuration des cartes avec leur quantité
      const cardConfig = {  // objet cardConfig defini les types de carte et leur quantité, divisé en 3 sections: cartes numérotées, cartes action et cartes noires
        numbers: {
          values: ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"],
          countPerColor: {
            0: 1, // Un seul 0 par couleur
            default: 2, // Deux de chaque autre nombre par couleur
          },
        },
  
        actions: {
          // Cartes d'action colorées avec leur quantité par couleur
          "PoserTout": 3, // Tout poser (12 total)
          "skip": 3, // Sauter (12 total)
          "reverse": 3, // Inverse (12 total)
          "+2": 2, //  (8 total)
          "+4": 2, // (8 total)
          "Rejouer": 2, // Sauter tout le monde
        },

        blackCards: {
          // Cartes spéciales noires avec leur quantité totale
  
          "ChoixCouleur": 8, // Roulette de couleurs
          "Black+4Reverse": 8, // +4 inverse
          "Black+6": 4,
          "Black+10": 4,
        },
      };
  
      // Ajout des cartes numérotées par couleur au paquet de cartes cards
      colors.forEach((color) => {  // Parcours chaque couleur
        cardConfig.numbers.values.forEach((num) => {  // Parcours chaque valeur
          const count = num === "0"  // Ternaire si la valeur est 0 une carte sinon deux defini dans cardConfig
              ? cardConfig.numbers.countPerColor["0"]
              : cardConfig.numbers.countPerColor["default"];
  
          for (let i = 0; i < count; i++) {
            this.cards.push(new Card(color, num)); // Ajout des cartes au tableau cards
          }
        });
      });
      // Ajout des cartes d'action colorées
      colors.forEach((color) => {
        Object.entries(cardConfig.actions).forEach(([action, count]) => { // cardConfig.actions est un objet qui définit les types de cartes d'action et leur quantité par couleur
          for (let i = 0; i < count; i++) { // Object.entries() transforme cet objet en un tableau de paires [clé, valeur]
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

// Crée une instance du deck
export const mainDeck = new Deck();