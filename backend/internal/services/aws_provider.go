package services

import (
	"context"
	"fmt"
	"strings"
	"time"

	"cloudweave/internal/models"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/cloudwatch"
	"github.com/aws/aws-sdk-go-v2/service/cloudwatch/types"
	"github.com/aws/aws-sdk-go-v2/service/ec2"
	ec2types "github.com/aws/aws-sdk-go-v2/service/ec2/types"
	"github.com/aws/aws-sdk-go-v2/service/pricing"
	"github.com/aws/aws-sdk-go-v2/service/rds"
	rdstypes "github.com/aws/aws-sdk-go-v2/service/rds/types"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	s3types "github.com/aws/aws-sdk-go-v2/service/s3/types"
)

// RealAWSProvider implements CloudProvider for Amazon Web Services using AWS SDK
type RealAWSProvider struct {
	cfg           aws.Config
	ec2Client     *ec2.Client
	rdsClient     *rds.Client
	s3Client      *s3.Client
	cwClient      *cloudwatch.Client
	pricingClient *pricing.Client
}

// NewRealAWSProvider creates a new AWS provider with real AWS SDK integration
func NewRealAWSProvider(ctx context.Context) (*RealAWSProvider, error) {
	// Load AWS configuration from environment/credentials
	cfg, err := config.LoadDefaultConfig(ctx,
		config.WithRegion("us-east-1"), // Default region, can be overridden
	)
	if err != nil {
		return nil, fmt.Errorf("failed to load AWS config: %w", err)
	}

	return &RealAWSProvider{
		cfg:           cfg,
		ec2Client:     ec2.NewFromConfig(cfg),
		rdsClient:     rds.NewFromConfig(cfg),
		s3Client:      s3.NewFromConfig(cfg),
		cwClient:      cloudwatch.NewFromConfig(cfg),
		pricingClient: pricing.NewFromConfig(cfg),
	}, nil
}

// CreateResource creates infrastructure resources in AWS
func (p *RealAWSProvider) CreateResource(ctx context.Context, infra *models.Infrastructure) (string, error) {
	switch infra.Type {
	case models.InfraTypeServer:
		return p.createEC2Instance(ctx, infra)
	case models.InfraTypeDatabase:
		return p.createRDSInstance(ctx, infra)
	case models.InfraTypeStorage:
		return p.createS3Bucket(ctx, infra)
	default:
		return "", fmt.Errorf("unsupported infrastructure type: %s", infra.Type)
	}
}

// createEC2Instance creates an EC2 instance
func (p *RealAWSProvider) createEC2Instance(ctx context.Context, infra *models.Infrastructure) (string, error) {
	// Extract specifications
	instanceType := "t3.micro" // Default
	if specs, ok := infra.Specifications["instance_type"].(string); ok {
		instanceType = specs
	}

	keyName := ""
	if key, ok := infra.Specifications["key_name"].(string); ok {
		keyName = key
	}

	securityGroups := []string{}
	if sgs, ok := infra.Specifications["security_groups"].([]interface{}); ok {
		for _, sg := range sgs {
			if sgStr, ok := sg.(string); ok {
				securityGroups = append(securityGroups, sgStr)
			}
		}
	}

	// Use Amazon Linux 2 AMI (this should be dynamic based on region)
	amiID := "ami-0c02fb55956c7d316" // Amazon Linux 2 in us-east-1

	input := &ec2.RunInstancesInput{
		ImageId:      aws.String(amiID),
		InstanceType: ec2types.InstanceType(instanceType),
		MinCount:     aws.Int32(1),
		MaxCount:     aws.Int32(1),
		TagSpecifications: []ec2types.TagSpecification{
			{
				ResourceType: ec2types.ResourceTypeInstance,
				Tags: []ec2types.Tag{
					{
						Key:   aws.String("Name"),
						Value: aws.String(infra.Name),
					},
					{
						Key:   aws.String("CloudWeave-ID"),
						Value: aws.String(infra.ID),
					},
					{
						Key:   aws.String("CloudWeave-Managed"),
						Value: aws.String("true"),
					},
				},
			},
		},
	}

	if keyName != "" {
		input.KeyName = aws.String(keyName)
	}

	if len(securityGroups) > 0 {
		input.SecurityGroups = securityGroups
	}

	result, err := p.ec2Client.RunInstances(ctx, input)
	if err != nil {
		return "", fmt.Errorf("failed to create EC2 instance: %w", err)
	}

	if len(result.Instances) == 0 {
		return "", fmt.Errorf("no instances created")
	}

	instanceID := *result.Instances[0].InstanceId
	return instanceID, nil
}

