import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, concat, of } from 'rxjs';
import { catchError, delay, map } from 'rxjs/operators';

export type DocumentScenario = 'ovd' | 'text' | 'form' | 'misc';

export interface ExtractionSessionContext {
  documentId: string;
  documentLabel: string;
  fileName: string;
}

export interface ExtractionSession {
  sessionId: string;
  documentId: string;
  documentLabel: string;
  fileName: string;
  scenario: DocumentScenario;
  createdAt: string;
}

export interface StageEvent {
  stageCode:
    | 'QUEUED'
    | 'OCR_STARTED'
    | 'OCR_COMPLETED'
    | 'FIELD_EXTRACTION'
    | 'VALIDATION'
    | 'READY_FOR_REVIEW';
  stageLabel: string;
  statusMessage: string;
  progress: number;
  qualityScore: number;
}

export interface OvdField {
  key: string;
  label: string;
  value: string;
  confidence: number;
  required: boolean;
}

export interface OvdReviewPayload {
  scenario: 'ovd';
  sessionId: string;
  documentLabel: string;
  fileName: string;
  customerReference: string;
  fields: OvdField[];
}

export interface TextLineBlock {
  id: string;
  page: number;
  formattedText: string;
  confidence: number;
}

export interface TextReviewPayload {
  scenario: 'text';
  sessionId: string;
  documentLabel: string;
  fileName: string;
  blocks: TextLineBlock[];
}

export interface FormField {
  key: string;
  label: string;
  value: string;
  confidence: number;
  required: boolean;
}

export interface FormSection {
  id: string;
  title: string;
  fields: FormField[];
}

export interface FormPage {
  pageNumber: number;
  sectionTitle: string;
  sections: FormSection[];
}

export interface FormReviewPayload {
  scenario: 'form';
  sessionId: string;
  documentLabel: string;
  fileName: string;
  totalPages: number;
  pages: FormPage[];
}

export interface MiscReviewPayload {
  scenario: 'misc';
  sessionId: string;
  documentLabel: string;
  fileName: string;
  summaryMessage: string;
}

export type ReviewPayload = OvdReviewPayload | TextReviewPayload | FormReviewPayload | MiscReviewPayload;

export interface HistoryRecord {
  id: string;
  sessionId: string;
  documentLabel: string;
  fileName: string;
  scenario: DocumentScenario;
  status: 'Draft Saved' | 'Pending Checker' | 'Verified' | 'Rejected';
  checkerDecision: 'Pending Checker' | 'Verified' | 'Rejected';
  checkerName?: string;
  checkerComment?: string;
  checkerReviewedAt?: string;
  updatedAt: string;
  makerAction: string;
}

export interface SaveReviewRequest {
  sessionId: string;
  values: Array<{ key: string; value: string }>;
}

export interface SaveReviewResponse {
  savedAt: string;
  record: HistoryRecord;
}

export interface HistoryQueryParams {
  page: number;
  pageSize: number;
  searchTerm?: string;
  status?: 'ALL' | HistoryRecord['status'];
  verificationState?: 'ALL' | HistoryRecord['checkerDecision'];
  fromDate?: string;
  toDate?: string;
}

export interface HistoryQueryResponse {
  items: HistoryRecord[];
  totalItems: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

@Injectable({ providedIn: 'root' })
export class ExtractionWorkflowService {
  private readonly sessionStore = new Map<string, ExtractionSession>();
  private readonly historyStore = new Map<string, HistoryRecord>();
  private isHistorySeedLoaded = false;

  constructor(private readonly httpClient: HttpClient) {}

  createSession(context: ExtractionSessionContext): ExtractionSession {
    const sessionId = this.buildSessionId();
    const scenario = this.resolveScenario(context.documentId);

    const session: ExtractionSession = {
      sessionId,
      documentId: context.documentId,
      documentLabel: context.documentLabel,
      fileName: context.fileName,
      scenario,
      createdAt: new Date().toISOString()
    };

    this.sessionStore.set(sessionId, session);
    return session;
  }

