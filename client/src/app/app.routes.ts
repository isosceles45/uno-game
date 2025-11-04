import { Routes } from '@angular/router';
import {LobbyComponent} from './components/lobby/lobby';

export const routes: Routes = [
  { path: '', component: LobbyComponent },
  { path: '**', redirectTo: '' }
];
