import { Component, Input } from "@angular/core";

@Component({
  selector: "app-status-badge",
  templateUrl: "./status-badge.component.html",
  styleUrls: ["./status-badge.component.css"],
})
export class StatusBadgeComponent {
  @Input() status: "applied" | "interview" | "offer" | "rejected" = "applied";

  statusClass(): string {
    switch (this.status) {
      case "interview":
        return "status-interview";
      case "offer":
        return "status-offer";
      case "rejected":
        return "status-rejected";
      default:
        return "status-applied";
    }
  }
}
