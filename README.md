# Worker Space - Admin Dashboard

A full-stack enterprise workforce management dashboard engineered with:
- **Frontend & Framework**: React 19 + TypeScript + Vite + Tailwind CSS + Lucide Icons
- **Backend**: Node.js + Express
- **Database**: MongoDB (via Mongoose schemas with automatic in-memory mock fallback)

---

## 📸 Overview & Features
Matches the design and workflow of the Admin Dashboard:
1. **Header & KPI Stats**:
   - Welcome banner and active status
   - Dynamic real-time KPI overview cards: **Departments** (4), **Teams** (12), **Members** (36), **Today's Tasks** (18), **Work Done Today** (14).
2. **Organization & Departments**:
   - Department selector: Engineering, Design, Marketing, Operations
   - Add, edit, and delete departments
3. **Teams & Members Management**:
   - Teams within department (e.g. Backend Team, Frontend Team, QA Team)
   - Add, edit, and delete teams
   - Interactive members table with avatars, roles (Team Lead, Developer, Tester, Designer), contact details, and assigned work
4. **Assign Work Workflow**:
   - Assign work form with dynamic team member dropdown, auto-filled contact info, role picker, priority, due date, and status
   - "Assigned Work Summary" feed tracking recent assignments, due dates, and statuses
5. **Work Management (Bottom Cards)**:
   - **Today's Tasks**: Interactive checklist with priority badges (High, Medium, Low) and task toggle capability
   - **Today's Work Done**: Completed accomplishments feed with green checkmarks and details

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v18+)
- (Optional) MongoDB local server or MongoDB Atlas URI. If MongoDB is not running, the application automatically uses an in-memory database seeded with default data.

### 2. Backend Setup
```bash
cd Backend
npm install
npm run dev
```
*Backend runs on `http://localhost:5000`*

### 3. Frontend Setup
```bash
cd Frontend
npm install
npm run dev
```
*Frontend runs on `http://localhost:3000`*

### 4. MongoDB Configuration
In `Backend/.env`:
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/worker_space
```
*To connect to MongoDB Atlas, replace `MONGODB_URI` with your connection string.*
