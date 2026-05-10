# Backend Update Log — May 2026

## Overview
This document summarizes the changes made to the backend to support correct subscription durations, seamless plan upgrades, and enhanced user profile management.

## Key Changes

### 1. Subscription Duration Adjustment
- **What used to happen**: Premium and Enterprise plans were hardcoded to a **365-day** duration.
- **What happens now**: Both plans are now set to a **30-day** duration in `paymentService.ts` to align with the monthly billing cycle displayed in the frontend.

### 2. Plan Upgrade Support
- **What used to happen**: The `createOrder` controller blocked any new payment order if the user had *any* active subscription.
- **What happens now**: The duplicate check in `paymentController.ts` is now smarter. It only blocks an order if the user is buying the **exact same plan**. It allows the creation of orders for different tiers (upgrades/downgrades).

### 3. Database Integrity & Correction
- **Action Taken**: Ran a migration script to update existing subscriptions in the database.
- **Impact**: Current users who had "364 days remaining" now correctly show "~30 days remaining" based on their original purchase date.

### 4. Admin & Security API Refinement
- Refined the `/api/v1/auth/change-password` endpoint handling to ensure consistent pathing.
- Improved the `getCurrentUser` mapping to provide all necessary subscription fields to the frontend.

## Files Modified
- `backend/src/utils/paymentService.ts` (Duration fix)
- `backend/src/controllers/payments/paymentController.ts` (Upgrade logic)
- `backend/src/utils/subscriptionService.ts` (Status calculation)
- `backend/src/models/interfaces.ts` (Type definitions)
