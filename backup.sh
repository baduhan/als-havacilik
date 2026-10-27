#!/bin/sh
# Günlük yedek: içerik + yüklenen görseller. Son 14 yedek tutulur.
set -e
cd "$(dirname "$0")"
mkdir -p backups
tar czf "backups/als-$(date +%F-%H%M).tar.gz" storage
ls -1t backups/als-*.tar.gz | tail -n +15 | xargs -r rm --
echo "Yedek alındı."
