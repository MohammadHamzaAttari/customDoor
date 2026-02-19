#!/bin/bash
export AWS_REGION="eu-west-2"
export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
export PROJECT="door-designer"
export LAMBDA_NAME="${PROJECT}-api"
export CLIENT_BUCKET="${PROJECT}-client-${AWS_ACCOUNT_ID}"
export DEPLOY_BUCKET="${PROJECT}-deploy-${AWS_ACCOUNT_ID}"

# ⚠️ REPLACE THIS with your actual Neon connection string
export NEON_DATABASE_URL="postgresql://neondb_owner:npg_e0QjpmVJ5rSF@ep-purple-band-abrg3arb-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

echo "══════════════════════════════════════"
echo "  AWS Account:  ${AWS_ACCOUNT_ID}"
echo "  Region:       ${AWS_REGION}"
echo "  Project:      ${PROJECT}"
echo "══════════════════════════════════════"
