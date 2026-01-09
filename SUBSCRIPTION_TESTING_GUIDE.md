# Subscription Plans Testing Guide

## Overview

This document provides a comprehensive testing checklist for the GadgetCloud subscription plans implementation. Use this guide to verify all features are working correctly before deploying to production.

**Testing Environment:**
- **Local Backend**: http://localhost:8000
- **Local Frontend**: http://localhost:4201
- **Test Credentials**:
  - Customer: `customer1@gadgetcloud.io` / `customer1@gadgetcloud.io`
  - Admin: (create via backend scripts or use existing admin account)

---

## Pre-Testing Setup

### 1. Verify Services are Running

```bash
# From project root
cd /Users/ganesh/projects/gc-sprint-03

# Check health
bash scripts/health-check.sh

# Expected output:
# ✅ Backend is running on port 8000
# ✅ Frontend is running on port 4200 or 4201
```

### 2. Verify Database Has Plans

```bash
# Check if subscription plans exist
cd gc-py-backend
source venv/bin/activate
python scripts/check_firestore.py --collection gc-subscription-plans

# If empty, seed plans:
python scripts/seed_subscription_plans.py

# Verify users have subscriptions:
python scripts/check_firestore.py --collection gc-users | grep subscriptionPlanId

# If users missing subscriptions, migrate them:
python scripts/migrate_users_to_standard_plan.py
```

---

## Phase 8 Testing Checklist

### ✅ Build Verification

- [x] TypeScript compilation successful
- [x] No build errors
- [x] Bundle size warnings acceptable
- [x] All components properly imported
- [x] Design system components integrated

**Status**: COMPLETED - Build succeeds with only minor warnings

---

### 🎯 User Flow Testing

#### Test 1: View Available Plans (Public)

**Steps:**
1. Navigate to http://localhost:4201
2. Click "Pricing" in navigation
3. Verify 3 plans are displayed:
   - Standard Plan (₹0/month)
   - Family Plan (₹999/month)
   - Premium Plan (₹2999/month)
4. Verify each plan shows:
   - Display name
   - Price and billing period
   - Description
   - Feature comparison table (12 features)
   - CTA button

**Expected Result:** All plans fetched from backend API and displayed correctly

**Test Data:**
- API Endpoint: `GET /api/billing/plans`
- Expected Response: Array of 3 SubscriptionPlan objects

---

#### Test 2: View Current Subscription (Authenticated)

**Steps:**
1. Login as customer: `customer1@gadgetcloud.io`
2. Navigate to Profile page
3. Click "Subscription" tab
4. Verify displays:
   - Current plan name (should be "Standard Plan")
   - Plan status badge (Active)
   - Feature limits (5 devices, 100 MB storage)
   - Current usage (X/5 devices, Y/100 MB storage)
   - Progress bars for usage
   - "Upgrade Plan" button

**Expected Result:** Subscription details loaded from backend with merged plan + overrides

**Test Data:**
- API Endpoint: `GET /api/billing/my-subscription`
- Expected Response: UserSubscription object with effectiveLimits

---

#### Test 3: Upgrade Plan (Mock Payment)

**Steps:**
1. From Profile > Subscription tab, click "Upgrade Plan"
2. Plan comparison modal opens showing all 3 plans
3. Current plan (Standard) highlighted with border + "Current Plan" badge
4. Click "Select Plan" on Family plan
5. Confirmation alert appears: "Upgrade to Family Plan?"
6. Click "Confirm"
7. Loading spinner appears
8. Success message: "Plan upgraded successfully"
9. Modal closes
10. Page refreshes - new plan displayed (Family Plan)

**Expected Result:** Plan changed in database, user sees new limits

**Test Data:**
- API Endpoint: `POST /api/billing/upgrade`
- Request Body: `{ planId: "PLN_00002", paymentMethod: "mock" }`
- Expected Response: Updated subscription object

