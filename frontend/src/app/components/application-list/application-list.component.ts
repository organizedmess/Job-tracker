import { Component, OnDestroy, OnInit } from "@angular/core";
import { MatSnackBar } from "@angular/material/snack-bar";
import {
  debounceTime,
  distinctUntilChanged,
  Subject,
  Subscription,
} from "rxjs";

import {
  Application,
  ApplicationsResponse,
  ApplicationFilters,
  ApplicationService,
  StatusHistoryItem,
} from "../../services/application.service";

@Component({
  selector: "app-application-list",
  templateUrl: "./application-list.component.html",
  styleUrls: ["./application-list.component.css"],
})
export class ApplicationListComponent implements OnInit, OnDestroy {
  applications: Application[] = [];
  selectedApplication: Application | null = null;
  historyDrawerOpen = false;
  statusHistory: StatusHistoryItem[] = [];
  statuses: Application["status"][] = [
    "applied",
    "interview",
    "offer",
    "rejected",
  ];
  priorities: Array<"low" | "medium" | "high"> = ["low", "medium", "high"];
  filterStatus = "";
  sortBy = "date";
  order = "desc";
  searchTerm = "";
  loading = false;
  exporting = false;
  historyLoading = false;
  totalApplications = 0;
  currentPage = 1;
  pageSize = 10;
  totalPages = 1;
  readonly emptyStateSvg =
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="280" height="180" viewBox="0 0 280 180"><rect width="280" height="180" fill="#f4f7fb"/><rect x="36" y="28" width="208" height="124" rx="12" fill="#ffffff" stroke="#d4deea"/><circle cx="80" cy="70" r="10" fill="#90caf9"/><rect x="100" y="62" width="110" height="8" rx="4" fill="#cfd8dc"/><rect x="100" y="78" width="80" height="8" rx="4" fill="#e1e8ed"/><rect x="56" y="108" width="168" height="26" rx="6" fill="#e8f2ff"/></svg>',
    );

  private readonly search$ = new Subject<string>();
  private searchSub?: Subscription;

  constructor(
    private readonly applicationService: ApplicationService,
    private readonly snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.searchSub = this.search$
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(() => this.fetchApplications());
    this.fetchApplications();
  }

  ngOnDestroy(): void {
    this.searchSub?.unsubscribe();
  }

  fetchApplications(): void {
    this.loading = true;
    const filters: ApplicationFilters = {};
    if (this.filterStatus) filters.status = this.filterStatus;
    filters.sort_by = this.sortBy;
    filters.order = this.order;
    if (this.searchTerm.trim()) filters.search = this.searchTerm.trim();
    filters.page = this.currentPage;
    filters.limit = this.pageSize;

    this.applicationService.getAll(filters).subscribe({
      next: (response: ApplicationsResponse) => {
        this.applications = response.data ?? [];
        this.totalApplications = response.meta?.total ?? 0;
        this.currentPage = response.meta?.page ?? 1;
        this.pageSize = response.meta?.limit ?? this.pageSize;
        this.totalPages = response.meta?.total_pages ?? 1;
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.snackBar.open(
          err.error?.error || "Failed to fetch applications",
          "Close",
          { duration: 3200 },
        );
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
        this.snackBar.open("Application deleted", "Close", { duration: 2400 });
      },
      error: (err) => {
        this.snackBar.open(err.error?.error || "Delete failed", "Close", {
          duration: 3200,
        });
        console.error("Failed to delete application:", err);
      },
    });
  }

  onStatusChange(application: Application, status: string): void {
    if (!application.id) {
      return;
    }

    this.applicationService
      .update(application.id, {
        status,
        notes: application.notes ?? "",
      } as Partial<Application>)
      .subscribe({
        next: (updated) => {
          application.status = updated.status;
          application.notes = updated.notes;
          this.snackBar.open("Status updated", "Close", { duration: 2400 });
        },
        error: (err) => {
          this.snackBar.open(
            err.error?.error || "Status update failed",
            "Close",
            {
              duration: 3200,
            },
          );
          console.error("Failed to update application status:", err);
        },
      });
  }

  priorityClass(priority?: string): string {
    switch (priority) {
      case "high":
        return "priority-high";
      case "low":
        return "priority-low";
      default:
        return "priority-medium";
    }
  }

  statusColor(status: Application["status"]): string {
    switch (status) {
      case "interview":
        return "warn";
      case "offer":
        return "primary";
      case "rejected":
        return "warn";
      default:
        return "accent";
    }
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.fetchApplications();
  }

  onSearchChange(value: string): void {
    this.searchTerm = value;
    this.search$.next(value);
  }

  openHistory(application: Application): void {
    if (!application.id) {
      return;
    }
    this.selectedApplication = application;
    this.historyDrawerOpen = true;
    this.historyLoading = true;
    this.applicationService.getHistory(application.id).subscribe({
      next: (history) => {
        this.statusHistory = history;
        this.historyLoading = false;
      },
      error: (err) => {
        this.historyLoading = false;
        this.snackBar.open(
          err.error?.error || "Failed to load timeline",
          "Close",
          {
            duration: 3200,
          },
        );
      },
    });
  }

  closeHistory(): void {
    this.historyDrawerOpen = false;
    this.selectedApplication = null;
    this.statusHistory = [];
  }

  exportCsv(): void {
    this.exporting = true;
    this.applicationService.exportCsv().subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = "applications.csv";
        anchor.click();
        URL.revokeObjectURL(url);
        this.exporting = false;
      },
      error: (err) => {
        this.exporting = false;
        this.snackBar.open(err.error?.error || "Export failed", "Close", {
          duration: 3200,
        });
      },
    });
  }

  historyStatus(item: StatusHistoryItem): Application["status"] {
    if (
      item.status === "applied" ||
      item.status === "interview" ||
      item.status === "offer" ||
      item.status === "rejected"
    ) {
      return item.status;
    }
    return "applied";
  }
}
