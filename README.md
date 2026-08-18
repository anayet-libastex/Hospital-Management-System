# 🏥 Hospital Management System

A comprehensive **web-based Hospital Management System** designed to streamline hospital operations, manage patient records, assign doctors, and handle laboratory reports efficiently.

The system provides separate dashboards and functionalities for different user roles, including:

* 👨‍💼 Admin
* 👨‍⚕️ Doctor
* 🧑‍🤝‍🧑 Patient
* 🧪 Lab Staff

---

## 📋 Table of Contents

* [Features](#-features)
* [Technologies Used](#-technologies-used)
* [Prerequisites](#-prerequisites)
* [Installation & Setup](#-installation--setup)
* [Environment Variables](#-environment-variables)
* [Running the Application](#-running-the-application)
* [Default Login Credentials](#-default-login-credentials)
* [Sample Data for UI Testing](#-sample-data-for-ui-testing)
* [Project Structure](#-project-structure)
* [Notes](#-notes)

---

## ✨ Features

### 👨‍💼 Admin

* Manage doctors and patients
* Manage hospital users
* Manage laboratory staff
* Monitor hospital activities
* Manage appointments and records

### 👨‍⚕️ Doctor

* View assigned patients
* Manage patient information
* Review laboratory reports
* Add medical notes and prescriptions
* Monitor patient history

### 🧑‍🤝‍🧑 Patient

* View personal information
* View assigned doctor
* View appointments
* View laboratory reports
* Access medical information

### 🧪 Lab Staff

* View assigned laboratory requests
* View requested tests
* Process laboratory tests
* Submit test results
* Update laboratory report status

---

## 🛠️ Technologies Used

### Frontend

* HTML5
* CSS3
* JavaScript
* Live Server

### Backend

* Node.js
* Express.js
* REST API

### Database

* MongoDB
* MongoDB Atlas

### Authentication

* JWT (JSON Web Token)
* Role-based authentication

---

## 🔧 Prerequisites

Before running the project, make sure the following software is installed on your system:

* **Node.js** — v14 or higher
* **MongoDB** — Local MongoDB instance or MongoDB Atlas
* **Git** — For cloning the repository
* **VS Code** — Recommended code editor
* **Live Server Extension** — Required for running the frontend

---

## 🚀 Installation & Setup

### 1. Clone the Repository

Open your terminal and run:

```bash
git clone https://github.com/anayet-libastex/Hospital-Management-System.git
```

Alternatively, you can download the repository as a ZIP file and extract it.

### 📁 Project Location

Make sure the extracted project is placed in a convenient directory, for example:

```text
C:/Desktop/Hospital-Management-System
```

---

### 2. Navigate to the Backend Folder

Open the project folder in VS Code and open the terminal.

Run:

```bash
cd Hospital-Management-System
cd backend
```

---

### 3. Install Backend Dependencies

Run:

```bash
npm install
```

This will install all required Node.js dependencies.

---

## 🔐 Environment Variables

Create a `.env` file inside the `backend` folder.

The structure should look like:

```env
PORT=5000
MONGO_URI=YOUR_DATABASE_URI
JWT_SECRET=YOUR_SECRET_KEY
```

### Environment Variables Description

| Variable     | Description                            | Example                                 |
| ------------ | -------------------------------------- | --------------------------------------- |
| `PORT`       | Port used by the backend server        | `5000`                                  |
| `MONGO_URI`  | MongoDB connection string              | `mongodb://localhost:27017/hospital_db` |
| `JWT_SECRET` | Secret key used for JWT authentication | `your_strong_secret_key`                |

> ⚠️ **Important:** Never upload your `.env` file or real database credentials to GitHub.

---

## 🖥️ Running the Application

The project contains two parts:

1. Backend Server
2. Frontend Application

Both need to be running for the complete application to work properly.

---

### Step 1: Start the Backend Server

Open a terminal inside the `backend` folder:

```bash
node server.js
```

Or, if a start script is configured in `package.json`:

```bash
npm start
```

The backend should start on:

```text
http://localhost:5000
```

---

### Step 2: Start the Frontend

Open the project root folder in VS Code.

Locate:

```text
index.html
```

Right-click on `index.html` and select:

**Open with Live Server**

The frontend will usually open at:

```text
http://127.0.0.1:5500
```

> ⚠️ **Note:** Make sure the backend server is running before testing features that communicate with the API.

---

## 🔑 Default Login Credentials

The system comes with pre-seeded accounts for testing.

| Role             | Email Address      | Password  |
| ---------------- | ------------------ | --------- |
| 👨‍💼 Admin      | `anayet@gmail.com` | `jara123` |
| 👨‍⚕️ Doctor     | `peash@gmail.com`  | `000000`  |
| 🧑‍🤝‍🧑 Patient | `mahit@gmail.com`  | `000000`  |
| 🧪 Lab Staff     | `rajib@gmail.com`  | `000000`  |

> 🔐 **Security Note:** These credentials are intended for development/testing purposes only. Change them before deploying the application to a production environment.

---

# 🧪 Sample Data for UI Testing

The following dummy data can be used to manually test the **Lab Staff Dashboard**, especially the **Assigned Tests** page and **Submit Results** modal.

---

## 1. Lab Request Dummy Data

Login using the **Lab Staff** account:

```text
Email: rajib@gmail.com
Password: 000000
```

Navigate to the **Assigned Tests** page.

Use the following values if the corresponding fields appear empty:

| UI Field | Dummy Value                                   |
| -------- | --------------------------------------------- |
| Patient  | `Mahit`                                       |
| Doctor   | `Dr. Peash Ahmed`                             |
| Test(s)  | `CBC, Screatine (Creatinine)`                 |
| Status   | `Assigned`                                    |
| Notes    | `Must doing this test and show report to me.` |

---

## 2. Submit Results Dummy Data

When you click **Submit Results** for a specific patient, input the following values into the corresponding test fields.

### 🩸 CBC

Copy and paste:

```text
Hb: 14.2 g/dL, WBC: 7,500 /µL, RBC: 4.8 M/µL, Platelets: 2.8 Lakh/µL, Neutrophil: 62%, Lymphocyte: 30%
```

### 🧪 Creatinine

For the **Screatine / Creatinine** test, use:

```text
1.2 mg/dL (Normal range)
```

To simulate an abnormal result, you can alternatively use:

```text
2.5 mg/dL
```

---

## 📁 Project Structure

A simplified project structure may look like:

```text
Hospital-Management-System/
│
├── backend/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── .env
│   ├── package.json
│   └── server.js
│
├── assets/
│
├── css/
│
├── js/
│
├── index.html
│
└── README.md
```

> The exact folder structure may vary depending on the current project implementation.

---

## 🧪 Testing Workflow

For a quick end-to-end test of the laboratory feature:

```text
1. Start MongoDB
        ↓
2. Start Backend Server
        ↓
3. Start Frontend using Live Server
        ↓
4. Login as Lab Staff
        ↓
5. Open Assigned Tests
        ↓
6. Select a patient
        ↓
7. Click "Submit Results"
        ↓
8. Enter CBC / Creatinine results
        ↓
9. Submit the report
        ↓
10. Login as Doctor / Patient
        ↓
11. Verify the laboratory report
```

---

## ⚠️ Important Notes

* Make sure MongoDB is running before starting the backend.
* Make sure the `.env` file is correctly configured.
* Make sure the backend API is running before using the frontend.
* Do not commit `.env` files to GitHub.
* The provided login credentials are for testing purposes.
* The sample laboratory data is dummy data and should not be treated as real medical information.
* For production deployment, use strong passwords and secure JWT secrets.

---

## 👨‍💻 Developer

**Anayet Miah**

GitHub:
`https://github.com/anayet-libastex`

---

## 📄 License

This project is intended for educational and development purposes.