  getSession(sessionId: string): ExtractionSession | null {
    return this.sessionStore.get(sessionId) || null;
  }

  getStageEvents(sessionId: string): Observable<StageEvent> {
    const session = this.getSession(sessionId);
    const scenario = session?.scenario ?? 'misc';

    const stageSequence = this.buildStageSequence(scenario);
    const streams = stageSequence.map((event, index) =>
      of(event).pipe(delay(index === 0 ? 220 : 900))
    );

    return concat(...streams);
  }

  getReviewPayload(sessionId: string): Observable<ReviewPayload> {
    const session = this.getSession(sessionId);

    if (!session) {
      const fallbackPayload: MiscReviewPayload = {
        scenario: 'misc',
        sessionId,
        documentLabel: 'Document',
        fileName: '',
        summaryMessage: 'Session not found. Please upload the document again.'
      };

      return of(fallbackPayload).pipe(delay(120));
    }

    if (session.scenario === 'ovd') {
      return of(this.createOvdPayload(session)).pipe(delay(220));
    }

    if (session.scenario === 'text') {
      return of(this.createTextPayload(session)).pipe(delay(220));
    }

    if (session.scenario === 'form') {
      return of(this.createFormPayload(session)).pipe(delay(220));
    }

    return of({
      scenario: session.scenario,
      sessionId: session.sessionId,
      documentLabel: session.documentLabel,
      fileName: session.fileName,
      summaryMessage: this.buildGenericScenarioSummary(session.scenario)
    } as MiscReviewPayload).pipe(delay(220));
  }

  saveReviewDraft(request: SaveReviewRequest): Observable<SaveReviewResponse> {
    const session = this.getSession(request.sessionId);
    const now = new Date().toISOString();

    const record: HistoryRecord = {
      id: `hist-${request.sessionId}`,
      sessionId: request.sessionId,
      documentLabel: session?.documentLabel || 'Document',
      fileName: session?.fileName || '',
      scenario: session?.scenario || 'misc',
      status: 'Draft Saved',
      checkerDecision: 'Pending Checker',
      updatedAt: now,
      makerAction: `Draft saved with ${request.values.length} edited fields`
    };

    this.historyStore.set(record.id, record);
    return of({ savedAt: now, record }).pipe(delay(220));
  }

  submitToChecker(request: SaveReviewRequest): Observable<SaveReviewResponse> {
    const session = this.getSession(request.sessionId);
    const now = new Date().toISOString();

    const record: HistoryRecord = {
      id: `hist-${request.sessionId}`,
      sessionId: request.sessionId,
      documentLabel: session?.documentLabel || 'Document',
      fileName: session?.fileName || '',
      scenario: session?.scenario || 'misc',
      status: 'Pending Checker',
      checkerDecision: 'Pending Checker',
      updatedAt: now,
      makerAction: `Submitted with ${request.values.length} reviewed fields`
    };

    this.historyStore.set(record.id, record);
    return of({ savedAt: now, record }).pipe(delay(260));
  }

  getHistoryRows(): Observable<HistoryRecord[]> {
    return this.loadHistorySeedIfNeeded().pipe(
      map(() => this.sortedHistoryRows()),
      delay(140)
    );
  }

