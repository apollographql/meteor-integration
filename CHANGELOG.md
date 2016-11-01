# Change Log
All notable changes to this project will be documented in this file. [*File syntax*](http://keepachangelog.com/).
This project adheres to [Semantic Versioning](http://semver.org/).

## vNEXT
### Updated

- `apollo-client` [v0.5.x](https://github.com/apollostack/apollo-client/blob/master/CHANGELOG.md)
- Update createNetworkInterface call to match new signature ([@jasonphillips](https://github.com/jasonphillips) in [#43](https://github.com/apollostack/meteor-integration/pull/43)).

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
