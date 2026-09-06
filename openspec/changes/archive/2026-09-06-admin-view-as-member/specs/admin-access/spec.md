## ADDED Requirements

### Requirement: Admin can preview as a member

A signed-in user whose stored role is `admin` SHALL be able to turn on “view as member” and turn it off again. The default SHALL be admin view (overlay off). The control SHALL live in the signed-in account menu. Portuguese chrome SHALL use **Ver como membro** and **Voltar à vista de admin**; English SHALL use **View as member** and **Back to admin view**. The overlay SHALL NOT sign them out, SHALL NOT impersonate another account, and SHALL NOT preview as a guest.

#### Scenario: Admin enables member view

- **GIVEN** a signed-in admin on any non-admin page
- **WHEN** they choose **Ver como membro**
- **THEN** the Admin navigation link is hidden
- **AND** they remain signed in as themselves

#### Scenario: Default is admin view

- **GIVEN** a signed-in admin with no member-view overlay
- **WHEN** they load the header
- **THEN** the Admin navigation link is shown

### Requirement: Member preview uses the member effective role

While the overlay is on, `/admin`, `/api/admin/*`, the Admin navigation link, and every other check that today treats `session.user.role === 'admin'` as privilege SHALL treat the caller as a member. Guests and stored `user` accounts SHALL be unchanged. A member who forges the overlay SHALL NOT gain admin access.

#### Scenario: Previewing admin opens /admin

- **GIVEN** a signed-in admin with member view on
- **WHEN** they open `/admin`
- **THEN** they see the same forbidden page a stored member sees
- **AND** they do not see the dashboard

#### Scenario: Previewing admin hits an admin API

- **GIVEN** a signed-in admin with member view on
- **WHEN** they call `/api/admin/stats`
- **THEN** the response is 403

#### Scenario: Member cannot become admin via overlay

- **GIVEN** a signed-in user whose stored role is `user`
- **WHEN** they present the member-view overlay
- **THEN** `/admin` is still forbidden and `/api/admin/stats` is still 403

### Requirement: Stored admin role is unchanged

Turning the overlay on or off SHALL NOT write `user.role`. `ADMIN_EMAILS` promotion, last-admin protection, and the admin user list SHALL keep using the stored role. Other admins SHALL still receive notifications as today.

#### Scenario: Overlay does not demote

- **GIVEN** a user whose stored role is `admin`
- **WHEN** they turn member view on and then off
- **THEN** their stored role is still `admin`
- **AND** after they turn it off, `/admin` shows the dashboard again

### Requirement: Exit stays visible while previewing

While member view is on, the product SHALL show that the admin is previewing and offer **Voltar à vista de admin** / **Back to admin view** in both the account menu and a banner. The banner SHALL use existing surface colours (no new brand colour).

#### Scenario: Exit from the banner

- **GIVEN** a signed-in admin with member view on
- **WHEN** they choose **Voltar à vista de admin** on the banner
- **THEN** the overlay is off
- **AND** the Admin navigation link is shown again

## MODIFIED Requirements

### Requirement: Admin routes reject non-admins

`/admin` and `/api/admin/*` SHALL require a signed-in user whose **effective** role is `admin`. Effective role is the stored role unless a stored admin has member view on, in which case it is `user`. Guests SHALL receive 401 (API) or be sent to sign-in (pages). Callers whose effective role is not `admin` SHALL receive 403 and a Portuguese forbidden page. The Admin navigation link SHALL appear only when the effective role is `admin`.

#### Scenario: Regular user opens /admin

- **WHEN** a signed-in user with stored role `user` opens `/admin`
- **THEN** they see a forbidden page and not the dashboard

#### Scenario: Guest hits an admin API

- **WHEN** a guest calls `/api/admin/stats`
- **THEN** the response is 401

#### Scenario: Admin opens /admin

- **WHEN** a signed-in admin with member view off opens `/admin`
- **THEN** they see the dashboard
