import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HomepageRoutingModule } from './homepage-routing-module';
import { Homepage } from './homepage/homepage';
import { LeftSidebar } from './component/left-sidebar/left-sidebar';
import { RightSidebar } from './component/right-sidebar/right-sidebar';

@NgModule({
  declarations: [
    LeftSidebar,
    RightSidebar,
    Homepage
  ],
  imports: [
    CommonModule,
    FormsModule,
    HomepageRoutingModule,
  ]
})
export class HomepageModule { }
