import { Injectable } from "@angular/core";
import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { Observable, throwError } from "rxjs";
import { catchError } from "rxjs/operators";

import { environment } from "../../environments/environment";

export interface Application {
  id?: number;
  user_id?: number;
  company: string;
  role: string;
  status: "applied" | "interview" | "offer" | "rejected";
  applied_date: string;
  notes: string;
  created_at?: string;
}

@Injectable({
  providedIn: "root",
})
export class ApplicationService {
  private readonly baseUrl = `${environment.apiBaseUrl}/applications`;

  constructor(private readonly http: HttpClient) {}

  getAll(): Observable<Application[]> {
    return this.http
      .get<Application[]>(this.baseUrl)
      .pipe(catchError(this.handleError));
  }

  create(application: Application): Observable<Application> {
    return this.http
      .post<Application>(this.baseUrl, application)
      .pipe(catchError(this.handleError));
  }

  update(
    id: number,
    payload: { status: string; notes: string },
  ): Observable<Application> {
    return this.http
      .put<Application>(`${this.baseUrl}/${id}`, payload)
      .pipe(catchError(this.handleError));
  }

  delete(id: number): Observable<{ message: string }> {
    return this.http
      .delete<{ message: string }>(`${this.baseUrl}/${id}`)
      .pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse) {
    console.error("Application API error:", error);
    return throwError(() => error);
  }
}
