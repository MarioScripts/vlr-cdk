import { Repository } from "aws-cdk-lib/aws-ecr";
import {
  ContainerImage,
  FargateTaskDefinition,
  LogDriver,
} from "aws-cdk-lib/aws-ecs";
import { PolicyStatement, Role, ServicePrincipal } from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";

export default class VlrTask extends Construct {
  public readonly task: FargateTaskDefinition;
  constructor(scope: Construct, id: string) {
    super(scope, id);

    // Execution role for task
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

    // Task
    this.task = new FargateTaskDefinition(this, id, {
      family: "vlr-api-task",
      executionRole,
    });
    this.task.addContainer("vlr-api-container", {
      containerName: "vlr-api",
      image: ContainerImage.fromEcrRepository(
        Repository.fromRepositoryName(this, "vlr-ecr-repo", "vlr-api"),
        "latest"
      ),
      logging: LogDriver.awsLogs({ streamPrefix: "vlr-api" }),
      portMappings: [
        {
          containerPort: this.node.tryGetContext("VLRAPI_GRPC_PORT"),
          hostPort: this.node.tryGetContext("VLRAPI_GRPC_PORT"),
        },
        {
          containerPort: this.node.tryGetContext("VLRAPI_GATEWAY_PORT"),
          hostPort: this.node.tryGetContext("VLRAPI_GATEWAY_PORT"),
        },
      ],
    });
  }
}
