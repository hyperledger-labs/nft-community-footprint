FROM node:14 AS build

WORKDIR /app

RUN mkdir -p /app/test-network/organizations/peerOrganizations/
COPY --chown=node:node . /app/nft-erc721/application/

WORKDIR /app/nft-erc721/application/

RUN npm ci
RUN npm prune --production
RUN chown -hR node:node /app

FROM node:14

RUN apt-get update
RUN apt-get install -y g++ make python3 dumb-init

ENV NODE_ENV production

WORKDIR /app
COPY --chown=node:node --from=build /app .

WORKDIR /app/nft-erc721/application
RUN npm link

EXPOSE 3000  

USER node
ENTRYPOINT [ "dumb-init", "--", "/bin/bash"]
