import { Component } from '@angular/core';

interface NavItem {
  label: string;
  icon: string;
  isActive: boolean;
}

@Component({
  selector: 'app-reports',
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.css']
})
export class ReportsComponent {
  readonly topNavItems: NavItem[] = [
    { label: 'Dashboard', icon: 'D', isActive: false },
    { label: 'Verification Queue', icon: 'V', isActive: false },
    { label: 'History', icon: 'H', isActive: false },
    { label: 'Reports', icon: 'R', isActive: true },
    { label: 'Settings', icon: 'S', isActive: false }
  ];
}
