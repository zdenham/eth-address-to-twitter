import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { ethers } from 'ethers';

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
  const lookup = await provider.lookupAddress(address);
  console.log('THE LOOK UP: ', lookup);

  return '';
};

app.post('/do-the-thing', async (req, res) => {
  const { addresses } = req.body;
  let handles: string[] = [];
  const allPromises: Promise<string>[] = [];
  let i = 0;
  for (let address of addresses) {
    allPromises.push(getTwitterFromEthAddress(address));
    i++;
    if (i % BATCH_SIZE === 0) {
      const newHandles = await Promise.all(allPromises);
      handles = [...handles, ...newHandles];
    }
  }

  handles = handles.filter((handle) => !!handle);

  res.send({ body: JSON.stringify({ handles }) });
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
