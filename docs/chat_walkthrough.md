# CampusCart Real-Time Chat Implementation Walkthrough

This document explains the end-to-end flow of the real-time chat feature implemented in CampusCart using Spring Boot WebSockets and React.

## 1. The Database Models (PostgreSQL)

To store chat history permanently, we use two entities:
*   **`ChatSession`**: Represents a unique conversation between a `Buyer` and a `Seller` regarding a specific `Listing`.
*   **`ChatMessage`**: Represents an individual message sent inside a `ChatSession`. It stores the text, timestamp, and the `senderId`.

## 2. Spring Boot WebSockets (STOMP)

We use the **STOMP (Simple Text Oriented Messaging Protocol)** over WebSockets. It acts like a pub-sub system.
*   **WebSocketConfig.java**: We register a WebSocket endpoint `/ws` for the React app to connect to. We also enable a "Simple Broker" routing messages to destinations prefixed with `/topic` or `/queue`.
*   **Message Routing**: 
    *   Clients subscribe to `/user/queue/messages` to receive private messages.
    *   When a user sends a message, they send it to `/app/chat`.
*   **ChatController.java**: Contains `@MessageMapping("/chat")`. When a message hits this endpoint, the backend saves the message to PostgreSQL, then uses `SimpMessagingTemplate` to push the message directly to the recipient's active WebSocket connection.

## 3. The Frontend (React)

*   **Connection**: The React app uses `sockjs-client` and `@stomp/stompjs` to establish a persistent connection to the `/ws` endpoint when the user opens their Inbox.
*   **Inbox UI (`Inbox.tsx`)**: 
    *   A split-pane layout. The left pane shows a list of active `ChatSessions`. The right pane shows the actual `ChatMessages` for the selected session.
    *   When the user types a message and hits "Send", it emits a STOMP message to `/app/chat`.
    *   The UI instantly appends the message to the screen while also listening for incoming messages on the subscription channel to render replies in real-time.
*   **Initiating a Chat (`ItemDetail.tsx`)**: 
    *   When a buyer clicks **"Message Seller"**, the frontend sends a standard HTTP POST request to `/api/chat/session` with the `listingId`. 
    *   The backend either creates a new `ChatSession` or returns the existing one. 
    *   The React router then redirects the user to `/marketplace/inbox?session=[id]`.

## 4. Security

*   Even though it's WebSockets, we intercept the connection handshake to validate the JWT token in the `Authorization` header or as a query parameter (since standard browser WebSockets don't easily support headers). 
*   If the token is invalid, the WebSocket connection is rejected.

## 5. Frequently Asked Questions (Architecture & Scaling)

**Q: What happens if a user is logged in on both the Mobile App and the Web App at the same time?**
**A:** Spring WebSockets natively supports multiple active WebSocket sessions for a single Principal (user). When a message is sent to a specific user's topic (e.g., `/topic/session/123`), Spring Boot's message broker automatically broadcasts that message to **all** active WebSocket connections associated with that user. The user will see the message pop up instantly on both their phone and their laptop!

**Q: What if multiple buyers message a single seller at the exact same time?**
**A:** Each conversation is strictly isolated into its own `ChatSession`. If 5 different buyers message a seller about the same textbook, the database will create 5 distinct `ChatSession` rows. The seller's Inbox UI will simply show 5 separate threads in the sidebar. The backend processes these messages asynchronously, routing each message only to the specific session's topic.

**Q: What happens to the Backend and Database if 100 users use this chat feature simultaneously?**
**A:** Because we are using WebSockets, connections are persistent. 
*   **Memory:** 100 simultaneous WebSocket connections take a negligible amount of RAM on a Spring Boot server (a single Tomcat instance can comfortably handle 10,000+ concurrent WebSockets).
*   **Database Load:** We optimize writes by saving the message to PostgreSQL immediately, but we broadcast the message via memory (the Simple Broker). PostgreSQL can easily handle thousands of inserts per second. 
*   **Scaling Up:** If the app grows to 100,000 users, the "Simple Broker" will run out of memory. This is exactly when we would swap out the Simple Broker for **RabbitMQ**. RabbitMQ would act as a highly scalable external message broker, allowing us to spin up multiple Spring Boot backend instances to load-balance the WebSocket connections.

**Q: Does the chat work if the recipient is currently offline?**
**A:** Yes! Because every message is saved directly to the `chat_messages` PostgreSQL table *before* being broadcasted over the WebSocket, no data is lost. When the offline user logs back in and navigates to their Inbox, the React app will fetch the entire session history from the REST API (`/api/chat/session/{id}/messages`), and they will see everything they missed.

**Q: How do we prevent users from spamming the chat?**
**A:** We implemented custom business logic in the `ChatService` to strictly limit spam:
1. **Consecutive Message Cap**: A user can only send a maximum of 4 consecutive messages. If they try to send a 5th message before the other person replies, the backend throws an exception and blocks the message.
2. **Total Session Cap**: A single conversation (Chat Session) about a specific product is capped at 100 total messages between both parties. This ensures negotiations remain focused and prevents database bloat.
