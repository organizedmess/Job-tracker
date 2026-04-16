import { Component } from "@angular/core";
import { FormBuilder, Validators } from "@angular/forms";

import { ApplicationService } from "../../services/application.service";

@Component({
  selector: "app-application-form",
  templateUrl: "./application-form.component.html",
  styleUrls: ["./application-form.component.css"],
})
export class ApplicationFormComponent {
  statuses: string[] = ["applied", "interview", "offer", "rejected"];

  applicationForm = this.fb.group({
    company: ["", Validators.required],
    role: ["", Validators.required],
    status: ["applied"],
    applied_date: [""],
    notes: [""],
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly applicationService: ApplicationService,
  ) {}

  onSubmit(): void {
    if (this.applicationForm.invalid) {
      return;
    }

    const value = this.applicationForm.getRawValue();
    const payload = {
      company: value.company ?? "",
      role: value.role ?? "",
      status:
        (value.status as "applied" | "interview" | "offer" | "rejected") ??
        "applied",
      applied_date: value.applied_date
        ? new Date(value.applied_date).toISOString()
        : new Date().toISOString(),
      notes: value.notes ?? "",
    };

    this.applicationService.create(payload).subscribe({
      next: () => {
        this.applicationForm.reset({
          company: "",
          role: "",
          status: "applied",
          applied_date: "",
          notes: "",
        });
      },
      error: (err) => {
        console.error("Failed to create application:", err);
      },
    });
  }
}
