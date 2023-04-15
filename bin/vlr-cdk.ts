#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { LoadBalancerStack } from "../lib/stacks/lb-stack";
import { ECSStack } from "../lib/stacks/ecs-stack";

const app = new cdk.App();
const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: app.node.tryGetContext("region") || process.env.CDK_DEFAULT_REGION,
};
const lbStack = new LoadBalancerStack(app, "LoadBalancerStack", {
  env,
});

new ECSStack(
  app,
  "ECSStack",
  {
    env,
  },
  {
    gatewayTargetGroup: lbStack.gatewayTargetGroup,
    grpcTargetGroup: lbStack.grpcTargetGroup,
  }
);
