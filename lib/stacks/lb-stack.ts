import { Stack, StackProps } from "aws-cdk-lib";
import { SubnetType, Vpc } from "aws-cdk-lib/aws-ec2";
import {
  NetworkLoadBalancer,
  NetworkTargetGroup,
  TargetType
} from "aws-cdk-lib/aws-elasticloadbalancingv2";
import { Construct } from "constructs";

export class LoadBalancerStack extends Stack {
  public readonly vlrTargetGroup: NetworkTargetGroup;
  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props);
    // Target Group
    const vpc = Vpc.fromLookup(this, "default-vpc", { isDefault: true });
    this.vlrTargetGroup = new NetworkTargetGroup(this, "vlr-target-group", {
      targetGroupName: "vlr-api-target",
      targetType: TargetType.IP,
      port: 50051,
      vpc,
    });

    // Load balancer
    const nlb = new NetworkLoadBalancer(this, "vlr-nlb", {
      loadBalancerName: "vlr-nlb",
      vpc,
      internetFacing: true,
      vpcSubnets: {
        subnetType: SubnetType.PUBLIC,
        onePerAz: true,
      },
    });

    // Add listeners
    [80, 443].forEach((port: number) =>
      nlb.addListener(`port-${port}-listener`, {
        port,
        defaultTargetGroups: [this.vlrTargetGroup],
      })
    );
  }
}