  getHistoryRowsPaged(query: HistoryQueryParams): Observable<HistoryQueryResponse> {
    return this.loadHistorySeedIfNeeded().pipe(
      map(() => {
        let filteredRows = this.sortedHistoryRows();

        const normalizedSearch = (query.searchTerm || '').trim().toLowerCase();
        if (normalizedSearch) {
          filteredRows = filteredRows.filter((row) =>
            row.sessionId.toLowerCase().includes(normalizedSearch)
            || row.documentLabel.toLowerCase().includes(normalizedSearch)
          );
        }

        if (query.status && query.status !== 'ALL') {
          filteredRows = filteredRows.filter((row) => row.status === query.status);
        }

        if (query.verificationState && query.verificationState !== 'ALL') {
          filteredRows = filteredRows.filter((row) => row.checkerDecision === query.verificationState);
        }

        const fromTime = this.parseDateBoundary(query.fromDate, 'start');
        if (fromTime !== null) {
          filteredRows = filteredRows.filter((row) => new Date(row.updatedAt).getTime() >= fromTime);
        }

        const toTime = this.parseDateBoundary(query.toDate, 'end');
        if (toTime !== null) {
          filteredRows = filteredRows.filter((row) => new Date(row.updatedAt).getTime() <= toTime);
        }

        const totalItems = filteredRows.length;
        const pageSize = Math.max(1, query.pageSize || 10);
        const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
        const page = Math.min(Math.max(1, query.page || 1), totalPages);
        const startIndex = (page - 1) * pageSize;
        const endIndex = startIndex + pageSize;

        return {
          items: filteredRows.slice(startIndex, endIndex),
          totalItems,
          page,
          pageSize,
          totalPages
        } as HistoryQueryResponse;
      }),
      delay(220)
    );
  }

  getCheckerQueueRows(): Observable<HistoryRecord[]> {
    return this.loadHistorySeedIfNeeded().pipe(
      map(() =>
        this.sortedHistoryRows().filter((row) => row.checkerDecision === 'Pending Checker')
      ),
      delay(180)
    );
  }

  checkerVerify(recordId: string, checkerName: string): Observable<HistoryRecord | null> {
    const row = this.historyStore.get(recordId);
    if (!row || row.checkerDecision !== 'Pending Checker') {
      return of(null).pipe(delay(120));
    }

    const reviewedAt = new Date().toISOString();
    const verifiedRecord: HistoryRecord = {
      ...row,
      status: 'Verified',
      checkerDecision: 'Verified',
      checkerName,
      checkerComment: 'Verified and approved by checker.',
      checkerReviewedAt: reviewedAt,
      updatedAt: reviewedAt,
      makerAction: `${row.makerAction} | Checker verified`
    };

    this.historyStore.set(recordId, verifiedRecord);
    return of(verifiedRecord).pipe(delay(220));
  }

  checkerReject(recordId: string, checkerName: string, comment: string): Observable<HistoryRecord | null> {
    const row = this.historyStore.get(recordId);
    const trimmedComment = comment.trim();

    if (!row || row.checkerDecision !== 'Pending Checker' || !trimmedComment) {
      return of(null).pipe(delay(120));
    }

    const reviewedAt = new Date().toISOString();
    const rejectedRecord: HistoryRecord = {
      ...row,
      status: 'Rejected',
      checkerDecision: 'Rejected',
      checkerName,
      checkerComment: trimmedComment,
      checkerReviewedAt: reviewedAt,
      updatedAt: reviewedAt,
      makerAction: `${row.makerAction} | Checker rejected`
    };

    this.historyStore.set(recordId, rejectedRecord);
    return of(rejectedRecord).pipe(delay(220));
  }

  updateHistoryRow(recordId: string, makerAction: string): Observable<HistoryRecord | null> {
    const row = this.historyStore.get(recordId);
    if (!row) {
      return of(null).pipe(delay(100));
    }

    const updated: HistoryRecord = {
      ...row,
      makerAction,
      updatedAt: new Date().toISOString()
    };

    this.historyStore.set(recordId, updated);
    return of(updated).pipe(delay(120));
  }

  deleteHistoryRow(recordId: string): Observable<boolean> {
    const deleted = this.historyStore.delete(recordId);
    return of(deleted).pipe(delay(100));
  }

