const fs = require('fs');

const mine = {
    json: 'application/json',
    xml: 'tect/xml',
    html: 'text/html'
};

const getContentType = (file) => {
    const ext = require('path').extname(file) || '.unknown';
    return mine[ext.slice(1)] || 'text/plain';
}

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
}

const response500 = (resp) => {
    resp.writeHead(500, {'Content-type': 'text/html'});
    resp.write('<h1>Internal Server Error</h1>');
    resp.end();
}

const response404 = (resp) => {
    
}
