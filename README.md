## WorldWise

**WorldWise** is an interactive travel destinations web app. This project expands on the original by integrating real-world APIs and modern state-management tools to enhance functionality and developer experience.

### 🚀 What’s Improved

* **Map Integration**
  Replaced the original map solution with **Gaode (Amap) Map API** for more accurate and native support in China and Asia-Pacific regions.

* **Mock Backend with Strapi**
  A local headless CMS server is included under the `/server` directory using **Strapi**, providing structured endpoints for destinations, users, and related content.

* **Enhanced Auth with RTK Query**
  The authentication system (registration & login) is completely rebuilt using **Redux Toolkit Query (RTKQ)** for reliable async state handling, caching, and server synchronization.


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


## Tech Stack

**WorldWise** leverages modern frontend and backend technologies to deliver a smooth and interactive user experience:

* **Frontend:**

  * **React** – UI library for building component-based interfaces
  * **Redux Toolkit & RTK Query** – State management and async data fetching
  * **React Router** – Routing between pages
  * **Axios / Fetch** – HTTP requests

* **Backend / Mock Server:**

  * **Strapi** – Headless CMS to simulate API endpoints for destinations, users, and content
  * **Node.js & Express** – Underlying server framework (via Strapi)

* **Styling & UI:**

  * **CSS / SCSS** – Styling components





