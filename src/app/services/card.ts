import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CardService {

  cards: string[] = [
    '/.../.../assets/card/1.png',
    '/.../.../assets/card/1.png',
    '/.../.../assets/card/1.png',
    '/.../.../assets/card/1.png',
  ];

  getRandomCard(): string {
    const index = Math.floor(Math.random() * this.cards.length);
    return this.cards[index];
  }
}
