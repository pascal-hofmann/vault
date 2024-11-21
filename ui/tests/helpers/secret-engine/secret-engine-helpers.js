/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

import { click, fillIn } from '@ember/test-helpers';
import { GENERAL } from 'vault/tests/helpers/general-selectors';
import { SECRET_ENGINE_SELECTORS as SES } from 'vault/tests/helpers/secret-engine/secret-engine-selectors';
import { v4 as uuidv4 } from 'uuid';

export const createSecretsEngine = (store, type, path) => {
  store.pushPayload('secret-engine', {
    modelName: 'secret-engine',
    id: path,
    path: `${path}/`,
    type: type,
    data: {
      type: type,
    },
  });
  return store.peekRecord('secret-engine', path);
};

const createAwsRootConfig = (store, backend, accessType = 'iam') => {
  // clear any records first
  store.unloadAll('aws/root-config');
  if (accessType === 'wif') {
    store.pushPayload('aws/root-config', {
      id: backend,
      modelName: 'aws/root-config',
      data: {
        backend,
        role_arn: '123-role',
        identity_token_audience: '123-audience',
        identity_token_ttl: 7200,
      },
    });
  } else if (accessType === 'no-access') {
    // set root config options that are not associated with accessType 'wif' or 'iam'
    store.pushPayload('aws/root-config', {
      id: backend,
      modelName: 'aws/root-config',
      data: {
        backend,
        region: 'ap-northeast-1',
      },
    });
  } else {
    store.pushPayload('aws/root-config', {
      id: backend,
      modelName: 'aws/root-config',
      data: {
        backend,
        region: 'us-west-2',
        access_key: '123-key',
        iam_endpoint: 'iam-endpoint',
        sts_endpoint: 'sts-endpoint',
        max_retries: 1,
      },
    });
  }
  return store.peekRecord('aws/root-config', backend);
};

const createIssuerConfig = (store) => {
  store.pushPayload('identity/oidc/config', {
    id: 'identity-oidc-config',
    modelName: 'identity/oidc/config',
    data: {
      issuer: ``,
    },
  });
  return store.peekRecord('identity/oidc/config', 'identity-oidc-config');
};

const createAwsLeaseConfig = (store, backend) => {
  store.pushPayload('aws/lease-config', {
    id: backend,
    modelName: 'aws/lease-config',
    data: {
      backend,
      lease: '50s',
      lease_max: '55s',
    },
  });
  return store.peekRecord('aws/lease-config', backend);
};

const createSshCaConfig = (store, backend) => {
  store.pushPayload('ssh/ca-config', {
    id: backend,
    modelName: 'ssh/ca-config',
    data: {
      backend,
      public_key: 'public-key',
      generate_signing_key: true,
    },
  });
  return store.peekRecord('ssh/ca-config', backend);
};

const createAzureConfig = (store, backend, accessType = 'generic') => {
  // clear any records first
  store.unloadAll('azure/config');
  if (accessType === 'azure') {
    store.pushPayload('azure/config', {
      id: backend,
      modelName: 'azure/config',
      data: {
        backend,
        client_secret: 'client-secret',
        subscription_id: 'subscription-id',
        tenant_id: 'tenant-id',
        client_id: 'client-id',
        root_password_ttl: '500h',
        environment: 'AZUREPUBLICCLOUD',
      },
    });
  } else if (accessType === 'wif') {
    store.pushPayload('azure/config', {
      id: backend,
      modelName: 'azure/config',
      data: {
        backend,
        subscription_id: 'subscription-id',
        tenant_id: 'tenant-id',
        client_id: 'client-id',
        identity_token_audience: 'audience',
        identity_token_ttl: 7200,
        environment: 'AZUREPUBLICCLOUD',
      },
    });
  } else {
    store.pushPayload('azure/config', {
      id: backend,
      modelName: 'azure/config',
      data: {
        backend,
        subscription_id: 'subscription-id-2',
        tenant_id: 'tenant-id-2',
        client_id: 'client-id-2',
        environment: 'AZUREPUBLICCLOUD', // allowed environment vars for testing https://github.com/hashicorp/vault-plugin-secrets-azure/blob/main/client.go#L35-L37
      },
    });
  }
  return store.peekRecord('azure/config', backend);
};

