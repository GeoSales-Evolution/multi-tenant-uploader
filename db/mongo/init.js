db = db.getSiblingDB('multi_tenant_uploader');

db.createCollection('tenant_driver');

db.tenant_driver.insertMany([
  {
    tenant: 'Tenant1',
    drivers: [
      {
        type: 'Driver1',
  properties: {
    access_token: 'abcd1234',
    token_creation_date: '2023-01-01',
    token_url: 'https://token-url.example.com',
    upload_url: 'https://upload-url.example.com',
    download_url: 'https://download-url.example.com',
    upload_folder: '/path/to/upload/folder',
    client_id: 'clientid123',
    client_secret: 'clientsecret456',
    grant_type: 'authorization_code',
    scope: 'read write'
  }
      },
      {
        type: 'Driver2',
        properties: {
          access_token: null,
          token_creation_date: null,
          token_url: null,
          upload_url: null,
          download_url: null,
          upload_folder: '/path/to/other/folder',
          client_id: 'clientid789',
          client_secret: 'clientsecret012',
          grant_type: 'client_credentials',
          scope: 'read'
        }
      }
    ]
  },
  {
    tenant: 'Tenant2',
    drivers: [
      {
        type: 'Driver3',
        properties: {
          access_token: 'efgh5678',
          token_creation_date: '2023-02-01',
          token_url: 'https://token-url.example.com',
          upload_url: 'https://upload-url.example.com',
          download_url: 'https://download-url.example.com',
          upload_folder: '/path/to/another/folder',
          client_id: 'clientid345',
          client_secret: 'clientsecret678',
          grant_type: 'password',
          scope: 'write'
        }
      }
    ]
  }
]);

db.createCollection('arquivo');

db.arquivo.insertMany([
  {
    tenant: 'Tenant1',
    driver: 'Driver1',
    id_file_driver: 'file1',
    name: 'File 1',
    path: '/path/to/file1',
    size: 1024,
    mime_type: 'text/plain',
    creation_date: new Date('2023-06-01'),
  },
  {
    tenant: 'Tenant1',
    driver: 'Driver1',
    id_file_driver: 'file2',
    name: 'File 2',
    path: '/path/to/file2',
    size: 2048,
    mime_type: 'application/pdf',
    creation_date: new Date('2023-06-02'),
  },
  {
    tenant: 'Tenant2',
    driver: 'Driver3',
    id_file_driver: 'file3',
    name: 'File 3',
    path: '/path/to/file3',
    size: 4096,
    mime_type: 'image/jpeg',
    creation_date: new Date('2023-06-03'),
  },
]);

print('Initialization script executed successfully!');