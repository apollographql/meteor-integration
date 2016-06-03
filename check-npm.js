import { checkNpmVersions } from 'meteor/tmeasday:check-npm-versions';

checkNpmVersions({
  'apollo-client': '^0.3.12',
  'apollo-server': '^0.1.1',
  'express': '^4.13.4',
  'http-proxy-middleware': '^0.15.0'
}, 'my:awesome-package');
