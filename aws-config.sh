#!/bin/bash
export AWS_REGION="eu-west-2"
export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
export PROJECT="door-designer"
export LAMBDA_NAME="${PROJECT}-api"
export CLIENT_BUCKET="${PROJECT}-client-${AWS_ACCOUNT_ID}"
export DEPLOY_BUCKET="${PROJECT}-deploy-${AWS_ACCOUNT_ID}"

# ⚠️ Database connection string (Production RDS)
export NEON_DATABASE_URL="postgresql://dooradmin:Getaichatbots9871@door-designer-db.ch46u6wy835i.eu-west-2.rds.amazonaws.com:5432/doordesigner"

echo "══════════════════════════════════════"
echo "  AWS Account:  ${AWS_ACCOUNT_ID}"
echo "  Region:       ${AWS_REGION}"
echo "  Project:      ${PROJECT}"
echo "══════════════════════════════════════"
