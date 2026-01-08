#!/bin/bash
# ========================================
# GadgetCloud Portal S3+CloudFront Deployment Script
# ========================================
#
# Deploys Angular portal app to S3 and invalidates CloudFront cache
#
# Usage:
#   ./deploy-portal-to-s3.sh stg     # Deploy to staging
#   ./deploy-portal-to-s3.sh prd     # Deploy to production
#
# Prerequisites:
#   - AWS CLI configured with 'gc' profile
#   - Angular app built in dist/gc-ng-portal-web/browser
#   - CloudFront distribution IDs configured
#
# ========================================

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# ========================================
# Configuration
# ========================================

ENVIRONMENT=${1:-stg}

if [ "$ENVIRONMENT" = "prd" ]; then
  BUCKET_NAME="my.gadgetcloud.io"
  DISTRIBUTION_ID="E2C6CN3UB2T4L2"
  AWS_PROFILE="gc"
  BUILD_CONFIG="production"
elif [ "$ENVIRONMENT" = "stg" ]; then
  BUCKET_NAME="my-stg.gadgetcloud.io"
  DISTRIBUTION_ID="E14WTLCWV7VL2Z"
  AWS_PROFILE="gc"
  BUILD_CONFIG="staging"
else
  echo -e "${RED}Error: Environment must be 'prd' or 'stg'${NC}"
  echo "Usage: $0 <prd|stg>"
  exit 1
fi

BUILD_DIR="dist/gc-ng-portal-web/browser"

# ========================================
# Header
# ========================================

echo ""
echo "=========================================="
echo -e "${BLUE}  🚀 GadgetCloud Deployment${NC}"
echo "=========================================="
echo -e "${BLUE}Environment:${NC} $ENVIRONMENT"
echo -e "${BLUE}Bucket:${NC}      $BUCKET_NAME"
echo -e "${BLUE}CloudFront:${NC}  $DISTRIBUTION_ID"
echo -e "${BLUE}AWS Profile:${NC} $AWS_PROFILE"
echo "=========================================="
echo ""

# ========================================
# Step 1: Build Angular App
# ========================================

echo -e "${BLUE}📦 Step 1/4: Building Angular app...${NC}"

if [ "$ENVIRONMENT" = "prd" ]; then
  npm run build -- --configuration=production
else
  npm run build -- --configuration=staging
fi

# Verify build output exists
if [ ! -d "$BUILD_DIR" ]; then
  echo -e "${RED}❌ Error: Build directory not found: $BUILD_DIR${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Build complete${NC}"
echo ""

# ========================================
# Step 2: Sync Files to S3
# ========================================

echo -e "${BLUE}📤 Step 2/4: Syncing files to S3...${NC}"

# Upload HTML files (no cache - always fetch fresh)
echo "  → Uploading HTML files (no-cache)..."
aws s3 sync "$BUILD_DIR" "s3://$BUCKET_NAME/" \
  --profile "$AWS_PROFILE" \
  --exclude "*" \
  --include "*.html" \
  --cache-control "no-cache, no-store, must-revalidate" \
  --metadata-directive REPLACE \
  --delete

# Upload JS/CSS files (5-minute cache for debugging)
echo "  → Uploading JS/CSS files (5min cache)..."
aws s3 sync "$BUILD_DIR" "s3://$BUCKET_NAME/" \
  --profile "$AWS_PROFILE" \
  --exclude "*" \
  --include "*.js" \
  --include "*.css" \
  --cache-control "public, max-age=300, immutable" \
  --metadata-directive REPLACE \
  --delete

# Upload other files (images, fonts, etc.)
echo "  → Uploading other files (images, fonts, etc.)..."
aws s3 sync "$BUILD_DIR" "s3://$BUCKET_NAME/" \
  --profile "$AWS_PROFILE" \
  --exclude "*.html" \
  --exclude "*.js" \
  --exclude "*.css" \
  --cache-control "public, max-age=300" \
  --metadata-directive REPLACE \
  --delete

echo -e "${GREEN}✅ Files synced to S3${NC}"
echo ""

# ========================================
# Step 3: Invalidate CloudFront Cache
# ========================================

echo -e "${BLUE}🔄 Step 3/4: Creating CloudFront invalidation...${NC}"

INVALIDATION_ID=$(aws cloudfront create-invalidation \
  --profile "$AWS_PROFILE" \
  --distribution-id "$DISTRIBUTION_ID" \
  --paths "/*" \
  --query 'Invalidation.Id' \
  --output text)

echo -e "${GREEN}✅ Invalidation created: $INVALIDATION_ID${NC}"
echo ""

# ========================================
# Step 4: Wait for Invalidation
# ========================================

echo -e "${BLUE}⏳ Step 4/4: Waiting for invalidation to complete...${NC}"

aws cloudfront wait invalidation-completed \
  --profile "$AWS_PROFILE" \
  --distribution-id "$DISTRIBUTION_ID" \
  --id "$INVALIDATION_ID"

echo -e "${GREEN}✅ Invalidation complete${NC}"
echo ""

# ========================================
# Success Message
# ========================================

echo "=========================================="
echo -e "${GREEN}✅ Deployment Successful!${NC}"
echo "=========================================="
echo ""

if [ "$ENVIRONMENT" = "prd" ]; then
  echo -e "${BLUE}Production URLs:${NC}"
  echo "  🌐 https://www.gadgetcloud.io"
  echo "  🔀 https://gadgetcloud.io (redirects to www)"
else
  echo -e "${BLUE}Staging URL:${NC}"
  echo "  🌐 https://www-stg.gadgetcloud.io"
fi

echo ""
echo -e "${BLUE}CloudFront Distribution:${NC} $DISTRIBUTION_ID"
echo -e "${BLUE}S3 Bucket:${NC} s3://$BUCKET_NAME/"
echo ""
echo "=========================================="
echo ""
