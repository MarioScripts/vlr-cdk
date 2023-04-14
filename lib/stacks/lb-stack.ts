import { Stack, StackProps } from "aws-cdk-lib";
import { Vpc } from "aws-cdk-lib/aws-ec2";
import {
  NetworkTargetGroup,
  TargetType
} from "aws-cdk-lib/aws-elasticloadbalancingv2";
import { Construct } from "constructs";
import VlrLoadBalancer from "../constructs/lb/vlr-lb";

export class LoadBalancerStack extends Stack {
  public readonly vlrTargetGroup: NetworkTargetGroup;
  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props);
    const vpc = Vpc.fromLookup(this, "default-vpc", { isDefault: true });
    
    // Target Group
    this.vlrTargetGroup = new NetworkTargetGroup(this, "vlr-target-group", {
      targetGroupName: "vlr-api-target",
      targetType: TargetType.IP,
      port: 50051,
      vpc,
    });

    // Load Balancer
    new VlrLoadBalancer(this, "vlr-nlb", {
      vpc,
      targetGroup: this.vlrTargetGroup,
    });
  }
}
