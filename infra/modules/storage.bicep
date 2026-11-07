// Private storage account for activity images (openspec: azure-blob-uploads).
// No public access, no shared keys: the Web Apps reach it with their managed identity.

param location string

@description('Storage account name: 3-24 lowercase letters and digits, globally unique.')
param storageAccountName string

@description('Principal ids (managed identities) of the Web Apps that read and write images.')
param principalIds array

var storageBlobDataContributorRole = 'ba92f5b4-2d11-453d-a403-e96b0029c9fe'

resource account 'Microsoft.Storage/storageAccounts@2023-05-01' = {
  name: storageAccountName
  location: location
  kind: 'StorageV2'
  sku: {
    name: 'Standard_LRS'
  }
  properties: {
    allowBlobPublicAccess: false
    allowSharedKeyAccess: false
    minimumTlsVersion: 'TLS1_2'
    supportsHttpsTrafficOnly: true
    publicNetworkAccess: 'Enabled'
  }
}

resource blobService 'Microsoft.Storage/storageAccounts/blobServices@2023-05-01' = {
  parent: account
  name: 'default'
}

resource images 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-05-01' = {
  parent: blobService
  name: 'activity-images'
  properties: {
    publicAccess: 'None'
  }
}

resource contributors 'Microsoft.Authorization/roleAssignments@2022-04-01' = [for principalId in principalIds: {
  name: guid(images.id, principalId, storageBlobDataContributorRole)
  scope: images
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', storageBlobDataContributorRole)
    principalId: principalId
    principalType: 'ServicePrincipal'
  }
}]

output blobEndpoint string = account.properties.primaryEndpoints.blob
