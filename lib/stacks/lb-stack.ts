import { Stack, StackProps } from "aws-cdk-lib";
import { Vpc } from "aws-cdk-lib/aws-ec2";
import {
  NetworkTargetGroup,
  TargetType,
} from "aws-cdk-lib/aws-elasticloadbalancingv2";
import { Construct } from "constructs";
import VlrLoadBalancer from "../constructs/lb/vlr-lb";

export class LoadBalancerStack extends Stack {
  public readonly grpcTargetGroup: NetworkTargetGroup;
  public readonly gatewayTargetGroup: NetworkTargetGroup;
  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props);
    const vpc = Vpc.fromLookup(this, "default-vpc", { isDefault: true });

    // Target Group
    this.grpcTargetGroup = new NetworkTargetGroup(
      this,
      "vlr-grpc-target-group",
      {
        targetGroupName: "vlr-api-grpc-target",
        targetType: TargetType.IP,
        port: this.node.tryGetContext("VLRAPI_GRPC_PORT"),
        vpc,
      }
    );

    this.gatewayTargetGroup = new NetworkTargetGroup(
      this,
      "vlr-gateway-target-group",
      {
        targetGroupName: "vlr-api-gateway-target",
        targetType: TargetType.IP,
        port: this.node.tryGetContext("VLRAPI_GATEWAY_PORT"),
        vpc,
      }
    );

    // Load Balancer
    new VlrLoadBalancer(this, "vlr-nlb", {
      vpc,
      grpcTargetGroup: this.grpcTargetGroup,
      gatewayTargetGroup: this.gatewayTargetGroup,
    });
  }
}
