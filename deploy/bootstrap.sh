#!/usr/bin/env bash
set -euo pipefail
export AWS_PAGER=""
region="${1:-eu-central-1}"
repo="${2:-ShunanH/linguisnap}"
cd "$(dirname "$0")"

# Uses your AWS CloudShell login. Never paste AWS credentials into this script.
aws sts get-caller-identity --query Account --output text
vpc=$(aws ec2 describe-vpcs --region "$region" --filters Name=is-default,Values=true --query 'Vpcs[0].VpcId' --output text)
if [[ "$vpc" == "None" || -z "$vpc" ]]; then
  echo "No default VPC in $region. Select a region with a default VPC or configure custom subnets before deploying."
  exit 1
fi
# Preserve OIDC ownership when updating an existing stack.
stack_file=$(mktemp)
error_file=$(mktemp)
trap 'rm -f "$stack_file" "$error_file"' EXIT
if aws cloudformation describe-stacks --region "$region" --stack-name linguisnap-bootstrap >"$stack_file" 2>"$error_file"; then
  existing=$(python3 -c 'import json,sys; p=json.load(open(sys.argv[1]))["Stacks"][0]["Parameters"]; print(next(x["ParameterValue"] for x in p if x["ParameterKey"] == "ExistingOidcArn"))' "$stack_file")
else
  if ! grep -q 'does not exist' "$error_file"; then cat "$error_file" >&2; exit 1; fi
  existing=$(aws iam list-open-id-connect-providers --query "OpenIDConnectProviderList[?ends_with(Arn, 'oidc-provider/token.actions.githubusercontent.com')].Arn | [0]" --output text)
  if [[ "$existing" == "None" ]]; then existing=""; fi
fi
# Create service-linked roles once; do not hide permission or network errors.
for item in 'ecs.amazonaws.com AWSServiceRoleForECS' 'elasticloadbalancing.amazonaws.com AWSServiceRoleForElasticLoadBalancing' 'ecs.application-autoscaling.amazonaws.com AWSServiceRoleForApplicationAutoScaling_ECSService'; do
  read -r service role <<< "$item"
  if ! aws iam get-role --role-name "$role" >/dev/null 2>"$error_file"; then
    if ! grep -q 'NoSuchEntity' "$error_file"; then cat "$error_file" >&2; exit 1; fi
    aws iam create-service-linked-role --aws-service-name "$service" >/dev/null
    aws iam wait role-exists --role-name "$role"
  fi
done
aws cloudformation deploy \
  --region "$region" \
  --stack-name linguisnap-bootstrap \
  --template-file bootstrap.json \
  --capabilities CAPABILITY_IAM \
  --parameter-overrides "GitHubRepository=$repo" "ExistingOidcArn=$existing" \
  --no-fail-on-empty-changeset
aws cloudformation describe-stacks --region "$region" --stack-name linguisnap-bootstrap \
  --query 'Stacks[0].Outputs[].[OutputKey,OutputValue]' --output table
