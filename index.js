const centers = require('./only_lodash_centers.json');
const fetch = require('node-fetch');
const q = require('q')
const beeper = require('beepbeep');
const winston = require('winston')
const consoleTransport = new winston.transports.Console()
const myWinstonOptions = {
    transports: [consoleTransport]
}
const logger = new winston.createLogger(myWinstonOptions)

var statusCenters = [];

const updateCenters = function () {
    Promise.allSettled(centers.map(center => {

        const name = center.name;
        const id = center.id;
        const fetchy = fetch("https://zh.vacme.ch/api/v1/reg/dossier/termine/nextfrei/" + id + "/ERSTE_IMPFUNG", {
            // paste "nodejs fetch" from browser here, and remove first line<snip>
            "headers": {
                "accept": "application/json",
                "accept-language": "en-US,en;q=0.9,de-DE;q=0.8,de;q=0.7,et;q=0.6",
                "authorization": null,
                "content-type": "application/json",
                "sec-fetch-dest": "empty",
                "sec-fetch-mode": "cors",
                "sec-fetch-site": "same-origin",
                "x-xsrf-token": null,
                "cookie": null
            },
            "referrer": "https://zh.vacme.ch/",
            "referrerPolicy": "strict-origin",
            "body": null,
            "method": "POST",
            "mode": "cors"
        });
        // to here </snip>
        fetchy.then(result => {
            // statusCenters.push({"status": result.status, "name": name, data: result.body});
            statusCenters.push({"status": result.status, "name": name, "body": result.text()});
            return result;
        });
        return fetchy;

    })).then(results => {
        return statusCenters.sort((a, b) => b.status - a.status);
    }).then((c) => {
        const termin = c.filter(x => x.status < 204);
        if (termin.length > 0) {
            logger.info("Termin(e) gefunden!");
        }
        const sessionBroken = c.filter(x => x.status > 299);
        if (sessionBroken.length > 0) {
            logger.warn("SessionBroken");
        }
        return c;
    }).then(c => {
        let impfzenter = c.filter(x => x.status < 204);
        if (impfzenter.length > 0) {
            logger.info("Freier Termin!")
            logger.info(impfzenter);
            beeper(50, 20)
        } else {
            if (c.filter(x => x.status > 299).length > 0) {
                logger.error("Token abgelaufen")
                beeper(1, 1000);
            } else {
                logger.info('updating....');
                setTimeout(updateCenters, 2000);
            }
        }

    })
}

updateCenters();