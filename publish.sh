#!/bin/bash

## Build docker image.

version=$1

arch_name="$(uname -m)"

if [ $# = 0 ];then
    echo "Version must be provided. example: ./publish.sh 1.0.0"
    exit 1
fi
 
yarn install --ignore-engines

yarn run build

if [ "${arch_name}" = "x86_64" ]; then
    docker build --rm=true -t ccr.ccs.tencentyun.com/koderover-rc/zadig-portal:$version -f amd64.Dockerfile .
    docker push ccr.ccs.tencentyun.com/koderover-rc/zadig-portal:$version
elif [ "${arch_name}" = "arm64" ]; then
    docker buildx build --platform linux/amd64 --rm=true -t ccr.ccs.tencentyun.com/koderover-rc/zadig-portal:$version -f amd64.Dockerfile .
    docker push ccr.ccs.tencentyun.com/koderover-rc/zadig-portal:$version
else
    echo "Unknown architecture: ${arch_name}"
    exit 1
fi


