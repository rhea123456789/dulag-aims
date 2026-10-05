import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular/lazy';
import { LandingPage } from './landing.page';
import { LoginPage } from './login.page';
import { PublicRoutingModule } from './public-routing.module';
import { RegisterPage } from './register.page';
import { RolesPage } from './roles.page';

@NgModule({
  declarations: [LandingPage, LoginPage, RolesPage, RegisterPage],
  imports: [CommonModule, FormsModule, IonicModule, PublicRoutingModule],
})
export class PublicModule {}
