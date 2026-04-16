# Job Application Tracker

A full-stack web application to manage job applications with authentication, dashboard analytics, status timelines, CSV export, and interview reminders.

## Tech Stack

- Backend: Go, Gin, GORM, PostgreSQL, JWT, bcrypt, SendGrid SDK
- Frontend: Angular 17, TypeScript, Angular Material, Chart.js
- Database: PostgreSQL
- DevOps: Docker Compose

## Run Locally

1. Clone repository and move into project root.
2. Backend setup:
   - Go to `backend` folder.
   - Update `.env` values (`DB_URL` or DB_* vars, `JWT_SECRET`, optional SendGrid keys).
   - Run `go mod tidy`.
   - Start API with `go run main.go`.
3. Frontend setup:
   - Go to `frontend` folder.
   - Run `npm install`.
   - Start app with `npm start`.
4. Open `http://localhost:4200`.

## Screenshots

- Login Page: Placeholder
- Dashboard: Placeholder
- Applications List: Placeholder
- Application Form: Placeholder

## API Endpoints

| Method | Endpoint | Protected | Description |
|---|---|---|---|
| POST | /api/auth/register | No | Register user and return JWT |
| POST | /api/auth/login | No | Login and return JWT |
| GET | /api/stats | Yes | Dashboard statistics |
| POST | /api/applications | Yes | Create application |
| GET | /api/applications | Yes | List applications with filters/search/sort |
| GET | /api/applications/export | Yes | Export applications CSV |
| GET | /api/applications/:id/history | Yes | Get status timeline |
| PUT | /api/applications/:id | Yes | Update application |
| DELETE | /api/applications/:id | Yes | Delete application |

## Notes

- All protected routes require `Authorization: Bearer <token>`.
- Salary range is handled in INR format on the UI.
- Interview reminder scheduler runs every 24 hours and sends emails for next-day interviews when SendGrid env vars are configured.
