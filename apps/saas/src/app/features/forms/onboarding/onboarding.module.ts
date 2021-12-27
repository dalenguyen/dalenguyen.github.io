import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { OnboardingRoutingModule } from './onboarding-routing.module';
import { OnboardingComponent } from './onboarding.component';


@NgModule({
  declarations: [
    OnboardingComponent
  ],
  imports: [
    CommonModule,
    OnboardingRoutingModule
  ]
})
export class OnboardingModule { }
