import importlib.util
import os
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
from datetime import datetime, timezone
import botocore.session
from botocore.validate import validate_parameters

spec = importlib.util.spec_from_file_location('deploy_ecs', Path(__file__).parents[1] / 'deploy_ecs.py')
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)

class FakeECS:
    def __init__(self, status='SUCCESSFUL', exists=True, endpoint='example.com'):
        self.status, self.exists, self.endpoint = status, exists, endpoint
        self.model = botocore.session.get_session().get_service_model('ecs')
        self.submitted = False
    def describe_services(self, **kwargs):
        return {'services': [{'status': 'ACTIVE'}] if self.exists else []}
    def update_express_gateway_service(self, **kwargs):
        validate_parameters(kwargs, self.model.operation_model('UpdateExpressGatewayService').input_shape)
        self.submitted = True
    def create_express_gateway_service(self, **kwargs):
        validate_parameters(kwargs, self.model.operation_model('CreateExpressGatewayService').input_shape)
        self.submitted = True
    def list_service_deployments(self, **kwargs):
        return {'serviceDeployments': [{'createdAt': datetime.now(timezone.utc), 'serviceDeploymentArn':'deployment'}]}
    def describe_service_deployments(self, **kwargs):
        return {'serviceDeployments': [{'status': self.status, 'statusReason': 'test reason'}]}
    def describe_express_gateway_service(self, **kwargs):
        return {'service': {'activeConfigurations': [{'primaryContainer': {'image':'test-image'}, 'ingressPaths': [{'endpoint': self.endpoint}]}]}}

class DeployTests(unittest.TestCase):
    def run_case(self, fake):
        with tempfile.TemporaryDirectory() as tmp:
            output = Path(tmp) / 'output'
            env = {'AWS_REGION':'eu-central-1', 'IMAGE':'test-image',
                   'EXECUTION_ROLE':'arn:aws:iam::123456789012:role/execution',
                   'INFRASTRUCTURE_ROLE':'arn:aws:iam::123456789012:role/infra',
                   'TOKEN_SECRET_ARN':'arn:aws:secretsmanager:eu-central-1:123456789012:secret:test',
                   'GITHUB_OUTPUT':str(output)}
            with patch.dict(os.environ, env), patch.object(m.boto3, 'client', return_value=fake), patch.object(m.time, 'sleep') as sleep:
                m.main()
                sleep.assert_not_called()
            return output.read_text()
    def test_update_validates_against_aws_sdk(self):
        self.assertEqual(self.run_case(FakeECS()), 'endpoint=https://example.com\n')
    def test_create_validates_against_aws_sdk(self):
        self.assertEqual(self.run_case(FakeECS(exists=False)), 'endpoint=https://example.com\n')
    def test_rollback_stops_without_polling_again(self):
        with self.assertRaisesRegex(RuntimeError, 'ROLLBACK_FAILED'):
            self.run_case(FakeECS(status='ROLLBACK_FAILED'))
    def test_missing_endpoint_is_failure(self):
        with self.assertRaisesRegex(RuntimeError, 'no endpoint'):
            self.run_case(FakeECS(endpoint=''))
    def test_http_rejected(self):
        with self.assertRaisesRegex(RuntimeError, 'HTTPS'):
            m.endpoint_url('http://example.com')
    def test_timeout_is_failure(self):
        with patch.object(m.time, 'monotonic', side_effect=[0, 1201]):
            with self.assertRaisesRegex(RuntimeError, '20 minutes'):
                self.run_case(FakeECS())

if __name__ == '__main__':
    unittest.main()
