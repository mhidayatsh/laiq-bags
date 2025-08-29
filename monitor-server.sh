#!/bin/bash

# Server monitoring script
SERVER_URL="http://localhost:3001/api/health"
LOG_FILE="logs/monitor.log"

echo "$(date): Starting server monitoring..." >> $LOG_FILE

while true; do
    if curl -s -f $SERVER_URL > /dev/null; then
        echo "$(date): Server is running" >> $LOG_FILE
    else
        echo "$(date): Server is down, restarting..." >> $LOG_FILE
        ./start-server.sh
    fi
    sleep 30
done
