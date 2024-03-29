import { TableModule } from 'primeng/table'
import { NgModule } from '@angular/core'
import { SharedActorImageModule } from '../shared-actor-image/shared-actor-image.module'
import { SharedFormModule } from '../shared-forms/shared-form.module'
import { SharedGlobalIconModule } from '../shared-icons'
import { SharedMainModule } from '../shared-main/shared-main.module'
import { SharedModerationModule } from '../shared-moderation'
import { SharedTablesModule } from '../shared-tables'
import { SharedVideoCommentModule } from '../shared-video-comment'
import { AbuseDetailsComponent } from './abuse-details.component'
import { AbuseListTableComponent } from './abuse-list-table.component'
import { AbuseMessageModalComponent } from './abuse-message-modal.component'
import { ModerationCommentModalComponent } from './moderation-comment-modal.component'

@NgModule({
  imports: [
    TableModule,

    SharedMainModule,
    SharedFormModule,
    SharedModerationModule,
    SharedGlobalIconModule,
    SharedVideoCommentModule,
    SharedActorImageModule,
    SharedTablesModule
  ],

  declarations: [
    AbuseDetailsComponent,
    AbuseListTableComponent,
    ModerationCommentModalComponent,
    AbuseMessageModalComponent
  ],

  exports: [
    AbuseDetailsComponent,
    AbuseListTableComponent,
    ModerationCommentModalComponent,
    AbuseMessageModalComponent
  ],

  providers: [
  ]
})
export class SharedAbuseListModule { }
