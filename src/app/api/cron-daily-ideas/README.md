# Daily Ideas Generation Cron Endpoint

This API endpoint is designed to be called by a cron job service (like cron-job.org) on a daily basis to automatically generate and store new business ideas.

## Endpoint

```
GET /api/cron-daily-ideas
```

## Security

This endpoint is secured with a Bearer token authorization header. The token must be set in the environment variable `CRON_AUTH_TOKEN`.

Example header:

```
Authorization: Bearer YOUR_SECRET_TOKEN
```

## Functionality

When called, this endpoint will:

1. Collect current trends from Twitter and Reddit
2. Send the combined research data to Gemini AI as a prompt
3. Receive formatted business ideas from Gemini
4. Store the ideas in the Supabase database

## Setup Instructions

1. Set the `CRON_AUTH_TOKEN` environment variable in your deployment environment
2. Configure your cron job service to call this endpoint daily
3. Include the Authorization header with your secret token

Example curl command:

```bash
curl -H "Authorization: Bearer YOUR_SECRET_TOKEN" \
     https://your-domain.com/api/cron-daily-ideas
```

## Response Format

On success:

```json
{
  "success": true,
  "message": "Daily ideas generated and saved successfully",
  "ideas": [...],
  "count": 10,
  "date": "2025-09-23"
}
```

On error:

```json
{
  "success": false,
  "error": "Error message"
}
```
