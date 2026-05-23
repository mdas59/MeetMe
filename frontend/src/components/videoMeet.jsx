import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import styles from "../styles/videoMeet.module.css";

import { Badge, IconButton, TextField } from "@mui/material";
import { Button } from "@mui/material";
import VideocamIcon from "@mui/icons-material/Videocam";
import VideocamOffIcon from "@mui/icons-material/VideocamOff";
import CallEndIcon from "@mui/icons-material/CallEnd";
import MicIcon from "@mui/icons-material/Mic";
import MicOffIcon from "@mui/icons-material/MicOff";
import ScreenShareIcon from "@mui/icons-material/ScreenShare";
import StopScreenShareIcon from "@mui/icons-material/StopScreenShare";
import ChatIcon from "@mui/icons-material/Chat";

const server_url = "http://localhost:3000";

var connections = {};

// Setting up STUN server to get public IP address of user
const peerConfigConnections = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

export default function VideoMeet() {
  // Current user's socket info
  var socketRef = useRef();
  let socketIdRef = useRef();

  //Local video stream
  let localVideoref = useRef();

  //Hardware media access
  let [videoAvailable, setVideoAvailable] = useState(true);
  let [audioAvailable, setAudioAvailable] = useState(true);

  //Setting user's video audio stream null/blank/silent/present
  let [video, setVideo] = useState([]);
  let [audio, setAudio] = useState();

  //Screen share activity
  let [screen, setScreen] = useState();

  //Local notification pop ups
  let [showModal, setModal] = useState(true);

  //Check screen share availability
  let [screenAvailable, setScreenAvailable] = useState();

  //Chat messages
  let [messages, setMessages] = useState([]);

  //User's latest message
  let [message, setMessage] = useState("");

  //New messages when a user's joins a call
  let [newMessages, setNewMessages] = useState(0);

  //User name for the meeting
  let [askForUsername, setAskForUsername] = useState(true);
  let [username, setUsername] = useState("");

  //Video reference of othe connections in the room
  const videoRef = useRef([]);

  //Connections' videos
  let [videos, setVideos] = useState([]);

  //Upon getting the lobby name we get our harware permissions and set up system
  useEffect(() => {
    console.log("getting permissions");
    getPermissions();
  }, []);

  //Getting screen share media
  let getDislayMedia = () => {
    if (screen) {
      if (navigator.mediaDevices.getDisplayMedia) {
        navigator.mediaDevices
          .getDisplayMedia({ video: true, audio: true })
          .then(getDislayMediaSuccess)
          .then((stream) => {})
          .catch((error) => console.log(error));
      }
    }
  };

  //For the video frame settings
  const mediaConstraints = {
    video: {
      width: { ideal: 640 },
      height: { ideal: 360 },
      frameRate: { ideal: 15, max: 20 },
    },
    audio: true,
  };

  const getPermissions = async () => {
    try {
      // using navigator object to get hardware permissions for mic/camera

      const videoPermission = await navigator.mediaDevices.getUserMedia({
        video: true,
      });
      if (videoPermission) {
        setVideoAvailable(true);
        console.log("video permission granted");
      } else {
        setVideoAvailable(false);
        console.log("video permission denied");
      }

      const audioPermission = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      if (audioPermission) {
        setAudioAvailable(true);
        console.log("audio permission granted");
      } else {
        setAudioAvailable(false);
        console.log("audio permission denied");
      }

      // asking for screen share permission
      if (navigator.mediaDevices.getDisplayMedia) {
        setScreenAvailable(true);
      } else {
        setScreenAvailable(false);
      }
      // if we have audio and video we set up our user's media stream
      if (videoAvailable || audioAvailable) {
        // const userMediaStream = await navigator.mediaDevices.getUserMedia({ video: videoAvailable, audio: audioAvailable });
        const userMediaStream =
          await navigator.mediaDevices.getUserMedia(mediaConstraints);
        if (userMediaStream) {
          // setting up our local stream to send through WebRTC
          window.localStream = userMediaStream;
          // setting up our local screen where user will see their video on screen
          if (localVideoref.current) {
            localVideoref.current.srcObject = userMediaStream;
          }
        }
      }
    } catch (error) {
      console.log(error);
    }
  };

  //If user's audio/video is not undefined we get user's media input
  // useEffect(() => {
  //     if (video !== undefined && audio !== undefined) {
  //         getUserMedia();
  //         console.log("User's present state has: ", video, audio);

  //     }

  // }, [])

  // Setting up user's audio/video and connecting to server socket.io
  let getMedia = async () => {
    let stream;

    try {
      if (videoAvailable || audioAvailable) {
        // stream = await navigator.mediaDevices.getUserMedia({
        //     video: videoAvailable,
        //     audio: audioAvailable
        // });
        stream = await navigator.mediaDevices.getUserMedia(mediaConstraints);
      } else {
        stream = new MediaStream([black(), silence()]);
      }
    } catch (error) {
      console.log("Could not get user media, using black/silent stream", error);
      stream = new MediaStream([black(), silence()]);
    }
    //Set the user's device video/audio to loocal stream
    window.localStream = stream;

    if (localVideoref.current) {
      localVideoref.current.srcObject = stream;
    }

    setVideo(videoAvailable);
    setAudio(audioAvailable);
    connectToSocketServer();
  };

  let getUserMediaSuccess = (stream) => {
    // stopping the previous available track
    try {
      window.localStream.getTracks().forEach((track) => track.stop());
    } catch (error) {
      console.log(error);
    }

    // getting the current media stream
    window.localStream = stream;
    localVideoref.current.srcObject = stream;

    //for every current user
    for (let id in connections) {
      if (id === socketIdRef.current) continue;

      // setting up user's mdia stream
      connections[id].addStream(window.localStream);

      // creating a sdp offer too send
      connections[id].createOffer().then((description) => {
        console.log(description);
        connections[id]
          .setLocalDescription(description)
          .then(() => {
            socketRef.current.emit(
              "signal",
              id,
              JSON.stringify({ sdp: connections[id].localDescription }),
            );
          })
          .catch((error) => console.log(error));
      });
    }

    // if any connection's track is off we set their media off
    stream.getTracks().forEach(
      (track) =>
        (track.onended = () => {
          setVideo(false);
          setAudio(false);

          try {
            let tracks = localVideoref.current.srcObject.getTracks();
            tracks.forEach((track) => track.stop());
          } catch (error) {
            console.log(error);
          }

          // Set the media and audio to black and silence media stream if user media is off
          let blackSilence = (...args) =>
            new MediaStream([black(...args), silence()]);
          window.localStream = blackSilence();
          localVideoref.current.srcObject = window.localStream;
          // Emit the same black/silent media to all other sockets in the meeting room
          for (let id in connections) {
            connections[id].addStream(window.localStream);

            connections[id].createOffer().then((description) => {
              connections[id]
                .setLocalDescription(description)
                .then(() => {
                  socketRef.current.emit(
                    "signal",
                    id,
                    JSON.stringify({ sdp: connections[id].localDescription }),
                  );
                })
                .catch((error) => console.log(error));
            });
          }
        }),
    );
  };

  // Function to get user's media
  let getUserMedia = () => {
    if ((video && videoAvailable) || (audio && audioAvailable)) {
      navigator.mediaDevices
        .getUserMedia({ video: video, audio: audio })
        .then(getUserMediaSuccess)
        .then((stream) => {})
        .catch((error) => console.log(error));
    } else {
      try {
        // If user's media is not available or diconnected we stop all the connection's tracks
        let tracks = localVideoref.current.srcObject.getTracks();
        tracks.forEach((track) => track.stop());
      } catch (error) {
        console.log(error);
      }
    }
  };

  let getDislayMediaSuccess = (stream) => {
    console.log("screen share media");
    try {
      window.localStream.getTracks().forEach((track) => track.stop());
    } catch (error) {
      console.log(error);
    }

    // Setting the screen media as user's local media
    window.localStream = stream;
    localVideoref.current.srcObject = stream;

    // Sharing the local media with other available connections in the room
    for (let id in connections) {
      if (id === socketIdRef.current) continue;

      connections[id].addStream(window.localStream);

      connections[id].createOffer().then((description) => {
        connections[id]
          .setLocalDescription(description)
          .then(() => {
            socketRef.current.emit(
              "signal",
              id,
              JSON.stringify({ sdp: connections[id].localDescription }),
            );
          })
          .catch((error) => console.log(error));
      });
    }

    // When screen share is ended we clears out our Screen value
    stream.getTracks().forEach(
      (track) =>
        (track.onended = () => {
          setScreen(false);

          // Sends a black/silent stream to other conection
          try {
            let tracks = localVideoref.current.srcObject.getTracks();
            tracks.forEach((track) => track.stop());
          } catch (error) {
            console.log(error);
          }

          let blackSilence = (...args) =>
            new MediaStream([black(...args), silence()]);
          window.localStream = blackSilence();
          localVideoref.current.srcObject = window.localStream;

          getUserMedia();
        }),
    );
  };

  let gotMessageFromServer = (fromId, message) => {
    var signal = JSON.parse(message);

    // When a user get a message from server
    if (fromId !== socketIdRef.current) {
      // If signal type or protocol is sdp
      if (signal.sdp) {
        connections[fromId]
          .setRemoteDescription(new RTCSessionDescription(signal.sdp))
          .then(() => {
            //    If sdp type is offer
            if (signal.sdp.type === "offer") {
              // We create a sdp answer for the offer
              connections[fromId]
                .createAnswer()
                .then((description) => {
                  connections[fromId]
                    .setLocalDescription(description)
                    .then(() => {
                      socketRef.current.emit(
                        "signal",
                        fromId,
                        JSON.stringify({
                          sdp: connections[fromId].localDescription,
                        }),
                      );
                    })
                    .catch((error) => console.log(error));
                })
                .catch((error) => console.log(error));
            }
          })
          .catch((error) => console.log(error));
      }

      // If signal type or protocol is ice
      if (signal.ice) {
        // We create a new ice connection
        connections[fromId]
          .addIceCandidate(new RTCIceCandidate(signal.ice))
          .catch((e) => console.log(e));
      }
    }
  };

  let connectToSocketServer = () => {
    // Connect to socket.io server
    socketRef.current = io.connect(server_url, { secure: false });

    socketRef.current.on("signal", gotMessageFromServer);
    socketRef.current.on("room-full", (message) => {
      alert(message);
      navigate("/dashboard");
    });

    // Emit user's actions notifications to all other's available connections in the room
    socketRef.current.on("connect", () => {
      // Specifying the user's web location
      socketRef.current.emit("join-call", window.location.href);
      // Getting user's soccketID
      socketIdRef.current = socketRef.current.id;

      // Add the messages to the existing chat
      socketRef.current.on("chat-message", addMessage);

      // Get all the videos except the socket.id who has left the room and set their tracks
      socketRef.current.on("user-left", (id) => {
        setVideos((videos) => videos.filter((video) => video.socketId !== id));
      });

      //  When a new user joins
      socketRef.current.on("user-joined", (id, clients) => {
        clients.forEach((socketListId) => {
          // Trying to create browser to browser P2P connection
          connections[socketListId] = new RTCPeerConnection(
            peerConfigConnections,
          );

          // Wait for the available socketID's ice candidate to connect with them without a server
          connections[socketListId].onicecandidate = function (event) {
            if (event.candidate != null) {
              socketRef.current.emit(
                "signal",
                socketListId,
                JSON.stringify({ ice: event.candidate }),
              );
            }
          };

          // Wait for their video stream
          connections[socketListId].onaddstream = (event) => {
            console.log("before :", videoRef.current);
            console.log("getting socketID : ", socketListId);

            // Checking if the socketID already existed in the room or user newly joined
            let videoExists = videoRef.current.find(
              (video) => video.socketId === socketListId,
            );

            if (videoExists) {
              console.log("existing video slide");

              // Update the stream of the existing video slides with newly coming media stream
              setVideos((videos) => {
                const updatedVideos = videos.map((video) =>
                  video.socketId === socketListId
                    ? { ...video, stream: event.stream }
                    : video,
                );
                videoRef.current = updatedVideos;
                return updatedVideos;
              });
            } else {
              //Create a new video slide for new socketID
              console.log("creating new video slide");
              let newVideo = {
                socketId: socketListId,
                stream: event.stream,
                autoplay: true,
                playsinline: true,
              };
              // Setting new video stream
              setVideos((videos) => {
                const updatedVideos = [...videos, newVideo];
                videoRef.current = updatedVideos;
                return updatedVideos;
              });
            }
          };

          // Add the local video stream
          if (window.localStream !== undefined && window.localStream !== null) {
            connections[socketListId].addStream(window.localStream);
          } else {
            // We set a black blank media stream to user's local media stream if video is off
            let blackSilence = (...args) =>
              new MediaStream([black(...args), silence()]);
            window.localStream = blackSilence();
            connections[socketListId].addStream(window.localStream);
          }
        });

        // For every current user
        if (id === socketIdRef.current) {
          // Search through their connections list
          for (let id2 in connections) {
            if (id2 === socketIdRef.current) continue;

            // We add user's local stream yo each connections video
            try {
              connections[id2].addStream(window.localStream);
            } catch (e) {}

            // Create SDP offers for those connections
            connections[id2].createOffer().then((description) => {
              connections[id2]
                .setLocalDescription(description)
                // Setting up handshake for 2 browsers to create P2P connection
                .then(() => {
                  socketRef.current.emit(
                    "signal",
                    id2,
                    JSON.stringify({ sdp: connections[id2].localDescription }),
                  );
                })
                .catch((error) => console.log(error));
            });
          }
        }
      });
    });
  };

  // Creating a silent audio stream
  let silence = () => {
    // Interface to provide a constant tone of audio stream
    let context = new AudioContext();
    // Oscillator to create the media stream
    let oscillator = context.createOscillator();
    let destination = oscillator.connect(
      context.createMediaStreamDestination(),
    );
    oscillator.start();
    context.resume();
    return Object.assign(destination.stream.getAudioTracks()[0], {
      enabled: false,
    });
  };

  // Creating a black video stream
  let black = ({ width = 900, height = 540 } = {}) => {
    let canvas = Object.assign(document.createElement("canvas"), {
      width,
      height,
    });
    let ctx = canvas.getContext("2d");
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, width, height);
    let stream = canvas.captureStream(15);
    return stream.getVideoTracks()[0];
  };

  // let handleVideo = () => {
  //     const newVideoVal= !video;
  //     setVideo(newVideoVal);
  //     if (window.localStream) {
  //     // This stops the data flow while keeping the "connection" alive
  //     window.localStream.getVideoTracks().forEach(track => {
  //         track.enabled = newVideoVal;
  //     });
  // }
  // }

  // let handleAudio = () => {
  //      const newAudioval= !audio;
  //     setAudio(neAudioval);
  //     if (window.localStream) {
  //     // This keeps the mic active but sends "silence"
  //     window.localStream.getAudioTracks().forEach(track => {
  //         track.enabled = newAudioVal;
  //     });
  // }
  // }

  let handleVideo = async () => {
    const nextVideoState = !video;
    setVideo(nextVideoState);

    if (window.localStream) {
      const videoTrack = window.localStream.getVideoTracks()[0];
      let newTrack;

      if (nextVideoState) {
        // Turning camera back ON
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        newTrack = stream.getVideoTracks()[0];
      } else {
        // Turning camera OFF (use black track)
        newTrack = black();
      }

      // Swap locally so uset see the change in media
      window.localStream.removeTrack(videoTrack);
      window.localStream.addTrack(newTrack);
      // Stop the old hardware to turn off the physical light
      if (videoTrack) videoTrack.stop();

      localVideoref.current.srcObject = window.localStream;

      // Swap on the network so all other connections see the change in media
      for (let id in connections) {
        const senders = connections[id].getSenders();
        const sender = senders.find((s) => s.track && s.track.kind === "video");
        if (sender) sender.replaceTrack(newTrack);
      }
    }
  };

  let handleAudio = async () => {
    const nextAudioState = !audio;
    setAudio(nextAudioState);

    if (window.localStream) {
      const audioTrack = window.localStream.getAudioTracks()[0];
      let newTrack;

      if (nextAudioState) {
        // Turning mic back ON
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        newTrack = stream.getAudioTracks()[0];
      } else {
        // Turning mic OFF (use silence track)
        newTrack = silence();
      }
      // Stop the old hardware to turn off the physical light
      window.localStream.removeTrack(audioTrack);
      window.localStream.addTrack(newTrack);
      audioTrack.stop();
      // Swap on the network so all other connections see the change in media
      for (let id in connections) {
        const senders = connections[id].getSenders();
        const sender = senders.find((s) => s.track && s.track.kind === "audio");
        if (sender) sender.replaceTrack(newTrack);
      }
    }
  };

  // To share the screen get the screen media
  useEffect(() => {
    if (screen !== undefined) {
      getDislayMedia();
    }
  }, [screen]);

  let handleScreen = () => {
    setScreen(!screen);
  };

  // When a user ends a call we clear all the tracks and send the user back to home route
  let handleEndCall = () => {
    try {
      let tracks = localVideoref.current.srcObject.getTracks();
      tracks.forEach((track) => track.stop());
    } catch (error) {
      console.log(error);
    }
    window.location.href = "/dashboard";
  };

  // Chat box functionality
  let openChat = () => {
    setModal(true);
    setNewMessages(0);
  };
  let closeChat = () => {
    setModal(false);
  };

  // To handle user's chat message
  let handleMessage = (e) => {
    setMessage(e.target.value);
  };

  // Adding new message with sender name and socketID along with previous messages
  const addMessage = (data, sender, socketIdSender) => {
    setMessages((prevMessages) => [
      ...prevMessages,
      { sender: sender, data: data },
    ]);
    if (socketIdSender !== socketIdRef.current) {
      setNewMessages((prevNewMessages) => prevNewMessages + 1);
    }
  };

  // Emitting the user message with the current user's socket ID

  let sendMessage = () => {
    console.log(socketRef.current);
    socketRef.current.emit("chat-message", message, username);
    setMessage("");
  };

  // Setting up connections with socket.io server and fulfilling prerequisites
  let connect = async () => {
    setAskForUsername(false);
    await getMedia();
  };

  return (
    <div>
      {askForUsername === true ? (
        <div className="container-fluid p-4">
          <h2 className="text-center">Enter the Lobby </h2>
          {/* Input for meeting username */}
          <div className="input-group d-flex justify-content-center align-items-center mx-2">
            <label htmlFor="input-username" className="text-md mb-3">
              Enter your Username here:
            </label>
            <input
              type="text"
              id="input-username"
              className="form-control mb-3 mx-2"
              label="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <button className="btn btn-primary mb-3 mx-3" onClick={connect}>
              Connect
            </button>
          </div>

          {/* Show local media as a reference */}
          <div className={styles.lobbyVideo}>
            <video ref={localVideoref} autoPlay muted></video>
          </div>
        </div>
      ) : (
        <div className={styles.meetVideoContainer}>
          {showModal ? (
            <div className={styles.chatRoom}>
              {/* Chat box */}
              <div className={styles.chatContainer}>
                <h2 className="my-2">Chat</h2>

                <div className={styles.chattingDisplay}>
                  {messages.length !== 0 ? (
                    messages.map((item, index) => {
                      console.log(messages);
                      return (
                        <div
                          className="d-flex align-item-end justify-content-start mb-2"
                          key={index}
                        >
                          <span className="fw-bold me-2">@{item.sender}</span>
                          <span>{item.data}</span>
                        </div>
                      );
                    })
                  ) : (
                    <p>No messages yet</p>
                  )}
                </div>

                <div className={styles.chattingArea}>
                  <input
                    className="form-control mx-2"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="type your message"
                  />
                  <button className="btn btn-primary" onClick={sendMessage}>
                    Send
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <></>
          )}

          {/*Setting up the functions with UI buttons  */}
          <div className={styles.buttonContainers}>
            <IconButton onClick={handleVideo} style={{ color: "white" }}>
              {video === true ? <VideocamIcon /> : <VideocamOffIcon />}
            </IconButton>
            <IconButton onClick={handleEndCall} style={{ color: "red" }}>
              <CallEndIcon />
            </IconButton>
            <IconButton onClick={handleAudio} style={{ color: "white" }}>
              {audio === true ? <MicIcon /> : <MicOffIcon />}
            </IconButton>

            {screenAvailable === true ? (
              <IconButton onClick={handleScreen} style={{ color: "white" }}>
                {screen === true ? (
                  <ScreenShareIcon />
                ) : (
                  <StopScreenShareIcon />
                )}
              </IconButton>
            ) : (
              <></>
            )}

            <Badge badgeContent={newMessages} max={999} color="orange">
              <IconButton
                onClick={() => setModal(!showModal)}
                style={{ color: "white" }}
              >
                <ChatIcon />
              </IconButton>
            </Badge>
          </div>

          <video
            className={styles.meetUserVideo}
            ref={localVideoref}
            autoPlay
            muted
          ></video>

          <div className={styles.conferenceView}>
            {/*Mapping connection's video to different video slides for different socket.ID */}
            {videos.map((video) => (
              <div key={video.socketId}>
                <video
                  // Setting our video referenece to our available video stream for each socketID
                  data-socket={video.socketId}
                  ref={(ref) => {
                    if (ref && video.stream) {
                      ref.srcObject = video.stream;
                    }
                  }}
                  autoPlay
                ></video>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
