# ELEMENTAL

A tool for annotating texts  &mdash; for tagging tokens and adding comments to them. 

Current direction of development is towards building an up-to-date platform for maintaining and publishing commented **digital editions**. However, the main idea behind the project is **providing a user-friendly and productive UI for any type of text annotation**, backed by a lightweight and easy to install application.

## Status

**Pre-release / Work In Progress [March 2023]**

As for now, the project was tested only on a single text and with a single scheme of a comment. It would be great to have more different projects. I'd appreciate any feedback. Feel free to create an issue on Github or [contact me](https://yaskevich.com/) directly.

## Development

It started in 2018 as a manual Part-of-Speech tagging tool written in JQuery (data loader in Python 3) backed with SQLite. It is being rewritten in modern JavaScript &mdash; both client (Vue3/TypeScript) and server (NodeJS). The project architecture changes. Current tasks include migrating from SQLite to PostgreSQL (*completed*) and extending the toolset with the interface for adding comments for text tokens (*high priority*). Rewriting the old client for PoS from JQuery to Vue3 is in the backlog as well (*postponed*).

## Setup and deployment

| Requirements                    | OS    | NodeJS | PostgreSQL |
| ------------------------------- | ----- | ------ | ---------- |
| Minimal setup                   | *any* | 14     | 12         |
| Development setup (recommended) | Linux | 18     | 14         |

Technically, the platform consists of two applications: client and server.

Installation routine consists of such sequence of steps as:  installing  client packages, compiling client application and copying it into server `public` directory, installing server packages, setting environmental variables (the easiest way is by creating an `.env` file in project root directory) and starting the server application. There is no need to do it manually, step by step, automation is a way. The example setup script is in [deploy.sh](/deploy.sh).

This example of the content of `.env` file:

```shell
# PostgreSQL user
PGUSER=database_user
# PostgreSQL host (IP or hostname)
PGHOST=127.0.0.1
# PostgreSQL password
PGPASSWORD=...................
# PostgreSQL database
PGDATABASE=database_name
# PostgreSQL port
PGPORT=5432
# Application port
# If not set, default value is used (8080)
PORT=8080
# Secret Key for JSON Web Token (must be random)
JWT_SECRET=...................
# Size limit for image files (in bytes)
# If not set, default value is used (1 Mb)
IMGLIMIT=1024000
# Size limit for text content (in bytes)
# If not set, default value is used (10 Mb)
TXTLIMIT=10240000
```



Obviously, in production environment one should use rather a process manager, than a bare NodeJS instance. I recommend [PM2](https://pm2.keymetrics.io), there is a [config file](/server/ecosystem.config.cjs) for it. Also, one can pass the environmental variables in any other manner: via Docker config, via PM2 config, etc.


:space_invader:
