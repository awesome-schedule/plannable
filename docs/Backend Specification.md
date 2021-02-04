# Backend Specification

If you're interested in providing a profile storage backend for plannable, this document provides the detailed specification. If you're interested in parsing the profile stored by plannable, please refer to the `SemesterStorage` interface in `../src/store/store.ts`. The profile uploaded to the backend will be a string, and when it's JSON deserialized, it will be an object of the type `SemesterStorage`. 

## Backend configuration

The backend provider should provide the information specified in the `BackendConfig` type in [config.example.ts](../src/config.example.ts). Currently, this information should be filled into the `backend` field of [package.json](../package.json). Plannable may support multi-backend in the future, so the `backend` field will become an array. 

## CORS headers

To satisfy the CORS policies, the backend needs to include the following headers on every response. However, if you deploy plannable on the same domain as the backend, then no CORS headers are required. 

```
Access-Control-Allow-Origin: https://plannable.org
Access-Control-Allow-Headers: Authorization
```

## Authorization

The authorization process of plannable follows the authorization code flow with PKCE of the OAuth 2.0 standard. Appropriate information should be filled into config.ts.

### Authorization Code Endpoint

The backend should provide an endpoint (`backend.code`) for getting an authorization code. The request to this endpoint will a HTTP GET containing the following information in the URL:

```js
{
    client_id: backend.client_id,
    state: "....", // a randomly generated string
    redirect_uri: 'https://plannable.org',
    code_challenge: "...", // SHA256(code_verifier), where code_verifier is a randomly generated string
    code_challenge_method: 'S256'
}
```

The backend should redirect to plannable with the authorization code and the previous state attached onto the url.

```
https://plannable.org?code=...&state=...
```

### Token Endpoint

Additionally, the backend should provide an endpoint (`backend.token`) for getting a access token using the authorization code. The request to this endpoint will be a HTTP POST and the body will be JSON encoded. 

```js
{
    client_id: backend.client_id,
    code: "...", // the authorization code acquired from the authorization code endpoint
    grant_type: 'authorization_code',
    code_verifier: '...' // the code verifier of the previous request to the authorization code endpoint,
    redirect_uri: 'https://plannable.org'
}
```

It should give a JSON response:

```js
{
    "access_token": "...",
    "expires_in": "...", // expiration time in seconds
    "token_type": "..." // an alphabetical name for this token type
}
```

Once plannable has the access token, all requests to the backend will be sent with the Authorization header

```
Authorization: token_type access_token
```

For example, if the token_type is `Bearer` and access_token is `deadbeef`, then the header `Authorization: Bearer deadbeef` will be included in every request. 

### Token Expiration

The backend provider has the freedom to set the expiration time for access tokens. However, for the best user experience, it is recommended to make it valid for at least a week. It is also recommended to implement an auto-extension mechanism: when the token is about to expire and some APIs are called with that token, the expiration date should be automatically extended. 

## Get API

The get api (`backend.down`) should accept POST requests with JSON-encoded body

```js
{
    "name": "...", // the profile name. If omitted, return all the profiles (each profile should be the latest version)
    "version": 1 // only present if "name" is present. If this field is missing, then the latest profile should be returned
}
```

and it should give a JSON response 

```js
{
    "success": true, // or false if failed,
    "message": "...", // reason for failure. If success, can put anything here
    "profiles": [ // if the name field of the request is missing, this should be a list of all profiles. Otherwise, this should be a list of 1 profile corresponding to the name and version given. If failed, omit this field.
        {
            "versions": [ // all versions of this profile
                {
                    /** number of milliseconds since Unix epoch */
                    "modified": 1609794572021,
                    /** User Agent from the Http Header */
                    "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36",
                    /** the version number */
                    "version": 1
                },
                ...
            ],
            "profile": "..." // the body of the profile corresponding to the queried version. It should be the latest profile if the version number is missing
        }
    ]
}
```

## Edit API

The edit api (`backend.edit`) should accept 2 types of POST requests with JSON-encoded body.

### Delete Request

Request format:

```js
{
    "action": "delete",
    "name": "..." // name of the profile to be deleted
}
```

