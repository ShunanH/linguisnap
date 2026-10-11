"""Publish an Express service and fail on rollback, timeout, or a missing endpoint."""
import os
import time
from datetime import datetime, timezone
from urllib.parse import urlsplit

import boto3
from botocore.exceptions import ClientError


def endpoint_url(value):
    value = (value or '').strip()
    if not value:
        raise RuntimeError('ECS returned no endpoint; health check was not attempted')
    url = value if '://' in value else 'https://' + value
    parsed = urlsplit(url)
    if parsed.scheme != 'https' or not parsed.hostname or parsed.username or parsed.password:
        raise RuntimeError('ECS returned an invalid HTTPS endpoint')
    return url.rstrip('/')


def deployment_result(deployment):
    status = deployment.get('status', '')
    if status == 'SUCCESSFUL':
        return True
    if status.startswith('ROLLBACK') or status in ('FAILED', 'STOPPED', 'STOP_REQUESTED'):
        raise RuntimeError(f"Deployment {status}: {deployment.get('statusReason', 'See ECS service events below')}")
    return False


def main():
    required = ['AWS_REGION', 'IMAGE', 'EXECUTION_ROLE', 'INFRASTRUCTURE_ROLE', 'TOKEN_SECRET_ARN']
    for name in required:
        if not os.environ.get(name, '').strip():
            raise RuntimeError(f'Missing deployment setting: {name}')
    ecs = boto3.client('ecs', region_name=os.environ['AWS_REGION'])
    account = os.environ['EXECUTION_ROLE'].split(':')[4]
    arn = f"arn:aws:ecs:{os.environ['AWS_REGION']}:{account}:service/default/linguisnap-api"
    config = dict(
        executionRoleArn=os.environ['EXECUTION_ROLE'],
        infrastructureRoleArn=os.environ['INFRASTRUCTURE_ROLE'],
        primaryContainer=dict(
            image=os.environ['IMAGE'], containerPort=8000,
            environment=[dict(name='ANALYSIS_TIMEOUT_SECONDS', value='50')],
            secrets=[dict(name='INTERNAL_API_TOKEN', valueFrom=os.environ['TOKEN_SECRET_ARN'])],
            awsLogsConfiguration=dict(logGroup='/linguisnap/api', logStreamPrefix='api'),
        ),
        cpu='256', memory='512', healthCheckPath='/health',
        scalingTarget=dict(minTaskCount=1, maxTaskCount=1),
    )
    try:
        try:
            response = ecs.describe_services(cluster='default', services=['linguisnap-api'])
            unexpected = [f for f in response.get('failures', []) if f.get('reason') != 'MISSING']
            if unexpected:
                raise RuntimeError(f'ECS lookup failed: {unexpected}')
            exists = any(s['status'] != 'INACTIVE' for s in response.get('services', []))
        except ClientError as error:
            if error.response['Error']['Code'] != 'ClusterNotFoundException':
                raise
            exists = False
        started = datetime.now(timezone.utc)
        if exists:
            update_config = {k: v for k, v in config.items() if k != 'infrastructureRoleArn'}
            ecs.update_express_gateway_service(serviceArn=arn, **update_config)
        else:
            ecs.create_express_gateway_service(serviceName='linguisnap-api', cluster='default', **config)
        deadline = time.monotonic() + 1200
        deployment_arn = None
        while time.monotonic() < deadline:
            if deployment_arn is None:
                deployments = ecs.list_service_deployments(
                    cluster='default', service=arn, createdAt={'after': started}
                ).get('serviceDeployments', [])
                if deployments:
                    deployment_arn = max(deployments, key=lambda d: d['createdAt'])['serviceDeploymentArn']
            if deployment_arn:
                response = ecs.describe_service_deployments(serviceDeploymentArns=[deployment_arn])
                if response.get('failures'):
                    raise RuntimeError(f"Deployment lookup failed: {response['failures']}")
                deployments = response.get('serviceDeployments', [])
                if deployments:
                    print('Deployment:', deployments[0].get('status'), flush=True)
                    if deployment_result(deployments[0]):
                        service = ecs.describe_express_gateway_service(serviceArn=arn)['service']
                        endpoints = [p.get('endpoint') for c in service.get('activeConfigurations', [])
                                     if c.get('primaryContainer', {}).get('image') == os.environ['IMAGE']
                                     for p in c.get('ingressPaths', []) if p.get('endpoint')]
                        url = endpoint_url(endpoints[0] if endpoints else None)
                        with open(os.environ['GITHUB_OUTPUT'], 'a') as output:
                            output.write(f'endpoint={url}\n')
                        return
            time.sleep(15)
        raise RuntimeError('ECS deployment did not succeed within 20 minutes')
    except Exception:
        try:
            response = ecs.describe_services(cluster='default', services=['linguisnap-api'])
            for service in response.get('services', []):
                for deployment in service.get('deployments', []):
                    print('ECS rollout:', deployment.get('rolloutState'), deployment.get('rolloutStateReason'), flush=True)
                for event in service.get('events', [])[:10]:
                    print('ECS event:', event.get('createdAt'), event.get('message'), flush=True)
        except Exception as diagnostic_error:
            print('Could not read ECS events:', diagnostic_error, flush=True)
        raise


if __name__ == '__main__':
    main()
