import { Injectable } from "@angular/core";
import {
  HttpClient,
  HttpErrorResponse,
  HttpParams,
} from "@angular/common/http";
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
  salary_range?: string;
  job_url?: string;
  interview_date?: string | null;
  priority?: "low" | "medium" | "high";
  created_at?: string;
}

export interface ApplicationFilters {
  status?: string;
  sort_by?: string;
  order?: string;
  search?: string;
}

export interface StatusHistoryItem {
  id: number;
  application_id: number;
  status: string;
  changed_at: string;
}

export interface Stats {
  total_applied: number;
  in_interview: number;
  offers: number;
  rejections: number;
  rejection_rate: number;
}

@Injectable({
  providedIn: "root",
})
export class ApplicationService {
  private readonly baseUrl = `${environment.apiBaseUrl}/applications`;
  private readonly statsUrl = `${environment.apiBaseUrl}/stats`;

  constructor(private readonly http: HttpClient) {}

  getAll(filters: ApplicationFilters = {}): Observable<Application[]> {
    let params = new HttpParams();
    if (filters.status) params = params.set("status", filters.status);
    if (filters.sort_by) params = params.set("sort_by", filters.sort_by);
    if (filters.order) params = params.set("order", filters.order);
    if (filters.search) params = params.set("search", filters.search);
    return this.http
      .get<Application[]>(this.baseUrl, { params })
      .pipe(catchError(this.handleError));
  }

  create(application: Partial<Application>): Observable<Application> {
    return this.http
      .post<Application>(this.baseUrl, application)
      .pipe(catchError(this.handleError));
  }

  update(id: number, payload: Partial<Application>): Observable<Application> {
    return this.http
      .put<Application>(`${this.baseUrl}/${id}`, payload)
      .pipe(catchError(this.handleError));
  }

  delete(id: number): Observable<{ message: string }> {
    return this.http
      .delete<{ message: string }>(`${this.baseUrl}/${id}`)
      .pipe(catchError(this.handleError));
  }

  getStats(): Observable<Stats> {
    return this.http
      .get<Stats>(this.statsUrl)
      .pipe(catchError(this.handleError));
  }

  getHistory(id: number): Observable<StatusHistoryItem[]> {
    return this.http
      .get<StatusHistoryItem[]>(`${this.baseUrl}/${id}/history`)
      .pipe(catchError(this.handleError));
  }

  exportCsv(): Observable<Blob> {
    return this.http
      .get(`${this.baseUrl}/export`, { responseType: "blob" })
      .pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse) {
    console.error("Application API error:", error);
    return throwError(() => error);
  }
}
