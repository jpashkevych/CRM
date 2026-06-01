# 📘 CRM-система для малого бізнесу

> Повнофункціональна CRM-система для управління клієнтами, товарами, замовленнями, документообігом та бухгалтерським обліком.

---

## 👤 Автор

- **ПІБ**: Пашкевич Юлія Русланівна
- **Група**: ФЕІ-45
- **Керівник**: доцент Павлик Михайло Романович
- **Репозиторій**: https://github.com/jpashkevych/CRM
- **Дата виконання**: 2026

---

## 📌 Загальна інформація

- **Тип проєкту**: Fullstack веб-застосунок
- **Мови програмування**: TypeScript
- **Frontend**: React 19 + TypeScript + Tailwind CSS + Vite
- **Backend**: Node.js + Express 5 + SQLite (better-sqlite3)
- **State Management**: Redux Toolkit
- **База даних**: SQLite (`data.db`)

---

## 🧠 Опис функціоналу

- 🏠 **Dashboard** — огляд ключових метрик, графіки продажів за 7 днів
- 👥 **Клієнти** — управління контактами: додавання, редагування, видалення, пошук
- 📦 **Товари** — каталог товарів із управлінням запасами та категоризацією
- 🛒 **Замовлення** — створення замовлень, додавання товарів, управління статусами
- 📄 **Документи** — генерація рахунків-фактур (Invoice), актів (Act) та платіжних документів (Payment)
- 📚 **Бухгалтерія** — журнал проводок, оборотно-сальдова відомість, картки рахунків
- 💳 **Касса/Банк** — журнал руху коштів із підтримкою кількох валют (UAH, USD, EUR, GBP, JPY)
- 🤖 **AI Асистент** — вбудований помічник

---

## 🧱 Структура проєкту

```
CRM/
├── crm-front/               # Frontend (React + TypeScript + Vite)
│   ├── src/
│   │   ├── components/      # Перевикористовувані компоненти
│   │   │   ├── AccountCard.tsx
│   │   │   ├── CustomerSelect.tsx
│   │   │   ├── DocumentSelect.tsx
│   │   │   ├── Layout.tsx
│   │   │   ├── OrderSelect.tsx
│   │   │   ├── Pagination.tsx
│   │   │   └── ProductsSelect.tsx
│   │   ├── pages/           # Сторінки застосунку
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Customers.tsx
│   │   │   ├── Products.tsx
│   │   │   ├── Orders.tsx
│   │   │   ├── Documents.tsx
│   │   │   ├── Accounting.tsx
│   │   │   ├── CashBank.tsx
│   │   │   └── Assistant.tsx
│   │   ├── store/           # Redux store та API-запити
│   │   │   └── api/
│   │   │       ├── customers.ts
│   │   │       ├── products.ts
│   │   │       ├── orders.ts
│   │   │       ├── documents.ts
│   │   │       ├── journal.ts
│   │   │       ├── cashBankJournal.ts
│   │   │       └── statistics.ts
│   │   ├── models/          # TypeScript-інтерфейси
│   │   ├── hooks/           # Кастомні хуки
│   │   └── App.tsx
│   └── package.json
│
└── crm-server/              # Backend (Node.js + Express + SQLite)
    ├── src/
    │   ├── config/
    │   │   └── database.ts  # Ініціалізація SQLite БД
    │   ├── routes/
    │   │   ├── customers.ts
    │   │   ├── products.ts
    │   │   ├── orders.ts
    │   │   ├── documents.ts
    │   │   ├── journalEntries.ts
    │   │   ├── cashBank.ts
    │   │   └── statistics.ts
    │   └── index.ts         # Точка входу сервера
    ├── data.db              # SQLite база даних
    └── package.json
```

---

## 📊 База даних

### CRM Модуль

| Таблиця        | Призначення              | Ключові поля                                          |
|----------------|--------------------------|-------------------------------------------------------|
| `customers`    | Управління клієнтами     | id, name, email, phone, address, notes, total_spent   |
| `products`     | Каталог товарів          | id, name, description, price, stock, category        |
| `orders`       | Замовлення клієнтів      | id, customer_id, total_amount, status, notes          |
| `order_items`  | Товари в замовленні      | id, order_id, product_id, quantity, price             |

### Документообіг

| Таблиця     | Призначення     | Ключові поля                                    |
|-------------|-----------------|--------------------------------------------------|
| `documents` | Видані документи | id, type (invoice/act/payment), number, date, status |

### Бухгалтерія

| Таблиця             | Призначення              | Ключові поля                                              |
|---------------------|--------------------------|-----------------------------------------------------------|
| `accounts`          | План рахунків            | id, code (30, 31, 36...), name, type                      |
| `journal_entries`   | Бухгалтерські проводки   | id, date, debit_account_id, credit_account_id, amount     |
| `cash_bank_journal` | Рух коштів касса/банк    | id, transaction_type, counterparty, amount, currency      |

