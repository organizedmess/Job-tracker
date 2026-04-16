import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";

import { ApplicationFormComponent } from "./components/application-form/application-form.component";
import { ApplicationListComponent } from "./components/application-list/application-list.component";
import { LayoutComponent } from "./components/layout/layout.component";

const routes: Routes = [
  {
    path: "",
    component: LayoutComponent,
    children: [
      { path: "applications", component: ApplicationListComponent },
      { path: "add", component: ApplicationFormComponent },
      { path: "", redirectTo: "applications", pathMatch: "full" },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
