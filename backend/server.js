import express from 'express'
import cors from 'cors'
import promClient from 'prom-client'
import rssParser from 'rss-parser'
import hasher from 'object-hash'
import fs from 'fs'

const filename = 'rss-parser.log';
let hashFile = undefined;

try {
    hashFile = fs.readFileSync(filename, 'utf8');
} catch (err) {
    fs.writeFileSync(filename, '');
}

const hashArray = hashFile ? hashFile.split('\n') : [];
const hashArrayFiltered = hashArray.filter((hash) => hash !== '');

let titleHashs = hashArrayFiltered ?? [];

const fileWriter = fs.createWriteStream(filename, { flags: 'a' });
const parser = new rssParser();
const counter = new promClient.Counter({ name: "test_counter", help: "test counter help", labelNames: ["name", "thema"] });

const app = express();

let feeds = [
    { url: 'https://www.reddit.com/.rss', name: 'reddit' },
    { url: 'https://www.autobild.de/rss/22590721.xml', name: 'AutoBild - Formel 1' },
];



app.use(cors());
app.use(express.json());

setInterval(async () => {
    parsingFeedsAndCheckTitleHashs();

}, 60000)

app.get("/", async (req, res) => {
    await parsingFeedsAndCheckTitleHashs();
    res.send("parsing feeds completed: " + titleHashs.length);

});


async function parsingFeedsAndCheckTitleHashs() {
    feeds.forEach(async (feed) => {

        const parsedFeed = await parser.parseURL(feed.url);
        try {
        } catch (error) {
            console.log("error: ", error);
        }
        parsedFeed.items.forEach(async (item) => {
            const titleHash = hasher(item.title);

            titleHashs.includes(titleHash) ? null : await pushAndCount(feed.name, item, titleHash);

        });
    });
}
async function pushAndCount(feedName, item, titleHash) {
    counter.inc({ name: feedName, thema: item.title });

    titleHashs.push(titleHash);
    fileWriter.write(titleHash + "\n");

}

app.get("/metrics", async (req, res) => {
    res.set('Content-Type', promClient.register.contentType);
    res.end(await promClient.register.metrics());
})


app.listen(3003, () => {
    console.log("app is running on port 3003")
})