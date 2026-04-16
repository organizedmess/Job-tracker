import { Component, OnInit, ViewChild } from "@angular/core";
import {
  AbstractControl,
  FormBuilder,
  FormGroupDirective,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from "@angular/forms";
import { MatSnackBar } from "@angular/material/snack-bar";
import * as InspirationalQuotes from "inspirational-quotes";

import { ApplicationService } from "../../services/application.service";

interface QuoteItem {
  text: string;
  author: string;
}

@Component({
  selector: "app-application-form",
  templateUrl: "./application-form.component.html",
  styleUrls: ["./application-form.component.css"],
})
export class ApplicationFormComponent implements OnInit {
  @ViewChild(FormGroupDirective) formDirective!: FormGroupDirective;

  statuses: string[] = ["applied", "interview", "offer", "rejected"];
  priorities: string[] = ["low", "medium", "high"];
  submitting = false;
  quote: QuoteItem = {
    text: "Small, consistent actions compound into meaningful career progress.",
    author: "Job Tracker",
  };

  private readonly urlRegex = /^(https?:\/\/)([\w-]+\.)+[\w-]{2,}(\/[^\s]*)?$/i;

  private interviewNotPastValidator: ValidatorFn = (
    control: AbstractControl,
  ): ValidationErrors | null => {
    if (!control.value) {
      return null;
    }
    const selected = new Date(control.value);
    selected.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return selected < today ? { pastDate: true } : null;
  };

  applicationForm = this.fb.group({
    company: ["", Validators.required],
    role: ["", Validators.required],
    status: ["applied"],
    applied_date: [""],
    notes: [""],
    salary_range: [""],
    job_url: ["", Validators.pattern(this.urlRegex)],
    interview_date: ["", this.interviewNotPastValidator],
    priority: ["medium"],
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly applicationService: ApplicationService,
    private readonly snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.refreshQuote();
  }

  refreshQuote(): void {
    try {
      const nextQuote = InspirationalQuotes.getQuote() as QuoteItem;
      this.quote = {
        text: nextQuote.text,
        author: nextQuote.author,
      };
    } catch {
      this.quote = {
        text: "Success is the sum of focused effort repeated one application at a time.",
        author: "Job Tracker",
      };
    }
  }

  onSubmit(): void {
    if (this.applicationForm.invalid) {
      this.applicationForm.markAllAsTouched();
      return;
    }

    this.submitting = true;

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
      salary_range: value.salary_range ?? "",
      job_url: value.job_url ?? "",
      interview_date: value.interview_date
        ? new Date(value.interview_date).toISOString()
        : undefined,
      priority: (value.priority as "low" | "medium" | "high") ?? "medium",
    };

    this.applicationService.create(payload).subscribe({
      next: () => {
        this.submitting = false;
        this.snackBar.open("Application added", "Close", { duration: 2500 });
        // resetForm() resets the FormGroupDirective's `submitted` flag too,
        // which prevents Angular Material from showing validation errors after reset
        this.formDirective.resetForm({
          company: "",
          role: "",
          status: "applied",
          applied_date: "",
          notes: "",
          salary_range: "",
          job_url: "",
          interview_date: "",
          priority: "medium",
        });
      },
      error: (err) => {
        this.submitting = false;
        this.snackBar.open(
          err.error?.errors?.join(", ") ||
            err.error?.error ||
            "Failed to create application",
          "Close",
          { duration: 3500 },
        );
        console.error("Failed to create application:", err);
      },
    });
  }
}
