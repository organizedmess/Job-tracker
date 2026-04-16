import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";

import { authGuard } from "./guards/auth.guard";
import { ApplicationFormComponent } from "./components/application-form/application-form.component";
import { ApplicationListComponent } from "./components/application-list/application-list.component";
import { DashboardComponent } from "./components/dashboard/dashboard.component";
import { LayoutComponent } from "./components/layout/layout.component";
import { LoginComponent } from "./components/login/login.component";
import { RegisterComponent } from "./components/register/register.component";

const routes: Routes = [
  { path: "login", component: LoginComponent },
  { path: "register", component: RegisterComponent },
  {
    path: "",
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: "dashboard",
        component: DashboardComponent,
        canActivate: [authGuard],
      },
      {
        path: "applications",
        component: ApplicationListComponent,
        canActivate: [authGuard],
      },
      { path: "add", component: ApplicationFormComponent },
      { path: "", redirectTo: "dashboard", pathMatch: "full" },
    ],
  },
  { path: "**", redirectTo: "login" },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