// createRDSInstance creates an RDS database instance
func (p *RealAWSProvider) createRDSInstance(ctx context.Context, infra *models.Infrastructure) (string, error) {
	// Extract specifications
	dbInstanceClass := "db.t3.micro" // Default
	if class, ok := infra.Specifications["db_instance_class"].(string); ok {
		dbInstanceClass = class
	}

	engine := "mysql"
	if eng, ok := infra.Specifications["engine"].(string); ok {
		engine = eng
	}

	allocatedStorage := int32(20) // Default 20GB
	if storage, ok := infra.Specifications["allocated_storage"].(float64); ok {
		allocatedStorage = int32(storage)
	}

	dbName := strings.ReplaceAll(strings.ToLower(infra.Name), "-", "")
	if len(dbName) > 63 {
		dbName = dbName[:63]
	}

	input := &rds.CreateDBInstanceInput{
		DBInstanceIdentifier: aws.String(dbName),
		DBInstanceClass:      aws.String(dbInstanceClass),
		Engine:               aws.String(engine),
		AllocatedStorage:     aws.Int32(allocatedStorage),
		MasterUsername:       aws.String("admin"),
		MasterUserPassword:   aws.String("TempPassword123!"), // Should be generated securely
		Tags: []rdstypes.Tag{
			{
				Key:   aws.String("Name"),
				Value: aws.String(infra.Name),
			},
			{
				Key:   aws.String("CloudWeave-ID"),
				Value: aws.String(infra.ID),
			},
			{
				Key:   aws.String("CloudWeave-Managed"),
				Value: aws.String("true"),
			},
		},
	}

	result, err := p.rdsClient.CreateDBInstance(ctx, input)
	if err != nil {
		return "", fmt.Errorf("failed to create RDS instance: %w", err)
	}

	return *result.DBInstance.DBInstanceIdentifier, nil
}

// createS3Bucket creates an S3 bucket
func (p *RealAWSProvider) createS3Bucket(ctx context.Context, infra *models.Infrastructure) (string, error) {
	bucketName := strings.ToLower(fmt.Sprintf("cloudweave-%s-%d",
		strings.ReplaceAll(infra.Name, " ", "-"), time.Now().Unix()))

	input := &s3.CreateBucketInput{
		Bucket: aws.String(bucketName),
	}

	// Add region constraint if not us-east-1
	if infra.Region != "us-east-1" {
		input.CreateBucketConfiguration = &s3types.CreateBucketConfiguration{
			LocationConstraint: s3types.BucketLocationConstraint(infra.Region),
		}
	}

	_, err := p.s3Client.CreateBucket(ctx, input)
	if err != nil {
		return "", fmt.Errorf("failed to create S3 bucket: %w", err)
	}

	// Add tags
	_, err = p.s3Client.PutBucketTagging(ctx, &s3.PutBucketTaggingInput{
		Bucket: aws.String(bucketName),
		Tagging: &s3types.Tagging{
			TagSet: []s3types.Tag{
				{
					Key:   aws.String("Name"),
					Value: aws.String(infra.Name),
				},
				{
					Key:   aws.String("CloudWeave-ID"),
					Value: aws.String(infra.ID),
				},
				{
					Key:   aws.String("CloudWeave-Managed"),
					Value: aws.String("true"),
				},
			},
		},
	})
	if err != nil {
		// Don't fail if tagging fails
		fmt.Printf("Warning: failed to tag S3 bucket: %v\n", err)
	}

	return bucketName, nil
}

