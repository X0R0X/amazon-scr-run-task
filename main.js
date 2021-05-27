const Apify = require('apify');
const ApifyClient = require('apify-client');
const got = require('got');

const apiToken = 'abnhd6vCFL24qcfWRpWdkZoZa';
const taskID = 'x0r0x~rocket-best-offers-task';
const datasetName = 'x0r0x~cheapestOffers';


Apify.main(async () => {
    const input = Apify.getInput();
    const memory = input['memory'] || 4096;
    const useClient = input['useClient'] || false;
    const fields = input['fields'] || ['title', 'url', 'price'];
    const maxItems = input['maxItems'] || 10;

    const client = new ApifyClient({token: apiToken});

    if (useClient) {
        console.log(`Running task ${taskID} using ApifyClient...`);

        const task = client.task(taskID);
        await task.call({}, {memory: memory});
    } else {
        console.log(`Running task ${taskID} using API...`);

        let response = await got({
            url: `https://api.apify.com/v2/actor-tasks/${taskID}/runs?token=${apiToken}`,
            method: 'POST',
            responseType: 'json',
        });
        const runID = response.body['data']['id'];

        while (true) {
            response = await got({
                url: `https://api.apify.com/v2/actor-runs/${runID}?token=${apiToken}`,
                method: 'GET',
                responseType: 'json',
            });

            if (response.body['data']['status'] !== 'RUNNING') {
                break;
            }

            await new Promise(x=>setTimeout(x, 1000))
        }
    }

    console.log(`Task ${taskID} completed, saving OUTPUT.csv...`);
    const datasetClient = client.dataset(datasetName);
    const csv = await datasetClient.downloadItems('csv', {limit: maxItems, fields: fields});

    const kvStore = await Apify.openKeyValueStore();
    await kvStore.setValue('OUTPUT.csv', csv);
});