  private createOvdPayload(session: ExtractionSession): OvdReviewPayload {
    return {
      scenario: 'ovd',
      sessionId: session.sessionId,
      documentLabel: session.documentLabel,
      fileName: session.fileName,
      customerReference: 'SBI-KYC-447193',
      fields: [
        { key: 'fullName', label: 'Full Name', value: 'RAMESH KUMAR', confidence: 98, required: true },
        { key: 'documentNumber', label: 'Document Number', value: 'ABCDE1234F', confidence: 97, required: true },
        { key: 'dateOfBirth', label: 'Date of Birth', value: '1991-06-15', confidence: 95, required: true },
        { key: 'gender', label: 'Gender', value: 'Male', confidence: 96, required: false },
        { key: 'address', label: 'Address', value: '22 Park Street, Kolkata', confidence: 91, required: true },
        { key: 'issuedDate', label: 'Issued Date', value: '2019-11-06', confidence: 89, required: false }
      ]
    };
  }

  private createTextPayload(session: ExtractionSession): TextReviewPayload {
    return {
      scenario: 'text',
      sessionId: session.sessionId,
      documentLabel: session.documentLabel,
      fileName: session.fileName,
      blocks: [
        {
          id: 'txt-1',
          page: 1,
          confidence: 92,
          formattedText: [
            'To,',
            'The Branch Manager',
            'State Bank of India, Park Street Branch',
            '',
            'Subject: Request for address update in account records',
            '',
            'Dear Sir/Madam,',
            'I request you to update my residential address linked with Savings Account 12345678901.',
            'New Address: 22 Park Street, Kolkata - 700016.',
            '',
            'Regards,',
            'Ramesh Kumar'
          ].join('\n')
        },
        {
          id: 'txt-2',
          page: 2,
          confidence: 89,
          formattedText: [
            'Enclosures:',
            '1. Self-attested address proof',
            '2. Copy of PAN card',
            '3. Passport-size photograph'
          ].join('\n')
        }
      ]
    };
  }

  private createFormPayload(session: ExtractionSession): FormReviewPayload {
    const pages: FormPage[] = [
      {
        pageNumber: 1,
        sectionTitle: 'Applicant Profile',
        sections: [
          {
            id: 'sec-personal',
            title: 'Personal Details',
            fields: [
              { key: 'fullName', label: 'Full Name', value: 'RAMESH KUMAR', confidence: 97, required: true },
              { key: 'dob', label: 'Date of Birth', value: '1991-06-15', confidence: 96, required: true },
              { key: 'pan', label: 'PAN Number', value: 'ABCDE1234F', confidence: 94, required: true },
              { key: 'mobile', label: 'Mobile Number', value: '9876543210', confidence: 93, required: true }
            ]
          }
        ]
      },
      {
        pageNumber: 2,
        sectionTitle: 'Employment Details',
        sections: [
          {
            id: 'sec-employment',
            title: 'Income & Occupation',
            fields: [
              { key: 'occupation', label: 'Occupation', value: 'Software Engineer', confidence: 90, required: true },
              { key: 'employer', label: 'Employer Name', value: 'ABC Technologies Pvt Ltd', confidence: 91, required: true },
              { key: 'annualIncome', label: 'Annual Income', value: '1400000', confidence: 88, required: true },
              { key: 'workExp', label: 'Work Experience (Years)', value: '7', confidence: 86, required: false }
            ]
          }
        ]
      },
      {
        pageNumber: 3,
        sectionTitle: 'Loan Request',
        sections: [
          {
            id: 'sec-loan',
            title: 'Requested Facility',
            fields: [
              { key: 'loanType', label: 'Loan Type', value: 'Personal Loan', confidence: 95, required: true },
              { key: 'amount', label: 'Requested Amount', value: '500000', confidence: 92, required: true },
              { key: 'tenure', label: 'Tenure (Months)', value: '48', confidence: 93, required: true },
              { key: 'emi', label: 'Estimated EMI', value: '12780', confidence: 85, required: false }
            ]
          }
        ]
      }
    ];

    return {
      scenario: 'form',
      sessionId: session.sessionId,
      documentLabel: session.documentLabel,
      fileName: session.fileName,
      totalPages: 8,
      pages
    };
  }

