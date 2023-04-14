import { Stack, StackProps } from "aws-cdk-lib";
import {
  Vpc
} from "aws-cdk-lib/aws-ec2";
import { Cluster} from "aws-cdk-lib/aws-ecs";
import { NetworkTargetGroup } from "aws-cdk-lib/aws-elasticloadbalancingv2";
import { Construct } from "constructs";
import VlrTask from "../constructs/ecs/vlr-task";
import VlrService from "../constructs/ecs/vlr-service";

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

    const ecsTask = new VlrTask(this, "vlr-api-task");
    const ecsService = new VlrService(this, "vlr-api-service", {
      cluster,
      task: ecsTask.task, 
      vpc
    })

    targetGroup.addTarget(ecsService.service);
  }
}
