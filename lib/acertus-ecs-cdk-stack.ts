import * as cdk from '@aws-cdk/core';
import * as ec2 from "@aws-cdk/aws-ec2";
import * as ecs from "@aws-cdk/aws-ecs";
import * as ecs_patterns from "@aws-cdk/aws-ecs-patterns";
import * as iam from "@aws-cdk/aws-iam";
import * as elbv2 from '@aws-cdk/aws-elasticloadbalancingv2';
//import * as s3deploy from "@aws-cdk/aws-s3-deployment";
import * as autoscaling from '@aws-cdk/aws-autoscaling';
import { Vpc } from '@aws-cdk/aws-ec2';
import * as ecr from "@aws-cdk/aws-ecr";
import * as s3 from "@aws-cdk/aws-s3";
import * as route53 from "@aws-cdk/aws-route53";
import * as route53targets from "@aws-cdk/aws-route53-targets";
import * as certificatemanager from "@aws-cdk/aws-certificatemanager";

export class AcertusEcsCdkStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const routecertificate = certificatemanager.Certificate.fromCertificateArn(this, "certificate", "	arn:aws:acm:ap-south-1:665106695518:certificate/d55e09cc-f9e7-4b8e-9c69-0d85bcd24436");
    //const cloudfronturl = "arn:aws:cloudfront::850805969385:distribution/E3SXCGGDWS0B0P";
    const clientPrefix = "ADMINUI";
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

    // The code that defines your stack goes here
    const cluster = new ecs.Cluster(this, `${clientPrefix}-cluster`, {
      clusterName: `${clientPrefix}-cluster`,
      vpc: adminvpc
    });

    const repository = new ecr.Repository(this, `${clientPrefix}-repository`, {
      repositoryName: "665106695518.dkr.ecr.ap-south-1.amazonaws.com/adminui",
    });

    //Application Load Balancer
    const asg = new autoscaling.AutoScalingGroup(this, "ASG", {
      //adminvpc
      vpc: adminvpc,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T2, ec2.InstanceSize.MICRO),
      machineImage: new ec2.AmazonLinuxImage(),
    });

    //targetgroup
    const targetGroupHttp = new elbv2.ApplicationTargetGroup(
      this,
      `${clientPrefix}-target`,
      {
        port: 80,
        vpc: adminvpc,
        protocol: elbv2.ApplicationProtocol.HTTP,
        targetType: elbv2.TargetType.IP,
      }
    );

    targetGroupHttp.configureHealthCheck({
      path: "/health",
      protocol: elbv2.Protocol.HTTP,
    });

    const lb = new elbv2.ApplicationLoadBalancer(this, `${clientPrefix}-elb`, {
      vpc: adminvpc,
      internetFacing: true,
      vpcSubnets: {
        subnets: adminvpc.publicSubnets
      }
    });

    //elbv2.ApplicationLoadBalancer.fromLookup()
    const listener = lb.addListener("Listener", {
      open: true,
      port: 443,
      certificates: [routecertificate]
    });

    listener.addTargetGroups(`${clientPrefix}-tg`, {
      targetGroups: [targetGroupHttp],
    });

    const elbSG = new ec2.SecurityGroup(this, `${clientPrefix}-elbSG`, {
      vpc: adminvpc,
      allowAllOutbound: true,
    });

    elbSG.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      "Allow https traffic"
    );

    lb.addSecurityGroup(elbSG);

    //S3 Code
    const bucket = new s3.Bucket(this, `${clientPrefix}-s3-bucket`, {
      bucketName: "adminui-assets",
      publicReadAccess: true,
      websiteIndexDocument: 'index.html',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      cors: [
        {
          allowedOrigins: ["*"],
          allowedMethods: [s3.HttpMethods.GET],
          maxAge: 3000,
        },
      ],
    });
/*
    // uploads index.html to s3 bucket
    new s3deploy.BucketDeployment(this, "AcertusFinalcicd-Website", {
      sources: [s3deploy.Source.asset('./build')],
      destinationBucket: bucket,
    });

    bucket.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: "Grant Cloudfront Origin Access Identity access to S3 bucket",
        actions: ["s3:GetObject"],
        resources: [bucket.bucketArn + "/admin/"],
        principals: [cloudfronturl.       cloudfrontOAI.grantPrincipal],
      })
    ); */

    const taskRole = new iam.Role(this, `${clientPrefix}-task-role`, {
      assumedBy: new iam.ServicePrincipal("ecs-tasks.amazonaws.com"),
      roleName: `${clientPrefix}-task-role`,
      description: "Role that the api task definitions use to run the api code",
    });

    taskRole.attachInlinePolicy(
      new iam.Policy(this, `${clientPrefix}-task-policy`, {
        statements: [
          new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: ["S3:*"],
            resources: [bucket.bucketArn],
          }),
          new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: ["dynamodb:*"],
            resources: ["*"],
          }),
        ],
      })
    );

    const taskDefinition = new ecs.TaskDefinition(
      this,
      `${clientPrefix}-task`,
      {
        family: `${clientPrefix}-task`,
        compatibility: ecs.Compatibility.EC2_AND_FARGATE,
        cpu: "256",
        memoryMiB: "512",
        networkMode: ecs.NetworkMode.AWS_VPC,
        taskRole: taskRole
      }
    );

    const image = ecs.RepositoryImage.fromEcrRepository(repository, "latest");

    const container = taskDefinition.addContainer(`${clientPrefix}-container`, {
      image: image,
      memoryLimitMiB: 512
    });

    container.addPortMappings({ containerPort: 8080 });

    const ecsSG = new ec2.SecurityGroup(this, `${clientPrefix}-ecsSG`, {
      vpc: adminvpc,
      allowAllOutbound: true,
    });

    ecsSG.connections.allowFrom(
      elbSG,
      ec2.Port.allTcp(),
      "Application load balancer"
    );
/*
    // Create a load-balanced Fargate service and make it public
    new ecs_patterns.ApplicationLoadBalancedFargateService(this, "MyFargateService", {
      cluster: cluster, // Required
      cpu: 512, // Default is 256
      desiredCount: 3, // Default is 1
      taskImageOptions: { image: ecs.ContainerImage.fromRegistry("665106695518.dkr.ecr.ap-south-1.amazonaws.com/adminui") },
      memoryLimitMiB: 2048, // Default is 512
      publicLoadBalancer: true,
      listenerPort: 8080
    });  */




    // Instantiate an Amazon ECS Service
    

    const service = new ecs.FargateService(this, `${clientPrefix}-service`, {
      cluster,
      desiredCount: 1,
      taskDefinition,
      securityGroups: [ecsSG],
      vpcSubnets: {
        subnets: adminvpc.privateSubnets
      }
    });

    service.attachToApplicationTargetGroup(targetGroupHttp);
  }
}