export function configUrl(type, backend) {
  switch (type) {
    case 'aws':
      return `/${backend}/config/root`;
    case 'aws-lease':
      return `/${backend}/config/lease`;
    case 'ssh':
      return `/${backend}/config/ca`;
    default:
      return `/${backend}/config`;
  }
}
// send the type of config you want and the name of the backend path to push the config to the store.
export const createConfig = (store, backend, type) => {
  switch (type) {
    case 'aws':
      return createAwsRootConfig(store, backend);
    case 'aws-wif':
      return createAwsRootConfig(store, backend, 'wif');
    case 'aws-no-access':
      return createAwsRootConfig(store, backend, 'no-access');
    case 'issuer':
      return createIssuerConfig(store);
    case 'aws-lease':
      return createAwsLeaseConfig(store, backend);
    case 'ssh':
      return createSshCaConfig(store, backend);
    case 'azure':
      return createAzureConfig(store, backend, 'azure');
    case 'azure-wif':
      return createAzureConfig(store, backend, 'wif');
    case 'azure-generic':
      return createAzureConfig(store, backend, 'generic');
  }
};
// Used in tests to assert the expected keys in the config details of configurable secret engines
export const expectedConfigKeys = (type) => {
  switch (type) {
    case 'aws':
      return ['Access key', 'Region', 'IAM endpoint', 'STS endpoint', 'Maximum retries'];
    case 'aws-lease':
      return ['Default Lease TTL', 'Max Lease TTL'];
    case 'aws-root-create':
      return ['accessKey', 'secretKey', 'region', 'iamEndpoint', 'stsEndpoint', 'maxRetries'];
    case 'aws-root-create-wif':
      return ['issuer', 'roleArn', 'identityTokenAudience', 'Identity token TTL'];
    case 'aws-root-create-iam':
      return ['accessKey', 'secretKey'];
    case 'ssh':
      return ['Public key', 'Generate signing key'];
    case 'azure':
      return ['Subscription ID', 'Tenant ID', 'Client ID', 'Root password TTL', 'Environment'];
    case 'azure-wif':
      return [
        'Subscription ID',
        'Tenant ID',
        'Client ID',
        'Root password TTL',
        'Environment',
        'identityTokenAudience',
        'Identity token TTL',
      ];
  }
};

const valueOfAwsKeys = (string) => {
  switch (string) {
    case 'Access key':
      return '123-key';
    case 'Region':
      return 'us-west-2';
    case 'IAM endpoint':
      return 'iam-endpoint';
    case 'STS endpoint':
      return 'sts-endpoint';
    case 'Maximum retries':
      return '1';
  }
};

const valueOfAzureKeys = (string) => {
  switch (string) {
    case 'Subscription ID':
      return 'subscription-id';
    case 'Tenant ID':
      return 'tenant-id';
    case 'Client ID':
      return 'client-id';
    case 'Environment':
      return 'AZUREPUBLICCLOUD';
    case 'Root password TTL':
      return '20 days 20 hours';
  }
};

const valueOfSshKeys = (string) => {
  switch (string) {
    case 'Public key':
      return '***********';
    case 'Generate signing key':
      return 'Yes';
  }
};
// Used in tests to assert the expected values in the config details of configurable secret engines
export const expectedValueOfConfigKeys = (type, string) => {
  switch (type) {
    case 'aws':
      return valueOfAwsKeys(string);
    case 'azure':
      return valueOfAzureKeys(string);
    case 'ssh':
      return valueOfSshKeys(string);
  }
};

