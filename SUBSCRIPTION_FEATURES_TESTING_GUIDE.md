# Subscription Features - Production Testing Guide

**Environment**: Production
**Date**: 2026-01-09
**Frontend**: https://my.gadgetcloud.io
**Backend API**: https://gc-py-backend-935361188774.asia-south1.run.app/api

---

## Prerequisites

**Test Accounts**:
- **Customer**: customer1@gadgetcloud.io / customer1@gadgetcloud.io
- **Admin**: (Create if needed - see setup section)

**Browser**: Chrome, Firefox, or Safari (latest version)
**Tools**: Browser DevTools (Console, Network tab)

---

## Setup: Create Admin User (If Needed)

If admin user doesn't exist in production:

```bash
cd gc-py-backend
export PROJECT_ID=gadgetcloud-prd
export FIRESTORE_DATABASE=gc-db
python scripts/create_admin_user.py
```

Follow prompts to create admin account.

---

## Test Suite Overview

| Test Area | Status | Priority |
|-----------|--------|----------|
| User - View Subscription | ⏳ Pending | HIGH |
| User - View Plan Comparison | ⏳ Pending | HIGH |
| User - Upgrade Plan (Mock) | ⏳ Pending | HIGH |
| Admin - View Plans List | ⏳ Pending | HIGH |
| Admin - Create New Plan | ⏳ Pending | MEDIUM |
| Admin - Edit Existing Plan | ⏳ Pending | MEDIUM |
| Admin - Archive Plan | ⏳ Pending | LOW |
| Admin - Change User Plan | ⏳ Pending | MEDIUM |
| Admin - Override User Limits | ⏳ Pending | MEDIUM |
| Feature Limits - Device Blocking | ✅ Tested | HIGH |
| Feature Limits - Storage Blocking | ✅ Verified | MEDIUM |

---

## Test 1: User - View Subscription in Profile

**Goal**: Verify users can view their current subscription plan and usage stats.

**Steps**:
1. Navigate to https://my.gadgetcloud.io
2. Login as **customer1@gadgetcloud.io** / **customer1@gadgetcloud.io**
3. Click on profile icon → **My Profile**
4. Click on **Subscription** tab

**Expected Results**:
- ✅ Subscription tab is visible
- ✅ Current plan displayed: "Standard Plan"
- ✅ Plan price shown: "₹0/month"
- ✅ Active badge displayed
- ✅ Usage stats visible:
  - Devices: X / 5 (with progress bar)
  - Storage: X MB / 100 MB (with progress bar)
- ✅ "Upgrade Plan" button visible
- ✅ Plan features list displayed

**API Call to Verify** (Check Network tab):
```
GET /api/billing/my-subscription
Headers: Authorization: Bearer {token}
Response: 200 OK
{
  "planId": "PLN_00001",
  "planName": "Standard",
  "planDisplayName": "Standard Plan",
  "effectiveLimits": {
    "maxDevices": 5,
    "maxStorageBytes": 104857600,
    ...
  },
  "currentUsage": {
    "deviceCount": X,
    "storageUsed": X
  }
}
```

**Screenshot**: Take screenshot of subscription tab for documentation.

**Issues to Watch For**:
- ❌ 500 error (backend issue)
- ❌ Empty state (no subscription data)
- ❌ Incorrect usage stats
- ❌ Missing "Upgrade Plan" button

---

## Test 2: User - View Plan Comparison Modal

**Goal**: Verify users can compare all available subscription plans.

**Steps**:
1. From subscription tab (Test 1), click **"Upgrade Plan"** button
2. Plan comparison modal should open

**Expected Results**:
- ✅ Modal opens with 3 plans displayed:
  - Standard Plan (₹0/month)
  - Family Plan (₹999/month)
  - Premium Plan (₹2999/month)
- ✅ Current plan (Standard) has border highlight
- ✅ Current plan shows "Current Plan" badge
- ✅ "Select Plan" button disabled on current plan
- ✅ "Select Plan" button enabled on other plans
- ✅ Feature comparison table below plan cards
- ✅ All 12 features listed with checkmarks/values

**API Call to Verify**:
```
GET /api/billing/plans
Response: 200 OK
[
  { "id": "PLN_00001", "name": "Standard", ... },
  { "id": "PLN_00002", "name": "Family", ... },
  { "id": "PLN_00003", "name": "Premium", ... }
]
```

**Screenshot**: Take screenshot of plan comparison modal.

