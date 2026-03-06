# Project Milestones: Personal Finance SaaS

This document tracks the evolution of the application from a personal tool to a production-grade SaaS. All features are built on a multi-tenant architecture using DynamoDB User IDs for session isolation.

## 🏁 Phase 1: Core Financial Engine (Completed)

_Goal: Establish the basic CRUD operations and data persistence._

- [x] **Multi-tenant Data Schema**: DynamoDB structure using `user_id` as Partition Key for all records.
- [x] **Expense Management**: Full CRUD for tracking daily expenses.
- [x] **Income Tracking**: Full CRUD for managing multiple income sources.
- [x] **Basic Dashboard**: Real-time balance calculation (Total, Monthly).

## 📊 Phase 2: Visual Insights & Analytics (Current)

_Goal: Provide data-driven clarity to the user._

- [x] **Historical Balance Charts**: Visual representation of financial growth over time.
- [x] **Monthly Snapshots**: Breakdown of spending vs. income within a 30-day window.
- [x] **Category Heatmap**: Advanced visualization to identify top spending and earning categories.
- [x] **Income Projection**: Algorithm-based forecasting of future liquidity.

## 🛠️ Phase 3: Budgeting & Financial Health (Next)

_Goal: Shift from passive tracking to active financial planning._

- [ ] **Budget Constraints**: Ability to set monthly limits per category.
- [ ] **Smart Alerts**: Notifications when spending exceeds 80% of a defined budget.
- [ ] **Savings Goals**: Tracking progress toward specific financial targets.

## 🤖 Phase 4: AI & Omnichannel Integration (Future)

_Goal: Reduce friction in data entry and provide proactive insights._

- [ ] **WhatsApp Integration**: Record expenses via text/audio messages (Twilio/Meta API).
- [ ] **AI Financial Advisor**: Natural language interface to request reports (e.g., "How much did I spend on coffee this week?").
- [ ] **Automated Categorization**: Using LLMs to categorize raw transaction text from WhatsApp.

---

**Status Note:** The project is currently transitioning from **Phase 2** to **Phase 3**. The core financial engine is stable, and the focus is now on enhancing the user experience with actionable insights and planning tools.