// GetResourceStatus gets the current status from AWS
func (p *RealAWSProvider) GetResourceStatus(ctx context.Context, externalID string) (string, error) {
	// Determine resource type based on external ID format
	if strings.HasPrefix(externalID, "i-") {
		return p.getEC2InstanceStatus(ctx, externalID)
	} else if strings.Contains(externalID, "cloudweave-") && !strings.HasPrefix(externalID, "i-") {
		// Likely an S3 bucket
		return p.getS3BucketStatus(ctx, externalID)
	} else {
		// Likely an RDS instance
		return p.getRDSInstanceStatus(ctx, externalID)
	}
}

// getEC2InstanceStatus gets EC2 instance status
func (p *RealAWSProvider) getEC2InstanceStatus(ctx context.Context, instanceID string) (string, error) {
	input := &ec2.DescribeInstancesInput{
		InstanceIds: []string{instanceID},
	}

	result, err := p.ec2Client.DescribeInstances(ctx, input)
	if err != nil {
		return models.InfraStatusError, fmt.Errorf("failed to describe EC2 instance: %w", err)
	}

	if len(result.Reservations) == 0 || len(result.Reservations[0].Instances) == 0 {
		return models.InfraStatusTerminated, nil
	}

	instance := result.Reservations[0].Instances[0]
	switch instance.State.Name {
	case ec2types.InstanceStateNamePending:
		return models.InfraStatusPending, nil
	case ec2types.InstanceStateNameRunning:
		return models.InfraStatusRunning, nil
	case ec2types.InstanceStateNameStopped, ec2types.InstanceStateNameStopping:
		return models.InfraStatusStopped, nil
	case ec2types.InstanceStateNameTerminated:
		return models.InfraStatusTerminated, nil
	default:
		return models.InfraStatusError, nil
	}
}

// getRDSInstanceStatus gets RDS instance status
func (p *RealAWSProvider) getRDSInstanceStatus(ctx context.Context, dbInstanceID string) (string, error) {
	input := &rds.DescribeDBInstancesInput{
		DBInstanceIdentifier: aws.String(dbInstanceID),
	}

	result, err := p.rdsClient.DescribeDBInstances(ctx, input)
	if err != nil {
		return models.InfraStatusError, fmt.Errorf("failed to describe RDS instance: %w", err)
	}

	if len(result.DBInstances) == 0 {
		return models.InfraStatusTerminated, nil
	}

	dbInstance := result.DBInstances[0]
	switch *dbInstance.DBInstanceStatus {
	case "creating":
		return models.InfraStatusPending, nil
	case "available":
		return models.InfraStatusRunning, nil
	case "stopped":
		return models.InfraStatusStopped, nil
	case "deleting":
		return models.InfraStatusTerminated, nil
	default:
		return models.InfraStatusError, nil
	}
}

// getS3BucketStatus gets S3 bucket status
func (p *RealAWSProvider) getS3BucketStatus(ctx context.Context, bucketName string) (string, error) {
	_, err := p.s3Client.HeadBucket(ctx, &s3.HeadBucketInput{
		Bucket: aws.String(bucketName),
	})
	if err != nil {
		return models.InfraStatusTerminated, nil
	}
	return models.InfraStatusRunning, nil
}

// GetResourceMetrics retrieves CloudWatch metrics for AWS resources
func (p *RealAWSProvider) GetResourceMetrics(ctx context.Context, externalID string) (map[string]interface{}, error) {
	if strings.HasPrefix(externalID, "i-") {
		return p.getEC2Metrics(ctx, externalID)
	} else if strings.Contains(externalID, "cloudweave-") && !strings.HasPrefix(externalID, "i-") {
		return p.getS3Metrics(ctx, externalID)
	} else {
		return p.getRDSMetrics(ctx, externalID)
	}
}

