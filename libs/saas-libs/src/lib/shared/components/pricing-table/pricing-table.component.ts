import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core'
import { Plan } from '../../models'

@Component({
  selector: 'dalenguyen-pricing-table',
  templateUrl: './pricing-table.component.html',
  styleUrls: ['./pricing-table.component.scss'],
})
export class PricingTableComponent implements OnInit {
  @Input()
  plans!: Plan[]

  @Output() selectedPlan: EventEmitter<Plan> = new EventEmitter()
  constructor() {}

  ngOnInit(): void {}

  onPlanSelected(plan: Plan) {
    this.selectedPlan.emit(plan)
  }
}
