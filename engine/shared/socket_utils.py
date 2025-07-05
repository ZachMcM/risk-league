import asyncio
import json
import os
from websockets.asyncio.client import connect

async def send_message(namespace: str, message: str, data: dict = None, query_params: dict = None):
    """Sends a message to the specified namespace of the websocket on our webserver
    
    Args:
        namespace: The namespace that we are sending the message to
        message: The message/event name that we are sending
        data: Optional dictionary of data to send with the message
        query_params: Optional dictionary of query parameters for the socket connection
    """
    # Get WebSocket URL from environment or use default
    server_url = os.getenv("SERVER_URL", "http://localhost:8080")
    # Convert HTTP(S) URL to WebSocket URL
    ws_url = server_url.replace("http://", "ws://").replace("https://", "wss://")
    
    # Build query string from parameters
    query_string = "EIO=4&transport=websocket"
    if query_params:
        for key, value in query_params.items():
            query_string += f"&{key}={value}"
    
    try:
        async with connect(f"{ws_url}/socket.io/?{query_string}") as websocket:
            # Send socket.io handshake
            await websocket.send("40")  # Socket.io connect packet
            
            # Wait for connection confirmation
            await websocket.recv()
            
            # Send message to specific namespace with optional data
            if data is not None:
                socket_message = json.dumps([message, data])
            else:
                socket_message = json.dumps([message])
            
            await websocket.send(f"42{socket_message}")
            
            if data is not None:
                print(f"✅ Message sent to namespace '{namespace}': {message} with data: {data}")
            else:
                print(f"✅ Message sent to namespace '{namespace}': {message}")
            
    except Exception as e:
        print(f"⚠️ Error sending WebSocket message: {e}")