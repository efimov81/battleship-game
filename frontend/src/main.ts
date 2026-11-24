import { bootstrapApplication } from '@angular/platform-browser';
import { Component } from '@angular/core';
@Component({ selector: 'app-root', standalone: true, template: `
<main><h1>Battleship Lab</h1><p>Каркас готов. Игровой процесс реализуется в Stage 1.</p>
<section><h2>Ваше поле</h2><div class="board">@for (cell of cells; track $index) { <div class="cell"></div> }</div></section>
<section><h2>Поле противника</h2><div class="board">@for (cell of cells; track $index) { <div class="cell"></div> }</div></section>
<p>API: <code>http://localhost:3000/health</code></p></main>` })
class AppComponent { readonly cells = Array.from({ length: 100 }); }
bootstrapApplication(AppComponent).catch(console.error);
