# aipi

This is our ai api.
We write in TS as openai does not support Java and to isolate ai logic and loads.

## .env

We define some env vars in .env and some secret ones in .env.local:

-   `OPENAI_API_KEY` Open AI api key

## Deploy

We deploy this api as aws lambda functions usg aws cdk.
In the _stack_ dir we define our stack.
The entry point is in _bin_. AWS CDK recognizes the Stack instances and deploys them.

See _docs/CDK.md_ for more information.

## Endpoints

The endpoint are lambda functions and are defined in _src/api_ each endpoint must define an export handler named _handler_.
