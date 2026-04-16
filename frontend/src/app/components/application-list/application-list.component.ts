import { Component, OnInit } from "@angular/core";

import {
  Application,
  ApplicationService,
} from "../../services/application.service";

@Component({
  selector: "app-application-list",
  templateUrl: "./application-list.component.html",
  styleUrls: ["./application-list.component.css"],
})
export class ApplicationListComponent implements OnInit {
  applications: Application[] = [];
  statuses: Application["status"][] = [
    "applied",
    "interview",
    "offer",
    "rejected",
  ];

  constructor(private readonly applicationService: ApplicationService) {}

  ngOnInit(): void {
    this.fetchApplications();
  }

  fetchApplications(): void {
    this.applicationService.getAll().subscribe({
      next: (data) => {
        this.applications = data;
      },
      error: (err) => {
        console.error("Failed to fetch applications:", err);
      },
    });
  }

  onDelete(id?: number): void {
    if (!id) {
      return;
    }

    this.applicationService.delete(id).subscribe({
      next: () => {
        this.applications = this.applications.filter((item) => item.id !== id);
      },
      error: (err) => {
        console.error("Failed to delete application:", err);
      },
    });
  }

  onStatusChange(application: Application, status: string): void {
    if (!application.id) {
      return;
    }

    this.applicationService
      .update(application.id, { status, notes: application.notes ?? "" })
      .subscribe({
        next: (updated) => {
          application.status = updated.status;
          application.notes = updated.notes;
        },
        error: (err) => {
          console.error("Failed to update application status:", err);
        },
      });
  }
}
