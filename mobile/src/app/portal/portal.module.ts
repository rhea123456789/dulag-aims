import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular/lazy';
import { AuditPage } from './audit.page';
import { BeneficiariesPage } from './beneficiaries.page';
import { DashboardPage } from './dashboard.page';
import { DuplicatesPage } from './duplicates.page';
import { FarmerProfilePage } from './farmer-profile.page';
import { FarmersPage } from './farmers.page';
import { FarmsPage } from './farms.page';
import { PortalRoutingModule } from './portal-routing.module';
import { ProductionPage } from './production.page';
import { ProfilePage } from './profile.page';
import { ReportsPage } from './reports.page';
import { ShellPage } from './shell.page';
import { SummariesPage } from './summaries.page';
import { StatusPage } from './status.page';
import { SubsidiesPage } from './subsidies.page';

@NgModule({
  declarations: [
    ShellPage,
    DashboardPage,
    FarmersPage,
    FarmerProfilePage,
    FarmsPage,
    ProductionPage,
    SubsidiesPage,
    BeneficiariesPage,
    StatusPage,
    ReportsPage,
    AuditPage,
    DuplicatesPage,
    SummariesPage,
    ProfilePage,
  ],
  imports: [CommonModule, FormsModule, IonicModule, PortalRoutingModule],
})
export class PortalModule {}
