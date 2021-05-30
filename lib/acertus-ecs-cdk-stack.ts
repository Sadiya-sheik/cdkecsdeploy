import * as cdk from '@aws-cdk/core';
import * as ec2 from "@aws-cdk/aws-ec2";
import * as ecs from "@aws-cdk/aws-ecs";
import * as ecs_patterns from "@aws-cdk/aws-ecs-patterns";

export class AcertusEcsCdkStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // New VPC creation
    const adminvpc = new ec2.Vpc(this, "Acertus-Admin-Vpc", {
      maxAzs: 2,
      cidr: "10.0.0.0/16",
      natGateways: 1,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'adminpublicsub',
          subnetType: ec2.SubnetType.PUBLIC
        },
        {
          cidrMask: 24,
          name: 'adminpriivatesub',
          subnetType: ec2.SubnetType.PRIVATE
        }]
      
    });
    /*
        //Load Balancer
        const asg = new autoscaling.AutoScalingGroup(this, 'ASG', {
          vpc,
          instanceType: ec2.InstanceType.of(ec2.InstanceClass.T2, ec2.InstanceSize.MICRO),
          machineImage: new ec2.AmazonLinuxImage(),
        });
    
        const lb = new elbv2.ApplicationLoadBalancer(this, 'LB', {
          vpc,
          internetFacing: true
        });
    
        const listener = lb.addListener('Listener', {
          port: 80,
        });
    
        listener.addTargets('Target', {
          port: 80,
          targets: [asg]
        });
    
        listener.connections.allowDefaultPortFromAnyIpv4('Open to the world');
    
        asg.scaleOnRequestCount('AModestLoad', {
          targetRequestsPerSecond: 1
        }); 
        //Load balancer code ends
    */
        //New cluster creation
        const cluster = new ecs.Cluster(this, "MyCluster", {
          vpc: adminvpc
        });
    
        // Create a load-balanced Fargate service and make it public
        new ecs_patterns.ApplicationLoadBalancedFargateService(this, "MyFargateService", {
          cluster: cluster, // Required
          cpu: 512, // Default is 256
          desiredCount: 6, // Default is 1
          taskImageOptions: { image: ecs.ContainerImage.fromRegistry(${{ secrets.ECR_REGISTRY }}) },
          memoryLimitMiB: 2048, // Default is 512
          publicLoadBalancer: true // Default is false
        });
    
        // Add capacity to it
        cluster.addCapacity('DefaultAutoScalingGroupCapacity', {
          instanceType: new ec2.InstanceType("t2.xlarge"),
          desiredCapacity: 3,
        });
    
        const fargatetaskDefinition = new ecs.FargateTaskDefinition(this, 'TaskDef');
    
        fargatetaskDefinition.addContainer('DefaultContainer', {
          image: ecs.ContainerImage.fromRegistry("${{ secrets.ECR_REGISTRY }}/${{ secrets.IMAGE_NAME }}"),
          memoryLimitMiB: 512
        });
    
        // Instantiate an Amazon ECS Service
        const ecsService = new ecs.FargateService(this, 'Service', {
          cluster,
          fargatetaskDefinition
        })
  }
}
