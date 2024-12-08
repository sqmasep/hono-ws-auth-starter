# WS + Auth base

This repo is a base for a web server that includes OAuth2 auth + websockets handling

## Why?

I've been stuck on a few projects because i needed to link websockets with auth on Next apps, and i just couldn't find anything. Just trying to solve that problem on this repo.

> [!NOTE]
> This is an experimentation project, i'm trying stuff to learn about auth and websockets to improve my fullstack skills

## Stack

I decided to use [hono](https://hono.dev) as the server framework, as it is FASTER than express and way much better, since it provides full typesafety between the server and the frontend. Since Lucia will be deprecated soon and is just handling the database part of auth, i'm only using arctic, which is a fantastic lib that provides helpful functions. Bun is used because it's extremely fast. I'm using the Valibot validator for Hono to validate data on server side. Hono also provides a way to handle websockets, which is handy.

Frontend is made with React, i dont need a Next app for this base, since it's essentially the same thing
