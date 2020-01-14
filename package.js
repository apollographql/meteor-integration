Package.describe({
  name: 'apollo',
  version: '3.1.0',
  summary: 'Basic Apollo integration for Meteor apps',
  git: 'https://github.com/apollographql/meteor-integration',
});

Package.onUse(function(api) {
  api.versionsFrom('1.9');
  api.use(['ecmascript', 'accounts-base', 'check']);

  api.mainModule('src/server.js', 'server');
  api.mainModule('src/client.js', 'client', { lazy: true });
});

Npm.depends({
  'apollo-link': '1.2.13'
})

Package.onTest(function(api) {
  api.use([
    'ecmascript',
    'meteortesting:mocha',
    'practicalmeteor:chai',
    'accounts-base',
    'apollo',
  ]);

  api.mainModule('tests/server.js', 'server');
});
