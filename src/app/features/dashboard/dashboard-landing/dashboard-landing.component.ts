import { Component, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Observable, forkJoin, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { filter } from 'rxjs/operators';

interface HeaderInfo {
  platformTitle: string;
  userName: string;
  userRole: string;
  alerts: number;
}

interface NavItem {
  label: string;
  icon: string;
  isActive: boolean;
}

type DocArtClass =
  | 'aadhaar'
  | 'pan'
  | 'voter'
  | 'passport'
  | 'driving-license'
  | 'aof'
  | 'hlf'
  | 'handwritten'
  | 'digital'
  | 'misc-text'
  | 'plf'
  | 'cheque'
  | 'application'
  | 'supporting';

interface OvdCard {
  title: string;
  subtitle: string;
  artClass: DocArtClass;
}

interface DocumentCategory {
  name: 'OVDs' | 'Text Documents' | 'Forms' | 'Miscellaneous';
  types: string[];
}

interface ActivityItem {
  title: string;
  id: string;
  age: string;
  status: 'Processing' | 'Verified' | 'Just time';
}

interface StatItem {
  value: string;
  label: string;
}

interface ActionItem {
  text: string;
  actionLabel: string;
}

interface BenefitItem {
  title: string;
  subtitle: string;
}

@Component({
  selector: 'app-dashboard-landing',
  templateUrl: './dashboard-landing.component.html',
  styleUrls: ['./dashboard-landing.component.css']
})
export class DashboardLandingComponent implements OnInit {
  isLoading = true;

  headerInfo!: HeaderInfo;
  topNavItems: NavItem[] = [];
  sideNavItems: NavItem[] = [];
  ovdCards: OvdCard[] = [];
  documentCategories: DocumentCategory[] = [];
  selectedCategory: DocumentCategory['name'] = 'OVDs';
  recentActivities: ActivityItem[] = [];
  stats: StatItem[] = [];
  suggestedActions: ActionItem[] = [];
  benefits: BenefitItem[] = [];

  private readonly documentAssetMap: Record<DocArtClass, string> = {
    aadhaar: 'assets/doc-icons/aadhaar.svg',
    pan: 'assets/doc-icons/pan.svg',
    voter: 'assets/doc-icons/voter.svg',
    passport: 'assets/doc-icons/passport.svg',
    'driving-license': 'assets/doc-icons/driving-license.svg',
    aof: 'assets/doc-icons/account-opening-form.svg',
    hlf: 'assets/doc-icons/housing-loan-form.svg',
    handwritten: 'assets/doc-icons/handwritten-text.svg',
    digital: 'assets/doc-icons/digital-text.svg',
    'misc-text': 'assets/doc-icons/misc-text.svg',
    plf: 'assets/doc-icons/personal-loan-form.svg',
    cheque: 'assets/doc-icons/cheque.svg',
    application: 'assets/doc-icons/application.svg',
    supporting: 'assets/doc-icons/supporting-document.svg'
  };

  constructor(private readonly router: Router) {}

  get firstSuggestedAction(): ActionItem | null {
    return this.suggestedActions.length > 0 ? this.suggestedActions[0] : null;
  }

  getDocAsset(artClass: DocArtClass): string {
    return this.documentAssetMap[artClass];
  }

  ngOnInit(): void {
    this.loadDashboardData();

    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        this.syncTopNavWithRoute(this.router.url);
      });
  }

  private loadDashboardData(): void {
    forkJoin({
      headerInfo: this.getHeaderInfoApi(),
      topNavItems: this.getTopNavigationApi(),
      sideNavItems: this.getSideNavigationApi(),
      ovdCards: this.getOvdCardsApi(),
      documentCategories: this.getDocumentCategoriesApi(),
      recentActivities: this.getRecentActivitiesApi(),
      stats: this.getStatsApi(),
      suggestedActions: this.getSuggestedActionsApi(),
      benefits: this.getKeyBenefitsApi()
    }).subscribe((response) => {
      this.headerInfo = response.headerInfo;
      this.topNavItems = response.topNavItems;
      this.sideNavItems = response.sideNavItems;
      this.ovdCards = response.ovdCards;
      this.documentCategories = response.documentCategories;
      this.recentActivities = response.recentActivities;
      this.stats = response.stats;
      this.suggestedActions = response.suggestedActions;
      this.benefits = response.benefits;
      this.syncTopNavWithRoute(this.router.url);
      this.isLoading = false;
    });
  }

  get selectedCategoryTypes(): string[] {
    const matchedCategory = this.documentCategories.find((category) => category.name === this.selectedCategory);
    return matchedCategory ? matchedCategory.types : [];
  }

  get selectedCategoryHeading(): string {
    if (this.selectedCategory === 'OVDs') {
      return 'OVD Extraction';
    }
    if (this.selectedCategory === 'Text Documents') {
      return 'Text Documents Extraction';
    }
    if (this.selectedCategory === 'Forms') {
      return 'Forms Extraction';
    }
    return 'Miscellaneous Extraction';
  }

  get supportedLabel(): string {
    if (this.selectedCategory === 'OVDs') {
      return 'Supported OVDs:';
    }
    if (this.selectedCategory === 'Text Documents') {
      return 'Supported Text Documents:';
    }
    if (this.selectedCategory === 'Forms') {
      return 'Supported Forms:';
    }
    return 'Supported Miscellaneous:';
  }

  onSelectCategory(categoryName: DocumentCategory['name']): void {
    this.selectedCategory = categoryName;
    this.ovdCards = this.getCardsByCategory(categoryName);
  }

  onTopNavClick(label: string): void {
    this.setTopNavActive(label);

    if (label === 'Dashboard') {
      void this.router.navigate(['/dashboard']);
      return;
    }

    if (label === 'History') {
      void this.router.navigate(['/dashboard/history']);
      return;
    }

    if (label === 'Verification Queue') {
      void this.router.navigate(['/dashboard/verification-queue']);
      return;
    }

    if (label === 'Reports') {
      void this.router.navigate(['/dashboard/reports']);
      return;
    }

    if (label === 'Settings') {
      void this.router.navigate(['/dashboard/settings']);
    }
  }

  onSideNavClick(label: string): void {
    if (label === 'Start New Verification' || label === 'Upload Document') {
      void this.router.navigate(['/dashboard/upload-documents']);
      return;
    }

    if (label === 'Pending Queue') {
      void this.router.navigate(['/dashboard/verification-queue']);
    }
  }

  private syncTopNavWithRoute(url: string): void {
    if (url.startsWith('/dashboard/history')) {
      this.setTopNavActive('History');
      return;
    }

    if (url.startsWith('/dashboard/verification-queue') || url.startsWith('/dashboard/checker-queue')) {
      this.setTopNavActive('Verification Queue');
      return;
    }

    if (url.startsWith('/dashboard/reports')) {
      this.setTopNavActive('Reports');
      return;
    }

    if (url.startsWith('/dashboard/settings')) {
      this.setTopNavActive('Settings');
      return;
    }

    if (url.startsWith('/dashboard')) {
      this.setTopNavActive('Dashboard');
      return;
    }

    this.setTopNavActive('');
  }

  private setTopNavActive(activeLabel: string): void {
    this.topNavItems = this.topNavItems.map((item) => ({
      ...item,
      isActive: item.label === activeLabel
    }));
  }

  private getHeaderInfoApi(): Observable<HeaderInfo> {
    return of({
      platformTitle: 'SBI Document Extractor',
      userName: 'John Doe',
      userRole: 'KYC Manager',
      alerts: 1
    }).pipe(delay(180));
  }

  private getTopNavigationApi(): Observable<NavItem[]> {
    return of([
      { label: 'Dashboard', icon: 'D', isActive: true },
      { label: 'Verification Queue', icon: 'V', isActive: false },
      { label: 'History', icon: 'H', isActive: false },
      { label: 'Reports', icon: 'R', isActive: false },
      { label: 'Settings', icon: 'S', isActive: false }
    ]).pipe(delay(220));
  }

  private getSideNavigationApi(): Observable<NavItem[]> {
    return of([
      { label: 'Upload Document', icon: 'U', isActive: true },
      { label: 'Start New Verification', icon: 'N', isActive: false },
      { label: 'Pending Queue', icon: 'P', isActive: false },
      { label: 'Approvals', icon: 'A', isActive: false },
      { label: 'Rejected Cases', icon: 'R', isActive: false }
    ]).pipe(delay(240));
  }

  private getOvdCardsApi(): Observable<OvdCard[]> {
    return of(this.getCardsByCategory('OVDs')).pipe(delay(280));
  }

  private getDocumentCategoriesApi(): Observable<DocumentCategory[]> {
    const categories: DocumentCategory[] = [
      {
        name: 'OVDs',
        types: ['Aadhaar Card', 'PAN Card', 'Voter Card', 'Passport', 'Driving License']
      },
      {
        name: 'Text Documents',
        types: ['Handwritten Text', 'Digital Text', 'Miscellaneous Text Documents']
      },
      {
        name: 'Forms',
        types: ['Account Opening Form', 'Housing Loan Form', 'Personal Loan Form']
      },
      {
        name: 'Miscellaneous',
        types: ['Cheques', 'Applications', 'Other Supporting Documents']
      }
    ];

    return of(categories).pipe(delay(250));
  }

  private getCardsByCategory(category: DocumentCategory['name']): OvdCard[] {
    if (category === 'Text Documents') {
      return [
        { title: 'Handwritten Text', subtitle: 'Handwritten Text', artClass: 'handwritten' },
        { title: 'Digital Text', subtitle: 'Digital Text', artClass: 'digital' },
        { title: 'Miscellaneous Text', subtitle: 'Miscellaneous Text', artClass: 'misc-text' }
      ];
    }

    if (category === 'Forms') {
      return [
        { title: 'Account Opening Form', subtitle: 'Account Opening Form', artClass: 'aof' },
        { title: 'Housing Loan Form', subtitle: 'Housing Loan Form', artClass: 'hlf' },
        { title: 'Personal Loan Form', subtitle: 'Personal Loan Form', artClass: 'plf' }
      ];
    }

    if (category === 'Miscellaneous') {
      return [
        { title: 'Cheque', subtitle: 'Cheque', artClass: 'cheque' },
        { title: 'Application', subtitle: 'Application', artClass: 'application' },
        { title: 'Supporting Doc', subtitle: 'Supporting Document', artClass: 'supporting' }
      ];
    }

    return [
      { title: 'Aadhaar Card', subtitle: 'Aadhaar Card', artClass: 'aadhaar' },
      { title: 'PAN Card', subtitle: 'PAN Card', artClass: 'pan' },
      { title: 'Voter Card', subtitle: 'Voter Card', artClass: 'voter' },
      { title: 'Passport', subtitle: 'Passport', artClass: 'passport' },
      { title: 'Driving License', subtitle: 'Driving License', artClass: 'driving-license' }
    ];
  }

  private getRecentActivitiesApi(): Observable<ActivityItem[]> {
    const activities: ActivityItem[] = [
      { title: 'Aadhaar Card', id: '1824-5608-9123', age: 'Just now', status: 'Just time' },
      { title: 'Personal Loan Form', id: '2078-8004-29122', age: '5 mins ago', status: 'Processing' },
      { title: 'Aadhaar Card', id: '5978-9223-4667', age: '15 mins ago', status: 'Verified' },
      { title: 'PAN Card', id: '#11B0ED10234F', age: '30 mins ago', status: 'Verified' }
    ];

    return of(activities).pipe(delay(300));
  }

  private getStatsApi(): Observable<StatItem[]> {
    return of([
      { value: '18', label: 'Documents Processed Today' },
      { value: '32s', label: 'Average Verification Time' },
      { value: '4', label: 'Pending Verifications' }
    ]).pipe(delay(210));
  }

  private getSuggestedActionsApi(): Observable<ActionItem[]> {
    return of([
      { text: 'Resume Aadhaar Card #1234 56XX 9123 verification', actionLabel: 'Resume Verification' },
      { text: '4 pending loan forms need review', actionLabel: 'Review Loan Forms' }
    ]).pipe(delay(260));
  }

  private getKeyBenefitsApi(): Observable<BenefitItem[]> {
    return of([
      { title: 'Secure & Encrypted', subtitle: 'Bank-grade data handling with strict controls' },
      { title: 'Fast OCR & AI Extraction', subtitle: 'High-speed field extraction from KYC documents' },
      { title: 'Editable Verification', subtitle: 'Maker-checker review before final submission' }
    ]).pipe(delay(230));
  }

}
