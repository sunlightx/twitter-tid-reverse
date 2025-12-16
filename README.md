# Twitter TID Builder

Transaction ID generator for Twitter API.

## Example Usage

```javascript
import fs from "fs";
import { TidBuilder } from "./tid-builder.js";

const twitterHtml = fs.readFileSync("twitterHtml.txt", "utf-8");
const onedemandHtml = fs.readFileSync("onedemandHtml.txt", "utf-8");

const tid = new TidBuilder(twitterHtml, onedemandHtml);

const transaction_id = await tid.generate(
  "/1.1/account/update_profile.json",
  "POST"
);
console.log(transaction_id);
```

## Dependencies

- cheerio
