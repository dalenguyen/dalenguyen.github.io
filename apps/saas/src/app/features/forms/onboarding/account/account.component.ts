import { Component } from '@angular/core'
import { FormGroup } from '@angular/forms'
import { FormProvider } from '../form.provider'

@Component({
  selector: 'dalenguyen-account',
  template: `
    <form [formGroup]="form">
      <input formControlName="name" />
      <input formControlName="email" />

      <button [disabled]="form.invalid">Next</button>
    </form>
  `,
})
export class AccountComponent {
  form!: FormGroup
  constructor(private formProvider: FormProvider) {
    console.log(this.formProvider)
    this.form = this.formProvider?.getForm().get('account') as FormGroup
  }
}