export const fillInAwsConfig = async (situation = 'withAccess') => {
  if (situation === 'withAccess') {
    await fillIn(GENERAL.inputByAttr('accessKey'), 'foo');
    await fillIn(GENERAL.inputByAttr('secretKey'), 'bar');
  }
  if (situation === 'withAccessOptions') {
    await click(GENERAL.toggleGroup('Root config options'));
    await fillIn(GENERAL.inputByAttr('region'), 'ca-central-1');
    await fillIn(GENERAL.inputByAttr('iamEndpoint'), 'iam-endpoint');
    await fillIn(GENERAL.inputByAttr('stsEndpoint'), 'sts-endpoint');
    await fillIn(GENERAL.inputByAttr('maxRetries'), '3');
  }
  if (situation === 'withLease') {
    await click(GENERAL.ttl.toggle('Default Lease TTL'));
    await fillIn(GENERAL.ttl.input('Default Lease TTL'), '33');
    await click(GENERAL.ttl.toggle('Max Lease TTL'));
    await fillIn(GENERAL.ttl.input('Max Lease TTL'), '44');
  }
  if (situation === 'withWif') {
    await click(SES.wif.accessType('wif')); // toggle to wif
    await fillIn(GENERAL.inputByAttr('issuer'), `http://bar.${uuidv4()}`); // make random because global setting
    await fillIn(GENERAL.inputByAttr('roleArn'), 'foo-role');
    await fillIn(GENERAL.inputByAttr('identityTokenAudience'), 'foo-audience');
    await click(GENERAL.ttl.toggle('Identity token TTL'));
    await fillIn(GENERAL.ttl.input('Identity token TTL'), '7200');
  }
};

export const fillInAzureConfig = async (situation = 'azure') => {
  await fillIn(GENERAL.inputByAttr('subscriptionId'), 'subscription-id');
  await fillIn(GENERAL.inputByAttr('tenantId'), 'tenant-id');
  await fillIn(GENERAL.inputByAttr('clientId'), 'client-id');
  await fillIn(GENERAL.inputByAttr('environment'), 'environment-123');

  if (situation === 'azure') {
    await fillIn(GENERAL.inputByAttr('clientSecret'), 'client-secret');
    await click(GENERAL.ttl.toggle('Root password TTL'));
    await fillIn(GENERAL.ttl.input('Root password TTL'), '5200');
  }
  if (situation === 'withWif') {
    await click(SES.wif.accessType('wif')); // toggle to wif
    await fillIn(GENERAL.inputByAttr('identityTokenAudience'), 'azure-audience');
    await click(GENERAL.ttl.toggle('Identity token TTL'));
    await fillIn(GENERAL.ttl.input('Identity token TTL'), '7200');
  }
};

// Example usage
// createLongJson (2, 3) will create a json object with 2 original keys, each with 3 nested keys
// {
// 	"key-0": {
// 		"nested-key-0": {
// 			"nested-key-1": {
// 				"nested-key-2": "nested-value"
// 			}
// 		}
// 	},
// 	"key-1": {
// 		"nested-key-0": {
// 			"nested-key-1": {
// 				"nested-key-2": "nested-value"
// 			}
// 		}
// 	}
// }

export function createLongJson(lines = 10, nestLevel = 3) {
  const keys = Array.from({ length: nestLevel }, (_, i) => `nested-key-${i}`);
  const jsonObject = {};

  for (let i = 0; i < lines; i++) {
    nestLevel > 0
      ? (jsonObject[`key-${i}`] = createNestedObject({}, keys, 'nested-value'))
      : (jsonObject[`key-${i}`] = 'non-nested-value');
  }
  return jsonObject;
}

function createNestedObject(obj = {}, keys, value) {
  let current = obj;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!current[key]) {
      current[key] = {};
    }
    current = current[key];
  }

  current[keys[keys.length - 1]] = value;
  return obj;
}