**Edge Cases:**
- Try upgrading to same plan (should show error or disable button)
- Cancel during upgrade (modal closes, no changes)

---

#### Test 4: Device Limit Enforcement

**Steps:**
1. Login as customer with Standard plan (5 device limit)
2. Navigate to "My Gadgets" page
3. Click "Add Gadget" 5 times, filling out form each time
4. All 5 devices created successfully
5. Try to add 6th device
6. Error appears: "Device limit exceeded. Upgrade to add more."
7. Verify "Upgrade Plan" button/link appears in error message

**Expected Result:** 6th device creation blocked by backend with 403 status

**Test Data:**
- API Endpoint: `POST /api/items` (6th attempt)
- Expected Response: 403 Forbidden with `{ error, message, upgradeRequired: true }`

**Verify Backend Enforcement:**
```bash
# Check backend logs for limit check
tail -f /tmp/gc-backend.log | grep "Device limit"

# Expected: "Device limit check: current=5, limit=5, allowed=false"
```

---

#### Test 5: Storage Limit Enforcement

**Steps:**
1. Login as customer with Standard plan (100 MB storage limit)
2. Navigate to a device detail page
3. Click "Upload Document" in Documents tab
4. Try uploading a file that would exceed 100 MB total
5. Error appears: "Storage limit exceeded. Upgrade for more space."
6. Verify upload blocked before file is sent to backend

**Expected Result:** Upload blocked by backend with 403 status

**Test Data:**
- API Endpoint: `POST /api/documents/upload`
- Expected Response: 403 Forbidden with storage limit details

**Note:** Testing storage limits requires calculating current usage. Check current usage first:
```bash
# Query user's documents and sum filesizes
python scripts/check_firestore.py --collection gc-documents --filter userId==customer_id
```

---

### 👨‍💼 Admin Flow Testing

#### Test 6: View All Plans (Admin)

**Steps:**
1. Login as admin user
2. Navigate to `/admin/plans`
3. Verify table shows all plans (including archived)
4. Verify columns:
   - Plan Name
   - Price
   - Device Limit
   - Storage Limit
   - Status (Active/Archived badge)
   - Actions (Edit, Archive buttons)

**Expected Result:** All plans loaded from API with correct data

**Test Data:**
- API Endpoint: `GET /api/admin/plans?include_archived=true`
- Expected Response: Array of all plans

---

#### Test 7: Create New Plan (Admin)

**Steps:**
1. From Admin Plans page, click "Create New Plan"
2. Form dialog opens
3. Fill out form:
   - Plan Name: Premium
   - Display Name: Premium Plan
   - Description: Enterprise-grade protection
   - Price: 2999
   - Currency: INR
   - Billing Period: monthly
   - Max Devices: 20
   - Max Storage: 1 GB (1073741824 bytes)
   - Enable all premium features (checkboxes)
   - Display Order: 3
   - Is Visible: checked
   - Is Default: unchecked
4. Click "Create Plan"
5. Loading spinner appears
6. Success message: "Plan created successfully"
7. Dialog closes
8. New plan appears in table

**Expected Result:** Plan created in database with sequential ID (PLN_00004)

**Test Data:**
- API Endpoint: `POST /api/admin/plans`
- Request Body: CreatePlanRequest object
- Expected Response: SubscriptionPlan object with generated ID

**Validation Tests:**
- Try submitting with empty Display Name (should show error)
- Try submitting with negative price (should show error)
- Try submitting with invalid device limit (should show error)

---

#### Test 8: Edit Existing Plan (Admin)

**Steps:**
1. From Admin Plans page, click "Edit" on Standard plan
2. Form dialog opens with pre-filled values
3. Modify fields:
   - Max Devices: 5 → 10
   - Description: Update text
4. Enter reason: "Increased device limit for better user experience"
5. Click "Save Changes"
6. Loading spinner appears
7. Success message: "Plan updated successfully"
8. Dialog closes
9. Table refreshes with updated values

