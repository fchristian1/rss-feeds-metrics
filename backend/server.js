import express from 'express'
import cors from 'cors'
import promClient from 'prom-client'
import rssParser from 'rss-parser'
import hasher from 'object-hash'
import fs from 'fs'

const filename = 'rss-parser.log';
const rssFeedsFilename = 'feeds.json';
const rssLogFilename = 'rss.log';
const errorLogFilename = 'error.log';
const errorLogWriter = fs.createWriteStream(errorLogFilename, { flags: 'a' });
let hashFile = undefined;
let rssFeedsFile = undefined;

try {
    hashFile = fs.readFileSync(filename, 'utf8');
    rssFeedsFile = fs.readFileSync(rssFeedsFilename, 'utf8');
} catch (err) {
    fs.writeFileSync(filename, '');
}


const hashArray = hashFile ? hashFile.split('\n') : [];
const hashArrayFiltered = hashArray.filter((hash) => hash !== '');

let titleHashs = hashArrayFiltered ?? [];

const fileWriter = fs.createWriteStream(filename, { flags: 'a' });
const rssLogWriter = fs.createWriteStream(rssLogFilename, { flags: 'a' });
const parser = new rssParser();
const counter = new promClient.Counter({ name: "test_counter", help: "test counter help", labelNames: ["name", "thema"] });

const app = express();

let feeds = rssFeedsFile ? JSON.parse(rssFeedsFile) : [];



app.use(cors());
app.use(express.json());

parsingFeedsAndCheckTitleHashs();

setInterval(async () => {
    parsingFeedsAndCheckTitleHashs();

}, 60000)

app.get("/", async (req, res) => {
    await parsingFeedsAndCheckTitleHashs();
    res.send("parsing feeds completed: " + titleHashs.length);

});


async function parsingFeedsAndCheckTitleHashs() {
    feeds.forEach(async (feed) => {
        try {
            const parsedFeed = await parser.parseURL(feed.url);
            parsedFeed.items.forEach(async (item) => {
                const titleHash = hasher(item.title);

                titleHashs.includes(titleHash) ? null : await pushAndCount(feed.name, item, titleHash);

            });
        } catch (error) {
            errorLogWriter.write(JSON.stringify(error) + "\n");
        }
    });
}
async function pushAndCount(feedName, item, titleHash) {
    counter.inc({ name: feedName, thema: item.title });

    titleHashs.push(titleHash);
    fileWriter.write(titleHash + "\n");
    item.feedName = feedName;
    rssLogWriter.write(JSON.stringify(item) + "\n");

}

app.get("/metrics", async (req, res) => {
    res.set('Content-Type', promClient.register.contentType);
    res.end(await promClient.register.metrics());
})


app.listen(3003, () => {
    console.log("app is running on port 3003")
})