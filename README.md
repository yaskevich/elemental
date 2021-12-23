# Corpus Annotation Tool

**Work in progress**

The idea behind the project is to provide user-friendly and productive UI for rich text annotation.
It started as a PoS manual tagging tool written in JQuery (data loader in Python 3), but as for now (Dec 2021) is is being rewritten in JavaScript – both client (Vue3) and server (NodeJS).

The project architecture changes. Current tasks include migrating from SQLite to PostgreSQL and extending the toolset with the interface for adding comments for text tokens. Rewriting the old client for PoS from JQuery to Vue3 is in the backlog as well.

However, the project is still far away from release-ready status, particularly, since it lacks project setup functions. File `server/converter.js` is able to import raw text file into the database, but the database is to be initiated via loading SQL dump, not automatically.

If either you like the idea and would like to use the app as soon as possible, or you are ready to  commit, or, maybe, you know the application that already exists and has all the functions like this, please, contact me via Github or mail me.

### Preprocessing
For early alpha:
- Create SQLite database file with the structure as it is in `text2db.py`
- Run `python text2db.py file.txt`

Now: execute `node server/converter.js`

#### Requirements

NodeJS v14+, PostgreSQL v9.6+

#### Running the application

The example setup script is in the file `deploy-elemental.sh`

Obviously, in production one should not use bare NodeJS instance, but a process manager, such as PM2.
