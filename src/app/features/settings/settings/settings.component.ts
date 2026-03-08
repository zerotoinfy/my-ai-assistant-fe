import { Component } from '@angular/core';

interface NavItem {
  label: string;
  icon: string;
  isActive: boolean;
}

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent {
  readonly topNavItems: NavItem[] = [
    { label: 'Dashboard', icon: 'D', isActive: false },
    { label: 'Verification Queue', icon: 'V', isActive: false },
    { label: 'History', icon: 'H', isActive: false },
    { label: 'Reports', icon: 'R', isActive: false },
    { label: 'Settings', icon: 'S', isActive: true }
  ];
}
