import { Component, OnInit } from '@angular/core'
import { FormBuilder, Validators } from '@angular/forms'

@Component({
  selector: 'dalenguyen-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss'],
})
export class SignupComponent implements OnInit {
  signupForm = this.fb.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  })

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {}

  submit() {
    // TODO: call the auth service
    const { firstName, lastName, email, password } = this.signupForm.value

    console.table({ firstName, lastName, email, password })
  }
}
