# Admin Guide - Subscription Plan Management

**Audience**: Administrators, Support Staff
**Last Updated**: January 2026
**Version**: 1.0

---

## Table of Contents

1. [Overview](#overview)
2. [Accessing Admin Features](#accessing-admin-features)
3. [Managing Subscription Plans](#managing-subscription-plans)
4. [Managing User Subscriptions](#managing-user-subscriptions)
5. [Handling Limit Issues](#handling-limit-issues)
6. [Common Support Scenarios](#common-support-scenarios)
7. [Audit Trail & Reporting](#audit-trail--reporting)
8. [Troubleshooting](#troubleshooting)

---

## Overview

### What Can Admins Do?

As an administrator, you can:
- ✅ View all subscription plans
- ✅ Create new plans
- ✅ Edit existing plans
- ✅ Archive plans (soft delete)
- ✅ View user subscriptions
- ✅ Change a user's plan
- ✅ Override feature limits for specific users
- ✅ View audit logs for all subscription changes

### Important Rules

**DO**:
- ✅ Always provide a reason when making changes (required for audit)
- ✅ Test changes in staging before production
- ✅ Communicate plan changes to affected users
- ✅ Document special cases in user notes

**DON'T**:
- ❌ Archive the default plan (Standard)
- ❌ Delete plans (use archive instead)
- ❌ Change prices without stakeholder approval
- ❌ Override limits without a valid reason
- ❌ Make changes without logging in audit trail

---

## Accessing Admin Features

### Login as Admin

1. Navigate to https://my.gadgetcloud.io
2. Login with your admin credentials
3. Verify you see "Admin" menu in navigation

### Admin Menu Structure

```
Admin (dropdown)
├── Dashboard
├── Users
│   └── View all users
│   └── User details (click user row)
├── Subscription Plans ← Manage plans here
├── Audit Logs
└── Settings
```

### Permissions Required

- **View Plans**: `plans:view`
- **Create Plans**: `plans:create`
- **Edit Plans**: `plans:edit`
- **Archive Plans**: `plans:delete`
- **Manage User Subscriptions**: `subscriptions:view`, `subscriptions:change_plan`, `subscriptions:override_limits`

If you don't see these options, contact a super admin to grant permissions.

---

## Managing Subscription Plans

### Viewing All Plans

**Navigate**: Admin → Subscription Plans

**What You'll See**:
- Table with all plans (including archived if enabled)
- Columns: Plan Name, Price, Device Limit, Storage, Status, Actions
- "Create New Plan" button (top right)
- Filter by status (Active/Archived)

**Status Badges**:
- 🟢 **Active**: Plan available to users
- ⚫ **Archived**: Hidden from users, existing subscriptions remain
- 🔵 **Draft**: Not yet published (future feature)

---

### Creating a New Plan

**When to Create**:
- Launching a new pricing tier
- Special promotions or limited-time offers
- Custom enterprise plans for large customers

**Steps**:
1. Click **"Create New Plan"** button
2. Fill in the form (see fields below)
3. Review carefully (can't change plan name after creation)
4. Click **"Save"**

**Form Fields**:

| Field | Required | Notes |
|-------|----------|-------|
| **Plan Name** | ✅ | Unique, internal ID (lowercase, no spaces): `standard`, `family`, `premium`, `enterprise` |
| **Display Name** | ✅ | User-facing name: "Standard Plan", "Family Plan" |
| **Description** | ✅ | Short description (max 500 chars) |
| **Price - Amount** | ✅ | In rupees, ≥ 0 (use 0 for free) |
| **Price - Currency** | ✅ | Default: INR |
| **Price - Billing Period** | ✅ | monthly or yearly |
| **Max Devices** | ✅ | Number or -1 for unlimited |
| **Max Storage (bytes)** | ✅ | In bytes (100 MB = 104,857,600) |
| **Max Docs per Device** | ✅ | Number or -1 for unlimited |
| **AI Photo Recognition** | ✅ | Checkbox (enabled/disabled) |
| **Priority Support Hours** | ✅ | Response time (hours): 48, 24, 12 |
| **Support Channels** | ✅ | Multi-select: in-app, email, phone, sms |
| **Dedicated Manager** | ✅ | Checkbox |
| **Family Sharing** | ✅ | Checkbox |
| **Max Family Members** | ✅ | Number (0 if sharing disabled) |
| **Analytics Level** | ✅ | basic or advanced |
| **Notification Channels** | ✅ | Multi-select: in-app, email, sms, push |
| **Can Create Repair Requests** | ✅ | Checkbox |
| **Enterprise Warranty Tracking** | ✅ | Checkbox |
| **Display Order** | ✅ | Sort order (1, 2, 3...) |
| **Is Visible** | ✅ | Show on pricing page |
| **Is Default** | ✅ | Default for new users (only one) |

**Validation Rules**:
- Plan name must be unique (system checks)
- Price must be ≥ 0
- Only one plan can be default
- All required fields must be filled

**After Creation**:
- New plan assigned ID: `PLN_00001`, `PLN_00002`, etc.
- Plan appears in admin table immediately
- If "Is Visible" checked, appears on public pricing page
- Audit log created with your admin ID

**Example - Creating Enterprise Plan**:
```
Plan Name: enterprise
Display Name: Enterprise Plan
Description: Custom solution for large teams
Price: 9999 INR/monthly
Max Devices: 50
Max Storage: 10737418240 bytes (10 GB)
Max Docs per Device: 20
AI Photo Recognition: ✅
Priority Support: 12 hours
Support Channels: in-app, email, phone
Dedicated Manager: ✅
Family Sharing: ✅
Max Family Members: 20
Analytics: advanced
Notification Channels: in-app, email, sms, push
Repair Requests: ✅
Enterprise Warranty: ✅
Display Order: 4
Is Visible: ✅
Is Default: ❌
```

---

### Editing an Existing Plan

**When to Edit**:
- Adjusting feature limits
- Changing pricing (with approval)
- Updating descriptions
- Modifying support tiers

**Steps**:
1. Click **"Edit"** icon (pencil) on plan row
2. Form opens with current values pre-filled
3. Make changes
4. **Enter reason** (required, min 10 characters)
5. Click **"Save"**

**What You Can Edit**:
- ✅ Display name
- ✅ Description
- ✅ Price (with approval)
- ✅ All feature limits
- ✅ Display order
- ✅ Visibility
- ❌ **Cannot edit**: Plan name (internal ID)

**Reason Field**:
- Required for all edits
- Minimum 10 characters
- Stored in audit log
- Examples:
  - "Increased device limit per product team request"
  - "Updated pricing to match new tier structure"
  - "Fixed typo in plan description"

**After Editing**:
- Changes apply immediately
- Existing subscribers see new limits instantly
- Audit log records old vs. new values
- Users not notified automatically (do this manually if needed)

**Example - Increasing Device Limit**:
```
Plan: Standard (PLN_00001)
Change: Max Devices from 5 → 7
Reason: "Product team approved increase for Standard tier"
Impact: All Standard users can now add up to 7 devices
```

---

### Archiving a Plan

**When to Archive**:
- Plan no longer offered
- Promotional period ended
- Consolidating similar plans
- Replacing with new plan structure

**What Happens**:
- ✅ Plan hidden from public pricing page
- ✅ Existing users keep their subscription
- ✅ Cannot assign archived plan to new users
- ✅ Can view archived plan in admin (with filter)
- ❌ Cannot archive default plan

**Steps**:
1. Click **"Archive"** icon (trash) on plan row
2. Confirmation dialog appears with warning
3. **Enter reason** (required, min 10 characters)
4. Click **"Archive"**

**Warning Message**:
> "Archive [Plan Name]? Existing users keep this plan, but no new subscriptions allowed."

**Reason Examples**:
- "Plan replaced by new Family tier"
- "Limited-time promotion ended"
- "Consolidating plans per Q1 strategy"

**After Archiving**:
- Status changes to "Archived" (gray badge)
- Not in public API (`/api/billing/plans`)
- Still in admin API with `include_archived=true`
- Archived date, reason stored in database

**Reversing Archive**:
- Not currently supported in UI
- Contact engineering to reactivate
- Or create new plan with same features

---

## Managing User Subscriptions

### Viewing User's Subscription

**Navigate**: Admin → Users → [Click user] → Subscription Details section

**What You'll See**:
- Current plan name and price
- Subscription start date
- Last updated date
- **Active Overrides** (if any)
- Effective limits (plan + overrides merged)
- Actions: Change Plan, Override Limits

**Example Display**:
```
Current Plan: Family Plan (₹999/month)
Started: 2025-12-15
Last Updated: 2026-01-05

Effective Limits:
- Max Devices: 15 (overridden from 10)
- Max Storage: 500 MB
- Family Members: 5
- Support Response: 24 hours

Active Overrides:
- Max Devices: 15 (was 10) - Reason: "Power user, needs extra capacity"
```

---

### Changing a User's Plan

**When to Change**:
- User requests plan change
- Billing issue (downgrade temporarily)
- Account issue (courtesy upgrade)
- Migration during plan restructure

**Steps**:
1. From user detail page, click **"Change Plan"** button
2. Dialog opens showing user info (read-only)
3. Select new plan from dropdown
4. **Enter reason** (required, min 10 characters)
5. Click **"Save"**

**Reason Examples**:
- "User requested upgrade via support ticket #12345"
- "Courtesy upgrade due to billing issue"
- "Temporary downgrade per user request"
- "Migration to new plan structure"

**After Change**:
- Plan updates immediately
- User's effective limits change instantly
- User can immediately use new limits
- Audit log records change with your admin ID
- **Important**: User not auto-notified - send email manually

**Example Scenario**:
```
User: customer1@gadgetcloud.io
Current: Standard (5 devices)
New: Family (10 devices)
Reason: "User hit device limit, approved upgrade by support manager"
Result: User can now add up to 10 devices
Action: Send email notifying of upgrade
```

---

### Overriding User's Feature Limits

**When to Override**:
- Power user needs more capacity
- Special case customer (VIP, partner, etc.)
- Temporary increase for specific need
- Testing or internal accounts

**What You Can Override**:
- Any feature limit from plan
- Independent of plan tier
- Specific to one user only
- Overrides take precedence over plan

**Steps**:
1. From user detail page, click **"Override Limits"** button
2. Dialog shows current plan limits (read-only)
3. Check boxes for features to override
4. Enter new values in enabled fields
5. **Enter reason** (required, min 10 characters)
6. Click **"Save"**

**Override Form**:
```
Current Plan: Standard (read-only)
- Max Devices: 5
- Max Storage: 100 MB

Overrides:
☑ Override max devices: [20]
☑ Override max storage: [1000] MB
☐ Override documents per device: [grayed out]
☑ Override AI photo recognition: [✓ Enabled]
... (all 12 features listed)

Reason: [Power user, manages business devices]
```

**Checkbox Behavior**:
- **Checked**: Input enabled, value sent as override
- **Unchecked**: Input disabled, `null` sent (use plan default)

**After Override**:
- Overrides save to `gc-subscription-overrides` collection
- Effective limits merge: overrides + plan defaults
- User sees new limits immediately
- "Active Overrides" section appears in user's subscription view
- Audit log records overrides with your admin ID

**Example Scenario**:
```
User: premium-partner@example.com
Plan: Standard (5 devices, 100 MB)
Override: Max Devices → 20, Max Storage → 1000 MB
Reason: "Partner account, needs extra capacity for demo devices"
Result: User has 20 device slots and 1 GB storage
```

**Removing Overrides**:
1. Click "Override Limits" again
2. Uncheck all override boxes
3. Reason: "Removing temporary overrides"
4. Save
5. User reverts to plan defaults

---

## Handling Limit Issues

### User Hit Device Limit

**Symptoms**:
- User reports can't add device
- Error: "Device limit exceeded"

**Diagnosis**:
1. Check user's subscription: Current device count vs. limit
2. Ask: How many devices do they actually need?
3. Review their devices: Any old/unused ones?

**Solutions**:

**Solution 1: Remove Old Devices** (Free)
- Guide user to delete devices they no longer own
- Walk through: My Gadgets → Select device → Delete

**Solution 2: Upgrade Plan** (Paid)
- Explain plan options (Family: 10, Premium: unlimited)
- Guide user to upgrade from Subscription tab
- Process: Profile → Subscription → Upgrade Plan

**Solution 3: Override Limit** (Admin Only)
- Use sparingly (special cases only)
- Document reason in override form
- Set reasonable new limit (not unlimited)
- Review override after 30-90 days

**Example Response**:
```
Subject: Device Limit Reached

Hi [User],

You're currently on the Standard plan (5 devices) and have 5 devices added.

Options:
1. Delete old devices you no longer own (free)
2. Upgrade to Family plan for 10 devices (₹999/month)
3. Upgrade to Premium for unlimited devices (₹2,999/month)

To delete devices:
1. Go to My Gadgets
2. Click on device you want to remove
3. Click Delete button

To upgrade:
1. Go to your Profile
2. Click Subscription tab
3. Click Upgrade Plan button
4. Select your preferred plan

Let me know if you need help!
```

---

### User Hit Storage Limit

**Symptoms**:
- User can't upload documents
- Error: "Storage limit exceeded"

**Diagnosis**:
1. Check user's subscription: Current storage vs. limit
2. What are they trying to upload?
3. Review their files: Any large/unnecessary ones?

**Solutions**:

**Solution 1: Delete Old Files** (Free)
- Guide user to delete unneeded documents
- Suggest: old photos, duplicate receipts
- Walk through: Device detail → Documents → Delete

**Solution 2: Download and Delete** (Free)
- User downloads important files locally
- Then deletes from GadgetCloud to free space
- Keeps data but frees cloud storage

**Solution 3: Upgrade Plan** (Paid)
- Family: 500 MB (5x more)
- Premium: 5 GB (50x more)

**Solution 4: Override Limit** (Admin Only)
- Temporary increase for specific need
- Document reason
- Review after time period

**Storage Tips to Share**:
- Delete blurry receipt photos (keep only clear ones)
- Compress images before upload (medium quality)
- Keep only essential documents (warranty, important receipts)
- Download manuals instead of storing in cloud

---

## Common Support Scenarios

### Scenario 1: User Wants to Try Premium

**Request**: "Can I try Premium for free before paying?"

**Response**:
- We don't offer free trials currently
- Plans are month-to-month (no long-term commitment)
- Can upgrade now, downgrade anytime if not satisfied
- Suggest: Review premium features, decide if needed

**If Approved by Manager**:
- Can override limits temporarily (1 month)
- Reason: "1-month premium trial approved by support manager"
- Set reminder to revert after 30 days
- Monitor usage

---

### Scenario 2: User Hit Limit Right After Upgrade

**Request**: "I upgraded to Family but still can't add devices!"

**Diagnosis**:
1. Check subscription: Did upgrade actually process?
2. Check effective limits: Shows Family (10) or Standard (5)?
3. Check device count: How many do they have?

**Common Causes**:
- Upgrade didn't save (rare, check browser console)
- User has 10+ devices, needs Premium
- Cached subscription data in browser

**Solutions**:
- Refresh page (most common fix)
- Clear browser cache
- Check audit log: Was upgrade logged?
- Manually change plan if system error

---

### Scenario 3: Billing Issue - Downgrade Temporarily

**Request**: Payment failed, user wants to keep account active.

**Steps**:
1. Verify payment failure (check billing system)
2. Confirm user wants temporary downgrade
3. Change plan to Standard with reason: "Temporary downgrade due to billing issue #12345"
4. User keeps data but limited to 5 devices, 100 MB
5. Set reminder to follow up in 7 days
6. When payment resolved, upgrade back with reason: "Restoring [Plan] after billing resolved"

---

### Scenario 4: VIP User Needs Special Treatment

**Request**: Important customer needs extra capacity without charge.

**Approval Required**:
- Get approval from management
- Document approval in ticket system

**Steps**:
1. Override limits (don't change plan)
2. Set generous limits (e.g., 50 devices, 10 GB)
3. Reason: "VIP customer, approved by [Manager Name] on [Date]"
4. Add note to user account
5. Set reminder to review in 90 days

---

### Scenario 5: User Wants Refund After Upgrade

**Request**: "I upgraded yesterday but want a refund."

**Policy** (check with management for your specific policy):
- Refunds handled case-by-case
- Within 7 days: Full refund typically granted
- Within 30 days: Partial refund may be considered
- After 30 days: Generally no refund

**Steps**:
1. Ask reason for refund
2. Check usage: Did they actually use upgraded features?
3. Escalate to billing team if approved
4. Process refund through payment system
5. Downgrade plan after refund processed
6. Document in ticket: reason + approval

---

## Audit Trail & Reporting

### Accessing Audit Logs

**Navigate**: Admin → Audit Logs

**Filter by Event Type**:
- `plan.created` - New plan created
- `plan.updated` - Plan edited
- `plan.archived` - Plan archived
- `subscription.plan_changed` - User's plan changed
- `subscription.features_overridden` - Limits overridden
- `feature.limit_exceeded` - User hit limit

**Audit Log Details**:
Each log includes:
- Event type
- Timestamp
- Actor (admin who did it) - ID and email
- Target (affected user) - ID and email
- Changes (old vs. new values)
- Reason (from form)
- Metadata (additional context)

**Example Audit Entry**:
```json
{
  "id": "log_12345",
  "eventType": "subscription.plan_changed",
  "timestamp": "2026-01-09T14:30:00Z",
  "actorId": "admin_001",
  "actorEmail": "admin@gadgetcloud.io",
  "targetId": "111Z",
  "targetEmail": "customer1@gadgetcloud.io",
  "changes": {
    "planId": {
      "old": "PLN_00001",
      "new": "PLN_00002"
    }
  },
  "reason": "User requested upgrade via ticket #9876",
  "metadata": {
    "oldPlanName": "Standard",
    "newPlanName": "Family"
  }
}
```

### Generating Reports

**Monthly Plan Distribution**:
```
Query audit logs for current subscriptions
Group by planName
Count users per plan
```

**Limit Exceeded Events**:
```
Query: eventType = "feature.limit_exceeded"
Date range: Last 30 days
Group by: limitType (device, storage)
Count occurrences
```

**Plan Changes**:
```
Query: eventType = "subscription.plan_changed"
Date range: Last month
Analyze: Upgrades vs. downgrades
Identify: Common upgrade paths
```

**Churned Users** (Downgraded to Standard):
```
Query: subscription.plan_changed
Filter: newPlanId = "PLN_00001"
AND oldPlanId != "PLN_00001"
Reason: Check reasons for downgrades
```

---

## Troubleshooting

### Issue: User Says They Upgraded But Plan Still Shows Standard

**Diagnosis**:
1. Check audit log: Was upgrade event logged?
2. Check user document: What's subscriptionPlanId?
3. Check browser: Clear cache and refresh

**Solutions**:
- If logged: Clear browser cache, refresh page
- If not logged: API error, manually change plan
- Check backend logs for errors during upgrade

**Commands**:
```bash
# Check user's plan in database
python scripts/check_firestore.py --collection gc-users | grep {userId} -A 5

# Check audit logs
curl https://BACKEND_URL/api/admin/audit-logs/user/{userId}?event_type=subscription.plan_changed
```

---

### Issue: Override Not Taking Effect

**Diagnosis**:
1. Check gc-subscription-overrides collection
2. Verify override document exists for userId
3. Check effective limits API response

**Solutions**:
- Re-save override (sometimes first save fails)
- Check backend logs for errors
- Verify override values are valid (not null)

**Commands**:
```bash
# Check overrides
python scripts/check_firestore.py --collection gc-subscription-overrides | grep {userId} -A 10

# Test effective limits API
curl https://BACKEND_URL/api/billing/my-subscription \
  -H "Authorization: Bearer {user_token}" | jq '.effectiveLimits'
```

---

### Issue: Can't Archive Default Plan

**Error**: "Cannot archive default plan"

**Why**: System requires at least one default plan for new users.

**Solution**:
1. Create or designate a different plan as default
2. Then archive the old default plan

---

### Issue: Audit Logs Not Showing

**Diagnosis**:
1. Check permissions: Do you have audit_logs:view?
2. Check date filter: Too narrow range?
3. Check backend: Is audit service working?

**Solutions**:
- Request audit_logs:view permission
- Expand date range
- Check backend logs for audit service errors

---

## Best Practices

### Documentation

- ✅ Always fill in reason fields (audit trail)
- ✅ Add notes to user accounts for special cases
- ✅ Document approvals in ticket system
- ✅ Keep internal wiki updated with policy changes

### Communication

- ✅ Notify users when changing their plan
- ✅ Explain why limits exist and how to manage them
- ✅ Be proactive: Warn users approaching limits
- ✅ Follow up after resolving issues

### Safety

- ✅ Test in staging before production
- ✅ Double-check before archiving plans
- ✅ Get approval for price changes
- ✅ Review overrides periodically (remove stale ones)

### Efficiency

- ✅ Create templates for common responses
- ✅ Document repetitive tasks in runbook
- ✅ Use keyboard shortcuts in admin panel
- ✅ Batch similar support requests

---

## Quick Reference

### Storage Conversions

| MB | Bytes |
|----|-------|
| 1 MB | 1,048,576 |
| 10 MB | 10,485,760 |
| 100 MB | 104,857,600 |
| 500 MB | 524,288,000 |
| 1 GB | 1,073,741,824 |
| 5 GB | 5,368,709,120 |
| 10 GB | 10,737,418,240 |

### Plan IDs

- Standard: `PLN_00001`
- Family: `PLN_00002`
- Premium: `PLN_00003`

### Common Reasons

**Plan Changes**:
- "User requested upgrade via ticket #{number}"
- "Temporary downgrade due to billing issue"
- "Courtesy upgrade due to account issue"
- "Restoring plan after billing resolved"

**Overrides**:
- "Power user, needs extra capacity"
- "VIP customer, approved by [Manager]"
- "Temporary increase for [event/project]"
- "Partner account, demo purposes"

**Plan Edits**:
- "Updated per product team request"
- "Fixed typo in description"
- "Adjusted pricing per new tier structure"
- "Increased limit per Q1 strategy"

---

## Contact & Escalation

**For Help**:
- Support Team Lead: support-lead@gadgetcloud.io
- Engineering: engineering@gadgetcloud.io
- Product Team: product@gadgetcloud.io

**Escalate If**:
- User requesting refund over ₹5,000
- VIP customer issue
- System bug affecting subscriptions
- Policy exception needed

---

**Version**: 1.0
**Last Updated**: January 2026
**Next Review**: March 2026
