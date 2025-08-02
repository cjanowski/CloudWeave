#!/bin/bash

# CloudWeave AWS Destruction Script
# This script safely destroys all AWS resources

set -e

echo "🗑️  CloudWeave AWS Destruction Script"
echo "====================================="

# Check if Terraform is installed
if ! command -v terraform &> /dev/null; then
    echo "❌ Terraform is not installed."
    exit 1
fi

# Check if terraform directory exists
if [ ! -d "aws/terraform" ]; then
    echo "❌ Terraform directory not found. Nothing to destroy."
    exit 1
fi

cd aws/terraform

# Check if terraform has been initialized
if [ ! -d ".terraform" ]; then
    echo "❌ Terraform not initialized. Nothing to destroy."
    exit 1
fi

echo "⚠️  WARNING: This will destroy ALL AWS resources created by this project!"
echo "   - ECS Cluster and Services"
echo "   - RDS Database (all data will be lost!)"
echo "   - VPC and networking components"
echo "   - Load Balancer"
echo "   - ECR repositories and images"
echo ""

read -p "🤔 Are you absolutely sure you want to destroy everything? (type 'yes' to confirm): " -r
echo
if [[ ! $REPLY == "yes" ]]; then
    echo "❌ Destruction cancelled"
    exit 1
fi

echo "🗑️  Destroying infrastructure..."
terraform destroy -auto-approve

echo ""
echo "✅ All AWS resources have been destroyed!"
echo ""
echo "💡 Note: You may want to also:"
echo "   - Remove the terraform.tfvars file if it contains sensitive data"
echo "   - Clean up any local Docker images"
echo ""
echo "🧹 To clean up local Docker images:"
echo "   docker rmi cloudweave-backend cloudweave-frontend"