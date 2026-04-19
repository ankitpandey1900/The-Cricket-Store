# 🏏 Khelo Ji — Premium Cricket Store
### Modern UI Design for Sports & Cricket Equipment
## 🌐 Live URL: [kheloji.netlify.app](https://kheloji.netlify.app/)

A fully functional, professional e-commerce platform designed for high-end cricket equipment. Built specifically for collegiate presentations, it features a comprehensive buyer and seller experience with zero backend configuration required.

---

## 🚀 Quick Start
To run the project, simply open **`index.html`** in any modern web browser.

> [!NOTE]
> This project uses **`localStorage`** to simulate a real database. All products you add, orders you place, and users you register will persist locally in your browser.

## 👥 Presentation Demo Accounts
Use these pre-configured accounts on the **Login Page** to quickly showcase the dual-role functionality:

| Role | Email | Password |
|---|---|---|
| **Buyer** | `buyer@kheloji.com` | `buyer123` |
| **Seller** | `seller@kheloji.com` | `seller123` |

## ✨ Key Features
- **Dynamic Storefront**: Products loaded dynamically from the internal DB with real-time search, category filtering, and "SALE" logic.
- **Professional Product Model**: Support for Brands, Technical Specs, Star Ratings, and Review Counts.
- **WhatsApp Logistics**: Captured phone numbers for automated order tracking and logisitics updates.
- **Unified Auth**: Secure login/register system for both buyers and sellers.
- **Seller Dashboard**: Full management suite for inventory, sales stats, and incoming orders.
- **Mock Payment Gateway**: Realistic Razorpay integration flow for a complete demo experience.

## 📂 Professional Project Structure
- `index.html`: Main marketplace UI (Marketplace Entry).
- `pages/`: Dedicated folder for sub-pages.
    - `login.html`: Entry point for all users.
    - `seller.html`: Private dashboard for product management.
    - `orders.html`: Buyer account and purchase history.
- `assets/`:
    - `js/core/`: The "Database" and utility layer (DB/Utils).
    - `js/components/`: Modular UI logic (Cart/UI).
    - `js/pages/`: Page-specific orchestration (Main/Auth/Seller).
    - `css/`: Organized into base, layout, and component-level stylesheets.

---
*Developed by Gemini & Antigravity for College Excellence.*
