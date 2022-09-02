import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { ethers } from 'ethers';
import { TwitterClient } from 'twitter-api-client';

const twitterClient = new TwitterClient({
  apiKey: process.env.TWITTER_API_KEY || '',
  apiSecret: process.env.TWITTER_SECRET || '',
  accessToken: process.env.TWITTER_ACCESS_TOKEN || '',
  accessTokenSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET || '',
});

const BATCH_SIZE = 5;

const app = express();
const port = 4000;

app.use(express.static('public'));
app.use(cors());
app.use(express.json());

const provider = new ethers.providers.JsonRpcProvider(
  process.env.ALCHEMY_PROVIDER_URL
);

const getTwitterFromEthAddress = async (address: string) => {
  const ens = await provider.lookupAddress(address);
  if (!ens) {
    return '';
  }

  const data = await twitterClient.accountsAndUsers.usersSearch({
    q: ens,
    count: 1,
  });

  if (!data.length) {
    return '';
  }

  return data[0].screen_name;
};

app.post('/do-the-thing', async (req, res) => {
  const { addresses } = req.body;
  let handles: string[] = [];
  let allPromises: Promise<string>[] = [];
  let i = 0;
  for (let address of addresses) {
    allPromises.push(getTwitterFromEthAddress(address));
    i++;
    if (i % BATCH_SIZE === 0) {
      const newHandles = await Promise.all(allPromises);
      handles = [...handles, ...newHandles];
      allPromises = [];
    }
  }

  // finish off the last of em
  const newHandles = await Promise.all(allPromises);
  handles = [...handles, ...newHandles].filter((handle) => !!handle);

  res.send({ body: JSON.stringify({ handles }) });
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
