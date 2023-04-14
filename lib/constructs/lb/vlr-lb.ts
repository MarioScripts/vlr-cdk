import { IVpc, SubnetType } from "aws-cdk-lib/aws-ec2";
import {
  NetworkLoadBalancer,
  NetworkTargetGroup,
} from "aws-cdk-lib/aws-elasticloadbalancingv2";
import { Construct } from "constructs";

export interface VlrNLBResources {
  targetGroup: NetworkTargetGroup;
  vpc: IVpc;
}

export default class VlrLoadBalancer extends Construct {
  public readonly nlb: NetworkLoadBalancer;
  constructor(scope: Construct, id: string, resources: VlrNLBResources) {
    super(scope, id);

    const nlb = new NetworkLoadBalancer(this, id, {
      loadBalancerName: "vlr-nlb",
      vpc: resources.vpc,
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
        defaultTargetGroups: [resources.targetGroup],
      })
    );
  }
}
