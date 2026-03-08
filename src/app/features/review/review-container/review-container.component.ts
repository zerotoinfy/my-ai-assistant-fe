import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  ExtractionWorkflowService,
  FormReviewPayload,
  OvdReviewPayload,
  ReviewPayload,
  TextReviewPayload
} from '../../../core/services/extraction-workflow.service';
import { OvdSaveEvent } from '../review-ovd/review-ovd.component';
import { Subscription } from 'rxjs';
import { TextSaveEvent } from '../review-text/review-text.component';
import { FormSaveEvent } from '../review-form/review-form.component';

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
  selector: 'app-review-container',
  templateUrl: './review-container.component.html',
  styleUrls: ['./review-container.component.css']
})
export class ReviewContainerComponent implements OnInit, OnDestroy {
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

  sessionId = '';
  isLoading = true;
  infoMessage = '';
  payload: ReviewPayload | null = null;
  lastSavedAt = '';
  isSavingDraft = false;
  isSubmitting = false;
  isDraftSaved = false;
  isEditMode = false;

  private payloadSubscription: Subscription | null = null;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly extractionWorkflowService: ExtractionWorkflowService
  ) {}

  ngOnInit(): void {
    this.sessionId = this.route.snapshot.paramMap.get('sessionId') || '';

    if (!this.sessionId) {
      this.isLoading = false;
      this.infoMessage = 'Review session is missing. Please upload the document again.';
      return;
    }

    this.payloadSubscription = this.extractionWorkflowService
      .getReviewPayload(this.sessionId)
      .subscribe((payload) => {
        this.payload = payload;
        this.isLoading = false;

        if (payload.scenario === 'misc') {
          this.infoMessage = payload.summaryMessage;
        } else {
          this.infoMessage = '';
        }
      });
  }

  ngOnDestroy(): void {
    this.payloadSubscription?.unsubscribe();
  }

  onSaveOvdDraft(saveEvent: OvdSaveEvent): void {
    this.saveDraftAndNotify(saveEvent.sessionId, saveEvent.values);
  }

  onSubmitOvd(saveEvent: OvdSaveEvent): void {
    this.submitAndRedirect(saveEvent.sessionId, saveEvent.values);
  }

  onSaveTextDraft(saveEvent: TextSaveEvent): void {
    this.saveDraftAndNotify(saveEvent.sessionId, saveEvent.values);
  }

  onSubmitText(saveEvent: TextSaveEvent): void {
    this.submitAndRedirect(saveEvent.sessionId, saveEvent.values);
  }

  onSaveFormDraft(saveEvent: FormSaveEvent): void {
    this.saveDraftAndNotify(saveEvent.sessionId, saveEvent.values);
  }

  onSubmitForm(saveEvent: FormSaveEvent): void {
    this.submitAndRedirect(saveEvent.sessionId, saveEvent.values);
  }

  onBackToUpload(): void {
    void this.router.navigate(['/dashboard/upload-documents']);
  }

  onEditRequested(): void {
    this.isEditMode = true;
    this.isDraftSaved = false;
    this.infoMessage = 'Edit mode enabled. Save draft again to lock fields and enable submit.';
  }

  onOpenHistory(): void {
    if (!this.canShowHistory) {
      return;
    }
    void this.router.navigate(['/dashboard/history']);
  }

  get ovdPayload(): OvdReviewPayload | null {
    if (!this.payload || this.payload.scenario !== 'ovd') {
      return null;
    }
    return this.payload;
  }

  get textPayload(): TextReviewPayload | null {
    if (!this.payload || this.payload.scenario !== 'text') {
      return null;
    }
    return this.payload;
  }

  get formPayload(): FormReviewPayload | null {
    if (!this.payload || this.payload.scenario !== 'form') {
      return null;
    }
    return this.payload;
  }

  get isFieldsLocked(): boolean {
    return this.isDraftSaved && !this.isEditMode;
  }

  get canShowHistory(): boolean {
    return this.isDraftSaved && !this.isSavingDraft;
  }

  private saveDraftAndNotify(sessionId: string, values: Array<{ key: string; value: string }>): void {
    this.isSavingDraft = true;
    this.extractionWorkflowService.saveReviewDraft({ sessionId, values }).subscribe((response) => {
      this.isSavingDraft = false;
      this.isDraftSaved = true;
      this.isEditMode = false;
      this.lastSavedAt = new Date(response.savedAt).toLocaleString();
      this.infoMessage = `Draft saved for session ${sessionId}. Fields are locked. Use Edit to modify and save again.`;
    });
  }

  private submitAndRedirect(sessionId: string, values: Array<{ key: string; value: string }>): void {
    if (!this.isDraftSaved || this.isEditMode) {
      this.infoMessage = 'Save draft first before submitting to checker.';
      return;
    }

    this.isSubmitting = true;
    this.extractionWorkflowService.submitToChecker({ sessionId, values }).subscribe(() => {
      this.isSubmitting = false;
      void this.router.navigate(['/dashboard/history']);
    });
  }
}
