import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LandingPage } from './landing.page';
import { LoginPage } from './login.page';
import { RegisterPage } from './register.page';
import { RolesPage } from './roles.page';

const routes: Routes = [
  { path: '', component: LandingPage },
  { path: 'login', component: LoginPage },
  { path: 'roles', component: RolesPage },
  { path: 'register', component: RegisterPage },
  { path: 'register/:kind', component: RegisterPage },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PublicRoutingModule {}
