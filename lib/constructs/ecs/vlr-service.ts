import {
    IVpc,
  Peer,
  Port,
  SecurityGroup,
  SubnetType
} from "aws-cdk-lib/aws-ec2";
import {
  Cluster,
  FargateService,
  FargateTaskDefinition
} from "aws-cdk-lib/aws-ecs";
import { Construct } from "constructs";

export interface VlrServiceResources {
  cluster: Cluster;
  task: FargateTaskDefinition;
  vpc: IVpc;
}

export default class VlrService extends Construct {
  public readonly service: FargateService;
  constructor(scope: Construct, id: string, resources: VlrServiceResources) {
    super(scope, id);

    // SG
    const vlrSg = new SecurityGroup(this, "vlr-svc-sg", {
      securityGroupName: "vlr-sg",
      vpc: resources.vpc,
    });
    vlrSg.addIngressRule(Peer.anyIpv4(), Port.tcp(this.node.tryGetContext("VLRAPI_CONTAINER_PORT")));

    // Service
    this.service = new FargateService(this, id, {
      serviceName: "vlr-api-service",
      cluster: resources.cluster,
      taskDefinition: resources.task,
      assignPublicIp: true,
      vpcSubnets: {
        subnetType: SubnetType.PUBLIC,
        onePerAz: true,
      },
      securityGroups: [vlrSg],
    });
  }
}