**Issues to Watch For**:
- ❌ Modal doesn't open
- ❌ Plans not loading (check Network tab for API errors)
- ❌ Missing plan cards
- ❌ Incorrect pricing
- ❌ Feature table missing or incomplete

---

## Test 3: User - Upgrade Plan (Mock Payment)

**Goal**: Verify users can upgrade their plan with mock payment.

**Steps**:
1. From plan comparison modal (Test 2), click **"Select Plan"** on Family Plan
2. Confirmation dialog should appear
3. Confirm upgrade

**Expected Results**:
- ✅ Confirmation dialog shows:
  - "Upgrade to Family Plan?"
  - Price: ₹999/month
  - Features summary
  - "This is a mock payment - no charge will be made"
- ✅ "Confirm" and "Cancel" buttons visible
- ✅ Clicking "Confirm" triggers upgrade:
  - Success message shown
  - Modal closes
  - Subscription tab refreshes
  - Current plan now shows "Family Plan"
  - Usage limits updated (10 devices, 500MB storage)
- ✅ Page doesn't reload (optimistic UI update)

**API Call to Verify**:
```
POST /api/billing/upgrade
Headers: Authorization: Bearer {token}
Body: {
  "planId": "PLN_00002",
  "paymentMethod": "mock",
  "transactionId": "mock-{timestamp}"
}
Response: 200 OK
{
  "success": true,
  "subscription": { ... }
}
```

**Screenshot**: Take screenshots of:
1. Confirmation dialog
2. Success message
3. Updated subscription tab showing Family Plan

**Issues to Watch For**:
- ❌ Confirmation dialog doesn't appear
- ❌ API call fails (check Network tab)
- ❌ Success message doesn't show
- ❌ Plan doesn't update (still shows Standard)
- ❌ Page reloads (should be SPA behavior)

**Rollback** (Important):
After testing, downgrade back to Standard plan:
1. Open plan comparison modal
2. Select "Standard Plan"
3. Confirm downgrade
4. Verify subscription tab shows Standard again

---

## Test 4: Admin - View Plans List

**Goal**: Verify admins can view all subscription plans in admin panel.

**Steps**:
1. Logout from customer account
2. Login as **admin user** (credentials from setup)
3. Navigate to **Admin** section
4. Click **"Subscription Plans"** menu item
5. Plans list page should load

**Expected Results**:
- ✅ Route: `/admin/plans`
- ✅ Page title: "Subscription Plans"
- ✅ "Create New Plan" button visible (top right)
- ✅ Table displays 3 plans:
  | Plan Name | Price | Device Limit | Storage | Status | Actions |
  |-----------|-------|--------------|---------|--------|---------|
  | Standard Plan | ₹0 | 5 | 100 MB | Active | Edit, Archive |
  | Family Plan | ₹999 | 10 | 500 MB | Active | Edit, Archive |
  | Premium Plan | ₹2999 | Unlimited | 5 GB | Active | Edit, Archive |
- ✅ Actions column has icon buttons (pencil for edit, trash for archive)
- ✅ Active badge shows green color

**API Call to Verify**:
```
GET /api/admin/plans?include_archived=true
Headers: Authorization: Bearer {admin_token}
Response: 200 OK
[
  { "id": "PLN_00001", "name": "Standard", "status": "active", ... },
  { "id": "PLN_00002", "name": "Family", "status": "active", ... },
  { "id": "PLN_00003", "name": "Premium", "status": "active", ... }
]
```

**Screenshot**: Take screenshot of admin plans list page.

**Issues to Watch For**:
- ❌ 403 Forbidden (permission issue)
- ❌ Empty table (API not returning data)
- ❌ Plans not displaying
- ❌ Actions buttons missing
- ❌ Incorrect data in table

---

## Test 5: Admin - Create New Plan

**Goal**: Verify admins can create a new subscription plan.

**⚠️ WARNING**: This test creates data in production. Only proceed if comfortable creating test plans.

**Steps**:
1. From admin plans list (Test 4), click **"Create New Plan"** button
2. Plan form dialog should open
3. Fill form with test data:
   - Plan Name: *Enterprise*
   - Display Name: *Enterprise Plan*
   - Description: *Custom enterprise solution for large teams*
   - Price: *9999*
   - Currency: *INR*
   - Billing Period: *monthly*
   - **Feature Limits**:
     - Max Devices: *50*
     - Max Storage: *10240* MB (10 GB)
     - Max Documents per Device: *20*
     - AI Photo Recognition: ✅ *checked*
     - Priority Support Hours: *12*
     - Support Channels: ✅ *in-app, email, phone*
     - Dedicated Account Manager: ✅ *checked*
     - Family Sharing: ✅ *checked*
     - Max Family Members: *20*
     - Analytics Level: *advanced*
     - Notification Channels: ✅ *in-app, email, sms*
     - Can Create Repair Requests: ✅ *checked*
     - Enterprise Warranty Tracking: ✅ *checked*
   - Display Order: *4*
   - Is Visible: ✅ *checked*
   - Is Default: ❌ *unchecked*
