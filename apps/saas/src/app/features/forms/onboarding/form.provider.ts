import { FormGroup } from '@angular/forms'

export abstract class FormProvider {
  abstract getForm(): FormGroup
}
