import { checkNpmVersions } from 'meteor/tmeasday:check-npm-versions';

checkNpmVersions({
  'apollo-client': '^0.3.9',
  'express': '^4.13.4',
  'graphql-tools': '^0.4.1',
  'http-proxy-middleware': '^0.15.0'
}, 'my:awesome-package');
