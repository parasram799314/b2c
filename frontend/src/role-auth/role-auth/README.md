# Role-Based Login — Integration Guide

Yeh folder bilkul alag hai. Tumhari original website ko touch karna hi nahi hai,
sirf 3 jagah kuch karna hai.

---

## Folder structure

```
role-auth/
└── src/
    ├── context/
    │   ├── AuthContext.jsx          ← dummy users + login/logout
    │   └── TripReviewContext.jsx    ← user → manager bridge
    ├── pages/
    │   ├── LoginPage.jsx            ← login screen
    │   └── ManagerPage.jsx          ← manager ka ek page
    ├── components/
    │   └── SendToManagerButton.jsx  ← user ke page pe trigger button
    └── App.jsx                      ← original App.jsx replace karega
```

---

## Step 1 — role-auth folder paste karo

Poora `role-auth` folder apne project ke `frontend/src/` ke andar rakh do.

```
frontend/src/
├── role-auth/        ← yahan paste karo
├── pages/            ← original (mat chhuo)
├── components/       ← original (mat chhuo)
├── App.jsx           ← original (agle step mein replace hoga)
└── index.js          ← original (mat chhuo)
```

---

## Step 2 — App.jsx replace karo

`frontend/src/App.jsx` ko **delete** karo aur `role-auth/src/App.jsx` ko
copy karke `frontend/src/App.jsx` ke naam se paste karo.

> Agar file ka path galat lage toh App.jsx ke top ke imports fix karo:
> ```js
> import { AuthProvider, useAuth }  from './role-auth/src/context/AuthContext';
> import { TripReviewProvider }     from './role-auth/src/context/TripReviewContext';
> import LoginPage                  from './role-auth/src/pages/LoginPage';
> import ManagerPage                from './role-auth/src/pages/ManagerPage';
> ```
> Yeh sab `frontend/src/` se relative hain — adjust mat karna padega normally.

---

## Step 3 — SendToManagerButton lagao (trigger)

Jahan bhi user ke page pe button lagana ho (DetailPage ya HomePage),
wahan import karke use karo:

```jsx
// Import
import SendToManagerButton from './role-auth/src/components/SendToManagerButton';

// Use karo — rfq prop mein current trip pass karo
<SendToManagerButton rfq={currentRfq} />
```

Button click hote hi manager ke dashboard pe woh trip appear ho jaayegi.

---

## Test karo

```bash
cd frontend
npm start
```

| Role    | Email                 | Password |
|---------|-----------------------|----------|
| User    | user@travel.com       | 1234     |
| User 2  | user2@travel.com      | 1234     |
| Manager | manager@travel.com    | 1234     |

### Flow:
1. `user@travel.com` se login → poori original website dikhegi
2. Kisi trip pe "Manager ko Bhejo" click karo
3. Logout → `manager@travel.com` se login → woh trip dashboard pe dikhegi
4. Manager Approve ya Reject kar sakta hai

---

## Naaya user ya role add karna

`role-auth/src/context/AuthContext.jsx` mein `DUMMY_USERS` array mein add karo:

```js
{ email: 'newuser@travel.com', password: 'pass', role: 'user', name: 'Koi Naam' }
```

Naaya role add karna ho toh `App.jsx` mein `AppInner` mein ek aur condition:
```jsx
if (user.role === 'admin') return <AdminPage />;
```

---

## Notes

- Koi real backend/API nahi — sab in-memory hai
- Page refresh karne pe session reset hoga (intentionally, baad mein localStorage mein save kar sakte ho)
- Production mein `AuthContext` ka `login()` function real API se replace karna
- `TripReviewContext` production mein DB polling/WebSocket se replace karna