**План рахунків:**
`30` — Каса, `31` — Рахунки в банках, `36` — Розрахунки з покупцями, `28` — Товари, `63` — Розрахунки з постачальниками, `70` — Дохід від реалізації, `90` — Собівартість реалізації, `92` — Адміністративні витрати, `93` — Витрати на збут

---

## 🔌 REST API

Сервер запускається на `http://localhost:8080`

| Ресурс            | Базовий маршрут        |
|-------------------|------------------------|
| Клієнти           | `/customers`           |
| Товари            | `/products`            |
| Замовлення        | `/orders`              |
| Документи         | `/documents`           |
| Проводки          | `/journalEntries`      |
| Касса/Банк        | `/cashBank`            |
| Статистика        | `/statistics`          |

### Приклад: Клієнти

**GET /customers** — отримати список клієнтів

**POST /customers** — створити клієнта
```json
{
  "name": "ТОВ Назва компанії",
  "email": "contact@company.ua",
  "phone": "+380501234567",
  "address": "м. Рівне, вул. Соборна, 1",
  "notes": "Постійний клієнт"
}
```

**PUT /customers/:id** — оновити клієнта

**DELETE /customers/:id** — видалити клієнта

---

## ▶️ Як запустити проєкт "з нуля"

### 1. Вимоги

- [Node.js](https://nodejs.org/) v18+ та npm
- Git

### 2. Клонування репозиторію

```bash
git clone https://github.com/jpashkevych/CRM.git
cd CRM
```

### 3. Налаштування та запуск Backend

```bash
cd crm-server
npm install
```

Створіть файл `.env` у папці `crm-server/`:
```
PORT=8080
```

Запуск сервера:
```bash
npm start
```

> Сервер буде доступний за адресою: **http://localhost:8080**

### 4. Налаштування та запуск Frontend

```bash
cd crm-front
npm install
npm run dev
```

> Застосунок буде доступний за адресою: **http://localhost:5173**

### 5. Збірка для продакшн

```bash
cd crm-front
npm run build
```

---

## 🖱️ Інструкція для користувача

### Основний сценарій: Нове замовлення

1. Перейдіть у розділ **Клієнти** → додайте клієнта
2. Перейдіть у розділ **Товари** → переконайтесь, що є товари на складі
3. Відкрийте **Замовлення** → натисніть «Нове замовлення»
4. Оберіть клієнта, додайте товари та вкажіть кількість
5. Збережіть замовлення
6. Перейдіть у **Документи** → створіть Invoice на основі замовлення
7. Видайте документ — він з'явиться на **Dashboard**

### Бухгалтерська проводка

1. Перейдіть у **Бухгалтерія** → «Новий запис»
2. Вкажіть дебет-рахунок (Дт) і кредит-рахунок (Кт)
3. Введіть суму та опис → збережіть
4. Перегляньте оновлену оборотно-сальдову відомість

---

## 📷 Скріншоти

| Dashboard | Клієнти | Замовлення |
|-----------|---------|------------|
| ![Dashboard](images/Dashboard.png) | ![Customers](images/Customers.png) | ![Orders](images/Orders.png) |

| Товари | Документи | Бухгалтерія |
|--------|-----------|-------------|
| ![Products](images/Products.png) | ![Documents](images/Documents.png) | ![Accounting](images/Accounting.png) |

| Касса/Банк | AI Асистент |
|------------|-------------|
| ![CashBank](images/CashBank.png) | ![Assistant](images/Assistant.png) |

---

## 🧪 Типові проблеми та рішення

| Проблема | Рішення |
|----------|---------|
| `Cannot connect to server` | Переконайтесь, що backend запущено на порті 8080 |
| CORS помилка | CORS вже налаштовано в `index.ts`; перевірте, чи співпадає URL у frontend |
| База даних не ініціалізується | Перевірте наявність файлу `data.db` у папці `crm-server/` |
| Порт вже зайнятий | Змініть `PORT` у файлі `.env` |
| `npm install` падає | Перевірте версію Node.js (мінімум v18) |

---

## 🧾 Використані технології та джерела

- [React](https://react.dev/) — офіційна документація
- [TypeScript](https://www.typescriptlang.org/docs/) — офіційна документація
- [Vite](https://vitejs.dev/) — документація збірника
- [Tailwind CSS](https://tailwindcss.com/docs) — документація
- [Redux Toolkit](https://redux-toolkit.js.org/) — документація
- [Express.js](https://expressjs.com/) — офіційна документація
- [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) — документація
- [Lucide React](https://lucide.dev/) — бібліотека іконок
