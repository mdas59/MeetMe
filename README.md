# MeetMe – Zoom Clone using WebRTC

MeetMe is a real-time video conferencing web application inspired by Zoom.  
It allows users to create and join meeting rooms, communicate through live video/audio streams, exchange messages in real time, and share screens using peer-to-peer WebRTC connections.

## Features

- Real-time video/audio communication
- Peer-to-peer WebRTC connection
- Socket.IO signaling server
- Live chat messaging
- Screen sharing support
- Camera and microphone toggle
- Black/silent stream fallback when media is turned off
- JWT-based authentication
- Meeting history storage
- Responsive meeting UI
- Room participant limit for stable P2P performance

---

## Tech Stack

### Frontend
- React.js
- CSS Modules
- Material UI
- Socket.IO Client
- WebRTC APIs

### Backend
- Node.js
- Express.js
- Socket.IO
- MongoDB Atlas
- JWT Authentication
- Bcrypt Password Hashing

---

## Security Configurations

- Passwords are hashed using bcrypt
- JWT authentication using HTTP-only cookies
- Protected routes using custom middleware
- CORS configuration for frontend/backend communication
- Room participant limit to prevent excessive P2P load

---

## Room Limit

This project uses a mesh-based P2P WebRTC architecture.  
To maintain stable video transmission and reduce bandwidth overload, the meeting room is limited to a small number of users.

Recommended room size:
- 2–4 participants

---

## Why I Built This Project

I wanted to understand how real-time communication systems work behind the scenes instead of only using existing platforms like Zoom or Google Meet.

This project helped me explore:
- WebRTC peer-to-peer communication
- SDP offer/answer exchange
- ICE candidate negotiation
- Socket.IO signaling
- Real-time media handling
- Browser media APIs

---

## Challenges Faced

- Managing peer connections dynamically
- Handling media stream replacement during camera/mic toggle
- Implementing black/silent fallback streams
- Preventing unnecessary component rerenders
- Managing responsive video layouts
- Maintaining stable performance with multiple users

---

## What I Learned

Through this project, I gained practical experience with:
- Real-time networking concepts
- WebRTC architecture
- Media stream handling
- React state management
- Backend socket communication
- Authentication and route protection
- Debugging asynchronous browser behavior

---

## Limitations

- Uses mesh-based P2P architecture (not SFU/MCU)
- Not designed for large-scale meetings
- Performance depends on client hardware and network quality
- Chat persistence is currently in-memory

---

## Future Improvements

- SFU integration for scalable conferencing
- Persistent chat storage
- Meeting scheduling
- Recording support
- Better mobile responsiveness
- Production deployment improvements