4. Click **"Save"** button

**Expected Results**:
- ✅ Form validation passes (all required fields filled)
- ✅ Loading spinner shows during save
- ✅ Success message: "Plan created successfully"
- ✅ Dialog closes
- ✅ Plans table refreshes and shows new Enterprise plan (4 total plans)
- ✅ New plan has ID: PLN_00004

**API Call to Verify**:
```
POST /api/admin/plans
Headers: Authorization: Bearer {admin_token}
Body: {
  "name": "Enterprise",
  "displayName": "Enterprise Plan",
  "description": "Custom enterprise solution...",
  "price": { "amount": 9999, "currency": "INR", "billingPeriod": "monthly" },
  "features": { ... },
  "displayOrder": 4,
  "isVisible": true,
  "isDefault": false
}
Response: 201 Created
{
  "id": "PLN_00004",
  "name": "Enterprise",
  ...
}
```

**Screenshot**: Take screenshots of:
1. Create plan form (filled)
2. Success message
3. Updated plans table with Enterprise plan

**Issues to Watch For**:
- ❌ Form validation errors (check console)
- ❌ API error (check Network tab)
- ❌ Plan not appearing in table after save
- ❌ Incorrect ID generated

**Cleanup** (Important):
After testing, archive the test Enterprise plan:
1. Click "Archive" icon on Enterprise plan row
2. Enter reason: "Test plan, not needed"
3. Confirm archive
4. Verify plan status changes to "Archived"

---

## Test 6: Admin - Edit Existing Plan

**Goal**: Verify admins can edit subscription plan details.

**⚠️ WARNING**: This test modifies production data. Use caution.

**Steps**:
1. From admin plans list, click **"Edit"** icon on Standard Plan
2. Plan form dialog opens with existing data pre-filled
3. Make a minor change:
   - Change *Max Devices* from **5** to **7**
   - Reason: *Testing edit functionality - will revert*
4. Click **"Save"** button

**Expected Results**:
- ✅ Form pre-fills with existing Standard plan data
- ✅ All fields editable except "Plan Name" (read-only)
- ✅ "Reason" field required and has min 10 characters validation
- ✅ Success message: "Plan updated successfully"
- ✅ Dialog closes
- ✅ Plans table shows updated device limit: 7

**API Call to Verify**:
```
PUT /api/admin/plans/PLN_00001
Headers: Authorization: Bearer {admin_token}
Body: {
  "displayName": "Standard Plan",
  "features": { "maxDevices": 7, ... },
  "reason": "Testing edit functionality - will revert"
}
Response: 200 OK
{
  "id": "PLN_00001",
  "features": { "maxDevices": 7, ... }
}
```

**Screenshot**: Take screenshots of:
1. Edit form (pre-filled)
2. Modified field (Max Devices: 7)
3. Updated table

**Issues to Watch For**:
- ❌ Form doesn't pre-fill data
- ❌ Reason field not validated
- ❌ API error on save
- ❌ Changes not reflected in table

**IMPORTANT - Revert Change**:
After testing, immediately revert the change:
1. Click "Edit" icon on Standard Plan again
2. Change *Max Devices* back to **5**
3. Reason: *Reverting test change*
4. Save
5. Verify device limit back to 5 in table

---

## Test 7: Admin - Archive Plan

**Goal**: Verify admins can archive (soft delete) subscription plans.

**⚠️ CRITICAL**: Do NOT archive active production plans (Standard, Family, Premium). Only test on the Enterprise plan created in Test 5.

**Steps**:
1. From admin plans list, click **"Archive"** icon on Enterprise Plan (PLN_00004)
2. Archive confirmation dialog opens
3. Warning message shown: "Archive Enterprise Plan? Existing users keep this plan, but no new subscriptions allowed."
4. Enter reason: *Test plan created for testing*
5. Click **"Archive"** button