Response should in JSON. Format:

```js
{
    "success": true, // or false if failed
    "message": "...", // reason for failure. If success, can put anything here
}
```

### Rename Request

Request format:

```js
{
    "action": "rename",
    "oldName": "...", // The name of the profile to be renamed
    "newName": "...", // The new name of the profile
    "profile": "..." // The content of the profile
}
```

The complete version history of the profile after rename should be given in the JSON response. Format:

```js
{
    "success": true, // or false if failed
    "message": "...", // reason for failure. If success, can put anything here
    /** This gives information of all versions of the newly renamed schedule */
    "versions": [
        { // version 1
            /** number of milliseconds since Unix epoch */
            "modified": 1609794572021,
            /** User Agent from the Http Header */
            "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36",
            /** the version number */
            "version": 1
        }, 
        // other versions
        ...
    ]
}
```

## Save/Upload API

The save/upload api (`backend.up`) should accept POST requests with JSON-encoded body

```js
{
    /** list of profiles to be uploaded */
    "profiles": [{
        /** name of the profile */
        "name": "...";
        /** content of the profile */
        "profile": "...";
        /** whether to force create a new version for this file. If this field is false or is not present, then it is up to the server to decide whether to create a new version (depending on SAVE_INTERVAL) */
        "new": true
    }, ...];
}
```

It should give a JSON response indicating whether the action is performed successfully. Also, the new version number for each uploaded profiles should be included. 

```js
{
    "success": true, // or false if failed
    "message": "...", // reason for failure. If success, can put anything here
    /** information of all versions of each newly uploaded profile. If failed, omit this field */
    "versions": [
        [ // all versions of profile 1
            {
                /** number of milliseconds since Unix epoch */
                "modified": 1609794572021,
                /** User Agent from the Http Header */
                "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36",
                /** the version number */
                "version": 1
            }, ...
        ], ...
    ] 
}
```

## Versioning and miscellaneous requirements

The following paragraphs give a rough description on what actions should be performed when some of the APIs are called. The implementer should fill in the details when needed. 

When a profile is **uploaded**:
- For each profile in the array:
  - If previous versions exist:
    - If the previous versions are marked as detached, they should be changed to active. 
    - If [time now] - [modified time of the latest version] > SAVE_INTERVAL **OR** `new` is set to true:
      - Increment the version number of the latest version by 1, and use it as the current version.
    - else
      - Overwrite the content of the latest version with the newly uploaded profile.
  - If previous versions do not exist:
    - A new version history for that profile is created. Version numbers should start from 1. 
  - Set the modified time to now. 

When a profile is **renamed**:
- All its previous versions corresponding to the old name shall be marked as detached. Administrators can set an expiration time for the detached versions, and delete them from the database when they expire. 
- If previous versions corresponding to the new name exists:
  - If the previous versions are marked as detached, they should be changed to active. 
  - Increment the version number of the latest version by 1, and use it as the current version.
- If previous versions corresponding to the new name do not exists: 
  - A new version history for the new name is created. Version numbers should start from 1.
- Set the modified time to now. 

When a profile is **deleted**, all its previous versions shall be marked as detached. Administrators can set an expiration time for the detached versions, and delete them from the database when they expire. 

**Some important notes:**
- Profiles are always uniquely identified by their names. All versions of a profile are associated with its name. 
- The detached behavior is recommended but optional. If you do not wish to implement it, you can simply delete the version history from the database when it is `marked as detached`, and thus you do not need to implement the reattach behavior, i.e. `changed to active`. 
- The expiration time for detached versions should be at least a week.
- The SAVE_INTERVAL should be set to somewhere between 5 and 10 minutes.
- To save database space, you can set a cap on the number of versions a profile can have. This number should be at least 50. When the cap is reached, delete the oldest version to allow the new version to be created. 
- To fullfil the specified API, for each profile name, you probably need to store at least the following information, although it is up to the backend provider to decide the implementation details.
  - profile name
  - the latest version number
  - a list of all versions, and for each version, you probably need to store
    - version number
    - modified time
    - the User-Agent header of the request when this version was created
    - profile content