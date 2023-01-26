#!/bin/sh
echo "Starting process"
echo $PWD
cd ../../
echo $PWD
cd Indy_hyperLedger
docker system prune
./manage up