# Logs Directory

This directory contains application logs. The files here are automatically generated and should not be committed to version control.

## Log Files

- `django.log` - Main application log file (auto-rotated at 15MB, keeps 10 backups)

## Configuration

Logging is configured in `backend/settings.py` under the `LOGGING` configuration.

## Log Levels

- **DEBUG**: Detailed information, database queries
- **INFO**: General information about requests and operations
- **WARNING**: Warning messages
- **ERROR**: Error messages with stack traces

## Viewing Logs

**On Render.com:**
- Go to your service dashboard
- Click on the "Logs" tab
- Logs are streamed in real-time

**Locally:**
```bash
# View real-time logs
tail -f logs/django.log

# View last 100 lines
tail -n 100 logs/django.log

# Search for errors
grep ERROR logs/django.log
```
