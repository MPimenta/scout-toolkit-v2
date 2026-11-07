// Kit de Atividades on Azure App Service (openspec: migrate-hosting-to-azure).
//
// Creates, in the resource group this is deployed to:
//   - Container Registry (Basic), Key Vault (RBAC), App Service plan (Linux B2)
//   - two Web Apps for Containers: Production and Preview, each with a system-assigned identity,
//     VNet integration, a health check and the right to pull images and read Key Vault secrets
// and, in the AEP's existing network resource group, one integration subnet for the plan.
//
// It contains no secret values. Secrets are added to Key Vault by a person (or the pipeline) and
// referenced from the Web App settings once they exist (see infra/README.md).
//
//   az group create -n rg-kit-de-atividades -l northeurope
//   az deployment group create -g rg-kit-de-atividades -f infra/main.bicep -p infra/main.parameters.json
targetScope = 'resourceGroup'

param location string = resourceGroup().location

@description('Container registry name: 5-50 lowercase letters and digits, globally unique.')
param acrName string

@description('Key Vault name: 3-24 letters, digits and hyphens, globally unique.')
param keyVaultName string

@description('Storage account for uploaded activity images: 3-24 lowercase letters and digits, globally unique.')
param storageAccountName string = 'aepkitimg'

param planName string = 'kit-plan'
param planSku string = 'B2'

@description('Existing virtual network of the AEP and its resource group.')
param vnetName string = 'painelaep-vnet'
param vnetResourceGroup string = 'rg-painel-regional'
param integrationSubnetName string = 'kit-apps'
param integrationSubnetPrefix string = '10.20.3.0/26'

@description('Image used until the first deployment pushes the real one.')
param placeholderImage string = 'mcr.microsoft.com/appsvc/staticsite:latest'

@description('Feature flags per environment (FEATURES). Production stays empty until the privacy wording is confirmed.')
param previewFeatures string = 'usage-tracking,pwa'
param productionFeatures string = ''

var environments = [
  {
    key: 'prod'
    appName: 'aep-kit'
    features: productionFeatures
  }
  {
    key: 'preview'
    appName: 'aep-kit-preview'
    features: previewFeatures
  }
]

// Built-in role definition ids
var acrPullRole = '7f951dda-4ed3-4680-a7ca-43fe172d538d'
var keyVaultSecretsUserRole = '4633458b-17de-408a-b874-0445c86b69e6'

module subnet 'modules/subnet.bicep' = {
  name: 'kit-integration-subnet'
  scope: resourceGroup(vnetResourceGroup)
  params: {
    vnetName: vnetName
    subnetName: integrationSubnetName
    addressPrefix: integrationSubnetPrefix
  }
}

resource registry 'Microsoft.ContainerRegistry/registries@2023-07-01' = {
  name: acrName
  location: location
  sku: {
    name: 'Basic'
  }
  properties: {
    adminUserEnabled: false
    anonymousPullEnabled: false
  }
}

resource vault 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: keyVaultName
  location: location
  properties: {
    tenantId: subscription().tenantId
    sku: {
      family: 'A'
      name: 'standard'
    }
    enableRbacAuthorization: true
    enableSoftDelete: true
    softDeleteRetentionInDays: 30
    enablePurgeProtection: true
    publicNetworkAccess: 'Enabled'
  }
}

resource plan 'Microsoft.Web/serverfarms@2023-12-01' = {
  name: planName
  location: location
  kind: 'linux'
  sku: {
    name: planSku
  }
  properties: {
    reserved: true
  }
}

resource apps 'Microsoft.Web/sites@2023-12-01' = [for env in environments: {
  name: env.appName
  location: location
  kind: 'app,linux,container'
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    serverFarmId: plan.id
    httpsOnly: true
    clientAffinityEnabled: false
    virtualNetworkSubnetId: subnet.outputs.subnetId
    vnetRouteAllEnabled: false
    siteConfig: {
      linuxFxVersion: 'DOCKER|${placeholderImage}'
      acrUseManagedIdentityCreds: true
      alwaysOn: true
      http20Enabled: true
      minTlsVersion: '1.2'
      ftpsState: 'Disabled'
      healthCheckPath: '/api/health'
      appSettings: [
        { name: 'WEBSITES_PORT', value: '8080' }
        { name: 'WEBSITES_ENABLE_APP_SERVICE_STORAGE', value: 'false' }
        { name: 'NODE_ENV', value: 'production' }
        { name: 'AUTH_TRUST_HOST', value: 'true' }
        { name: 'NEXTAUTH_URL', value: 'https://${env.appName}.azurewebsites.net' }
        { name: 'AUTH_URL', value: 'https://${env.appName}.azurewebsites.net' }
        { name: 'NEXT_PUBLIC_APP_URL', value: 'https://${env.appName}.azurewebsites.net' }
        { name: 'AZURE_STORAGE_ACCOUNT', value: storageAccountName }
        { name: 'ORGO_ISSUER', value: 'https://eaep.escoteiros.pt' }
        { name: 'FEATURES', value: env.features }
      ]
    }
  }
}]

resource acrPull 'Microsoft.Authorization/roleAssignments@2022-04-01' = [for (env, i) in environments: {
  name: guid(registry.id, env.appName, acrPullRole)
  scope: registry
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', acrPullRole)
    principalId: apps[i].identity.principalId
    principalType: 'ServicePrincipal'
  }
}]

resource vaultReader 'Microsoft.Authorization/roleAssignments@2022-04-01' = [for (env, i) in environments: {
  name: guid(vault.id, env.appName, keyVaultSecretsUserRole)
  scope: vault
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', keyVaultSecretsUserRole)
    principalId: apps[i].identity.principalId
    principalType: 'ServicePrincipal'
  }
}]

module storage 'modules/storage.bicep' = {
  name: 'kit-image-storage'
  params: {
    location: location
    storageAccountName: storageAccountName
    principalIds: [for (env, i) in environments: apps[i].identity.principalId]
  }
}

output registryLoginServer string = registry.properties.loginServer
output keyVaultUri string = vault.properties.vaultUri
output productionHost string = apps[0].properties.defaultHostName
output previewHost string = apps[1].properties.defaultHostName