  private buildGenericScenarioSummary(scenario: DocumentScenario): string {
    if (scenario === 'text') {
      return 'Text blocks are ready. Use the text-preserving review renderer to retain source formatting.';
    }
    if (scenario === 'form') {
      return 'Multi-page extraction completed. Use paginated section review for 100+ fields.';
    }
    return 'Document extraction finished. Scenario-specific review template will be rendered.';
  }

  private buildStageSequence(scenario: DocumentScenario): StageEvent[] {
    const extractionLabel = scenario === 'ovd' ? 'Extracting identity fields' : 'Extracting scenario-specific content';

    return [
      {
        stageCode: 'QUEUED',
        stageLabel: 'Queued',
        statusMessage: 'File uploaded. Queueing extraction request...',
        progress: 22,
        qualityScore: 84
      },
      {
        stageCode: 'OCR_STARTED',
        stageLabel: 'OCR Started',
        statusMessage: 'Running OCR on uploaded image/document...',
        progress: 40,
        qualityScore: 86
      },
      {
        stageCode: 'OCR_COMPLETED',
        stageLabel: 'OCR Completed',
        statusMessage: 'OCR complete. Structuring parsed lines and zones...',
        progress: 62,
        qualityScore: 89
      },
      {
        stageCode: 'FIELD_EXTRACTION',
        stageLabel: 'Field Extraction',
        statusMessage: `${extractionLabel}...`,
        progress: 80,
        qualityScore: 92
      },
      {
        stageCode: 'VALIDATION',
        stageLabel: 'Validation',
        statusMessage: 'Applying confidence checks and basic validation rules...',
        progress: 94,
        qualityScore: 95
      },
      {
        stageCode: 'READY_FOR_REVIEW',
        stageLabel: 'Ready For Review',
        statusMessage: 'Extraction complete. Opening maker review form...',
        progress: 100,
        qualityScore: 97
      }
    ];
  }

  private resolveScenario(documentId: string): DocumentScenario {
    if (documentId.startsWith('ovd-')) {
      return 'ovd';
    }
    if (documentId.startsWith('text-')) {
      return 'text';
    }
    if (documentId.startsWith('form-')) {
      return 'form';
    }
    return 'misc';
  }

  private buildSessionId(): string {
    const timestamp = Date.now().toString(36);
    const randomSeed = Math.random().toString(36).slice(2, 7);
    return `sess-${timestamp}-${randomSeed}`;
  }

  private loadHistorySeedIfNeeded(): Observable<void> {
    if (this.isHistorySeedLoaded) {
      return of(void 0);
    }

    return this.httpClient
      .get<HistoryRecord[]>('assets/mock-data/history-records.json')
      .pipe(
        map((records) => {
          records.forEach((record) => {
            if (!this.historyStore.has(record.id)) {
              this.historyStore.set(record.id, record);
            }
          });
          this.isHistorySeedLoaded = true;
          return void 0;
        }),
        catchError(() => {
          this.isHistorySeedLoaded = true;
          return of(void 0);
        })
      );
  }

  private sortedHistoryRows(): HistoryRecord[] {
    return Array.from(this.historyStore.values()).sort((a, b) =>
      b.updatedAt.localeCompare(a.updatedAt)
    );
  }

  private parseDateBoundary(rawDate: string | undefined, boundary: 'start' | 'end'): number | null {
    if (!rawDate) {
      return null;
    }

    const parsedDate = new Date(rawDate);
    if (Number.isNaN(parsedDate.getTime())) {
      return null;
    }

    if (boundary === 'start') {
      parsedDate.setHours(0, 0, 0, 0);
    } else {
      parsedDate.setHours(23, 59, 59, 999);
    }

    return parsedDate.getTime();
  }
}
