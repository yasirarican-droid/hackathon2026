# NASA Starboard

Live site: https://nasastarboard.app

## Publishing

Push static website files to `public/` on the `main` branch. The server checks GitHub approximately every 60 seconds and atomically publishes the latest valid release. No build commands or repository scripts are executed on the server. `public/index.html` is required. The last three published releases are retained.

Development notes, SSH keys, environment files, and other credentials must remain outside `public/` and must never be committed.

## Server operations

Deployment timer: `starboard-deploy.timer`

Deployment logs: `journalctl -u starboard-deploy.service`

Web server: Caddy with automatic HTTPS. The `www` hostname redirects to the main hostname.
