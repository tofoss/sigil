!#/usr/bin/bash

echo "Generating XSRF_SECRET..."
echo "XSRF_SECRET=$(openssl rand -base64 64 | tr -d '\n')" >> .env
echo "Generating JWT_SECRET..."
echo "JWT_SECRET=$(openssl rand -base64 64 | tr -d '\n')" >> .env

