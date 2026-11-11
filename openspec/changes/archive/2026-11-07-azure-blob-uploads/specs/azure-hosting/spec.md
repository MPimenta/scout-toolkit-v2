## ADDED Requirements

### Requirement: Private image storage account

The Azure environment SHALL include a storage account dedicated to the Kit, private (public blob access disabled, TLS 1.2 minimum, shared-key access disabled where the platform allows), with a container for activity images. Each Web App's managed identity SHALL hold the `Storage Blob Data Contributor` role on that container and no other principal SHALL hold data access except the operators named by the AEP.

#### Scenario: Anonymous access

- **WHEN** someone requests a blob address without credentials
- **THEN** access is refused

#### Scenario: App access

- **WHEN** a Web App saves or reads an image
- **THEN** it authenticates with its managed identity
