import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { VoterListRoutingModule } from './voter-list-routing-module';
import { LeftSidebar } from './component/left-sidebar/left-sidebar';
import { RightSidebar } from './component/right-sidebar/right-sidebar';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { VoterList } from './voter-list/voter-list';


@NgModule({
  declarations: [
    LeftSidebar,
    RightSidebar,
    VoterList,
  ],
  imports: [
    FormsModule,
    RouterModule,
    CommonModule,
    VoterListRoutingModule
  ]
})
export class VoterListModule { }
