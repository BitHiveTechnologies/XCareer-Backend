#!/bin/bash

echo "Starting localtunnel..."
lt --port 3001 > tunnel_output.log 2>&1 &
TUNNEL_PID=$!

echo "Waiting for tunnel to start..."
sleep 5

echo "Checking tunnel status..."
if [ -f tunnel_output.log ]; then
    echo "Tunnel output:"
    cat tunnel_output.log
fi

echo "Tunnel PID: $TUNNEL_PID"
echo "To stop tunnel: kill $TUNNEL_PID"
