import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';

interface ShellNavItem {
  label: string;
  icon: string;
  isActive: boolean;
}

@Component({
  selector: 'app-app-shell',
  templateUrl: './app-shell.component.html',
  styleUrls: ['./app-shell.component.css']
})
export class AppShellComponent {
  @Input() platformTitle = 'SBI Document Extractor';
  @Input() userName = 'John Doe';
  @Input() userRole = 'KYC Manager';
  @Input() primaryActionLabel = 'Upload Documents';
  @Input() topNavItems: ShellNavItem[] = [];
  @Input() footerLeft = 'Other Documents';
  @Input() footerRight = 'Help & Support';
  @Input() actionVisible = true;
  @Input() footerVisible = true;

  constructor(private readonly router: Router) {}

  onTopNavClick(label: string): void {
    const route = this.routeByLabel(label);
    if (!route) {
      return;
    }
    void this.router.navigate([route]);
  }

  isTopNavActive(label: string, fallback: boolean): boolean {
    const route = this.routeByLabel(label);
    if (!route) {
      return fallback;
    }

    if (route === '/dashboard') {
      return this.router.url === '/dashboard';
    }

    return this.router.url.startsWith(route);
  }

  private routeByLabel(label: string): string | null {
    if (label === 'Dashboard') {
      return '/dashboard';
    }
    if (label === 'History') {
      return '/dashboard/history';
    }
    if (label === 'Verification Queue') {
      return '/dashboard/verification-queue';
    }
    if (label === 'Settings') {
      return '/dashboard/settings';
    }
    if (label === 'Reports') {
      return '/dashboard/reports';
    }
    return null;
  }

}
