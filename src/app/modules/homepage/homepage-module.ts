import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HomepageRoutingModule } from './homepage-routing-module';
import { Homepage } from './homepage/homepage';
import { LeftSidebar } from './component/left-sidebar/left-sidebar';
import { RightSidebar } from './component/right-sidebar/right-sidebar';
import { QueryParamService } from '../../services/query-param.service';

@NgModule({
  declarations: [
    LeftSidebar,
    RightSidebar,
    Homepage
  ],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    HomepageRoutingModule,
  ],
  providers: [
    QueryParamService
  ]
})
export class HomepageModule { }
