# maimaidx_extend
A wrapper for maimai DX NET international version.

## Feature
- Save the play log and append to list (Official log count up to 50)
- Save the memory photo and append to list (Official photo count up to 10)
- Find the play log in song record
- Show achievement +-% in record (Since this record starts)
- Show the play count for today
- Play log achievement analysis
- Best 50 rating analysis (Database required)
- Song score page rating table preview (Database required)

## Usage
To install dependencies:

```bash
npm install
```

To run:

```bash
node server.js
```

## When updating
Sometimes `db.json` format updates over feature updating, make sure to run the migration after pulling the code from repo::

```bash
npm migrate
```

If you want to create a migration, run following command to create one from template:

```bash
npm migrate:create
```

This project was created using `bun init` in bun v1.0.0. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.
But bun is so buggy, now replaced by nodejs.