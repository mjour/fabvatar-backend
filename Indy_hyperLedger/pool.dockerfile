FROM bcgovimages/von-image:node-1.12-6

USER indy
RUN pip install --no-cache-dir aiosqlite~=0.6.0 

ENV RUST_LOG ${RUST_LOG:-warning}

RUN mkdir -p \
        $HOME/ledger/sandbox/data \
        $HOME/log \
        $HOME/.indy-cli/networks \
        $HOME/.indy_client/wallet \
       chmod uga+rw $HOME/log $HOME/ledger $HOME/.indy-cli $HOME/.indy_client

ADD --chown=indy:indy indy_config.py /etc/indy/

ADD --chown=indy:indy . $HOME

RUN chmod ug+x scripts/* bin/*
