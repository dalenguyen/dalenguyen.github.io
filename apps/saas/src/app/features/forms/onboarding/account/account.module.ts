import { CommonModule } from '@angular/common'
import { InjectionToken, NgModule } from '@angular/core'
import { ReactiveFormsModule } from '@angular/forms'
import { OnboardingModule } from '../onboarding.module'
import { AccountRoutingModule } from './account-routing.module'
import { AccountComponent } from './account.component'

export const BASE_URL = new InjectionToken<string>('BaseUrl')

@NgModule({
  declarations: [AccountComponent],
  imports: [CommonModule, AccountRoutingModule, ReactiveFormsModule, OnboardingModule],
})
export class AccountModule {}
