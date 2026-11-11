## ADDED Requirements

### Requirement: Production cutover is rehearsed and reversible

Production SHALL be switched from Vercel and Neon to Azure only after the Preview has been tested end to end on Azure (sign-in, search, activity detail, add to a program, PDF export, usage purge, a deploy and a rollback through the pipeline) and after a written cutover and rollback runbook exists. The previous hosting SHALL be kept, with Neon read-only, for at least 14 days after the switch.

#### Scenario: Going live

- **WHEN** the Production host name is switched to the Azure Web App
- **THEN** the Preview checks have passed, the runbook has been followed, and row counts of the restored database match the source

#### Scenario: Rollback

- **WHEN** a serious problem appears after the switch
- **THEN** the host name can be pointed back to the previous hosting using the runbook, with Neon still available