**Expected Result:** Plan updated in database, audit log created with reason

**Test Data:**
- API Endpoint: `PUT /api/admin/plans/PLN_00001`
- Request Body: UpdatePlanRequest object (includes reason field)
- Expected Response: Updated SubscriptionPlan object

**Validation Tests:**
- Try submitting without reason (should show error: "Reason is required (minimum 10 characters)")
- Try submitting with reason < 10 chars (should show error)

**Verify Audit Log:**
```bash
# Check audit logs for plan update event
cd gc-py-backend
python scripts/check_firestore.py --collection gc-audit-logs --filter eventType==plan.updated

# Expected: Event with actor, target, changes, reason
```

---

#### Test 9: Archive Plan (Admin)

**Steps:**
1. From Admin Plans page, click "Archive" on Family plan
2. Confirmation dialog opens
3. Verify warning message: "Archive Family Plan? Existing users keep this plan, but no new subscriptions allowed."
4. Verify plan details displayed (name, price, status)
5. Enter reason: "Plan no longer offered to new customers"
6. Click "Archive Plan"
7. Loading spinner appears
8. Success message: "Plan archived successfully"
9. Dialog closes
10. Plan status changes to "Archived" badge in table

**Expected Result:** Plan status changed to "archived" in database

**Test Data:**
- API Endpoint: `PUT /api/admin/plans/PLN_00002/archive`
- Request Body: `{ reason: "..." }`
- Expected Response: Updated plan with status="archived"

**Edge Cases:**
- Try archiving default plan (should show error: "Cannot archive default plan")
- Verify existing users on archived plan keep their subscription
- Verify archived plan not visible on public pricing page

**Verify Audit Log:**
```bash
# Check audit logs for archive event
python scripts/check_firestore.py --collection gc-audit-logs --filter eventType==plan.archived

# Expected: Event with reason, archivedBy fields
```

---

#### Test 10: Change User's Plan (Admin)

**Steps:**
1. Navigate to `/admin/users` (or user detail page)
2. Select a user (e.g., customer1@gadgetcloud.io)
3. View Subscription Details section
4. Click "Change Plan" button
5. Dialog opens showing:
   - User info (name, email, current plan)
   - List of available plans with radio buttons
   - Current plan highlighted with "Current" badge
6. Select new plan (e.g., Family)
7. Enter reason: "Customer requested upgrade for support ticket #123"
8. Click "Change Plan"
9. Loading spinner appears
10. Success message: "Plan changed successfully"
11. Dialog closes
12. User's subscription details refresh with new plan

**Expected Result:** User's subscriptionPlanId updated in database

**Test Data:**
- API Endpoint: `PUT /api/admin/subscriptions/user/{userId}/change-plan`
- Request Body: `{ planId: "PLN_00002", reason: "..." }`
- Expected Response: Updated UserSubscription object

**Validation Tests:**
- Try submitting without selecting a plan (should show error)
- Try submitting without reason (should show error)

**Verify Audit Log:**
```bash
# Check audit logs for subscription change event
python scripts/check_firestore.py --collection gc-audit-logs --filter eventType==subscription.plan_changed

# Expected: Event with targetId (user), planId, reason
```

---

#### Test 11: Override User Feature Limits (Admin)

**Steps:**
1. From user detail page, click "Override Limits"
2. Dialog opens showing:
   - User info
   - Current plan limits (read-only)
   - 12 override checkboxes with input fields
3. Enable "Override max devices" checkbox
4. Set value: 20 (instead of plan default 5)
5. Enable "Override max storage" checkbox
6. Set value: 500 MB (524288000 bytes)
7. Leave other fields unchecked (use plan defaults)
8. Enter reason: "Power user, needs extra capacity for business"
9. Click "Apply Overrides"
10. Loading spinner appears
11. Success message: "Overrides applied successfully"
12. Dialog closes
13. User subscription details show "Active Overrides" section

