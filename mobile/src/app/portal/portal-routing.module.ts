import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuditPage } from './audit.page';
import { BeneficiariesPage } from './beneficiaries.page';
import { DashboardPage } from './dashboard.page';
import { DuplicatesPage } from './duplicates.page';
import { FarmerProfilePage } from './farmer-profile.page';
import { FarmersPage } from './farmers.page';
import { FarmsPage } from './farms.page';
import { ProductionPage } from './production.page';
import { ProfilePage } from './profile.page';
import { ReportsPage } from './reports.page';
import { ShellPage } from './shell.page';
import { SummariesPage } from './summaries.page';
import { StatusPage } from './status.page';
import { SubsidiesPage } from './subsidies.page';

const routes: Routes = [
  {
    path: '',
    component: ShellPage,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardPage },
      { path: 'farmers', component: FarmersPage },
      { path: 'farmers/:id', component: FarmerProfilePage },
      { path: 'farms', component: FarmsPage },
      { path: 'production', component: ProductionPage },
      { path: 'subsidies', component: SubsidiesPage },
      { path: 'beneficiaries', component: BeneficiariesPage },
      { path: 'status', component: StatusPage },
      { path: 'reports', component: ReportsPage },
      { path: 'audit', component: AuditPage },
      { path: 'duplicates', component: DuplicatesPage },
      { path: 'summaries', component: SummariesPage },
      { path: 'profile', component: ProfilePage },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PortalRoutingModule {}
