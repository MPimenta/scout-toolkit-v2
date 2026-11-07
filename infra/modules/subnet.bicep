// Integration subnet for the Kit's App Service plan, added to the AEP's existing virtual network.
// A subnet can serve only one App Service plan, so the Kit does not reuse the `apps` subnet.
param vnetName string
param subnetName string
param addressPrefix string

resource vnet 'Microsoft.Network/virtualNetworks@2024-01-01' existing = {
  name: vnetName
}

resource subnet 'Microsoft.Network/virtualNetworks/subnets@2024-01-01' = {
  parent: vnet
  name: subnetName
  properties: {
    addressPrefix: addressPrefix
    delegations: [
      {
        name: 'appservice'
        properties: {
          serviceName: 'Microsoft.Web/serverFarms'
        }
      }
    ]
  }
}

output subnetId string = subnet.id
