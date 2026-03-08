import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormPage, FormReviewPayload } from '../../../core/services/extraction-workflow.service';

export interface FormSaveEvent {
  sessionId: string;
  values: Array<{ key: string; value: string }>;
}

@Component({
  selector: 'app-review-form',
  templateUrl: './review-form.component.html',
  styleUrls: ['./review-form.component.css']
})
export class ReviewFormComponent implements OnChanges {
  @Input() payload: FormReviewPayload | null = null;
  @Input() isLocked = false;
  @Input() isDraftSaved = false;
  @Input() isSavingDraft = false;
  @Input() isSubmitting = false;
  @Output() saveDraft = new EventEmitter<FormSaveEvent>();
  @Output() submitForChecker = new EventEmitter<FormSaveEvent>();
  @Output() editRequested = new EventEmitter<void>();

  activePageIndex = 0;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['payload']) {
      this.activePageIndex = 0;
    }
  }

  goToPreviousPage(): void {
    this.activePageIndex = Math.max(this.activePageIndex - 1, 0);
  }

  goToNextPage(): void {
    const lastIndex = (this.payload?.pages.length || 1) - 1;
    this.activePageIndex = Math.min(this.activePageIndex + 1, lastIndex);
  }

  goToPage(index: number): void {
    this.activePageIndex = index;
  }

  onFieldChange(fieldKey: string, value: string): void {
    if (!this.payload || this.isLocked) {
      return;
    }

    this.payload = {
      ...this.payload,
      pages: this.payload.pages.map((page) => ({
        ...page,
        sections: page.sections.map((section) => ({
          ...section,
          fields: section.fields.map((field) =>
            field.key === fieldKey ? { ...field, value } : field
          )
        }))
      }))
    };
  }

  onSaveDraft(): void {
    if (!this.payload || this.isSavingDraft || this.isSubmitting || this.isLocked) {
      return;
    }

    this.saveDraft.emit({ sessionId: this.payload.sessionId, values: this.flattenFields() });
  }

  onSubmitForChecker(): void {
    if (!this.payload || !this.isDraftSaved || this.isSavingDraft || this.isSubmitting || !this.isLocked) {
      return;
    }

    this.submitForChecker.emit({ sessionId: this.payload.sessionId, values: this.flattenFields() });
  }

  get currentPage(): FormPage | null {
    if (!this.payload) {
      return null;
    }
    return this.payload.pages[this.activePageIndex] || null;
  }

  get totalExtractedFields(): number {
    return this.flattenFields().length;
  }

  onEditRequested(): void {
    this.editRequested.emit();
  }

  get stateLabel(): string {
    if (this.isSubmitting) {
      return 'Submitting';
    }
    if (this.isLocked) {
      return 'Draft Locked';
    }
    return 'Editable';
  }

  get stateClass(): string {
    if (this.isSubmitting) {
      return 'state-submitting';
    }
    if (this.isLocked) {
      return 'state-locked';
    }
    return 'state-editable';
  }

  private flattenFields(): Array<{ key: string; value: string }> {
    if (!this.payload) {
      return [];
    }

    return this.payload.pages.flatMap((page) =>
      page.sections.flatMap((section) => section.fields.map((field) => ({ key: field.key, value: field.value })))
    );
  }
}
