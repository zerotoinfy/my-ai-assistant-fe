import { Component, OnInit } from '@angular/core';
import {
  ExtractionWorkflowService,
  HistoryQueryResponse,
  HistoryRecord
} from '../../../core/services/extraction-workflow.service';
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
  selector: 'app-history',
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.css']
})
export class HistoryComponent implements OnInit {
  readonly headerInfo: HeaderInfo = {
    platformTitle: 'SBI Document Extractor',
    userName: 'John Doe',
    userRole: 'KYC Manager'
  };

  readonly topNavItems: NavItem[] = [
    { label: 'Dashboard', icon: 'D', isActive: false },
    { label: 'Verification Queue', icon: 'V', isActive: false },
    { label: 'History', icon: 'H', isActive: true },
    { label: 'Reports', icon: 'R', isActive: false },
    { label: 'Settings', icon: 'S', isActive: false }
  ];

  rows: HistoryRecord[] = [];
  isLoading = true;
  infoMessage = '';

  searchTerm = '';
  fromDate = '';
  toDate = '';
  statusFilter: 'ALL' | HistoryRecord['status'] = 'ALL';
  verificationFilter: 'ALL' | HistoryRecord['checkerDecision'] = 'ALL';

  currentPage = 1;
  pageSize = 10;
  totalItems = 0;
  totalPages = 1;

  readonly statusOptions: Array<'ALL' | HistoryRecord['status']> = [
    'ALL',
    'Draft Saved',
    'Pending Checker',
    'Verified',
    'Rejected'
  ];

  readonly verificationOptions: Array<'ALL' | HistoryRecord['checkerDecision']> = [
    'ALL',
    'Pending Checker',
    'Verified',
    'Rejected'
  ];

  constructor(
    private readonly extractionWorkflowService: ExtractionWorkflowService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.refreshRows();
  }

  onDelete(recordId: string): void {
    this.extractionWorkflowService.deleteHistoryRow(recordId).subscribe(() => {
      this.infoMessage = 'History row deleted.';
      this.refreshRows();
    });
  }

  onApplyFilters(): void {
    this.currentPage = 1;
    this.refreshRows();
  }

  onResetFilters(): void {
    this.searchTerm = '';
    this.fromDate = '';
    this.toDate = '';
    this.statusFilter = 'ALL';
    this.verificationFilter = 'ALL';
    this.currentPage = 1;
    this.pageSize = 10;
    this.refreshRows();
  }

  onPageSizeChange(rawValue: string): void {
    const parsedSize = Number(rawValue);
    this.pageSize = Number.isFinite(parsedSize) && parsedSize > 0 ? parsedSize : 10;
    this.currentPage = 1;
    this.refreshRows();
  }

  onPreviousPage(): void {
    if (this.currentPage <= 1 || this.isLoading) {
      return;
    }
    this.currentPage -= 1;
    this.refreshRows();
  }

  onNextPage(): void {
    if (this.currentPage >= this.totalPages || this.isLoading) {
      return;
    }
    this.currentPage += 1;
    this.refreshRows();
  }

  onOpenReview(sessionId: string): void {
    void this.router.navigate(['/dashboard/review', sessionId]);
  }

  trackByRowId(_: number, row: HistoryRecord): string {
    return row.id;
  }

  private refreshRows(): void {
    this.isLoading = true;
    this.extractionWorkflowService.getHistoryRowsPaged({
      page: this.currentPage,
      pageSize: this.pageSize,
      searchTerm: this.searchTerm,
      status: this.statusFilter,
      verificationState: this.verificationFilter,
      fromDate: this.fromDate,
      toDate: this.toDate
    }).subscribe((response: HistoryQueryResponse) => {
      this.rows = response.items;
      this.currentPage = response.page;
      this.pageSize = response.pageSize;
      this.totalItems = response.totalItems;
      this.totalPages = response.totalPages;
      this.isLoading = false;
      if (response.items.length === 0) {
        this.infoMessage = 'No records match current filters.';
      } else {
        this.infoMessage = '';
      }
    });
  }
}
