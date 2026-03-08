import { Component, OnInit } from '@angular/core';
import { AuthSessionService } from '../../../core/services/auth-session.service';
import { ExtractionWorkflowService, HistoryRecord } from '../../../core/services/extraction-workflow.service';

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
  selector: 'app-checker-queue',
  templateUrl: './checker-queue.component.html',
  styleUrls: ['./checker-queue.component.css']
})
export class CheckerQueueComponent implements OnInit {
  headerInfo: HeaderInfo = {
    platformTitle: 'SBI Document Extractor',
    userName: 'Checker User',
    userRole: 'Checker'
  };

  readonly topNavItems: NavItem[] = [
    { label: 'Dashboard', icon: 'D', isActive: false },
    { label: 'Verification Queue', icon: 'V', isActive: true },
    { label: 'History', icon: 'H', isActive: false },
    { label: 'Reports', icon: 'R', isActive: false },
    { label: 'Settings', icon: 'S', isActive: false }
  ];

  queueRows: HistoryRecord[] = [];
  rejectComments: Record<string, string> = {};
  isLoading = true;
  feedbackMessage = '';

  constructor(
    private readonly extractionWorkflowService: ExtractionWorkflowService,
    private readonly authSessionService: AuthSessionService
  ) {}

  ngOnInit(): void {
    const user = this.authSessionService.getCurrentUser();
    if (user) {
      this.headerInfo = {
        platformTitle: 'SBI Document Extractor',
        userName: user.fullName,
        userRole: user.role
      };
    }

    this.loadQueue();
  }

  onVerify(row: HistoryRecord): void {
    const checkerName = this.headerInfo.userName;
    this.extractionWorkflowService.checkerVerify(row.id, checkerName).subscribe((updated) => {
      if (!updated) {
        this.feedbackMessage = 'Verification failed. Record may already be processed.';
        return;
      }
      this.feedbackMessage = `${row.documentLabel} verified successfully.`;
      this.loadQueue();
    });
  }

  onReject(row: HistoryRecord): void {
    const comment = this.rejectComments[row.id] || '';
    if (!comment.trim()) {
      this.feedbackMessage = 'Reject comment is mandatory.';
      return;
    }

    const checkerName = this.headerInfo.userName;
    this.extractionWorkflowService.checkerReject(row.id, checkerName, comment).subscribe((updated) => {
      if (!updated) {
        this.feedbackMessage = 'Reject failed. Record may already be processed.';
        return;
      }
      this.feedbackMessage = `${row.documentLabel} rejected with checker comments.`;
      this.loadQueue();
    });
  }

  onCommentChange(recordId: string, value: string): void {
    this.rejectComments = {
      ...this.rejectComments,
      [recordId]: value
    };
  }

  trackByRowId(_: number, row: HistoryRecord): string {
    return row.id;
  }

  private loadQueue(): void {
    this.isLoading = true;
    this.extractionWorkflowService.getCheckerQueueRows().subscribe((rows) => {
      this.queueRows = rows;
      this.isLoading = false;
      if (rows.length === 0) {
        this.feedbackMessage = 'No records pending checker decision.';
      }
    });
  }
}
