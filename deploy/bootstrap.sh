#!/usr/bin/env bash
set -euo pipefail
export AWS_PAGER=""
region="${1:-eu-central-1}"
repo="${2:-ShunanH/linguisnap}"
cd "$(dirname "$0")"

aws sts get-caller-identity --query Account --output text
vpc=$(aws ec2 describe-vpcs --region "$region" --filters Name=is-default,Values=true --query 'Vpcs[0].VpcId' --output text)
if [[ "$vpc" == "None" || -z "$vpc" ]]; then
  echo "No default VPC in $region. Select a region with a default VPC or configure custom subnets before deploying."
  exit 1
fi
existing=$(aws iam list-open-id-connect-providers --query "OpenIDConnectProviderList[?ends_with(Arn, 'oidc-provider/token.actions.githubusercontent.com')].Arn | [0]" --output text)
if [[ "$existing" == "None" ]]; then existing=""; fi
aws cloudformation deploy \
  --region "$region" \
  --stack-name linguisnap-bootstrap \
  --template-file bootstrap.json \
  --capabilities CAPABILITY_IAM \
  --parameter-overrides "GitHubRepository=$repo" "ExistingOidcArn=$existing" \
  --no-fail-on-empty-changeset
aws cloudformation describe-stacks --region "$region" --stack-name linguisnap-bootstrap \
  --query 'Stacks[0].Outputs[].[OutputKey,OutputValue]' --output table
