# Agentkit Overview

I would like to create a reusable fullstack development framework that I can
use as a strawman starting point for my agentic development workflow.
The workflow will act as a professional Golang developer and use
a base set of libraries and SDKs for development that will run via
docker.

# Base Libraries and SDKs

- Pocketbase
- SvelteKit with modern dashboard capabilities
- Nats realtime communication capability


# Features

- Handle authentication and OATH, especially Google authentication capable
- Database backend with import/export capabilities
- SSE capabile
- Able to be built and run from a docker compose file
- Use Github repo with actions to build, compile and creation of the docker image or images


# Tasks

1. Think deeply about tools for a development approach that is easy to maintaing and test.
2. Create a Dockerfile and docker-compose file that will handle the base image and development toolchains to start with
3. Create a skill.md file that an A.I. agent can use as the Agentkit skill for building new applicaitons.
4. Agentkit should start with a basic fullstack proof of concept starting point app that says Agentkit and be easily modified for any project an A.I. agent needs to create.

