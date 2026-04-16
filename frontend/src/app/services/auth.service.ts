import { Injectable } from "@angular/core";
import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { Observable, throwError } from "rxjs";
import { catchError, tap } from "rxjs/operators";
import { Router } from "@angular/router";

import { environment } from "../../environments/environment";

export interface AuthResponse {
  token: string;
  user_id: number;
  email: string;
}

@Injectable({
  providedIn: "root",
})
export class AuthService {
  private readonly baseUrl = `${environment.apiBaseUrl}/auth`;

  constructor(
    private readonly http: HttpClient,
    private readonly router: Router,
  ) {}

  register(email: string, password: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.baseUrl}/register`, { email, password })
      .pipe(
        tap((res) => {
          localStorage.setItem("jwt_token", res.token);
          localStorage.setItem("user_email", res.email);
        }),
        catchError(this.handleError),
      );
  }

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.baseUrl}/login`, { email, password })
      .pipe(
        tap((res) => {
          localStorage.setItem("jwt_token", res.token);
          localStorage.setItem("user_email", res.email);
        }),
        catchError(this.handleError),
      );
  }

  logout(): void {
    localStorage.removeItem("jwt_token");
    localStorage.removeItem("user_email");
    this.router.navigate(["/login"]);
  }

  getToken(): string | null {
    return localStorage.getItem("jwt_token");
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  getUserEmail(): string {
    return localStorage.getItem("user_email") || "";
  }

  private handleError(error: HttpErrorResponse) {
    console.error("Auth API error:", error);
    return throwError(() => error);
  }
}
