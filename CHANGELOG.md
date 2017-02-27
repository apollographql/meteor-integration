# Change Log
All notable changes to this project will be documented in this file. [*File syntax*](http://keepachangelog.com/).
This project adheres to [Semantic Versioning](http://semver.org/).

## vNEXT

## [0.4.1] - 2017-02-27
### Changed
- Pass `batchingInterval` to the batching network interface if configured to used it in `createMeteorNetworkInterface`.
- Move `networkInterface` configuration with `createMeteorNetworkInterface()` from the `defaultClientConfig` to the `meteorClientConfig` function, so that it's only executed when needed and not on startup too...

## [0.4.0] - 2017-02-26
### Changed

- The argument to `meteorClientConfig()` was changed: `meteorClientConfig(networkInterfaceConfig)` -> `meteorClientConfig(customClientConfig)`. If you previously did `meteorClientConfig({ batchingInterface: false })`, it should be changed to:
- Don't force `meteor/apollo` to update their NPM dependencies on Graphql-related packages, clean-up the User Accounts middleware [#74](https://github.com/apollographql/meteor-integration/pull/74)

```js
meteorClientConfig({
  networkInterface: createMeteorNetworkInterface({ batchingInterface: false })
});
```

### Added

-  Make it possible to extend the default Apollo Client & network interface configuration objects with any Apollo Client & interface options (+ some tests) [#70](https://github.com/apollographql/meteor-integration/pull/70)


- Don't force `meteor/apollo` to update their NPM dependencies on Graphql-related packages, clean-up the User Accounts middleware [#74](https://github.com/apollographql/meteor-integration/pull/74)

## [0.3.1]
### Fixed

- Fixed bug in `v0.3.0` [#69](https://github.com/apollographql/meteor-integration/issues/69)

## [0.3.0] - 2017-02-08
AKA The Xavier Release 👍

### Updated

- `apollo-client` [`^0.7.0 || ^0.8.0'`](https://github.com/apollographql/apollo-client/blob/master/CHANGELOG.md#080)
- `apollo-server-express` [`^0.5.0`](https://github.com/apollographql/graphql-server/blob/master/CHANGELOG.md#v050)

### Added

- Export `createMeteorNetworkInterface` and `meteorClientConfig` server-side to allow server-side rendering, accept a `loginToken` option in the config of Apollo Client (for example the cookie from `meteorhacks:fast-render` used for SSR) [#57](https://github.com/apollostack/meteor-integration/pull/57)
- Tests! [#63](https://github.com/apollographql/meteor-integration/pull/63) and [#68](https://github.com/apollographql/meteor-integration/pull/68)

## [0.2.1] - 2016-12-23
### Added

- Support for `v0.8.x` of `graphql` [#54](https://github.com/apollostack/meteor-integration/pull/54)
- When user is not logged in, provide `{}` as context [#55](https://github.com/apollostack/meteor-integration/pull/55)

## [0.2.0] - 2016-11-04
### Updated

- `apollo-client` [v0.5.x](https://github.com/apollostack/apollo-client/blob/master/CHANGELOG.md#v050)
- Updated createNetworkInterface call to match new signature ([@jasonphillips](https://github.com/jasonphillips) in [#43](https://github.com/apollostack/meteor-integration/pull/43)).
- `graphql-server` [v0.4.2](https://github.com/apollostack/graphql-server/blob/master/CHANGELOG.md#v042)

### Added

- Added the logged-in user's doc to `context.user`

## [0.1.2] - 2016-10-04
### Added

- Pass a function to configure the express server in createApolloServer ([@nicolaslopezj](https://github.com/nicolaslopezj) in [#32](https://github.com/apollostack/meteor-integration/pull/32)).
- Automatically pass Meteor authentication in GraphiQL ([@nicolaslopezj](https://github.com/nicolaslopezj) in [#35](https://github.com/apollostack/meteor-integration/pull/35)).

## [0.1.1] - 2016-09-21
### Fixed

- Fix userId persisting in options.context (reported in [#37](https://github.com/apollostack/meteor-integration/pull/37))

## [0.1.0] - 2016-09-09
### Updated

- `apollo-server` [v0.2.x](https://github.com/apollostack/apollo-server/blob/cc15ebfb1c9637989e09976c8416b4fd5c2b6728/CHANGELOG.md)
  - Updated interface to reflect `apollo-server` refactor.
- `apollo-client` [v0.4.x](https://github.com/apollostack/apollo-client/blob/master/CHANGELOG.md#v040)

## [0.0.4] - 2016-08-24
### Fixed

- Fixed global auth issue

## [0.0.2] - 2016-06-17
### Fixed

- Fix dependencies #17
