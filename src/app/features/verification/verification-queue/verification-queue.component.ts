import { Component, OnInit } from '@angular/core';
import { ExtractionWorkflowService, HistoryQueryResponse, HistoryRecord } from '../../../core/services/extraction-workflow.service';

interface NavItem {
  label: string;
  icon: string;
  isActive: boolean;
}

@Component({
  selector: 'app-verification-queue',
  templateUrl: './verification-queue.component.html',
  styleUrls: ['./verification-queue.component.css']
})
export class VerificationQueueComponent implements OnInit {
  readonly topNavItems: NavItem[] = [
    { label: 'Dashboard', icon: 'D', isActive: false },
    { label: 'Verification Queue', icon: 'V', isActive: true },
    { label: 'History', icon: 'H', isActive: false },
    { label: 'Reports', icon: 'R', isActive: false },
    { label: 'Settings', icon: 'S', isActive: false }
  ];

  rows: HistoryRecord[] = [];
  isLoading = true;
  infoMessage = '';

  constructor(private readonly extractionWorkflowService: ExtractionWorkflowService) {}

  ngOnInit(): void {
    this.loadPendingRows();
  }

  trackByRowId(_: number, row: HistoryRecord): string {
    return row.id;
  }

  private loadPendingRows(): void {
    this.isLoading = true;
    this.extractionWorkflowService.getHistoryRowsPaged({
      page: 1,
      pageSize: 100,
      status: 'ALL',
      verificationState: 'Pending Checker'
    }).subscribe((response: HistoryQueryResponse) => {
      this.rows = response.items;
      this.isLoading = false;
      if (response.items.length === 0) {
        this.infoMessage = 'No records are pending checker verification.';
      }
    });
  }
}
