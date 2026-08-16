# AskTask

AskTask is a full-stack task management application designed to help users create, organize, prioritize, schedule, and complete tasks from a single dashboard. It also provides reminders, browser notifications, and AI-assisted task suggestions and workload analysis.

## Live Project

Live Application: [https://smart-task-management-nine.vercel.app/](https://smart-task-management-nine.vercel.app/)

GitHub Repository: [https://github.com/Guptashrajal/smart-task-management](https://github.com/Guptashrajal/smart-task-management)

## Features

### User Authentication

* User registration and login
* JWT-based authentication
* Password hashing using bcrypt
* Password reset through email using Brevo

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

* High
* Medium
* Low

High-priority and overdue tasks are highlighted to help users focus on important work.

### Dashboard

The dashboard provides an overview of the user's workload, including:

* Total tasks
* Pending tasks
* Completed tasks
* High-priority tasks
* Upcoming tasks
* Overdue tasks
* AI workload summary

### Search, Filter and Sort

Users can search, filter, and organize tasks using:

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

The application uses the Browser Notifications API to provide notifications for upcoming reminders and overdue tasks.

### Schedule

The schedule view helps users organize and review tasks according to their due dates.

### AI Task Assistant

AskTask integrates the Google Gemini API to convert general goals into actionable tasks.

### AI Task Summary

The AI functionality analyzes existing tasks and provides workload insights related to:

* Important priorities
* Upcoming deadlines
* Overdue work
* Workload progress
* Suggested actions

### Responsive Design

The application supports desktop and mobile layouts with responsive task cards, filters, metadata, buttons, and dashboard components.

### Theme Support

The application supports light and dark themes with consistent UI styling.

## Technology Stack

### Frontend

* React
* Vite
* JavaScript / JSX
* CSS

### Backend

* Node.js
* Express.js
* REST APIs

### Database

* MongoDB
* Mongoose

### Authentication

* JWT
* bcrypt

### AI

* Google Gemini API

### Email

* Brevo

### Notifications

* Browser Notifications API

### Development and Version Control

* Visual Studio Code
* Git
* GitHub
* Vercel

## How It Works

The React frontend communicates with the Express.js backend through REST APIs.

The backend handles authentication, task operations, AI requests, and email functionality. Mongoose is used to interact with MongoDB.

The application also communicates with Google Gemini for AI functionality and Brevo for password-reset email delivery.

## Project Structure

The project is divided into two main parts.

### Client

The client contains the React frontend, dashboard, task management, scheduling, AI features, responsive styling, and frontend API communication.

### Server

The server contains the Express backend, REST API routes, authentication logic, database models, task operations, AI integration, and email functionality.

## Environment Variables

The application uses environment variables for sensitive configuration, including:

* MongoDB connection string
* JWT secret
* Gemini API key
* Brevo email configuration
* Frontend URL

Sensitive credentials should be stored in local environment files and must not be committed to GitHub.

## Installation

### Clone the Repository

```bash
git clone https://github.com/Guptashrajal/smart-task-management.git
cd smart-task-management
```

### Install Frontend Dependencies

```bash
cd client
npm install
```

### Start the Frontend

```bash
npm run dev
```

### Install Backend Dependencies

Open a new terminal and run:

```bash
cd server
npm install
```

### Start the Backend

```bash
npm run dev
```

Make sure the required environment variables are configured before starting the application.

## Usage

1. Register or log in to your account.
2. Create a task from the dashboard.
3. Set the priority, category, due date, and reminder.
4. Search, filter, and sort tasks as required.
5. Mark tasks as completed when finished.
6. Check reminders and notifications for tasks requiring attention.
7. Use the AI Assistant to generate tasks from a goal.
8. Use the AI Summary to understand your current workload.

## Future Improvements

* Push notifications
* Recurring tasks
* Calendar integration
* Advanced AI recommendations
* Productivity analytics
* Dedicated mobile application
* Improved reminder management
* Offline task support
* Additional personalization

## Conclusion

AskTask combines task management, reminders, notifications, and AI assistance into a single productivity application. It helps users organize their work, prioritize important tasks, track deadlines, manage reminders, and convert larger goals into actionable tasks using AI.
