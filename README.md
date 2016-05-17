<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->


- [Usage](#usage)
  - [Client](#client)
  - [Server](#server)
- [API](#api)
  - [createMeteorNetworkInterface](#createmeteornetworkinterface)
  - [createApolloServer](#createapolloserver)
- [Development](#development)
  - [Run tests](#run-tests)
  - [Credits](#credits)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

# Usage

```
meteor add apollo
meteor npm add --save apollo-client graphql-tools express http-proxy-middleware
```

## Client

```js
import ApolloClient from 'apollo-client';
import { createMeteorNetworkInterface } from 'meteor/apollo';

const client = new ApolloClient({
  networkInterface: createMeteorNetworkInterface()
});
```

## Server

```js
import { createApolloServer } from 'meteor/apollo';

import schema from '/imports/api/schema';
import resolvers from '/imports/api/resolvers';

createApolloServer({
  graphiql: true,
  pretty: true,
  schema,
  resolvers,
});
```

# API

## createMeteorNetworkInterface

`createMeteorNetworkInterface(options)`

`options` may contain any of the following fields:
- `url`: URL of the GraphQL server. Default: `'/graphql'`.
- `options`: `FetchOptions` passed to [`createNetworkInterface`](http://docs.apollostack.com/apollo-client/index.html#createNetworkInterface). Default: `{}`.
- `useMeteorAccounts`: Whether to send the current user's login token to the GraphQL server with each request. Default: `true`.

## createApolloServer

`createApolloServer(apolloConfig, options)`

- [`apolloConfig`](http://docs.apollostack.com/apollo-server/tools.html)
- `options` may contain any of the following fields:
  - `path`: [Path](http://expressjs.com/en/api.html#app.use) of the GraphQL server. Default: `'/graphql'`.
  - `port`: Port for the express server to listen on. Default: `4000`.
  - `maxAccountsCacheSizeInMB`: User account ids are cached in memory to reduce the response latency on multiple requests from the same user. Default: `XXX`.


# Development

## Run tests

```bash
git clone git@github.com:apollostack/meteor-integration.git
cd meteor-integration
meteor test-packages ./ --driver-package practicalmeteor:mocha
open localhost:3000
```

## Credits

[Contributors](https://github.com/apollostack/meteor-integration/graphs/contributors)
