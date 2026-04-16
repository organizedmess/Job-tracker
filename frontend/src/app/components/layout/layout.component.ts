import { Component, OnInit } from "@angular/core";
import { AuthService } from "../../services/auth.service";

@Component({
  selector: "app-layout",
  templateUrl: "./layout.component.html",
  styleUrls: ["./layout.component.css"],
})
export class LayoutComponent implements OnInit {
  isMobile = window.innerWidth <= 900;
  sidenavOpen = window.innerWidth > 900;
  darkMode = false;

  constructor(readonly authService: AuthService) {}

  ngOnInit(): void {
    this.darkMode = localStorage.getItem("dark_mode") === "true";
    this.applyBodyTheme();
  }

  onResize(): void {
    this.isMobile = window.innerWidth <= 900;
    if (!this.isMobile) {
      this.sidenavOpen = true;
    }
  }

  toggleDarkMode(): void {
    this.darkMode = !this.darkMode;
    localStorage.setItem("dark_mode", String(this.darkMode));
    this.applyBodyTheme();
    window.dispatchEvent(new CustomEvent("theme-changed"));
  }

  private applyBodyTheme(): void {
    if (this.darkMode) {
      document.body.classList.add("dark-theme");
    } else {
      document.body.classList.remove("dark-theme");
    }
  }
}
