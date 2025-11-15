/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { useState } from "react";
import { v4 as uuidV4 } from "uuid";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();
  const [roomId, setRoomId] = useState("");
  const [username, setUsername] = useState("");

  const createNewRoom = (e) => {
    e.preventDefault();
    const id = uuidV4();
    setRoomId(id);
    toast.success("Created a new room");
  };

  const joinRoom = () => {
    if (!username || !roomId) {
      toast.error("ROOM ID & username are required");
      return;
    }
    //Redirect
    navigate(`/editor/${roomId}`, {
      state: {
        username,
      },
    });
  };

  const handleInputEnter = (e) => {
    if (e.code === "Enter") {
      joinRoom();
    }
  };

return (
  <div className="homePageWrapper">
    <div className="formWrapper">
      <h1 className="codejam">CodeJam</h1>
      <h4 className="mainLabel">Start Coding Together</h4>
      <div className="inputGroup">
        <input
          type="text"
          className="inputBox"
          placeholder="Enter Room ID"
          onChange={(e) => setRoomId(e.target.value)}
          value={roomId}
          onKeyUp={handleInputEnter}
        />
        <input
          type="text"
          className="inputBox"
          placeholder="Your Username"
          onChange={(e) => setUsername(e.target.value)}
          value={username}
          onKeyUp={handleInputEnter}
        />
        <button className="btn joinBtn" onClick={joinRoom}>
          Join Room
        </button>
        <span className="createInfo">
          Don't have a room? &nbsp;
          <a onClick={createNewRoom} href="#" className="createNewBtn">
            Create new room
          </a>
        </span>
      </div>
    </div>
  </div>
);
};

export default Home;
