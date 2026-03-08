import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { DashboardLandingComponent } from './features/dashboard/dashboard-landing/dashboard-landing.component';
import { DocumentSelectorComponent } from './features/documents/document-selector/document-selector.component';
import { UploadProcessingComponent } from './features/upload/upload-processing/upload-processing.component';
import { ExtractionProgressComponent } from './features/upload/extraction-progress/extraction-progress.component';
import { ReviewContainerComponent } from './features/review/review-container/review-container.component';
import { HistoryComponent } from './features/history/history/history.component';
import { CheckerQueueComponent } from './features/checker/checker-queue/checker-queue.component';
import { VerificationQueueComponent } from './features/verification/verification-queue/verification-queue.component';
import { ReportsComponent } from './features/reports/reports/reports.component';
import { SettingsComponent } from './features/settings/settings/settings.component';
import { RoleGuard } from './core/guards/role.guard';

const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'dashboard', component: DashboardLandingComponent, canActivate: [RoleGuard], data: { roles: ['Maker', 'Checker'] } },
  { path: 'dashboard/upload-documents', component: DocumentSelectorComponent, canActivate: [RoleGuard], data: { roles: ['Maker'] } },
  { path: 'dashboard/upload-documents/process', component: UploadProcessingComponent, canActivate: [RoleGuard], data: { roles: ['Maker'] } },
  { path: 'dashboard/upload-documents/extraction-progress', component: ExtractionProgressComponent, canActivate: [RoleGuard], data: { roles: ['Maker'] } },
  { path: 'dashboard/review/:sessionId', component: ReviewContainerComponent, canActivate: [RoleGuard], data: { roles: ['Maker'] } },
  { path: 'dashboard/history', component: HistoryComponent, canActivate: [RoleGuard], data: { roles: ['Maker', 'Checker'] } },
  { path: 'dashboard/verification-queue', component: VerificationQueueComponent, canActivate: [RoleGuard], data: { roles: ['Maker', 'Checker'] } },
  { path: 'dashboard/reports', component: ReportsComponent, canActivate: [RoleGuard], data: { roles: ['Maker', 'Checker'] } },
  { path: 'dashboard/settings', component: SettingsComponent, canActivate: [RoleGuard], data: { roles: ['Maker', 'Checker'] } },
  { path: 'dashboard/checker-queue', component: CheckerQueueComponent, canActivate: [RoleGuard], data: { roles: ['Checker'] } },
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  { path: '**', redirectTo: 'login' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
