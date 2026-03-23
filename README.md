# 🌍 Travel RFQ — AI Itinerary Planner (MERN + Groq)

A full-stack MERN application where users fill an RFQ form and get an **AI-generated travel itinerary** powered by Groq (LLaMA 3 70B). The form shifts to the left panel and the itinerary appears on the right — editable and regeneratable.

---

## 🗂 Project Structure

```
rfq-app/
├── backend/
│   ├── models/RFQ.js          # Mongoose schema
│   ├── routes/rfq.js          # Express API routes
│   ├── services/groqService.js # Groq LLM integration
│   ├── server.js              # Express entry point
│   ├── .env.example           # Env variables template
│   └── package.json
└── frontend/
    ├── public/index.html
    ├── src/
    │   ├── components/
    │   │   ├── RFQForm.jsx       # Main form (same UI as screenshots)
    │   │   ├── ItineraryPanel.jsx # AI itinerary display + edit
    │   │   └── Stepper.jsx       # +/- number stepper
    │   ├── App.jsx               # Layout logic (full → split)
    │   ├── index.js
    │   └── index.css             # All styles (gold/yellow theme)
    └── package.json
```

---

## ⚙️ Setup & Installation

### 1. Clone / place files, then install dependencies

**Backend:**
```bash
cd rfq-app/backend
npm install
```

**Frontend:**
```bash
cd rfq-app/frontend
npm install
```

---

### 2. Configure environment variables

```bash
# In rfq-app/backend/
cp .env.example .env
```

Edit `.env`:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/rfq_db
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxx   ← your Groq key here
```

> Get your free Groq API key at: https://console.groq.com

---

### 3. Start MongoDB
Make sure MongoDB is running locally:
```bash
mongod
# or if using brew service:
brew services start mongodb-community
```

---

### 4. Run Backend
```bash
cd rfq-app/backend
npm run dev       # uses nodemon for auto-reload
# or
npm start
```
Server starts at: **http://localhost:5000**

---

### 5. Run Frontend
```bash
cd rfq-app/frontend
npm start
```
App opens at: **http://localhost:3000**

The frontend proxies `/api/*` calls to `http://localhost:5000` automatically.

---

## 🧠 How AI Works

The Groq service sends destination details, hotel preferences, and guest info to **LLaMA 3 70B** with a structured prompt that asks the model to:

1. **Identify travel type** (leisure, family, adventure, business, honeymoon, etc.)
2. **Recommend transport mode** (flight, train, car, cruise) considering 9 AM reachability
3. **Generate day-by-day itinerary** per destination
4. **Include dining, tips, and cost estimates**

---

## 🔌 API Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/rfqs` | Create RFQ + generate AI itinerary |
| GET | `/api/rfqs` | List all RFQs |
| GET | `/api/rfqs/:id` | Get single RFQ |
| PUT | `/api/rfqs/:id` | Update RFQ (edit itinerary) |
| POST | `/api/rfqs/:id/regenerate` | Regenerate AI itinerary |
| DELETE | `/api/rfqs/:id` | Delete RFQ |

---

## 🎨 UI Features

- ✅ **Exact UI match** — gold/yellow buttons, steppers, radio toggles as in screenshots
- ✅ **Multiple destinations** — add/remove with `+Add Destination`
- ✅ **Hotels YES** — rooms grid (1–10 rooms), adults/children per room, star rating multi-select
- ✅ **Hotels NO** — simple adults/children count
- ✅ **Guest Country** field
- ✅ **Split layout** — form slides to left panel, itinerary on right after submit
- ✅ **Editable itinerary** — click Edit to modify generated text
- ✅ **Regenerate** — re-run AI on same RFQ data

---

## 📦 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, CSS custom properties |
| Backend | Node.js, Express |
| Database | MongoDB + Mongoose |
| AI | Groq API (LLaMA 3 70B) |
| Markdown | react-markdown (itinerary rendering) |
