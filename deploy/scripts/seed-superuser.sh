#!/usr/bin/env bash
# No-op placeholder. PocketBase requires the first superuser to be created
# via the admin UI; this file exists so the Dockerfile reference is valid.
# After creating the superuser once at https://yourdomain.com/_/ the
# bootstrap script (wait-and-bootstrap.sh) will run successfully.
echo "Use the PB admin UI at /_ to create the first superuser."
