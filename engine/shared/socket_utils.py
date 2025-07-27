from shared.utils import setup_logger
import os
import socketio

logger = setup_logger(__name__)


async def send_message(namespace: str, message: str, data: list | None = None, query_params: dict | None = None):
    """Sends a message to the specified namespace of the socketio server
    
    Args:
        namespace: The namespace that we are sending the message to
        message: The message/event name that we are sending
        data: Optional dictionary of data to send with the message
        query_params: Optional dictionary of query parameters for the socket connection
    """
    # Get server URL from environment or use default
    server_url = os.getenv("SERVER_URL", "http://localhost:8080")
    
    # Create socketio client
    sio = socketio.AsyncClient()
    
    try:
        # Connect to the server with optional query parameters
        if query_params:
            await sio.connect(server_url, namespaces=[namespace], **query_params)
        else:
            await sio.connect(server_url, namespaces=[namespace])
        
        # Send message to the namespace
        if data is not None:
            await sio.emit(message, data, namespace=namespace)
            logger.info(f"Message sent to namespace '{namespace}': {message} with data: {data}")
        else:
            await sio.emit(message, namespace=namespace)
            logger.info(f"Message sent to namespace '{namespace}': {message}")
            
    except Exception as e:
        logger.error(f"Error sending Socket.IO message: {e}")
    finally:
        # Always disconnect to clean up resources
        await sio.disconnect()