**Expected Result:** Override document created in gc-subscription-overrides collection

**Test Data:**
- API Endpoint: `PUT /api/admin/subscriptions/user/{userId}/override-features`
- Request Body: `{ overrides: { maxDevices: 20, maxStorageBytes: 524288000, ... }, reason: "..." }`
- Expected Response: Updated UserSubscription with merged effectiveLimits

**Verify Overrides Applied:**
```bash
# Check overrides collection
python scripts/check_firestore.py --collection gc-subscription-overrides --filter userId==customer_id

# Expected: Document with overrides object, reason, createdBy fields

# Verify effective limits
curl -H "Authorization: Bearer <token>" http://localhost:8000/api/billing/my-subscription

# Expected: effectiveLimits.maxDevices = 20 (not 5 from plan)
```

**Verify Enforcement:**
1. Login as overridden user
2. Try adding 20 devices (should succeed)
3. Try adding 21st device (should fail - override limit reached)

---

### 🔐 Permission & Security Testing

#### Test 12: Admin Endpoints Require Permissions

**Steps:**
1. Login as customer (non-admin)
2. Try accessing admin endpoints directly:
   ```bash
   curl -H "Authorization: Bearer <customer_token>" http://localhost:8000/api/admin/plans
   ```
3. Verify response: 403 Forbidden

**Expected Result:** Non-admin users cannot access admin endpoints

**Test All Admin Endpoints:**
- `GET /api/admin/plans`
- `POST /api/admin/plans`
- `PUT /api/admin/plans/:id`
- `PUT /api/admin/plans/:id/archive`
- `PUT /api/admin/subscriptions/user/:id/change-plan`
- `PUT /api/admin/subscriptions/user/:id/override-features`

---

#### Test 13: Authentication Required for User Endpoints

**Steps:**
1. Try accessing user endpoints without token:
   ```bash
   curl http://localhost:8000/api/billing/my-subscription
   ```
2. Verify response: 401 Unauthorized

**Expected Result:** Unauthenticated requests rejected

---

### 📊 Data Integrity Testing

#### Test 14: Verify Audit Logs for All Admin Actions

**Steps:**
1. Perform all admin actions (create plan, update plan, archive plan, change user plan, override limits)
2. Check audit logs:
   ```bash
   python scripts/check_firestore.py --collection gc-audit-logs
   ```
3. Verify each action logged with:
   - eventType (plan.created, plan.updated, plan.archived, subscription.plan_changed, subscription.features_overridden)
   - actorId, actorEmail (admin user)
   - targetId (plan ID or user ID)
   - changes (for updates - old vs new values)
   - reason (from request body)
   - timestamp

**Expected Result:** All admin actions logged with complete audit trail

---

#### Test 15: Verify ID Generation

**Steps:**
1. Create new plan
2. Verify ID format: PLN_00001, PLN_00002, etc.
3. Create override
4. Verify ID format: OVR_00001, OVR_00002, etc.
5. Verify IDs are sequential and unique

**Expected Result:** All IDs generated correctly using SequenceGenerator

```bash
# Check sequence counters
python scripts/check_firestore.py --collection gc_sequence_counters

# Expected: plan_id and override_id documents with incrementing values
```

---

### 🎨 UI/UX Polish Testing

#### Test 16: Design System Consistency

**Steps:**
1. Visit all subscription-related pages
2. Verify consistent use of:
   - gc-card component for containers
   - gc-badge component for status indicators
   - gc-button component for actions
   - gc-alert component for messages
   - gc-loading-spinner for loading states
   - gc-empty-state for empty data
3. Verify color palette matches design tokens:
   - Primary blue: #0080C0
   - Success green: var(--color-success)
   - Error red: var(--color-error)
   - Warning yellow: var(--color-warning)

**Expected Result:** All pages use design system components consistently

---

#### Test 17: Responsive Design

