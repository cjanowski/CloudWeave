# CloudWeave AWS Deployment Guide

This guide will help you deploy CloudWeave to AWS in the simplest way possible using containerized services.

## 🏗️ Architecture Overview

The deployment creates:
- **ECS Fargate** - Containerized frontend and backend services
- **Application Load Balancer** - Routes traffic to services
- **RDS PostgreSQL** - Managed database
- **ECR** - Container image registry
- **VPC** - Isolated network with public/private subnets

## 📋 Prerequisites

1. **AWS Account** with appropriate permissions
2. **AWS CLI** installed and configured
3. **Terraform** installed (v1.0+)
4. **Docker** installed and running

### Install Prerequisites

```bash
# AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Terraform
wget https://releases.hashicorp.com/terraform/1.6.0/terraform_1.6.0_linux_amd64.zip
unzip terraform_1.6.0_linux_amd64.zip
sudo mv terraform /usr/local/bin/

# Configure AWS
aws configure
```

## 🚀 Quick Deployment

### Option 1: One-Click Deployment (Recommended)

```bash
# Make the script executable
chmod +x deploy-to-aws.sh

# Run the deployment
./deploy-to-aws.sh
```

This script will:
1. ✅ Check all prerequisites
2. 🔐 Generate secure passwords
3. 🏗️ Create AWS infrastructure
4. 📦 Build and push Docker images
5. 🚀 Deploy the application

### Option 2: Manual Step-by-Step

1. **Configure Terraform variables:**
```bash
cp aws/terraform/terraform.tfvars.example aws/terraform/terraform.tfvars
# Edit terraform.tfvars with your values
```

2. **Deploy infrastructure:**
```bash
cd aws/terraform
terraform init
terraform plan
terraform apply
```

3. **Build and push images:**
```bash
# Get ECR URLs from Terraform output
ECR_BACKEND=$(terraform output -raw ecr_backend_repository_url)
ECR_FRONTEND=$(terraform output -raw ecr_frontend_repository_url)

# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin $ECR_BACKEND

# Build and push
docker build -t $ECR_BACKEND:latest ./backend
docker push $ECR_BACKEND:latest

docker build -t $ECR_FRONTEND:latest ./frontend  
docker push $ECR_FRONTEND:latest
```

## 🔧 Configuration

### Environment Variables

The deployment automatically configures:
- Database connection
- JWT secrets
- CORS settings
- SSL/TLS encryption

### Custom Domain (Optional)

To use a custom domain:
1. Update `domain_name` in `terraform.tfvars`
2. The load balancer will be accessible at your domain

## 📊 Monitoring & Logs

### View Application Logs
```bash
# Backend logs
aws logs tail /ecs/cloudweave-backend --follow

# Frontend logs  
aws logs tail /ecs/cloudweave-frontend --follow
```

### Check Service Health
```bash
# Service status
aws ecs describe-services --cluster cloudweave-cluster --services cloudweave-backend cloudweave-frontend

# Task health
aws ecs list-tasks --cluster cloudweave-cluster --service-name cloudweave-backend
```

## 🔒 Security Features

- ✅ **VPC Isolation** - Private subnets for applications
- ✅ **Security Groups** - Least-privilege access
- ✅ **RDS Encryption** - Data encrypted at rest
- ✅ **SSL/TLS** - Data encrypted in transit
- ✅ **IAM Roles** - Secure service permissions

## 💰 Cost Optimization

**Estimated Monthly Cost (us-east-1):**
- ECS Fargate (4 tasks): ~$30
- RDS db.t3.micro: ~$15
- Load Balancer: ~$20
- Data Transfer: ~$5
- **Total: ~$70/month**

### Cost Reduction Tips:
- Use `db.t3.micro` for development
- Reduce ECS task count to 1 each
- Use spot instances for non-production

## 🧹 Cleanup

To destroy all AWS resources:

```bash
# One-click destruction
chmod +x destroy-aws.sh
./destroy-aws.sh

# Or manually
cd aws/terraform
terraform destroy
```

## 🔧 Troubleshooting

### Common Issues

**1. ECS Tasks Not Starting**
```bash
# Check task logs
aws ecs describe-tasks --cluster cloudweave-cluster --tasks TASK_ID
```

**2. Database Connection Issues**
- Verify security groups allow port 5432
- Check RDS endpoint in task environment

**3. Load Balancer Health Checks Failing**
- Ensure containers expose correct ports
- Check health check paths are accessible

**4. Image Push Failures**
```bash
# Re-authenticate with ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com
```

### Getting Help

1. **Check CloudWatch Logs** for application errors
2. **Review ECS Service Events** for deployment issues
3. **Verify Security Groups** for connectivity problems
4. **Check Terraform State** for infrastructure issues

## 📈 Scaling

### Auto Scaling (Future Enhancement)
The infrastructure supports auto-scaling:
- ECS services can scale based on CPU/memory
- RDS supports read replicas
- Load balancer handles traffic distribution

### Manual Scaling
```bash
# Scale backend service
aws ecs update-service --cluster cloudweave-cluster --service cloudweave-backend --desired-count 4

# Scale frontend service  
aws ecs update-service --cluster cloudweave-cluster --service cloudweave-frontend --desired-count 3
```

## 🎯 Next Steps

After successful deployment:
1. 🔐 Set up custom domain with SSL certificate
2. 📊 Configure CloudWatch alarms
3. 🔄 Set up CI/CD pipeline
4. 🛡️ Implement WAF for additional security
5. 📈 Configure auto-scaling policies

---

**Need help?** Check the troubleshooting section or review AWS CloudWatch logs for detailed error information.