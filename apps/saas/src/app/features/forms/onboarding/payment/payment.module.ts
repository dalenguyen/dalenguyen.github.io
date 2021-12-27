import { CommonModule } from '@angular/common'
import { NgModule } from '@angular/core'
import { ReactiveFormsModule } from '@angular/forms'
import { PaymentRoutingModule } from './payment-routing.module'
import { PaymentComponent } from './payment.component'

@NgModule({
  declarations: [PaymentComponent],
  imports: [CommonModule, PaymentRoutingModule, ReactiveFormsModule],
})
export class PaymentModule {}
