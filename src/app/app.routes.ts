import { Routes } from '@angular/router';
import {LandingComponent} from './landing/landing';
import { HomeComponent } from './pages/home/home';

export const routes: Routes = [
  {
    path: '',
    component: LandingComponent, // Landing sẽ là trang đầu tiên
  },
  {
    path: 'home',
    component: HomeComponent, // Trang countdown
  }
];
