import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { OvdReviewPayload } from '../../../core/services/extraction-workflow.service';

interface EditableField {
  key: string;
  label: string;
  value: string;
  confidence: number;
  required: boolean;
}

export interface OvdSaveEvent {
  sessionId: string;
  values: Array<{ key: string; value: string }>;
}

@Component({
  selector: 'app-review-ovd',
  templateUrl: './review-ovd.component.html',
  styleUrls: ['./review-ovd.component.css']
})
export class ReviewOvdComponent implements OnChanges {
  @Input() payload: OvdReviewPayload | null = null;
  @Input() isLocked = false;
  @Input() isDraftSaved = false;
  @Input() isSavingDraft = false;
  @Input() isSubmitting = false;
  @Output() saveDraft = new EventEmitter<OvdSaveEvent>();
  @Output() submitForChecker = new EventEmitter<OvdSaveEvent>();
  @Output() editRequested = new EventEmitter<void>();

  editableFields: EditableField[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['payload'] || !this.payload) {
      return;
    }

    this.editableFields = this.payload.fields.map((field) => ({
      key: field.key,
      label: field.label,
      value: field.value,
      confidence: field.confidence,
      required: field.required
    }));
  }

  onValueChange(fieldKey: string, value: string): void {
    if (this.isLocked) {
      return;
    }

    this.editableFields = this.editableFields.map((field) =>
      field.key === fieldKey ? { ...field, value } : field
    );
  }

  onSaveDraft(): void {
    if (!this.payload || this.isSavingDraft || this.isSubmitting || this.isLocked) {
      return;
    }

    this.saveDraft.emit({
      sessionId: this.payload.sessionId,
      values: this.editableFields.map((field) => ({ key: field.key, value: field.value }))
    });
  }

  onSubmitForChecker(): void {
    if (!this.payload || !this.isDraftSaved || this.isSavingDraft || this.isSubmitting || !this.isLocked) {
      return;
    }

    this.submitForChecker.emit({
      sessionId: this.payload.sessionId,
      values: this.editableFields.map((field) => ({ key: field.key, value: field.value }))
    });
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

  confidenceClass(confidence: number): 'high' | 'mid' | 'low' {
    if (confidence >= 95) {
      return 'high';
    }
    if (confidence >= 88) {
      return 'mid';
    }
    return 'low';
  }
}