**Steps:**
1. Test all subscription pages at different screen sizes:
   - Mobile: 375px width
   - Tablet: 768px width
   - Desktop: 1440px width
2. Verify:
   - Plan cards stack vertically on mobile
   - Forms remain usable on all sizes
   - Tables scroll horizontally on mobile
   - Buttons remain accessible

**Expected Result:** All layouts responsive and functional

---

#### Test 18: Loading States

**Steps:**
1. Throttle network to "Slow 3G" in dev tools
2. Navigate to each page
3. Verify loading spinners appear:
   - While fetching plans
   - While fetching subscription
   - While submitting forms
   - During plan changes
4. Verify spinners disappear when data loads

**Expected Result:** Smooth loading experience, no flash of empty state

---

#### Test 19: Error Handling

**Steps:**
1. Test error scenarios:
   - Backend offline (stop backend server)
   - Network timeout (use browser dev tools)
   - Invalid input (form validation)
   - Server errors (500 status)
2. Verify error messages:
   - User-friendly text
   - gc-alert component used
   - Actionable guidance ("Upgrade Plan" link)
   - Errors dismissible where appropriate

**Expected Result:** All errors handled gracefully with helpful messages

---

### ⚡ Performance Testing

#### Test 20: Bundle Size Optimization

**Current Bundle Sizes:**
- Initial: 502.05 kB (exceeds 500 kB budget by 2.05 kB)
- Lazy Chunks: Largest is 448.48 kB

**Action Items:**
- [ ] Analyze bundle with `npm run build -- --stats-json`
- [ ] Identify large dependencies
- [ ] Consider code splitting for subscription features
- [ ] Optimize images and assets

**Acceptance Criteria:** Initial bundle < 500 kB

---

#### Test 21: API Response Times

**Steps:**
1. Use browser Network tab to measure API response times
2. Verify all endpoints respond within acceptable limits:
   - GET /api/billing/plans: < 500ms
   - GET /api/billing/my-subscription: < 500ms
   - POST /api/billing/upgrade: < 1s
   - Admin endpoints: < 1s

**Expected Result:** Fast API responses, no perceived lag

---

## Known Issues & Warnings

### Build Warnings (Non-Critical)

1. **LoadingSpinnerComponent unused in ActivityComponent**
   - File: `src/app/pages/activity/activity.ts:21`
   - Fix: Remove import or use component in template
   - Priority: Low

2. **Bundle size exceeded**
   - Initial bundle: 502.05 kB (exceeds 500 kB by 2.05 kB)
   - Fix: Code splitting, tree shaking, optimization
   - Priority: Medium

3. **SCSS file sizes exceeded**
   - profile.scss: 24.37 kB (exceeds 15 kB by 9.37 kB)
   - service-ticket-detail.scss: 18.19 kB (exceeds 15 kB by 3.19 kB)
   - Fix: Extract common styles, use CSS variables, minification
   - Priority: Low

### TypeScript Errors (RESOLVED)

All TypeScript compilation errors have been fixed:
- ✅ Fixed type annotation in feature-limit.service.ts
- ✅ Removed unused RouterLink import in admin-plans.ts
- ✅ Changed invalid `variant="light"` to `variant="white"` in all dialogs
- ✅ Removed `isDefault` field from UpdatePlanRequest

---

## Testing Completion Checklist

### Phase 8: Testing & Polish

- [x] **Backend**: All compilation errors fixed
- [x] **Frontend**: Build succeeds with only warnings
- [ ] **User Flows**: All user subscription features tested
- [ ] **Admin Flows**: All admin plan management features tested
- [ ] **Enforcement**: Device and storage limits enforced
- [ ] **Audit**: All admin actions logged
- [ ] **UI/UX**: Design system consistency verified
- [ ] **Responsive**: All screen sizes tested
- [ ] **Performance**: Bundle size optimized
- [ ] **Security**: Permissions and authentication verified

