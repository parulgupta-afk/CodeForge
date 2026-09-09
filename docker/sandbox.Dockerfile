# Optional: pre-built Python image used by the execution sandbox
FROM python:3.12-slim
# Keep minimal – agent code is mounted at runtime
WORKDIR /code
