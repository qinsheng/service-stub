const fs = require('fs');

const mine = {
  json: 'application/json',
  xml: 'text/xml',
  html: 'text/html'
};

const getContentType = (file) => {
  const ext = require('path').extname(file) || '.unknown';
  return mine[ext.slice(1)] || 'text/plain';
};

const findService = (req, services) => {
  const method = req.method;
  const pathname = require('url').parse(req.url).pathname;
  console.log(Date(), method, pathname);

  for (let sidx in services) {
    let service = services[sidx];
    if (service.request === pathname) {
      if (!service.method) {
        return service;
      }

      for (let midx in service.method) {
        if (service.method[midx] === method) {
          return service;
        }
      }
    }
  }
};

const response500 = (resp) => {
  resp.writeHead(500, {'Content-Type': 'text/html'});
  resp.write('<h1>Internal Server Error</h1>');
  resp.end();
};

const response404 = (resp) => {
  resp.writeHead(404, {'Content-Type': 'text/html'});
  resp.write('<h1>Page Not Found</h1>');
  resp.end();
};

const handle = (req, resp, services) => {
  const service = findService(req, services);

  if (service && service.response) {
    const { header, payload, file, script } = service.response;

    if (header) {
      for (let h in header) {
        resp.setHeader(h, header[h]);
      }
    }

    if (payload) {
      if (typeof payload === 'string') {
        if (!header || !header['Content-Type']) {
          resp.setHeader('Content-Type', 'text/plain');
        }
        resp.writeHead(200);
        resp.write(payload);
      } else {
        resp.writeHead(200, {'Content-Type': 'application/json'});
        resp.write(JSON.stringify(payload));
      }
      resp.end();
      return;
    }

    if (file) {
      fs.readFile(file, 'binary', (err, data) => {
        if (err) {
          console.log(Date(), `read ${file} failed: ${err}`);
          response500(resp);
        } else {
          if (!header || !header['Content-Type']) {
            resp.setHeader('Content-Type', getContentType(file));
          }
          resp.writeHead(200);
          resp.write(data, 'binary');
          resp.end();
        }
      });
      return;
    }

    if (script) {
      try {
        require(script).handle(req, resp);
      } catch (err) {
        console.log(Date(), `run ${script} failed: ${err}`);
        if (!resp.finished) {
          response500(resp);
        }
      }
      return;
    }
  }

  response404(resp);
};

fs.readFile('stub.config.json', 'utf8', (err, data) => {
  const config = JSON.parse(data);
  require('http').createServer((req, resp) => {
    handle(req, resp, config.services);
  }).listen(config.port);
  console.log(Date(), 'Server runing at port:', config.port);
});