**Expected Results**:
- ✅ Confirmation dialog shows warning message
- ✅ Reason field required (min 10 characters)
- ✅ Success message: "Plan archived successfully"
- ✅ Dialog closes
- ✅ Enterprise plan status changes to "Archived" (gray badge)
- ✅ Enterprise plan no longer appears in user-facing plan list (/api/billing/plans)

**API Call to Verify**:
```
PUT /api/admin/plans/PLN_00004/archive
Headers: Authorization: Bearer {admin_token}
Body: {
  "reason": "Test plan created for testing"
}
Response: 200 OK
{
  "id": "PLN_00004",
  "status": "archived",
  "archivedAt": "2026-01-09T...",
  "archivedBy": "{admin_id}",
  "archivedReason": "Test plan created for testing"
}
```

**Verification**:
```bash
# Verify plan not in public list
curl -s https://gc-py-backend-935361188774.asia-south1.run.app/api/billing/plans | jq length
# Should return: 3 (Standard, Family, Premium only)

# Verify plan still in admin list
curl -s "https://gc-py-backend-935361188774.asia-south1.run.app/api/admin/plans?include_archived=true" \
  -H "Authorization: Bearer {admin_token}" | jq length
# Should return: 4 (includes archived Enterprise)
```

**Screenshot**: Take screenshots of:
1. Archive confirmation dialog
2. Success message
3. Updated table showing Archived badge

**Issues to Watch For**:
- ❌ Can archive default plans (should be blocked)
- ❌ Archived plan still appears in public /api/billing/plans
- ❌ Reason not saved
- ❌ Status not updating in table

---

## Test 8: Admin - Change User's Plan

**Goal**: Verify admins can manually change a user's subscription plan.

**Steps**:
1. Navigate to **Admin** → **Users**
2. Search for **customer1@gadgetcloud.io**
3. Click on user to open detail page
4. Scroll to **"Subscription Details"** section
5. Current plan should show: Standard Plan
6. Click **"Change Plan"** button
7. Change plan dialog opens
8. Select: **Family Plan**
9. Enter reason: *Testing admin plan change - will revert*
10. Click **"Save"** button

**Expected Results**:
- ✅ User detail page shows current subscription
- ✅ "Change Plan" button visible to admin
- ✅ Dialog shows user info (read-only):
  - Name: Customer One
  - Email: customer1@gadgetcloud.io
  - Current Plan: Standard Plan
- ✅ Dropdown shows all active plans (Standard, Family, Premium)
- ✅ Reason field required (min 10 characters)
- ✅ Success message: "User plan changed successfully"
- ✅ Subscription section updates to show: Family Plan
- ✅ User can immediately use new limits (10 devices, 500MB)

**API Call to Verify**:
```
PUT /api/admin/subscriptions/user/111Z/change-plan
Headers: Authorization: Bearer {admin_token}
Body: {
  "planId": "PLN_00002",
  "reason": "Testing admin plan change - will revert"
}
Response: 200 OK
{
  "planId": "PLN_00002",
  "planName": "Family",
  "planDisplayName": "Family Plan",
  ...
}
```

**Verification**:
```bash
# Login as customer and check subscription
curl -X POST ... /api/auth/login ... # Get token
curl -X GET https://gc-py-backend-935361188774.asia-south1.run.app/api/billing/my-subscription \
  -H "Authorization: Bearer {customer_token}" | jq '.planName'
# Should return: "Family"
```

**Screenshot**: Take screenshots of:
1. User subscription section (before)
2. Change plan dialog
3. User subscription section (after - showing Family)

**Issues to Watch For**:
- ❌ Change plan button not visible
- ❌ API error on save
- ❌ Plan doesn't update
- ❌ User still sees old limits

**IMPORTANT - Revert Change**:
After testing, change user back to Standard plan:
1. Click "Change Plan" again
2. Select "Standard Plan"
3. Reason: *Reverting test change*
4. Save
5. Verify user back on Standard plan

---

## Test 9: Admin - Override User's Feature Limits

**Goal**: Verify admins can override specific feature limits for individual users.

**Steps**:
1. From user detail page (customer1@gadgetcloud.io)
2. Scroll to **"Subscription Details"** section
3. Click **"Override Limits"** button
4. Override limits dialog opens
5. Enable overrides:
   - ✅ Override max devices: **20**
   - ✅ Override max storage: **1000** MB
   - Leave other features unchecked (use plan defaults)
6. Enter reason: *Power user testing - will remove after verification*
7. Click **"Save"** button

**Expected Results**:
- ✅ Dialog shows current plan limits (read-only):
  - Max Devices: 5 (Standard plan)
  - Max Storage: 100 MB (Standard plan)
