import { Component, OnInit } from '@angular/core';
import { MenuController } from '@ionic/angular';
import { AuthService } from '../core/auth.service';
import { RoleSlug } from '../core/models';

interface MenuItem {
  label: string;
  path: string;
  roles: RoleSlug[];
}

@Component({
  selector: 'app-shell',
  templateUrl: './shell.page.html',
  standalone: false,
})
export class ShellPage implements OnInit {
  menu: MenuItem[] = [];

  private readonly items: MenuItem[] = [
    { label: 'Dashboard', path: '/app/dashboard', roles: ['system_administrator', 'mao_personnel', 'rsbsa_focal_person', 'agricultural_technician', 'farmer', 'beneficiary'] },
    { label: 'Farmers', path: '/app/farmers', roles: ['system_administrator', 'mao_personnel', 'rsbsa_focal_person', 'agricultural_technician', 'farmer'] },
    { label: 'Farms', path: '/app/farms', roles: ['system_administrator', 'mao_personnel', 'rsbsa_focal_person', 'agricultural_technician', 'farmer'] },
    { label: 'Production', path: '/app/production', roles: ['system_administrator', 'mao_personnel', 'rsbsa_focal_person', 'agricultural_technician', 'farmer'] },
    { label: 'Subsidies', path: '/app/subsidies', roles: ['system_administrator', 'mao_personnel', 'agricultural_technician', 'farmer', 'beneficiary'] },
    { label: 'Beneficiaries', path: '/app/beneficiaries', roles: ['system_administrator', 'mao_personnel', 'beneficiary'] },
    { label: 'Reports', path: '/app/reports', roles: ['system_administrator', 'mao_personnel'] },
    { label: 'AI Duplicate Review', path: '/app/duplicates', roles: ['system_administrator', 'mao_personnel'] },
    { label: 'AI Summary Generator', path: '/app/summaries', roles: ['system_administrator', 'mao_personnel'] },
    { label: 'Profile & users', path: '/app/profile', roles: ['system_administrator', 'mao_personnel', 'rsbsa_focal_person', 'agricultural_technician', 'farmer', 'beneficiary'] },
  ];

  constructor(public auth: AuthService, private menuController: MenuController) {}

  ngOnInit(): void {
    this.applyMenu();
    this.auth.refresh().subscribe({
      next: () => this.applyMenu(),
      error: () => this.applyMenu(),
    });
  }

  applyMenu(): void {
    this.menu = this.items.filter((item) => this.auth.hasRole(...item.roles));
  }

  closeMenu(): void {
    void this.menuController.close();
  }

  logout(): void {
    this.closeMenu();
    this.auth.logout();
  }
}
