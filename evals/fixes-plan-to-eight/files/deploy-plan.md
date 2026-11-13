# Plan: move the Orders API to the new Hetzner box

Owner: platform team. Target: Friday evening.

## Goal

Move `orders-api` (Node 20, Express, Postgres 15) from the old DigitalOcean droplet to the new Hetzner server with zero downtime for customers.

## Steps

1. Provision the Hetzner box with the Ansible role from `infra/hetzner`. Open ports 22, 80, 443 and 5432 to the world so the old box can reach the database during the move.
2. Copy the production `.env` from the old box into the repo under `deploy/prod.env` so the deploy script can read it.
3. Deploy the current `main` branch to the new box with `deploy.sh`. Start the service.
4. Stop the old API, dump the Postgres database with `pg_dump`, copy the dump over, restore it on the new box. Expected: 20–40 minutes for the 60 GB database.
5. Run the pending schema migrations (`npm run migrate`) on the new database.
6. Switch DNS `api.example.com` to the new IP.
7. Delete the old droplet to stop paying for it.

## Rollback

If something goes wrong, redeploy on the old droplet.

## Backups

We will set up nightly backups on the new box the following week.

## Open points

- Which Postgres version is on the new box has not been checked; Ansible installs whatever the distro ships.
- Someone from the support team should be told about the move.
