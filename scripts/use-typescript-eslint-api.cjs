const Module = require('node:module');

const eslintTypeScriptApi = require.resolve('@typescript/typescript6');
const originalResolveFilename = Module._resolveFilename;

Module._resolveFilename = function resolveTypeScriptApi(request, parent, isMain, options) {
  if (request === 'typescript') {
    return eslintTypeScriptApi;
  }

  return originalResolveFilename.call(this, request, parent, isMain, options);
};
