# Security

Sinag holds a council's public record and its officials' accounts. If you find a way to read
something that should be private, change something you should not be able to, or get an account
without approval, please tell us privately first.

## Reporting

Email **pdyntechnology@gmail.com** with "Sinag security" in the subject, or use GitHub's
**Report a vulnerability** button on the repository's Security tab. Include:

- what you found and on which page or action,
- the steps to reproduce it,
- what someone could do with it.

Please do not test against a council's live site with real data, and do not access, change or
publish anyone's personal data. A local copy with the demo data (`npm run db:seed`) is the right
place to test.

We will acknowledge your report within a week, keep you told of progress, and credit you in the
fix if you want. If personal data was exposed, the council is told so it can meet its 72-hour
duty under the Data Privacy Act (see [docs/PRIVACY.md](docs/PRIVACY.md)).

## Supported versions

Fixes go into the `v1` branch, which is what is deployed.

## How Sinag protects itself

The security model (headers, sessions and revocation, rate limits, upload checks, role checks)
is summarised in the [README](README.md#security), with links to the code that does each part.