// getEC2Metrics gets CloudWatch metrics for EC2 instances
func (p *RealAWSProvider) getEC2Metrics(ctx context.Context, instanceID string) (map[string]interface{}, error) {
	endTime := time.Now()
	startTime := endTime.Add(-1 * time.Hour)

	metrics := map[string]interface{}{
		"timestamp": endTime.Unix(),
	}

	// CPU Utilization
	cpuInput := &cloudwatch.GetMetricStatisticsInput{
		Namespace:  aws.String("AWS/EC2"),
		MetricName: aws.String("CPUUtilization"),
		Dimensions: []types.Dimension{
			{
				Name:  aws.String("InstanceId"),
				Value: aws.String(instanceID),
			},
		},
		StartTime:  aws.Time(startTime),
		EndTime:    aws.Time(endTime),
		Period:     aws.Int32(300), // 5 minutes
		Statistics: []types.Statistic{types.StatisticAverage},
	}

	cpuResult, err := p.cwClient.GetMetricStatistics(ctx, cpuInput)
	if err == nil && len(cpuResult.Datapoints) > 0 {
		metrics["cpu_utilization"] = *cpuResult.Datapoints[len(cpuResult.Datapoints)-1].Average
	}

	// Network In
	netInInput := &cloudwatch.GetMetricStatisticsInput{
		Namespace:  aws.String("AWS/EC2"),
		MetricName: aws.String("NetworkIn"),
		Dimensions: []types.Dimension{
			{
				Name:  aws.String("InstanceId"),
				Value: aws.String(instanceID),
			},
		},
		StartTime:  aws.Time(startTime),
		EndTime:    aws.Time(endTime),
		Period:     aws.Int32(300),
		Statistics: []types.Statistic{types.StatisticSum},
	}

	netInResult, err := p.cwClient.GetMetricStatistics(ctx, netInInput)
	if err == nil && len(netInResult.Datapoints) > 0 {
		metrics["network_in"] = *netInResult.Datapoints[len(netInResult.Datapoints)-1].Sum
	}

	return metrics, nil
}

// getRDSMetrics gets CloudWatch metrics for RDS instances
func (p *RealAWSProvider) getRDSMetrics(ctx context.Context, dbInstanceID string) (map[string]interface{}, error) {
	endTime := time.Now()
	startTime := endTime.Add(-1 * time.Hour)

	metrics := map[string]interface{}{
		"timestamp": endTime.Unix(),
	}

	// CPU Utilization
	cpuInput := &cloudwatch.GetMetricStatisticsInput{
		Namespace:  aws.String("AWS/RDS"),
		MetricName: aws.String("CPUUtilization"),
		Dimensions: []types.Dimension{
			{
				Name:  aws.String("DBInstanceIdentifier"),
				Value: aws.String(dbInstanceID),
			},
		},
		StartTime:  aws.Time(startTime),
		EndTime:    aws.Time(endTime),
		Period:     aws.Int32(300),
		Statistics: []types.Statistic{types.StatisticAverage},
	}

	cpuResult, err := p.cwClient.GetMetricStatistics(ctx, cpuInput)
	if err == nil && len(cpuResult.Datapoints) > 0 {
		metrics["cpu_utilization"] = *cpuResult.Datapoints[len(cpuResult.Datapoints)-1].Average
	}

	return metrics, nil
}

// getS3Metrics gets CloudWatch metrics for S3 buckets
func (p *RealAWSProvider) getS3Metrics(ctx context.Context, bucketName string) (map[string]interface{}, error) {
	metrics := map[string]interface{}{
		"timestamp": time.Now().Unix(),
	}

	// S3 metrics are daily, so we'll return basic info
	metrics["bucket_size"] = 0  // Would need to calculate actual size
	metrics["object_count"] = 0 // Would need to count objects

	return metrics, nil
}

// GetResourceDetails gets detailed information about AWS resources
func (p *RealAWSProvider) GetResourceDetails(ctx context.Context, externalID string) (map[string]interface{}, error) {
	if strings.HasPrefix(externalID, "i-") {
		return p.getEC2Details(ctx, externalID)
	} else if strings.Contains(externalID, "cloudweave-") && !strings.HasPrefix(externalID, "i-") {
		return p.getS3Details(ctx, externalID)
	} else {
		return p.getRDSDetails(ctx, externalID)
	}
}

