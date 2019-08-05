'use strict';

const http = require('http');
const https = require('https');
const querystrig = require('querystring');

module.exports = function (options, params={})
{
  let query = querystrig.stringify(params),
    {request} = options.protocol === 'https:' ? https : http;

  if (query) {
    options.path += '?' + query;
  }

  return new Promise((resolve, reject) => {
    let req = request(options, (res) => {
      const { statusCode } = res;
      const contentType = res.headers['content-type'];
      let rawData = '';

      if (statusCode !== 200) {
        reject(new Error('Request Failed.\n' + `Status Code: ${statusCode}`));
      }
      else if (!/^application\/json/.test(contentType)) {
        reject(new Error('Invalid content-type.\n' + `Expected application/json but received ${contentType}`));
      }

      res.setEncoding('utf8');
      res.on('data', (chunk) => { rawData += chunk });
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(rawData);
          resolve(parsedData);
        }
        catch (err) {
          reject(err);
        }
      });
    });
    req.on('error', (err) => reject(err));
    req.end();
  });
};
