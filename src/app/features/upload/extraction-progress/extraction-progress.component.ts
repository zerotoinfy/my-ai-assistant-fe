import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  ExtractionWorkflowService,
  StageEvent
} from '../../../core/services/extraction-workflow.service';
import { Subscription } from 'rxjs';

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
  selector: 'app-extraction-progress',
  templateUrl: './extraction-progress.component.html',
  styleUrls: ['./extraction-progress.component.css']
})
export class ExtractionProgressComponent implements OnInit, OnDestroy {
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

  documentLabel = 'Document';
  documentId = '';
  fileName = '';
  progress = 18;
  statusMessage = 'Preparing extraction pipeline...';
  qualityScore = 87;
  currentStageLabel = 'Initializing';
  sessionId = '';

  private eventsSubscription: Subscription | null = null;
  private redirectTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly extractionWorkflowService: ExtractionWorkflowService
  ) {}

  ngOnInit(): void {
    this.documentId = this.route.snapshot.queryParamMap.get('documentId') || '';
    this.documentLabel = this.route.snapshot.queryParamMap.get('documentLabel') || 'Document';
    this.fileName = this.route.snapshot.queryParamMap.get('fileName') || 'uploaded-file';

    const session = this.extractionWorkflowService.createSession({
      documentId: this.documentId,
      documentLabel: this.documentLabel,
      fileName: this.fileName
    });

    this.sessionId = session.sessionId;

    this.eventsSubscription = this.extractionWorkflowService
      .getStageEvents(this.sessionId)
      .subscribe((event) => this.applyStageEvent(event));
  }

  ngOnDestroy(): void {
    this.eventsSubscription?.unsubscribe();
    if (this.redirectTimer) {
      clearTimeout(this.redirectTimer);
      this.redirectTimer = null;
    }
  }

  onBackToUpload(): void {
    void this.router.navigate(['/dashboard/upload-documents/process']);
  }

  private applyStageEvent(event: StageEvent): void {
    this.currentStageLabel = event.stageLabel;
    this.statusMessage = event.statusMessage;
    this.progress = event.progress;
    this.qualityScore = event.qualityScore;

    if (event.stageCode === 'READY_FOR_REVIEW') {
      this.redirectTimer = setTimeout(() => {
        void this.router.navigate(['/dashboard/review', this.sessionId]);
      }, 800);
    }
  }

}
