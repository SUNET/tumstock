
const express = require('express');
const fs = require('fs');
const https = require('https');
const http = require('http');
const cors = require('cors');
const redis = require('redis');

const HOST = process.env.HOST || "0.0.0.0";
const PORT = process.env.PORT || 3000;
const REDIS_HOST = process.env.REDIS_HOST || '127.0.0.1';
const REDIS_PORT = parseInt(process.env.REDIS_PORT) || 6379;

const client = redis.createClient(REDIS_PORT, REDIS_HOST);

const app = express();
app.use(express.json());

function to_number(x) {
    let v = Number(x);
    if (Number.isNaN(v)) {
        throw `Error - value is not a number`;
    }
    return v;
}

app.post('/tumstock/pingdom', (req, res) => {
    let data = req.body;
    if (data.check_params && data.check_params.hostname) {
        client.publish("tumstock.pingdom", JSON.stringify(data));
    }
});

// POST { name: <string>, [<tag>: <value>]+ }

app.post('/tumstock/metric/:name', (req, res) => {
    let data = req.body;
    try {
        Object.keys(data).forEach(k => {
            to_number(data[k]);
        });
    } catch (e) {
        return res.status(400).send(e);
    }
    let name = decodeURIComponent(req.params.name);
    client.hmset(name, data, (err, obj) => {
        if (err) {
            console.log(err);
            return res.status(500).send(err);
        } else {
            let message = {'name': name, 'timestamp': Date.now(), 'data': data};
            client.publish("tumstock.metric", JSON.stringify(message));
            return res.json(message);
        }
    });
});

app.get('/tumstock/metric/:name', cors(), (req, res) => {
    let name = decodeURIComponent(req.params.name);
    client.hgetall(name, (err, obj) => {
        let data = {};
        try {
            Object.keys(obj).forEach(k => {
                data[k] = to_number(obj[k]);
            });
        } catch (e) {
            return res.status(400).send(e);
        }
        return res.json(data);
    });
});

app.get('/tumstock/metric/:name/:tag', cors(), (req, res) => {
    let name = decodeURIComponent(req.params.name);
    let tag = decodeURIComponent(req.params.tag);
    client.hget(name, tag, (err, obj) => {
       return res.json({tag: new Number(obj)});
    });
});

if (process.env.SSL_KEY && process.env.SSL_CERT) {
    let options = {
        'key': fs.readFileSync(process.env.SSL_KEY),
        'cert': fs.readFileSync(process.env.SSL_CERT)
    };
    https.createServer(options, app).listen(PORT, function () {
        console.log(`HTTPS listening on ${HOST}:${PORT}`);
    });
} else {
    http.createServer(app).listen(PORT, function () {
        console.log(`HTTP listening on ${HOST}:${PORT}`);
    })
}
