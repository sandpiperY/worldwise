## 🌍 WorldWise

**WorldWise** is a travel destinations web application built with a **frontend–backend decoupled architecture**. It allows users to explore, mark, and manage travel locations on an interactive map, while integrating real-world APIs and modern state management solutions to deliver a smooth and scalable user experience.


## 🚀 Key Features

### 🗺️ Map Integration
- Integrated **Gaode (Amap) Map API** for accurate and region-optimized map rendering  
- Users can interact with the map to:
  - View destinations visually  
  - Add and manage markers  
  - Explore detailed location information  

### 🔐 Authentication System
- Rebuilt authentication flow using **Redux Toolkit Query (RTK Query)**  
- Supports:
  - User registration and login  
  - Persistent authentication state  
  - Automatic request caching and synchronization  

### 📍 Destination Management
- Create, view, and manage travel destinations  
- Structured data powered by a **Strapi-based headless CMS**  
- Seamless frontend-backend data interaction  

### 🧠 State Management Optimization
- Centralized global state using **Redux Toolkit**  
- Efficient async handling via **RTK Query**:
  - Request deduplication  
  - Cache management  
  - Improved performance across pages  

### ⚙️ Local Backend with Strapi
- Local backend server located in `/server` directory  
- Built with **Strapi** to provide:
  - RESTful APIs  
  - Content modeling for destinations and users  
  - Rapid development and testing support  


## 🏗️ Architecture Highlights

- **Frontend–Backend Decoupling** for scalability and maintainability  
- **Component-based UI design** using React for high reusability  
- **Centralized state & API layer** with Redux Toolkit + RTK Query  
- **Consistent data flow** with built-in caching and synchronization  
- **Modular project structure** supporting future expansion  


## Page Previews

### Home Page

The Home Page serves as the entry point of the app, providing user login and navigation to other pages.
<img width="1920" height="989" alt="屏幕截图 2026-02-21 213114" src="https://github.com/user-attachments/assets/f3bcfb62-8034-422b-9d6f-c4e15e7c4c41" />

### Map Page

Shows detailed information for each destination with integrated **Gaode Map** view.
<img width="1907" height="985" alt="屏幕截图 2026-02-21 213202" src="https://github.com/user-attachments/assets/a9323562-b669-4b80-ac21-9806af3ec6af" />

### Registration & Login

User registration and login powered by **RTK Query** for smooth asynchronous handling.
<img width="1920" height="998" alt="image" src="https://github.com/user-attachments/assets/050f9af4-7f43-4a8f-adc7-59eea369c187" />

### About

provides an overview of the WorldWise project
<img width="1920" height="1001" alt="屏幕截图 2026-02-21 213233" src="https://github.com/user-attachments/assets/5499188a-fa73-4bb4-bdfa-faa970221321" />


## 🛠️ Tech Stack

**WorldWise** leverages modern frontend and backend technologies to deliver a smooth and interactive experience:

### Frontend
- **React** – Component-based UI development  
- **Redux Toolkit & RTK Query** – Global state management and async data fetching  
- **React Router** – Client-side routing  
- **Axios / Fetch** – HTTP request handling  

### Backend / Mock Server
- **Strapi** – Headless CMS for structured APIs and content management  
- **Node.js & Express** – Backend runtime (via Strapi)  

### Styling & UI
- **CSS / SCSS** – Component styling and layout  


## 📦 Getting Started

### 1. Install dependencies
```bash
npm install
```
### 2. Run frontend
```bash
npm run dev
```
3. Run backend (Strapi)
```bash
cd server
npm install
npm run develop
```
## 🌟 Future Improvements
Deploy backend to cloud services (e.g., AWS / ECS)



