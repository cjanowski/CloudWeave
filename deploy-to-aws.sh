#!/bin/bash

# CloudWeave AWS Deployment Script
# This script deploys the entire application to AWS using the simplest approach

set -e

echo "🚀 CloudWeave AWS Deployment Script"
echo "===================================="

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is not installed. Please install it first:"
    echo "   https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html"
    exit 1
fi

# Check if Terraform is installed
if ! command -v terraform &> /dev/null; then
    echo "❌ Terraform is not installed. Please install it first:"
    echo "   https://learn.hashicorp.com/tutorials/terraform/install-cli"
    exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install it first:"
    echo "   https://docs.docker.com/get-docker/"
    exit 1
fi

# Check AWS credentials
echo "🔐 Checking AWS credentials..."
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS credentials not configured. Please run:"
    echo "   aws configure"
    exit 1
fi

AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
AWS_REGION=${AWS_REGION:-us-east-1}

echo "✅ AWS Account: $AWS_ACCOUNT_ID"
echo "✅ AWS Region: $AWS_REGION"

# Create terraform.tfvars if it doesn't exist
if [ ! -f "aws/terraform/terraform.tfvars" ]; then
    echo "📝 Creating terraform.tfvars..."
    cp aws/terraform/terraform.tfvars.example aws/terraform/terraform.tfvars
    
    # Generate secure passwords (alphanumeric only to avoid sed issues)
    DB_PASSWORD=$(openssl rand -hex 16)
    JWT_SECRET=$(openssl rand -hex 32)
    
    # Update the tfvars file
    sed -i.bak "s/your-secure-database-password-here/$DB_PASSWORD/g" aws/terraform/terraform.tfvars
    sed -i.bak "s/your-super-secret-jwt-key-change-in-production/$JWT_SECRET/g" aws/terraform/terraform.tfvars
    sed -i.bak "s/us-east-1/$AWS_REGION/g" aws/terraform/terraform.tfvars
    rm aws/terraform/terraform.tfvars.bak
    
    echo "✅ Generated secure passwords in terraform.tfvars"
fi

# Initialize Terraform
echo "🏗️  Initializing Terraform..."
cd aws/terraform
terraform init

# Plan the deployment
echo "📋 Planning Terraform deployment..."
terraform plan

# Ask for confirmation
echo ""
read -p "🤔 Do you want to proceed with the deployment? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Deployment cancelled"
    exit 1
fi

# Apply Terraform
echo "🚀 Deploying infrastructure..."
terraform apply -auto-approve

# Get outputs
ECR_BACKEND_URL=$(terraform output -raw ecr_backend_repository_url)
ECR_FRONTEND_URL=$(terraform output -raw ecr_frontend_repository_url)
LOAD_BALANCER_URL=$(terraform output -raw load_balancer_url)

echo "✅ Infrastructure deployed successfully!"
echo ""
echo "📦 Building and pushing Docker images..."

# Go back to project root
cd ../..

# Login to ECR
echo "🔐 Logging into ECR..."
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

# Build and push backend
echo "🔧 Building backend image..."
docker build -t cloudweave-backend ./backend
docker tag cloudweave-backend:latest $ECR_BACKEND_URL:latest
echo "📤 Pushing backend image..."
docker push $ECR_BACKEND_URL:latest

# Build and push frontend
echo "🎨 Building frontend image..."
docker build -t cloudweave-frontend ./frontend
docker tag cloudweave-frontend:latest $ECR_FRONTEND_URL:latest
echo "📤 Pushing frontend image..."
docker push $ECR_FRONTEND_URL:latest

# Update ECS services to use new images
echo "🔄 Updating ECS services..."
aws ecs update-service --cluster cloudweave-cluster --service cloudweave-backend --force-new-deployment --region $AWS_REGION > /dev/null
aws ecs update-service --cluster cloudweave-cluster --service cloudweave-frontend --force-new-deployment --region $AWS_REGION > /dev/null

echo ""
echo "🎉 Deployment completed successfully!"
echo ""
echo "📱 Your application is available at:"
echo "   $LOAD_BALANCER_URL"
echo ""
echo "⏳ Note: It may take 5-10 minutes for the services to be fully healthy"
echo ""
echo "🔍 To check deployment status:"
echo "   aws ecs describe-services --cluster cloudweave-cluster --services cloudweave-backend cloudweave-frontend --region $AWS_REGION"
echo ""
echo "📝 To view logs:"
echo "   aws logs tail /ecs/cloudweave-backend --follow --region $AWS_REGION"
echo "   aws logs tail /ecs/cloudweave-frontend --follow --region $AWS_REGION"