import { Component } from "@angular/core";
import { FormBuilder, Validators } from "@angular/forms";
import { MatSnackBar } from "@angular/material/snack-bar";
import { Router } from "@angular/router";

import { AuthService } from "../../services/auth.service";

@Component({
  selector: "app-register",
  templateUrl: "./register.component.html",
  styleUrls: ["./register.component.css"],
})
export class RegisterComponent {
  errorMessage = "";
  loading = false;

  form = this.fb.group({
    email: ["", [Validators.required, Validators.email]],
    password: ["", [Validators.required, Validators.minLength(8)]],
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly snackBar: MatSnackBar,
  ) {}

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading = true;
    const { email, password } = this.form.getRawValue();
    this.authService.register(email!, password!).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(["/applications"]);
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage =
          err.error?.errors?.join(", ") ||
          err.error?.error ||
          "Registration failed. Please try again.";
        this.snackBar.open(this.errorMessage, "Close", { duration: 3200 });
      },
    });
  }
}
