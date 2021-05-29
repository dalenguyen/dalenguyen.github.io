import { Component, OnInit } from '@angular/core'
import { FormBuilder, Validators } from '@angular/forms'

@Component({
  selector: 'dalenguyen-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  })

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {}

  submit() {
    // TODO: call the auth service
    const { email, password } = this.loginForm.value

    console.table({ email, password })
  }
}