- ✅ Override checkboxes with input fields
- ✅ Disabled checkboxes = grayed out inputs
- ✅ Enabled checkboxes = active inputs
- ✅ Reason field required (min 10 characters)
- ✅ Success message: "User limits overridden successfully"
- ✅ Subscription section shows "Active Overrides":
  - Max Devices: 20 (was 5)
  - Max Storage: 1000 MB (was 100 MB)
- ✅ User can now create up to 20 devices
- ✅ User can upload up to 1000 MB

**API Call to Verify**:
```
PUT /api/admin/subscriptions/user/111Z/override-features
Headers: Authorization: Bearer {admin_token}
Body: {
  "overrides": {
    "maxDevices": 20,
    "maxStorageBytes": 1048576000,  // 1000 MB in bytes
    "maxDocumentsPerDevice": null,   // Use plan default
    ...
  },
  "reason": "Power user testing - will remove after verification"
}
Response: 200 OK
{
  "overrides": { "maxDevices": 20, "maxStorageBytes": 1048576000 },
  "effectiveLimits": { "maxDevices": 20, "maxStorageBytes": 1048576000, ... }
}
```

**Verification**:
```bash
# Check effective limits as customer
curl -X GET https://gc-py-backend-935361188774.asia-south1.run.app/api/billing/my-subscription \
  -H "Authorization: Bearer {customer_token}" | jq '.effectiveLimits.maxDevices, .effectiveLimits.maxStorageBytes'
# Should return: 20, 1048576000
```

**Screenshot**: Take screenshots of:
1. Override limits dialog
2. Subscription section showing "Active Overrides"
3. Customer subscription view showing new limits

**Issues to Watch For**:
- ❌ Override button not visible
- ❌ Checkboxes don't enable/disable inputs
- ❌ API error on save
- ❌ Overrides not reflected in user's subscription
- ❌ User still blocked by original limits

**IMPORTANT - Remove Overrides**:
After testing, remove the overrides:
1. Click "Override Limits" again
2. Uncheck all override checkboxes
3. Reason: *Removing test overrides*
4. Save
5. Verify "Active Overrides" section disappears
6. Verify user back to plan defaults (5 devices, 100 MB)

---

## Test 10: Feature Limits - Device Creation Blocked

**Goal**: Verify device limit enforcement works in production.

**Status**: ✅ Already tested in staging (see FEATURE_LIMIT_ENFORCEMENT.md)

**Quick Verification**:
1. Login as customer1@gadgetcloud.io
2. Navigate to "My Gadgets"
3. Current device count: 39 devices
4. Standard plan limit: 5 devices
5. Click "Add Gadget" button
6. Fill form and submit

**Expected Result**:
- ✅ API returns 403 Forbidden
- ✅ Error alert shows: "Device limit exceeded. Your Standard Plan allows 5 devices. You currently have 39. Upgrade your plan to add more devices."
- ✅ "Upgrade Plan" button visible in error message
- ✅ Clicking upgrade button opens plan comparison modal

**Note**: This was successfully tested on 2026-01-09. See documentation for details.

---

## Test 11: Feature Limits - Storage Upload Blocked

**Goal**: Verify storage limit enforcement works in production.

**Status**: ✅ Code verified (see FEATURE_LIMIT_ENFORCEMENT.md)

**Quick Verification**:
1. Login as customer1@gadgetcloud.io
2. Navigate to any device detail page
3. Current storage used: ~1.6 MB
4. Standard plan limit: 100 MB
5. Try to upload a file > 98 MB

**Expected Result**:
- ✅ API returns 403 Forbidden
- ✅ Error alert shows: "Storage limit exceeded. Your Standard Plan allows 100MB..."
- ✅ Shows current usage, file size, and limit in MB

**Note**: Full test not performed due to file size requirements. Code review confirmed correct implementation.

---

## Post-Testing Checklist

After completing all tests, ensure:

### Data Cleanup
- [ ] Enterprise test plan archived (if created in Test 5)
- [ ] User plan reverted to Standard (if changed in Test 8)
- [ ] User overrides removed (if added in Test 9)
- [ ] Any test devices created are deleted

### Documentation
- [ ] All screenshots taken and saved
- [ ] Issues documented in issue tracker
- [ ] Test results recorded in test results spreadsheet
- [ ] Any bugs filed with reproduction steps

### Communication
- [ ] Stakeholders notified of production deployment
- [ ] Support team briefed on new subscription features
- [ ] User guide published (if applicable)

