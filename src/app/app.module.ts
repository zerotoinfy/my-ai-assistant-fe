import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LoginComponent } from './features/auth/login/login.component';
import { DashboardLandingComponent } from './features/dashboard/dashboard-landing/dashboard-landing.component';
import { DocumentSelectorComponent } from './features/documents/document-selector/document-selector.component';
import { UploadProcessingComponent } from './features/upload/upload-processing/upload-processing.component';
import { AppShellComponent } from './shared/layout/app-shell/app-shell.component';
import { ExtractionProgressComponent } from './features/upload/extraction-progress/extraction-progress.component';
import { ReviewContainerComponent } from './features/review/review-container/review-container.component';
import { ReviewOvdComponent } from './features/review/review-ovd/review-ovd.component';
import { ReviewTextComponent } from './features/review/review-text/review-text.component';
import { ReviewFormComponent } from './features/review/review-form/review-form.component';
import { HistoryComponent } from './features/history/history/history.component';
import { CheckerQueueComponent } from './features/checker/checker-queue/checker-queue.component';
import { VerificationQueueComponent } from './features/verification/verification-queue/verification-queue.component';
import { ReportsComponent } from './features/reports/reports/reports.component';
import { SettingsComponent } from './features/settings/settings/settings.component';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    DashboardLandingComponent,
    DocumentSelectorComponent,
    UploadProcessingComponent,
    AppShellComponent,
    ExtractionProgressComponent,
    ReviewContainerComponent,
    ReviewOvdComponent,
    ReviewTextComponent,
    ReviewFormComponent,
    HistoryComponent,
    CheckerQueueComponent,
    VerificationQueueComponent,
    ReportsComponent,
    SettingsComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    ReactiveFormsModule,
    HttpClientModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
