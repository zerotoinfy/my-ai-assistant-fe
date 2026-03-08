import { Component, OnInit } from '@angular/core';
import { Observable, forkJoin, of } from 'rxjs';
import { delay } from 'rxjs/operators';

interface HeaderInfo {
  platformTitle: string;
  userName: string;
  userRole: string;
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
  | 'handwritten'
  | 'digital'
  | 'misc-text'
  | 'aof'
  | 'hlf'
  | 'plf'
  | 'cheque'
  | 'application'
  | 'supporting';

interface SelectableDocument {
  id: string;
  label: string;
  artClass: DocArtClass;
}

interface DocumentCategorySection {
  title: 'OVD Documents' | 'Text Documents' | 'Bank Forms' | 'Miscelenous Documents';
  documents: SelectableDocument[];
}

@Component({
  selector: 'app-document-selector',
  templateUrl: './document-selector.component.html',
  styleUrls: ['./document-selector.component.css']
})
export class DocumentSelectorComponent implements OnInit {
  isLoading = true;

  headerInfo!: HeaderInfo;
  topNavItems: NavItem[] = [];
  categorySections: DocumentCategorySection[] = [];
  selectedDocumentId: string | null = null;

  private readonly documentAssetMap: Record<DocArtClass, string> = {
    aadhaar: 'assets/doc-icons/aadhaar.svg',
    pan: 'assets/doc-icons/pan.svg',
    voter: 'assets/doc-icons/voter.svg',
    passport: 'assets/doc-icons/passport.svg',
    'driving-license': 'assets/doc-icons/driving-license.svg',
    handwritten: 'assets/doc-icons/handwritten-text.svg',
    digital: 'assets/doc-icons/digital-text.svg',
    'misc-text': 'assets/doc-icons/misc-text.svg',
    aof: 'assets/doc-icons/account-opening-form.svg',
    hlf: 'assets/doc-icons/housing-loan-form.svg',
    plf: 'assets/doc-icons/personal-loan-form.svg',
    cheque: 'assets/doc-icons/cheque.svg',
    application: 'assets/doc-icons/application.svg',
    supporting: 'assets/doc-icons/supporting-document.svg'
  };

  ngOnInit(): void {
    this.loadDocumentPageData();
  }

  getDocAsset(artClass: DocArtClass): string {
    return this.documentAssetMap[artClass];
  }

  isSelected(documentId: string): boolean {
    return this.selectedDocumentId === documentId;
  }

  onSelectDocument(documentId: string): void {
    this.selectedDocumentId = this.selectedDocumentId === documentId ? null : documentId;
  }

  private loadDocumentPageData(): void {
    forkJoin({
      headerInfo: this.getHeaderInfoApi(),
      topNavItems: this.getTopNavigationApi(),
      categorySections: this.getDocumentSectionsApi()
    }).subscribe((response) => {
      this.headerInfo = response.headerInfo;
      this.topNavItems = response.topNavItems;
      this.categorySections = response.categorySections;
      this.isLoading = false;
    });
  }

  private getHeaderInfoApi(): Observable<HeaderInfo> {
    return of({
      platformTitle: 'SBI Document Extractor',
      userName: 'John Doe',
      userRole: 'KYC Manager'
    }).pipe(delay(160));
  }

  private getTopNavigationApi(): Observable<NavItem[]> {
    return of([
      { label: 'Dashboard', icon: 'D', isActive: false },
      { label: 'Verification Queue', icon: 'V', isActive: true },
      { label: 'History', icon: 'H', isActive: false },
      { label: 'Reports', icon: 'R', isActive: false },
      { label: 'Settings', icon: 'S', isActive: false }
    ]).pipe(delay(190));
  }

  private getDocumentSectionsApi(): Observable<DocumentCategorySection[]> {
    const sections: DocumentCategorySection[] = [
      {
        title: 'OVD Documents',
        documents: [
          { id: 'ovd-pan', label: 'PAN Card', artClass: 'pan' },
          { id: 'ovd-aadhaar', label: 'Aadhaar Card', artClass: 'aadhaar' },
          { id: 'ovd-voter', label: 'Voter Card', artClass: 'voter' },
          { id: 'ovd-passport', label: 'Passport', artClass: 'passport' },
          { id: 'ovd-driving', label: 'Driving Liscence', artClass: 'driving-license' }
        ]
      },
      {
        title: 'Text Documents',
        documents: [
          { id: 'text-handwritten', label: 'Handwritten Text', artClass: 'handwritten' },
          { id: 'text-digital', label: 'Digital Text', artClass: 'digital' },
          { id: 'text-misc', label: 'Miscellaneous Text Documents', artClass: 'misc-text' }
        ]
      },
      {
        title: 'Bank Forms',
        documents: [
          { id: 'form-aof', label: 'Account Opening Form', artClass: 'aof' },
          { id: 'form-hlf', label: 'Housing Loan Form', artClass: 'hlf' },
          { id: 'form-plf', label: 'Personal Loan Form', artClass: 'plf' }
        ]
      },
      {
        title: 'Miscelenous Documents',
        documents: [
          { id: 'misc-cheque', label: 'Cheque', artClass: 'cheque' },
          { id: 'misc-application', label: 'Application', artClass: 'application' },
          { id: 'misc-supporting', label: 'Supporting Document', artClass: 'supporting' }
        ]
      }
    ];

    return of(sections).pipe(delay(210));
  }

}
