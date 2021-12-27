import { Component } from '@angular/core'
import { FormGroup } from '@angular/forms'
import { FormProvider } from '../form.provider'

@Component({
  selector: 'dalenguyen-payment',
  template: `
    <form [formGroup]="form">
      <input formControlName="cardNumber" />
      <input formControlName="CVC" />

      <button [disabled]="form.invalid">Submit</button>
    </form>
  `,
})
export class PaymentComponent {
  form: FormGroup
  constructor(private formProvider: FormProvider) {
    this.form = this.formProvider.getForm().get('payment') as FormGroup
  }
}
