import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from "@angular/core";
import { Chart, registerables } from "chart.js";

import {
  Application,
  ApplicationService,
} from "../../services/application.service";
import { MatSnackBar } from "@angular/material/snack-bar";

Chart.register(...registerables);

export interface Stats {
  total_applied: number;
  in_interview: number;
  offers: number;
  rejections: number;
  rejection_rate: number;
}

@Component({
  selector: "app-dashboard",
  templateUrl: "./dashboard.component.html",
  styleUrls: ["./dashboard.component.css"],
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild("pieCanvas") pieCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild("lineCanvas") lineCanvas!: ElementRef<HTMLCanvasElement>;

  stats: Stats = {
    total_applied: 0,
    in_interview: 0,
    offers: 0,
    rejections: 0,
    rejection_rate: 0,
  };

  private pieChart?: Chart;
  private lineChart?: Chart;
  private applications: Application[] = [];
  private viewReady = false;
  private appsLoaded = false;
  loading = true;
  private readonly themeChangedHandler = () => {
    if (this.viewReady && this.appsLoaded) {
      this.renderCharts();
    }
  };

  constructor(
    private readonly applicationService: ApplicationService,
    private readonly snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    window.addEventListener("theme-changed", this.themeChangedHandler);

    this.applicationService.getStats().subscribe({
      next: (s) => {
        this.stats = s;
      },
      error: () => {
        this.snackBar.open("Failed to load dashboard stats", "Close", {
          duration: 3200,
        });
      },
    });

    this.applicationService.getAll().subscribe({
      next: (apps) => {
        this.applications = apps;
        this.appsLoaded = true;
        this.loading = false;
        if (this.viewReady) {
          setTimeout(() => this.renderCharts(), 0);
        }
      },
      error: (err) => {
        this.loading = false;
        this.snackBar.open("Failed to load chart data", "Close", {
          duration: 3200,
        });
        console.error("Failed to load applications:", err);
      },
    });
  }

  ngAfterViewInit(): void {
    this.viewReady = true;
    if (this.appsLoaded) {
      setTimeout(() => this.renderCharts(), 0);
    }
  }

  private renderCharts(): void {
    this.renderPieChart();
    this.renderLineChart();
  }

  private renderPieChart(): void {
    if (!this.pieCanvas) {
      return;
    }

    const labelColor = this.isDarkMode() ? "#e2e8f0" : "#475569";

    const counts: Record<string, number> = {
      applied: 0,
      interview: 0,
      offer: 0,
      rejected: 0,
    };

    for (const app of this.applications) {
      if (counts[app.status] !== undefined) {
        counts[app.status]++;
      }
    }

    this.pieChart?.destroy();
    this.pieChart = new Chart(this.pieCanvas.nativeElement, {
      type: "pie",
      data: {
        labels: ["Applied", "Interview", "Offer", "Rejected"],
        datasets: [
          {
            data: [
              counts["applied"],
              counts["interview"],
              counts["offer"],
              counts["rejected"],
            ],
            backgroundColor: ["#4e9af1", "#f5a623", "#27ae60", "#e74c3c"],
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: "bottom",
            labels: { color: labelColor },
          },
        },
      },
    });
  }

  private renderLineChart(): void {
    if (!this.lineCanvas) {
      return;
    }

    const labelColor = this.isDarkMode() ? "#e2e8f0" : "#475569";
    const gridColor = this.isDarkMode()
      ? "rgba(148, 163, 184, 0.12)"
      : "rgba(71, 85, 105, 0.12)";

    const weeks: string[] = [];
    const counts: number[] = [];

    for (let i = 7; i >= 0; i--) {
      const base = new Date();
      base.setDate(base.getDate() - i * 7);
      const weekStart = new Date(base);
      weekStart.setDate(base.getDate() - base.getDay());
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);

      const label = `${weekStart.getMonth() + 1}/${weekStart.getDate()}`;
      weeks.push(label);

      const count = this.applications.filter((app) => {
        const created = new Date(app.created_at!);
        return created >= weekStart && created < weekEnd;
      }).length;
      counts.push(count);
    }

    this.lineChart?.destroy();
    this.lineChart = new Chart(this.lineCanvas.nativeElement, {
      type: "line",
      data: {
        labels: weeks,
        datasets: [
          {
            label: "Applications per Week",
            data: counts,
            borderColor: "#4e9af1",
            backgroundColor: "rgba(78, 154, 241, 0.1)",
            tension: 0.4,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            labels: { color: labelColor },
          },
        },
        scales: {
          x: {
            ticks: { color: labelColor },
            grid: { color: gridColor },
          },
          y: {
            beginAtZero: true,
            ticks: { stepSize: 1, color: labelColor },
            grid: { color: gridColor },
          },
        },
      },
    });
  }

  private isDarkMode(): boolean {
    return document.body.classList.contains("dark-theme");
  }

  ngOnDestroy(): void {
    window.removeEventListener("theme-changed", this.themeChangedHandler);
    this.pieChart?.destroy();
    this.lineChart?.destroy();
  }
}
