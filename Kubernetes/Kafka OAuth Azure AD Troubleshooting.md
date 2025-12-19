# Kafka OAuth Azure AD Troubleshooting Guide

## Error: AADSTS501051 - Application Not Assigned to Role

### Error Message

```
io.strimzi.kafka.oauth.common.HttpException: POST request to https://login.microsoftonline.com/.../oauth2/v2.0/token failed with status 400: 
{"error":"invalid_grant","error_description":"AADSTS501051: Application '2659007c-b565-4cd5-8c1f-0160b400652d'(bkps360-mm2) is not assigned to a role for the application '16e7503c-ea25-4d4c-b7c9-085abbf77b6b'(rg-amacp-prd-we-techmdw-01-kafka-management-bkps210)"}
```

### Root Cause

The client application (`bkps360-mm2`) is trying to authenticate to Kafka using OAuth 2.0 Client Credentials flow, but it hasn't been assigned an **App Role** in the Kafka API application registration.

---

## Solution Steps

### Step 1: Create App Role in Kafka API Application

1. **Navigate to Azure Portal** → Azure Active Directory → App registrations
2. **Open the Kafka API app registration:**
   - Name: `rg-amacp-prd-we-techmdw-01-kafka-management-bkps210`
   - Application (client) ID: `16e7503c-ea25-4d4c-b7c9-085abbf77b6b`

3. **Go to "App roles"** → Click **"Create app role"**

4. **Configure the app role:**
   - **Display name**: `Kafka Consumer` (or appropriate role name)
   - **Allowed member types**: Select **"Applications"**
   - **Value**: `kafka.consumer` (must match your Kafka configuration)
   - **Description**: `Allows application to connect to Kafka as a consumer`
   - **Do you want to enable this app role?**: **Yes**

5. **Click "Apply"** to save

### Step 2: Assign Role to Client Application

1. **Open the client app registration:**
   - Name: `bkps360-mm2`
   - Application (client) ID: `2659007c-b565-4cd5-8c1f-0160b400652d`

2. **Go to "API permissions"** → Click **"Add a permission"**

3. **Select "My APIs"** tab

4. **Select the Kafka API application** (`rg-amacp-prd-we-techmdw-01-kafka-management-bkps210`)

5. **Select "Application permissions"** (not Delegated)

6. **Check the box** next to the role you created (e.g., `Kafka Consumer`)

7. **Click "Add permissions"**

8. **Grant admin consent:**
   - Click **"Grant admin consent for [Your Organization]"**
   - Confirm when prompted

### Step 3: Verify Configuration

After granting permissions, wait a few minutes for Azure AD to propagate the changes, then verify:

1. In the client app registration, check **"API permissions"**:
   - The Kafka API should be listed
   - Status should show **"Granted for [Your Organization]"** with a green checkmark

2. **Test the connection** again from your Kafka client

---

## Alternative: Using Azure CLI

If you prefer using Azure CLI:

```bash
# Get the app role ID from the Kafka API app
az ad app show --id 16e7503c-ea25-4d4c-b7c9-085abbf77b6b --query "appRoles[?value=='kafka.consumer'].id" -o tsv

# Assign the role to the client app (replace ROLE_ID with the ID from above)
az ad app permission add \
  --id 2659007c-b565-4cd5-8c1f-0160b400652d \
  --api 16e7503c-ea25-4d4c-b7c9-085abbf77b6b \
  --api-permissions ROLE_ID=Role

# Grant admin consent
az ad app permission admin-consent --id 2659007c-b565-4cd5-8c1f-0160b400652d
```

---

## Strimzi Kafka OAuth Configuration

Ensure your Strimzi Kafka configuration includes the correct scope that matches the app role value:

```yaml
apiVersion: kafka.strimzi.io/v1beta2
kind: Kafka
metadata:
  name: my-kafka
spec:
  kafka:
    listeners:
      - name: oauth
        port: 9093
        type: internal
        tls: true
        authentication:
          type: oauth
          validIssuerUri: https://login.microsoftonline.com/7d7761c0-8b7a-49bb-8975-a6aa1be7c38b/v2.0
          jwksEndpointUri: https://login.microsoftonline.com/7d7761c0-8b7a-49bb-8975-a6aa1be7c38b/discovery/v2.0/keys
          userNameClaim: sub
          # The scope should match the app role value
          scope: kafka.consumer  # or whatever value you set in the app role
```

---

## Common Issues and Troubleshooting

### Issue 1: Permission Not Propagating

**Solution**: Wait 5-10 minutes after granting permissions. Azure AD needs time to propagate changes.

### Issue 2: Wrong Scope Value

**Solution**: Ensure the scope in your Kafka configuration exactly matches the **Value** field in the App Role (case-sensitive).

### Issue 3: Admin Consent Not Granted

**Solution**: Admin consent is required for Application permissions. Make sure a Global Administrator or Privileged Role Administrator has granted consent.

### Issue 4: Multiple Roles Needed

If your application needs multiple roles (consumer, producer, admin), create separate app roles and assign all of them to the client application.

---

## Verification Steps

1. **Check Azure AD Audit Logs:**
   - Azure Portal → Azure AD → Sign-in logs
   - Filter by the client application ID
   - Look for successful token requests

2. **Test with curl:**
```bash
curl -X POST https://login.microsoftonline.com/7d7761c0-8b7a-49bb-8975-a6aa1be7c38b/oauth2/v2.0/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "client_id=2659007c-b565-4cd5-8c1f-0160b400652d" \
  -d "client_secret=YOUR_CLIENT_SECRET" \
  -d "scope=16e7503c-ea25-4d4c-b7c9-085abbf77b6b/.default" \
  -d "grant_type=client_credentials"
```

If successful, you should receive an access token.

---

## Summary

- **Error Code**: AADSTS501051
- **Problem**: Client app not assigned to role in API app
- **Solution**: Create app role in API app → Assign role to client app → Grant admin consent
- **Key Point**: The scope value in Kafka config must match the app role value exactly


