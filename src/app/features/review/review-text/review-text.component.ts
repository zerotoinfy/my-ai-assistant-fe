import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { TextReviewPayload } from '../../../core/services/extraction-workflow.service';

export interface TextSaveEvent {
  sessionId: string;
  values: Array<{ key: string; value: string }>;
}

interface EditableBlock {
  id: string;
  page: number;
  confidence: number;
  formattedText: string;
}

@Component({
  selector: 'app-review-text',
  templateUrl: './review-text.component.html',
  styleUrls: ['./review-text.component.css']
})
export class ReviewTextComponent implements OnChanges {
  @Input() payload: TextReviewPayload | null = null;
  @Input() isLocked = false;
  @Input() isDraftSaved = false;
  @Input() isSavingDraft = false;
  @Input() isSubmitting = false;
  @Output() saveDraft = new EventEmitter<TextSaveEvent>();
  @Output() submitForChecker = new EventEmitter<TextSaveEvent>();
  @Output() editRequested = new EventEmitter<void>();

  editableBlocks: EditableBlock[] = [];
  selectedBlockId = '';

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['payload'] || !this.payload) {
      return;
    }

    this.editableBlocks = this.payload.blocks.map((block) => ({ ...block }));
    this.selectedBlockId = this.editableBlocks[0]?.id || '';
  }

  onSelectBlock(blockId: string): void {
    this.selectedBlockId = blockId;
  }

  onBlockTextChange(blockId: string, value: string): void {
    if (this.isLocked) {
      return;
    }

    this.editableBlocks = this.editableBlocks.map((block) =>
      block.id === blockId ? { ...block, formattedText: value } : block
    );
  }

  onSaveDraft(): void {
    if (!this.payload || this.isSavingDraft || this.isSubmitting || this.isLocked) {
      return;
    }

    this.saveDraft.emit({
      sessionId: this.payload.sessionId,
      values: this.editableBlocks.map((block) => ({ key: block.id, value: block.formattedText }))
    });
  }

  onSubmitForChecker(): void {
    if (!this.payload || !this.isDraftSaved || this.isSavingDraft || this.isSubmitting || !this.isLocked) {
      return;
    }

    this.submitForChecker.emit({
      sessionId: this.payload.sessionId,
      values: this.editableBlocks.map((block) => ({ key: block.id, value: block.formattedText }))
    });
  }

  get selectedBlock(): EditableBlock | null {
    if (!this.selectedBlockId) {
      return null;
    }

    return this.editableBlocks.find((block) => block.id === this.selectedBlockId) || null;
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
}