---

## Troubleshooting

### Issue: 403 Forbidden on Admin Endpoints

**Cause**: User doesn't have admin role or permissions

**Solution**:
1. Verify user has `role: "admin"` in Firestore (gc-users collection)
2. Check permissions in gc-permissions collection
3. Verify JWT token includes role claim:
   ```bash
   jwt.io # Paste token and check payload
   ```

### Issue: Plans Not Loading

**Cause**: API endpoint unreachable or returning errors

**Solution**:
1. Check browser Network tab for failed requests
2. Verify API endpoint in environment.prd.ts
3. Check CORS settings if cross-origin
4. Review Cloud Run logs for backend errors:
   ```bash
   gcloud logging read 'resource.type="cloud_run_revision"' \
     --project=gadgetcloud-prd --limit=50
   ```

### Issue: Subscription Tab Empty

**Cause**: User doesn't have subscriptionPlanId or API not returning data

**Solution**:
1. Check user document in Firestore:
   ```bash
   python scripts/check_firestore.py --collection gc-users | grep {userId} -A 10
   ```
2. Verify subscriptionPlanId exists and is valid
3. Check /api/billing/my-subscription in Network tab
4. Review backend logs for errors

### Issue: Plan Upgrade Doesn't Work

**Cause**: API error or frontend not handling response

**Solution**:
1. Check Network tab for POST /api/billing/upgrade request
2. Verify request body includes planId and paymentMethod
3. Check response status and error message
4. Review backend validation in app/routers/billing.py

---

## Test Results Template

Use this template to document test results:

```markdown
## Subscription Features - Production Test Results

**Date**: YYYY-MM-DD
**Tester**: {Your Name}
**Environment**: Production
**Browser**: {Chrome/Firefox/Safari} {Version}

### Test Results Summary

| Test # | Test Name | Status | Notes |
|--------|-----------|--------|-------|
| 1 | User - View Subscription | ✅ / ❌ / ⚠️ | |
| 2 | User - Plan Comparison | ✅ / ❌ / ⚠️ | |
| 3 | User - Upgrade Plan | ✅ / ❌ / ⚠️ | |
| 4 | Admin - View Plans | ✅ / ❌ / ⚠️ | |
| 5 | Admin - Create Plan | ✅ / ❌ / ⚠️ | |
| 6 | Admin - Edit Plan | ✅ / ❌ / ⚠️ | |
| 7 | Admin - Archive Plan | ✅ / ❌ / ⚠️ | |
| 8 | Admin - Change User Plan | ✅ / ❌ / ⚠️ | |
| 9 | Admin - Override Limits | ✅ / ❌ / ⚠️ | |
| 10 | Limits - Device Block | ✅ / ❌ / ⚠️ | |
| 11 | Limits - Storage Block | ✅ / ❌ / ⚠️ | |

**Legend**: ✅ Pass | ❌ Fail | ⚠️ Partial/Warning

### Issues Found

1. **Issue Title**
   - Severity: High / Medium / Low
   - Steps to Reproduce:
   - Expected Behavior:
   - Actual Behavior:
   - Screenshots: {link}

### Screenshots

- Test 1: {screenshot links}
- Test 2: {screenshot links}
- ...

### Recommendations

- {Any improvements or follow-up actions}
```

---

## Success Criteria

All tests considered successful if:

- ✅ All 11 tests pass without critical failures
- ✅ No 500 errors or backend crashes
- ✅ Feature limits correctly block actions
- ✅ Admin can manage plans without issues
- ✅ Users can view and upgrade subscriptions
- ✅ All data changes properly persisted
- ✅ Audit logs created for all admin actions
- ✅ No data loss or corruption
- ✅ Performance acceptable (<2s page loads)
- ✅ Mobile responsive (bonus)

---

## Next Steps After Testing

1. **If All Tests Pass**:
   - Mark deployment as successful
   - Monitor production for 48 hours
   - Communicate success to stakeholders
   - Plan user training/documentation

2. **If Tests Fail**:
   - Document all failures with screenshots
   - File bugs in issue tracker
   - Assess severity (blocking vs non-blocking)
   - Plan hotfix deployment if critical
   - Re-test after fixes deployed

3. **Future Enhancements**:
   - Implement soft limits (warnings at 80%)
   - Add usage progress bars throughout portal
   - Build upgrade conversion funnel
   - Create analytics dashboard for plan utilization
   - Implement grace period for downgrades
