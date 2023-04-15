import { Stack, StackProps } from "aws-cdk-lib";
import { Vpc } from "aws-cdk-lib/aws-ec2";
import { Cluster } from "aws-cdk-lib/aws-ecs";
import {
  ApplicationTargetGroup,
  NetworkTargetGroup,
} from "aws-cdk-lib/aws-elasticloadbalancingv2";
import { Construct } from "constructs";
import VlrTask from "../constructs/ecs/vlr-task";
import VlrService from "../constructs/ecs/vlr-service";
import { TargetGroups } from "../constructs/lb/vlr-lb";

export class ECSStack extends Stack {
  constructor(
    scope: Construct,
    id: string,
    props: StackProps,
    targetGroups: TargetGroups
  ) {
    super(scope, id, props);
    const vpc = Vpc.fromLookup(this, "default-vpc", { isDefault: true });

    const cluster = new Cluster(this, "vlr-cluster", {
      clusterName: "vlr-cluster",
      vpc,
    });

    const ecsTask = new VlrTask(this, "vlr-api-task");
    const ecsService = new VlrService(this, "vlr-api-service", {
      cluster,
      task: ecsTask.task,
      vpc,
    });

    targetGroups.grpcTargetGroup.addTarget(
      ecsService.service.loadBalancerTarget({
        containerName: "vlr-api",
        containerPort: this.node.tryGetContext("VLRAPI_GRPC_PORT"),
      })
    );
    targetGroups.gatewayTargetGroup.addTarget(
      ecsService.service.loadBalancerTarget({
        containerName: "vlr-api",
        containerPort: this.node.tryGetContext("VLRAPI_GATEWAY_PORT"),
      })
    );
  }
}
