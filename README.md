# Excluser

## Details

A platform for content creators to share exclusive content to their subscribers.

Unlock protocol is used to create membership and thus everything is token gated. Content creators can create posts ( using Orbis ) and poll ( using Vocdoni ). Everything is encrypted using Lit Protocol.

Web3 storage ( which uses Filecoin ) is used to store profile image on ipfs, it is used when user wants to edit their profile so the ipfs image url is then used.

There is a chatroom for all the users to chat ( it's encrypted too ).

Tableland is used as a decentralized sql database.

Contract is deployed on polygon mumbai. And contract is verified.
[smart contract address](https://github.com/Ahmed-Aghadi/Excluser/blob/main/client/constants/contractAddress.json#L2)

| Tech stack used                     |
| ----------------------------------- |
| [Orbis Club](#orbis-club)           |
| [Vocdoni](#vocdoni)                 |
| [Lit Protocol](#lit-protocol)       |
| [Unlock Protocol](#unlock-protocol) |
| [Polygon](#polygon)                 |
| [Web3 Storage](#web3-storage)       |
| [Tableland](#tableland)             |
| [Mantine UI](#mantine-ui)           |

## Deployements

Deployed website at Vercel: [Excluser](https://excluser.vercel.app/)

## Getting Started

To run frontend :

```bash
cd client/my-app

yarn run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

To deploy smart contracts to localhost :

```bash
cd smart_contracts/

yarn hardhat deploy --network localhost
```

## Sponsors Used

### Orbis Club

Post creation and chatting feature is added using orbis.

#### Atleast one example:

[Create Post](https://github.com/Ahmed-Aghadi/Excluser/blob/main/client/components/UserPage.tsx#L397)

[Send Message](https://github.com/Ahmed-Aghadi/Excluser/blob/main/client/components/ChatRoom.tsx#L143)

[Edit Profile](https://github.com/Ahmed-Aghadi/Excluser/blob/main/client/components/UserPage.tsx#L797)

### Vocdoni

Different types of polls were created using Vocdoni.

#### Atleast one example:

[Create Election](https://github.com/Ahmed-Aghadi/Excluser/blob/main/client/components/UserPage.tsx#L529)

[Fetching Poll Info](https://github.com/Ahmed-Aghadi/Excluser/blob/main/client/components/Poll.tsx#L30)

### Lit Protocol

Everything is encrypted using lit actions ( using Lit js sdk ). Only the owner of the membership NFT contract or the user who is subscribed to the membership can decrypt the contents.

#### Atleast one example:

[Encrypt Content](https://github.com/Ahmed-Aghadi/Excluser/blob/main/client/components/UserPage.tsx#L881)

[Decrypt Content](https://github.com/Ahmed-Aghadi/Excluser/blob/main/client/components/UserPage.tsx#L905)

[Encryption Rules](https://github.com/Ahmed-Aghadi/Excluser/blob/main/client/utils.ts#L92)

### Unlock Protocol

Unlock Protocol is used to create membership for content creators. So everything is token gated.

#### Atleast one example:

[deploy lock function](https://github.com/Ahmed-Aghadi/Excluser/blob/main/client/pages/upload.js#L70)

[register lock function in smart contract](https://github.com/Ahmed-Aghadi/Excluser/blob/main/smart_contracts/contracts/Main.sol#L44)

[token gated access](https://github.com/Ahmed-Aghadi/Excluser/blob/main/client/pages/api/login.ts)

### Polygon

All the smart contracts are deployed on polygon mumbai.

#### Atleast one example:

[Deployements](https://github.com/Ahmed-Aghadi/Excluser/tree/main/smart_contracts/deployments/mumbai)

[Smart Contract](https://github.com/Ahmed-Aghadi/Excluser/tree/main/smart_contracts/contracts)

### Web3 Storage

When user want to edit their pfp or cover image. Image uploaded by user is stored on IPFS using web3 storage ( which uses Filecoin ) and the IPFS url is then used.

#### Atleast one example:

[image upload function](https://github.com/Ahmed-Aghadi/Excluser/blob/main/client/pages/api/image-upload-ipfs.js)

[Smart Contract](https://github.com/Ahmed-Aghadi/Excluser/tree/main/smart_contracts/contracts)

### Tableland

Tableland is used as a decentralized sql database so content is smart contract is indexed using tableland.

#### Atleast one example:

[Tablename](https://github.com/Ahmed-Aghadi/Excluser/blob/main/client/constants/index.js#L15)

[Tableland Result](https://testnets.tableland.network/query?s=SELECT%20*%20FROM%20main_80001_4676)

### Mantine UI

Mantine ui is heavily used in front end for styling.
