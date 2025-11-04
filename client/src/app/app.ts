import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {LobbyComponent} from './components/lobby/lobby';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, LobbyComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('client');
}
