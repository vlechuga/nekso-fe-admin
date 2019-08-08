#!/bin/sh

echo "\n\n== Downloading npm dependencies"
docker run -it --rm -v "$PWD":/data/src -w /data/src digitallyseamless/nodejs-bower-grunt npm install

echo "\n\n== Downloading bower dependencies"
docker run -it --rm -v "$PWD":/data/src -w /data/src digitallyseamless/nodejs-bower-grunt bower install

echo "\n\n== Building project"

if [ "$1" = "prod" ]; then
  echo '\n Production build'
  docker run -it --rm -v "$PWD":/data/src -w /data/src digitallyseamless/nodejs-bower-grunt grunt build-prod
elif [ "$1" = "qa" ]; then
  echo '\n QA build'
  docker run -it --rm -v "$PWD":/data/src -w /data/src digitallyseamless/nodejs-bower-grunt grunt build-qa
else
  echo '\n Development build'
  docker run -it --rm -v "$PWD":/data/src -w /data/src digitallyseamless/nodejs-bower-grunt grunt build
fi

echo "\n\n== Creating deployable container"
docker build --tag="nekso/admin" .
