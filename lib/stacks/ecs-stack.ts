import { Stack, StackProps } from "aws-cdk-lib";
import {
  SecurityGroup,
  SubnetType,
  Vpc,
  Peer,
  Port,
} from "aws-cdk-lib/aws-ec2";
import {
  Cluster,
  ContainerImage,
  FargateService,
  FargateTaskDefinition,
  LogDriver,
} from "aws-cdk-lib/aws-ecs";
import { NetworkTargetGroup } from "aws-cdk-lib/aws-elasticloadbalancingv2";
import { PolicyStatement, Role, ServicePrincipal } from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";
import { Duration } from "aws-cdk-lib/core"

export class ECSStack extends Stack {
  constructor(
    scope: Construct,
    id: string,
    props: StackProps,
    targetGroup: NetworkTargetGroup
  ) {
    super(scope, id, props);
    const vpc = Vpc.fromLookup(this, "default-vpc", { isDefault: true });

    const cluster = new Cluster(this, "vlr-cluster", {
      clusterName: "vlr-cluster",
      vpc,
    });

    // Task
    const executionRole = new Role(this, "vlr-task-role", {
      roleName: "vlr-task-role",
      assumedBy: new ServicePrincipal("ecs-tasks.amazonaws.com"),
    });
    executionRole.addToPolicy(
      new PolicyStatement({
        actions: [
          "ecr:GetAuthorizationToken",
          "ecr:BatchCheckLayerAvailability",
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchGetImage",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
        ],
        resources: ["*"],
      })
    );
    const ecsTask = new FargateTaskDefinition(this, "vlr-api-task", {
      family: "vlr-api-task",
      executionRole,
    }).addContainer("vlr-api-container", {
      containerName: "vlr-api",
      image: ContainerImage.fromRegistry(
        "991764619378.dkr.ecr.us-east-1.amazonaws.com/vlr-api:latest"
      ),
      logging: LogDriver.awsLogs({streamPrefix: "vlr-api"}),
      portMappings: [{ containerPort: 50051, hostPort: 50051 }],
    });

    // SG
    const vlrSg = new SecurityGroup(this, "vlr-svc-sg", {
      securityGroupName: "vlr-sg",
      vpc,
    });
    vlrSg.addIngressRule(Peer.anyIpv4(), Port.tcp(443));
    vlrSg.addIngressRule(Peer.anyIpv4(), Port.tcp(80));

    // Service
    const ecsService = new FargateService(this, "vlr-api-service", {
      serviceName: "vlr-api-service",
      cluster,
      taskDefinition: ecsTask.taskDefinition,
      assignPublicIp: true,
      vpcSubnets: {
        subnetType: SubnetType.PUBLIC,
      },
      securityGroups: [vlrSg],
      healthCheckGracePeriod: Duration.seconds(2_147_483_647)
    });

    targetGroup.addTarget(ecsService);
  }
}