**Estimated Testing Time:** 4-6 hours for complete manual testing

---

## Post-Testing Actions

### If All Tests Pass:

1. **Update Documentation**
   - Mark Phase 8 as complete
   - Document any issues found and resolved
   - Update SUBSCRIPTION_IMPLEMENTATION_SUMMARY.md

2. **Commit Changes**
   ```bash
   git add .
   git commit -m "test: complete Phase 8 testing and polish for subscription features"
   ```

3. **Deploy to Staging**
   ```bash
   # Backend
   cd gc-py-backend
   gcloud run deploy gc-py-backend --source . --region=asia-south1 --project=gadgetcloud-stg

   # Frontend
   cd gc-ng-portal-web
   npm run deploy:stg
   ```

4. **Test on Staging**
   - Repeat critical tests on https://www-stg.gadgetcloud.io
   - Verify backend integration with staging Cloud Run
   - Test with real staging database

5. **Deploy to Production** (after staging verification)
   ```bash
   # Backend
   cd gc-py-backend
   gcloud run deploy gc-py-backend --source . --region=asia-south1 --project=gadgetcloud-prd

   # Frontend
   cd gc-ng-portal-web
   npm run deploy:prd
   ```

### If Issues Found:

1. **Document Issues**
   - Create issues in GitHub or task tracker
   - Assign priority (Critical, High, Medium, Low)
   - Assign to responsible developer

2. **Fix Critical Issues**
   - Fix blocking issues immediately
   - Re-test affected flows
   - Update documentation

3. **Schedule Non-Critical Fixes**
   - Add to backlog for next sprint
   - Document in technical debt log

---

## Manual Testing Helpers

### Quick Test Data Setup

```bash
# Seed subscription plans
cd gc-py-backend
source venv/bin/activate
python scripts/seed_subscription_plans.py

# Migrate existing users to Standard plan
python scripts/migrate_users_to_standard_plan.py

# Verify migration
python scripts/verify_subscription_migration.py

# Create test admin user
python scripts/create_admin_user.py

# View all plans
python scripts/check_firestore.py --collection gc-subscription-plans

# View all subscriptions
python scripts/check_firestore.py --collection gc-users | grep subscriptionPlanId

# View all overrides
python scripts/check_firestore.py --collection gc-subscription-overrides
```

### API Testing with cURL

```bash
# Login and get token
TOKEN=$(curl -s -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"customer1@gadgetcloud.io","password":"customer1@gadgetcloud.io"}' \
  | jq -r '.access_token')

# Get available plans (public)
curl http://localhost:8000/api/billing/plans | jq

# Get my subscription
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/billing/my-subscription | jq

# Check device limit
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8000/api/billing/check-limit?limitType=device" | jq

# Upgrade plan (mock)
curl -X POST http://localhost:8000/api/billing/upgrade \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"planId":"PLN_00002","paymentMethod":"mock","transactionId":"test_txn_123"}' | jq
```

---

## Success Criteria

✅ **All tests pass** without critical issues
✅ **Audit logs** capture all admin actions with reason
✅ **Feature enforcement** blocks actions when limits exceeded
✅ **UI consistency** with design system components
✅ **Responsive design** works on all screen sizes
✅ **Performance** meets acceptable thresholds
✅ **Security** properly enforced (authentication, permissions)
✅ **Data integrity** maintained (no orphaned records, correct IDs)

**Ready for Production:** Yes/No

---

## Additional Resources

- **Backend API Docs**: http://localhost:8000/docs (FastAPI Swagger UI)
- **Implementation Summary**: `/gc-ng-portal-web/SUBSCRIPTION_IMPLEMENTATION_SUMMARY.md`
- **Implementation Plan**: `~/.claude/plans/shimmying-noodling-meadow.md`
- **Database Config**: `/DATABASE_CONFIG.md`
- **Deployment Guide**: `/DEPLOYMENT_CHECKLIST.md`