// getEC2Details gets detailed EC2 instance information
func (p *RealAWSProvider) getEC2Details(ctx context.Context, instanceID string) (map[string]interface{}, error) {
	input := &ec2.DescribeInstancesInput{
		InstanceIds: []string{instanceID},
	}

	result, err := p.ec2Client.DescribeInstances(ctx, input)
	if err != nil {
		return nil, fmt.Errorf("failed to describe EC2 instance: %w", err)
	}

	if len(result.Reservations) == 0 || len(result.Reservations[0].Instances) == 0 {
		return nil, fmt.Errorf("instance not found")
	}

	instance := result.Reservations[0].Instances[0]

	status := models.InfraStatusRunning
	switch instance.State.Name {
	case ec2types.InstanceStateNamePending:
		status = models.InfraStatusPending
	case ec2types.InstanceStateNameStopped, ec2types.InstanceStateNameStopping:
		status = models.InfraStatusStopped
	case ec2types.InstanceStateNameTerminated:
		status = models.InfraStatusTerminated
	}

	details := map[string]interface{}{
		"status": status,
		"specifications": map[string]interface{}{
			"instance_type":     string(instance.InstanceType),
			"instance_id":       *instance.InstanceId,
			"availability_zone": *instance.Placement.AvailabilityZone,
			"vpc_id":            aws.ToString(instance.VpcId),
			"subnet_id":         aws.ToString(instance.SubnetId),
			"public_ip":         aws.ToString(instance.PublicIpAddress),
			"private_ip":        aws.ToString(instance.PrivateIpAddress),
		},
		"costInfo": map[string]interface{}{
			"currency": "USD",
			// Cost calculation would be more complex in reality
			"hourly_cost":  p.getEC2HourlyCost(string(instance.InstanceType)),
			"monthly_cost": p.getEC2HourlyCost(string(instance.InstanceType)) * 24 * 30,
		},
	}

	return details, nil
}

// getRDSDetails gets detailed RDS instance information
func (p *RealAWSProvider) getRDSDetails(ctx context.Context, dbInstanceID string) (map[string]interface{}, error) {
	input := &rds.DescribeDBInstancesInput{
		DBInstanceIdentifier: aws.String(dbInstanceID),
	}

	result, err := p.rdsClient.DescribeDBInstances(ctx, input)
	if err != nil {
		return nil, fmt.Errorf("failed to describe RDS instance: %w", err)
	}

	if len(result.DBInstances) == 0 {
		return nil, fmt.Errorf("RDS instance not found")
	}

	dbInstance := result.DBInstances[0]

	status := models.InfraStatusRunning
	switch *dbInstance.DBInstanceStatus {
	case "creating":
		status = models.InfraStatusPending
	case "stopped":
		status = models.InfraStatusStopped
	case "deleting":
		status = models.InfraStatusTerminated
	}

	details := map[string]interface{}{
		"status": status,
		"specifications": map[string]interface{}{
			"db_instance_class": *dbInstance.DBInstanceClass,
			"engine":            *dbInstance.Engine,
			"engine_version":    aws.ToString(dbInstance.EngineVersion),
			"allocated_storage": *dbInstance.AllocatedStorage,
			"availability_zone": aws.ToString(dbInstance.AvailabilityZone),
			"endpoint":          aws.ToString(dbInstance.Endpoint.Address),
			"port":              *dbInstance.Endpoint.Port,
		},
		"costInfo": map[string]interface{}{
			"currency":     "USD",
			"hourly_cost":  p.getRDSHourlyCost(*dbInstance.DBInstanceClass),
			"monthly_cost": p.getRDSHourlyCost(*dbInstance.DBInstanceClass) * 24 * 30,
		},
	}

	return details, nil
}

// getS3Details gets detailed S3 bucket information
func (p *RealAWSProvider) getS3Details(ctx context.Context, bucketName string) (map[string]interface{}, error) {
	// Check if bucket exists
	_, err := p.s3Client.HeadBucket(ctx, &s3.HeadBucketInput{
		Bucket: aws.String(bucketName),
	})
	if err != nil {
		return nil, fmt.Errorf("failed to access S3 bucket: %w", err)
	}

	details := map[string]interface{}{
		"status": models.InfraStatusRunning,
		"specifications": map[string]interface{}{
			"bucket_name": bucketName,
			"region":      p.cfg.Region,
		},
		"costInfo": map[string]interface{}{
			"currency":     "USD",
			"monthly_cost": 0.023, // Basic S3 storage cost per GB
		},
	}

	return details, nil
}

