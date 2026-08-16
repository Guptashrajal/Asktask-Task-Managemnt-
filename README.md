# AskTask

AskTask is a full-stack task management application designed to help users create, organize, prioritize, schedule, and complete their tasks from a single dashboard. It also provides reminders, browser notifications, and AI-assisted task suggestions and workload analysis.

## Features

### User Authentication

* User registration and login
* JWT-based authentication
* Password hashing using bcrypt
* Password reset through email

### Task Management

Users can create, edit, delete, and complete tasks.

Each task can contain:

* Title
* Description
* Category
* Priority
* Status
* Due date
* Reminder date and time

### Task Priorities

Tasks support three priority levels:

* **High**
* **Medium**
* **Low**

High-priority and overdue tasks are highlighted to help users focus on important work.

### Dashboard

The dashboard provides a quick overview of the user's workload, including:

* Total tasks
* Pending tasks
* Completed tasks
* High-priority tasks
* Upcoming tasks
* Overdue tasks
* AI workload summary

### Search, Filter and Sort

Users can quickly find and organize tasks using:

* Task search
* Priority filtering
* Due-date filtering
* Status filtering
* Due-date sorting
* Priority sorting
* Recently created sorting
* Title sorting

### Reminders and Notifications

Users can assign reminder dates and times to tasks.

The application also uses browser notifications to highlight upcoming reminders and overdue tasks.

### Schedule

The schedule view helps users organize and review tasks according to their due dates, making upcoming work easier to track.

### AI Task Assistant

AskTask integrates the **Google Gemini API** to convert general goals into actionable tasks.

For example, a user can provide a goal such as:

> Prepare for a software engineering interview.

The AI can generate relevant tasks based on that goal.

### AI Task Summary

The AI functionality can analyze the user's existing tasks and provide a concise workload summary covering areas such as:

* Important priorities
* Upcoming deadlines
* Overdue work
* Workload progress
* Suggested actions

### Responsive Design

The application supports desktop and mobile layouts. Task cards, filters, metadata, buttons, and other dashboard elements adapt to smaller screen sizes for better usability.

### Theme Support

The interface supports theme switching and uses reusable CSS variables for consistent colors, surfaces, borders, text, and status indicators.

---

## Technology Stack

### Frontend

* **React** — builds the user interface and manages application state.
* **Vite** — frontend development and build tooling.
* **JavaScript / JSX** — application logic and React components.
* **CSS** — responsive layout, styling, themes, task cards, and dashboard UI.

### Backend

* **Node.js** — backend runtime.
* **Express.js** — creates and handles REST APIs.
* **REST APIs** — communication between the frontend and backend.

### Database

* **MongoDB** — stores application data such as users and tasks.
* **Mongoose** — ODM used by the Node.js backend to define models/schemas and perform database operations with MongoDB.

### Authentication

* **JWT** — handles authenticated user sessions and protected API requests.
* **bcrypt** — securely hashes user passwords.

### AI

* **Google Gemini API** — generates task suggestions and provides AI-based workload analysis.

### Email

* **Brevo** — used for password-reset email delivery.

### Notifications

* **Browser Notifications API** — provides reminder and overdue-task notifications in supported browsers.

### Development & Deployment

* **Visual Studio Code** — development environment.
* **Git** — version control.
* **GitHub** — source-code repository and project collaboration.
* **Vercel** — frontend deployment, where applicable.

---

## How It Works

The application follows a client-server approach.

The React frontend sends requests to the Express backend through REST APIs. The backend authenticates the user, processes the request, and uses Mongoose to interact with MongoDB.

The same backend also handles authentication, task operations, email functionality, and communication with the Gemini API.

## Project Structure

### Client

The client contains the React application, dashboard, task management interface, scheduling functionality, AI features, responsive styling, and frontend API communication.

### Server

The server contains the Express application, REST API routes, authentication logic, database models, task operations, AI integration, and email functionality.

## Environment Variables

The application uses environment variables for sensitive configuration.
Depending on the environment, these include values such as:
MongoDB connection string
JWT secret
Gemini API key
Brevo/email configuration
Frontend URL
Sensitive credentials should be stored in local `.env` files and **must not be committed to GitHub**.

## Installation

Clone the repository and install the dependencies for both the frontend and backend.

### Client

```bash
cd client
npm install
npm run dev
```

### Server

```bash
cd server
npm install
npm start
```

The exact backend command depends on the scripts defined in `server/package.json`.

---

## Usage

1. Register a new account or log in.
2. Create a task from the dashboard.
3. Set its priority, category, due date, and reminder if required.
4. Search, filter, or sort tasks.
5. Mark tasks as completed when finished.
6. Check reminders and notifications for tasks that require attention.
7. Use the AI Assistant to convert a goal into actionable tasks.
8. Use the AI Summary to understand the current workload.

---

## Future Improvements

Potential future improvements include:

* Push notifications
* Recurring tasks
* Calendar integration
* Advanced AI recommendations
* Productivity analytics
* Dedicated mobile application
* Improved reminder management
* Offline task support
* Additional personalization

---

## Conclusion

AskTask combines traditional task management with reminders and AI assistance in a single productivity-focused application. It helps users organize their work, prioritize important tasks, track deadlines, manage reminders, and turn larger goals into actionable tasks using AI.
