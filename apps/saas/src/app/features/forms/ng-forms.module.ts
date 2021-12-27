import { CommonModule } from '@angular/common'
import { NgModule } from '@angular/core'
import { NgFormsRoutingModule } from './ng-forms-routing.module'
import { NgFormsComponent } from './ng-forms.component'

@NgModule({
  declarations: [NgFormsComponent],
  imports: [CommonModule, NgFormsRoutingModule],
})
export class NgFormsModule {}

// https://netbasal.com/create-a-multi-step-form-in-angular-44cdc5b75cdc
