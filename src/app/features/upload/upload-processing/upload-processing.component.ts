import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';

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

@Component({
  selector: 'app-upload-processing',
  templateUrl: './upload-processing.component.html',
  styleUrls: ['./upload-processing.component.css']
})
export class UploadProcessingComponent implements OnInit, OnDestroy {
  readonly headerInfo: HeaderInfo = {
    platformTitle: 'SBI Document Extractor',
    userName: 'John Doe',
    userRole: 'KYC Manager'
  };

  readonly topNavItems: NavItem[] = [
    { label: 'Dashboard', icon: 'D', isActive: false },
    { label: 'Verification Queue', icon: 'V', isActive: true },
    { label: 'History', icon: 'H', isActive: false },
    { label: 'Reports', icon: 'R', isActive: false },
    { label: 'Settings', icon: 'S', isActive: false }
  ];

  selectedDocumentLabel = 'Selected Document';
  selectedDocumentId = '';
  isDragging = false;
  fileName = '';
  uploadProgress = 46;
  isUploading = false;
  private progressTimer: ReturnType<typeof setInterval> | null = null;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    const documentMap: Record<string, string> = {
      'ovd-pan': 'PAN Card',
      'ovd-aadhaar': 'Aadhaar Card',
      'ovd-voter': 'Voter Card',
      'ovd-passport': 'Passport',
      'ovd-driving': 'Driving Liscence',
      'text-handwritten': 'Handwritten Text',
      'text-digital': 'Digital Text',
      'text-misc': 'Miscellaneous Text Documents',
      'form-aof': 'Account Opening Form',
      'form-hlf': 'Housing Loan Form',
      'form-plf': 'Personal Loan Form',
      'misc-cheque': 'Cheque',
      'misc-application': 'Application',
      'misc-supporting': 'Supporting Document'
    };

    this.route.queryParamMap.subscribe((params) => {
      this.selectedDocumentId = params.get('documentId') || '';
      this.selectedDocumentLabel = documentMap[this.selectedDocumentId] || 'Selected Document';
    });
  }

  ngOnDestroy(): void {
    this.clearProgressTimer();
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = true;
  }

  onDragLeave(): void {
    this.isDragging = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = false;
    const droppedFiles = event.dataTransfer?.files;
    if (droppedFiles && droppedFiles.length > 0) {
      this.fileName = droppedFiles[0].name;
      this.uploadProgress = 52;
    }
  }

  onFileSelected(event: Event): void {
    const element = event.target as HTMLInputElement;
    if (element.files && element.files.length > 0) {
      this.fileName = element.files[0].name;
      this.uploadProgress = 52;
    }
  }

  onUpload(): void {
    if (!this.fileName || this.isUploading) {
      return;
    }

    this.isUploading = true;
    this.clearProgressTimer();
    this.progressTimer = setInterval(() => {
      if (this.uploadProgress >= 100) {
        this.isUploading = false;
        this.clearProgressTimer();
        void this.router.navigate(['/dashboard/upload-documents/extraction-progress'], {
          queryParams: {
            documentId: this.selectedDocumentId,
            documentLabel: this.selectedDocumentLabel,
            fileName: this.fileName
          }
        });
        return;
      }
      this.uploadProgress = Math.min(this.uploadProgress + 6, 100);
    }, 250);
  }

  get uploadTitle(): string {
    return `Upload ${this.selectedDocumentLabel} Document`;
  }

  private clearProgressTimer(): void {
    if (this.progressTimer) {
      clearInterval(this.progressTimer);
      this.progressTimer = null;
    }
  }

}
