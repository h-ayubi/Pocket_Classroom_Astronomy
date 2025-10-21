# 🌌 Pocket Classroom — Offline Learning App

**Pocket Classroom** is a lightweight **offline learning web app** designed as a **galaxy-themed experience**  for **astronomy-related classes and learners**.  
It lets you **create, edit, and study learning capsules** (mini lessons) — all fully stored in your browser.  
No internet or backend required.

---

##  Features

- **Library View:**  
  See all learning capsules in a responsive grid with options to *Learn*, *Edit*, *Export*, or *Delete*.

- **Author View:**  
  Create or edit your own capsules — add notes, flashcards, and quizzes in one place.

- **Learn View:**  
  Study mode with flashcards and quizzes that track your progress.

- **Offline Support:**  
  Everything is saved locally using `LocalStorage` — works 100% offline.

- **Import & Export:**  
  Share your capsules as `.json` files and re-import them easily.

---

## Galaxy Design Theme

Pocket Classroom’s design features a **galactic / cosmic style** with deep-space colors and astronomy-inspired elements,  
created specifically for **astronomy classes** and science-based learning environments.

---

## Structure

📁 project-root/
│
├── index.html
├── css/
│ └── styles.css
├── js/
│ ├── main.js
│ ├── storage.js
│ ├── library.js
│ ├── author.js
│ └── learn.js
└── README.md


---

##  How It Works

1. **index.html** loads all JS modules.  
2. `main.js` manages navigation and global events.  
3. `storage.js` handles capsule saving via LocalStorage.  
4. Each view (`library`, `author`, `learn`) is modular and independent.

---

##  Code Overview

###  `index.html`
- The **entry point** of the app.  
- Contains the layout and structure of the entire interface.  
- Loads all JavaScript modules and connects the HTML sections (Library, Author, Learn).  
- Uses Bootstrap for responsive design and `styles.css` for the galaxy visuals.

---

###  `css/styles.css`
- Defines the **visual design and galaxy theme** — background gradients, floating stars, and color schemes.  
- Styles all buttons, cards, and progress bars consistently.  
- Includes responsive design adjustments for mobile and desktop.  
- Handles hover effects, shadows, and smooth transitions for a cosmic look.

---

###  `js/main.js`
- Central **controller and event hub** for the whole app.  
- Manages navigation between “Library”, “Author”, and “Learn” views.  
- Listens for and dispatches custom events (`pc:openLearn`, `pc:openAuthor`, etc.).  
- Initializes the app state on load and triggers rendering of each section.

---

###  `js/storage.js`
- Handles **data persistence** using `LocalStorage`.  
- Stores, loads, and deletes capsules safely in the browser.  
- Provides helper functions:
  - `saveCap(id, data)` — save or update a capsule  
  - `loadCap(id)` — load a capsule by ID  
  - `loadIndex()` — list all saved capsules  
  - `deleteCap(id)` — remove one  
  - `exportCapJSON(id)` — export capsule as JSON

---

###  `js/library.js`
- Manages the **Library view** — the main dashboard showing all saved capsules.  
- Renders each capsule as a Bootstrap card with progress and actions.  
- Handles button actions via delegated click events:
  - `Learn` → open learning mode  
  - `Edit` → open author mode  
  - `Export` → save capsule to JSON  
  - `Delete` → remove capsule  
- Escapes user input to prevent HTML injection.  
- Updates the grid dynamically after edits or deletions.

---

###  `js/author.js`
- Handles the **Author view**, where users can create or edit capsules.  
- Provides form controls for title, subject, content, and quiz items.  
- Validates user input and saves data through `storage.js`.  
- Fires events to re-render the Library view after saving.

---

###  `js/learn.js`
- Manages the **Learn view** — the interactive study and quiz mode.  
- Loads selected capsule data and displays flashcards or quiz questions.  
- Tracks correct/incorrect answers and updates progress dynamically.  
- Updates the capsule’s “best score” and “known count” in storage.  
- Offers a clean, minimal UI to stay focused while learning.

---

📎 Demo, Live Link & Sample Data

 Video demo:
- (https://youtu.be/hQ4_d3c0e6Q)

 Live demo link:
- (https://h-ayubi.github.io/Pocket_Classroom_Astronomy/)

📄 Sample exported JSON:
- [Download sample JSON](assets/sample-astronomy-cap.json)



Developed for offline learning — private, portable, and cosmic. 🚀




