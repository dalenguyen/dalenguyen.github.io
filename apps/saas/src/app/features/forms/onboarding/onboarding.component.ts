import { Component } from '@angular/core'
import { FormControl, FormGroup, Validators } from '@angular/forms'
import { FormProvider } from './form.provider'

@Component({
  selector: 'dalenguyen-onboarding',
  templateUrl: './onboarding.component.html',
  styleUrls: ['./onboarding.component.css'],
  providers: [{ provide: FormProvider, useExisting: OnboardingComponent }],
})
export class OnboardingComponent extends FormProvider {
  onboardingForm = new FormGroup({
    account: new FormGroup({
      name: new FormControl('', Validators.required),
      email: new FormControl('', Validators.required),
    }),
    payment: new FormGroup({
      cardNumber: new FormControl('', Validators.required),
      CVC: new FormControl('', Validators.required),
    }),
  })

  getForm() {
    return this.onboardingForm
  }
}
