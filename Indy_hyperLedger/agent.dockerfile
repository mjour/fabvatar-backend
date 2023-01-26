# Use BC Gov Indy images that have indy-sdk
# Will have to be updated from time to time to stay up to date on the indy-sdk version
FROM bcgovimages/von-image:py36-1.6-8

USER root

# Install nodejs
RUN curl -sL https://deb.nodesource.com/setup_8.x | bash -
RUN apt-get install -y \
        nodejs \
        build-essential

USER indy

WORKDIR $HOME

RUN mkdir -p \
        nodejs \
        $HOME/ledger/sandbox/data \
        $HOME/log \
        $HOME/.indy-cli/networks \
        $HOME/.indy_client/wallet \
       chmod uga+rw $HOME/log $HOME/ledger $HOME/.indy-cli $HOME/.indy_client
WORKDIR nodejs

ENV LD_LIBRARY_PATH=$HOME/.local/lib:/usr/local/lib:/usr/lib

# Get the dependencies loaded first - this makes rebuilds faster
COPY --chown=indy:indy package.json .
RUN npm config set python3 && npm install

# Copy rest of the app
COPY --chown=indy:indy . .
RUN chmod uga+x scripts/* bin/*

CMD [ "npm", "start" ]

EXPOSE 8000