// DeleteResource deletes AWS resources
func (p *RealAWSProvider) DeleteResource(ctx context.Context, externalID string) error {
	if strings.HasPrefix(externalID, "i-") {
		return p.deleteEC2Instance(ctx, externalID)
	} else if strings.Contains(externalID, "cloudweave-") && !strings.HasPrefix(externalID, "i-") {
		return p.deleteS3Bucket(ctx, externalID)
	} else {
		return p.deleteRDSInstance(ctx, externalID)
	}
}

// deleteEC2Instance terminates an EC2 instance
func (p *RealAWSProvider) deleteEC2Instance(ctx context.Context, instanceID string) error {
	input := &ec2.TerminateInstancesInput{
		InstanceIds: []string{instanceID},
	}

	_, err := p.ec2Client.TerminateInstances(ctx, input)
	if err != nil {
		return fmt.Errorf("failed to terminate EC2 instance: %w", err)
	}

	return nil
}

// deleteRDSInstance deletes an RDS instance
func (p *RealAWSProvider) deleteRDSInstance(ctx context.Context, dbInstanceID string) error {
	input := &rds.DeleteDBInstanceInput{
		DBInstanceIdentifier: aws.String(dbInstanceID),
		SkipFinalSnapshot:    aws.Bool(true), // For demo purposes
	}

	_, err := p.rdsClient.DeleteDBInstance(ctx, input)
	if err != nil {
		return fmt.Errorf("failed to delete RDS instance: %w", err)
	}

	return nil
}

// deleteS3Bucket deletes an S3 bucket
func (p *RealAWSProvider) deleteS3Bucket(ctx context.Context, bucketName string) error {
	// First, delete all objects in the bucket
	listInput := &s3.ListObjectsV2Input{
		Bucket: aws.String(bucketName),
	}

	for {
		listResult, err := p.s3Client.ListObjectsV2(ctx, listInput)
		if err != nil {
			return fmt.Errorf("failed to list S3 objects: %w", err)
		}

		if len(listResult.Contents) == 0 {
			break
		}

		// Delete objects
		var objectIds []s3types.ObjectIdentifier
		for _, obj := range listResult.Contents {
			objectIds = append(objectIds, s3types.ObjectIdentifier{
				Key: obj.Key,
			})
		}

		deleteInput := &s3.DeleteObjectsInput{
			Bucket: aws.String(bucketName),
			Delete: &s3types.Delete{
				Objects: objectIds,
			},
		}

		_, err = p.s3Client.DeleteObjects(ctx, deleteInput)
		if err != nil {
			return fmt.Errorf("failed to delete S3 objects: %w", err)
		}

		if !*listResult.IsTruncated {
			break
		}
		listInput.ContinuationToken = listResult.NextContinuationToken
	}

	// Now delete the bucket
	_, err := p.s3Client.DeleteBucket(ctx, &s3.DeleteBucketInput{
		Bucket: aws.String(bucketName),
	})
	if err != nil {
		return fmt.Errorf("failed to delete S3 bucket: %w", err)
	}

	return nil
}

// Helper functions for cost estimation (simplified)
func (p *RealAWSProvider) getEC2HourlyCost(instanceType string) float64 {
	// Simplified cost mapping - in reality, this would use AWS Pricing API
	costs := map[string]float64{
		"t3.micro":  0.0104,
		"t3.small":  0.0208,
		"t3.medium": 0.0416,
		"t3.large":  0.0832,
		"t3.xlarge": 0.1664,
	}

	if cost, exists := costs[instanceType]; exists {
		return cost
	}
	return 0.05 // Default estimate
}

func (p *RealAWSProvider) getRDSHourlyCost(instanceClass string) float64 {
	// Simplified cost mapping
	costs := map[string]float64{
		"db.t3.micro":  0.017,
		"db.t3.small":  0.034,
		"db.t3.medium": 0.068,
		"db.t3.large":  0.136,
	}

	if cost, exists := costs[instanceClass]; exists {
		return cost
	}
	return 0.05 // Default estimate
}
