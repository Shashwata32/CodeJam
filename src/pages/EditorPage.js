// import React, { useState, useRef, useEffect } from "react";
// import ACTIONS from "../Actions";
// import Client from "../components/Client";
// import Editor from "../components/Editor";
// import { initSocket } from "../socket";
// import {
//   Navigate,
//   useLocation,
//   useNavigate,
//   useParams,
// } from "react-router-dom";
// import { toast } from "react-hot-toast";
// import axios from "axios";

// const EditorPage = () => {
//   const socketRef = useRef(null);
//   const codeRef = useRef(null);
//   const location = useLocation();
//   const reactNavigator = useNavigate();
//   const { roomId } = useParams();
//   const [clients, setClients] = useState([]);

//   useEffect(() => {
//     const init = async () => {
//       socketRef.current = await initSocket();

//       socketRef.current.on("connect_error", (err) => handleErrors(err));
//       socketRef.current.on("connect_failed", (err) => handleErrors(err));

//       function handleErrors(e) {
//         console.log("socket error", e);
//         toast.error("Socket connection failed, try again later.");
//         reactNavigator("/");
//       }

//       socketRef.current.emit(ACTIONS.JOIN, {
//         roomId,
//         username: location.state?.username,
//       });

//       // Listening for joined event
//       socketRef.current.on(
//         ACTIONS.JOINED,
//         ({ clients, username, socketId }) => {
//           if (username !== location.state?.username) {
//             toast.success(`${username} joined the room.`);
//             console.log(`${username} joined`);
//           }
//           setClients(clients);
//           socketRef.current.emit(ACTIONS.SYNC_CODE, {
//             code: codeRef.current,
//             socketId,
//           });
//         }
//       );

//       // Listening for disconnected
//       socketRef.current.on(ACTIONS.DISCONNECTED, ({ socketId, username }) => {
//         toast.success(`${username} left the room.`);
//         setClients((prev) => {
//           return prev.filter((client) => client.socketId !== socketId);
//         });
//       });

//       // Listening for message
//       socketRef.current.on(ACTIONS.SEND_MESSAGE, ({ message }) => {
//         const chatWindow = document.getElementById("chatWindow");
//         if (chatWindow) {
//           var currText = chatWindow.value;
//           currText += message;
//           chatWindow.value = currText;
//           chatWindow.scrollTop = chatWindow.scrollHeight;
//         }
//       });
//     };
//     init();
//     return () => {
//       if (socketRef.current) {
//         socketRef.current.off(ACTIONS.JOINED);
//         socketRef.current.off(ACTIONS.DISCONNECTED);
//         socketRef.current.off(ACTIONS.SEND_MESSAGE);
//         socketRef.current.disconnect();
//       }
//     };
//   }, []);

//   async function copyRoomId() {
//     try {
//       await navigator.clipboard.writeText(roomId);
//       toast.success("Room ID has been copied to your clipboard");
//     } catch (err) {
//       toast.error("Could not copy the room id");
//       console.error(err);
//     }
//   }

//   function leaveRoom() {
//     reactNavigator("/");
//   }

//   if (!location.state) {
//     return <Navigate to="/" />;
//   }

//   const inputClicked = () => {
//     const inputArea = document.getElementById("input");
//     if (inputArea) {
//       inputArea.placeholder = "Enter your input here";
//       inputArea.value = "";
//       inputArea.disabled = false;
//     }
//     const inputLabel = document.getElementById("inputLabel");
//     const outputLabel = document.getElementById("outputLabel");
//     if (inputLabel && outputLabel) {
//       inputLabel.classList.remove("notClickedLabel");
//       inputLabel.classList.add("clickedLabel");
//       outputLabel.classList.remove("clickedLabel");
//       outputLabel.classList.add("notClickedLabel");
//     }
//   };

//   const outputClicked = () => {
//     const inputArea = document.getElementById("input");
//     if (inputArea) {
//       inputArea.placeholder = "Your output will appear here, Click 'Run code' to see it";
//       inputArea.value = "";
//       inputArea.disabled = true;
//     }
//     const inputLabel = document.getElementById("inputLabel");
//     const outputLabel = document.getElementById("outputLabel");
//     if (inputLabel && outputLabel) {
//       inputLabel.classList.remove("clickedLabel");
//       inputLabel.classList.add("notClickedLabel");
//       outputLabel.classList.remove("notClickedLabel");
//       outputLabel.classList.add("clickedLabel");
//     }
//   };

//   const runCode = () => {
//     const lang = document.getElementById("languageOptions");
//     const input = document.getElementById("input");
//     const code = codeRef.current;

//     if (!lang || !input) {
//       toast.error("UI elements not found");
//       return;
//     }

//     toast.loading("Running Code....");

//     // Enhanced language mapping with proper versions
//     const languageMap = {
//       '1': { language: 'csharp', version: '6.12.0', filename: 'main.cs' },
//       '4': { language: 'java', version: '15.0.2', filename: 'Main.java' },
//       '5': { language: 'python', version: '3.10.0', filename: 'main.py' },
//       '6': { language: 'c', version: '10.2.0', filename: 'main.c' },
//       '7': { language: 'cpp', version: '10.2.0', filename: 'main.cpp' },
//       '8': { language: 'php', version: '8.2.3', filename: 'main.php' },
//       '11': { language: 'haskell', version: '9.2.0', filename: 'main.hs' },
//       '12': { language: 'ruby', version: '3.0.1', filename: 'main.rb' },
//       '13': { language: 'perl', version: '5.34.0', filename: 'main.pl' },
//       '17': { language: 'javascript', version: '18.15.0', filename: 'main.js' },
//       '20': { language: 'go', version: '1.16.2', filename: 'main.go' },
//       '21': { language: 'scala', version: '3.2.2', filename: 'main.scala' },
//       '37': { language: 'swift', version: '5.3.3', filename: 'main.swift' },
//       '38': { language: 'bash', version: '5.2.0', filename: 'main.sh' },
//       '43': { language: 'kotlin', version: '1.9.0', filename: 'main.kt' },
//       '60': { language: 'typescript', version: '5.0.3', filename: 'main.ts' }
//     };

//     const langConfig = languageMap[lang.value] || languageMap['17'];

//     const requestData = {
//       language: langConfig.language,
//       version: langConfig.version,
//       files: [
//         {
//           name: langConfig.filename,
//           content: code
//         }
//       ],
//       stdin: input.value
//     };

//     console.log("API Request Data:", requestData);

//     const options = {
//       method: 'POST',
//       url: 'https://emkc.org/api/v2/piston/execute',
//       headers: {
//         'Content-Type': 'application/json'
//       },
//       data: requestData
//     };

//     axios
//       .request(options)
//       .then(function (response) {
//         console.log("API Response:", response.data);
//         const result = response.data.run;
//         let message = '';
        
//         if (result.output) {
//           message = result.output;
//         } else if (result.stderr) {
//           message = `Error: ${result.stderr}`;
//         } else {
//           message = 'No output received';
//         }
        
//         outputClicked();
//         document.getElementById("input").value = message;
//         toast.dismiss();
//         toast.success("Code execution complete");
//       })
//       .catch(function (error) {
//         console.error("API Error:", error);
//         toast.dismiss();
        
//         let errorMessage = "Something went wrong. Please check your code and input.";
//         if (error.response) {
//           errorMessage = `API Error: ${error.response.status} - ${error.response.data.message || 'Bad Request'}`;
//         } else if (error.request) {
//           errorMessage = "Network error: Unable to reach the code execution service.";
//         }
        
//         toast.error("Code execution failed");
//         document.getElementById("input").value = errorMessage;
//       });
//   };

//   const sendMessage = () => {
//     const inputBox = document.getElementById("inputBox");
//     if (!inputBox || inputBox.value === "") return;
    
//     var message = `> ${location.state.username}:\n${inputBox.value}\n`;
//     const chatWindow = document.getElementById("chatWindow");
//     if (chatWindow) {
//       var currText = chatWindow.value;
//       currText += message;
//       chatWindow.value = currText;
//       chatWindow.scrollTop = chatWindow.scrollHeight;
//     }
//     inputBox.value = "";
    
//     if (socketRef.current) {
//       socketRef.current.emit(ACTIONS.SEND_MESSAGE, { roomId, message });
//     }
//   };

//   const handleInputEnter = (e) => {
//     if (e.code === "Enter") {
//       sendMessage();
//     }
//   };

//   return (
//     <div className="mainWrap">
//       <div className="asideWrap">
//         <div className="asideInner">
//           <div className="logo">
//             <img className="logoImage" src="/code-sync.png" alt="logo" />
//             <h1>CodeSync</h1>
//           </div>
          
//           <div className="clientsSection">
//             <h3>Connected Users</h3>
//             <div className="clientsList">
//               {clients.map((client) => (
//                 <Client key={client.socketId} username={client.username} />
//               ))}
//             </div>
//           </div>
//         </div>

//         <div className="controlsSection">
//           <div className="controlGroup">
//             <label>Programming Language</label>
//             <select id="languageOptions" className="seLang" defaultValue="17">
//               <option value="1">C#</option>
//               <option value="4">Java</option>
//               <option value="5">Python</option>
//               <option value="6">C (gcc)</option>
//               <option value="7">C++ (gcc)</option>
//               <option value="8">PHP</option>
//               <option value="11">Haskell</option>
//               <option value="12">Ruby</option>
//               <option value="13">Perl</option>
//               <option value="17">JavaScript</option>
//               <option value="20">Golang</option>
//               <option value="21">Scala</option>
//               <option value="37">Swift</option>
//               <option value="38">Bash</option>
//               <option value="43">Kotlin</option>
//               <option value="60">TypeScript</option>
//             </select>
//           </div>

//           <button className="btn runBtn" onClick={runCode}>
//             <span>▶</span> Run Code
//           </button>
//           <button className="btn copyBtn" onClick={copyRoomId}>
//             <span>📋</span> Copy Room ID
//           </button>
//           <button className="btn leaveBtn" onClick={leaveRoom}>
//             <span>🚪</span> Leave Room
//           </button>
//         </div>
//       </div>

//       <div className="editorWrap">
//         <div className="editorContainer">
//           <Editor
//             socketRef={socketRef}
//             roomId={roomId}
//             onCodeChange={(code) => {
//               codeRef.current = code;
//             }}
//           />
//         </div>
//         <div className="ioSection">
//           <div className="IO-container">
//             <label
//               id="inputLabel"
//               className="clickedLabel"
//               onClick={inputClicked}
//             >
//               Input
//             </label>
//             <label
//               id="outputLabel"
//               className="notClickedLabel"
//               onClick={outputClicked}
//             >
//               Output
//             </label>
//           </div>
//           <textarea
//             id="input"
//             className="inputArea textarea-style"
//             placeholder="Enter your input here"
//           ></textarea>
//         </div>
//       </div>

//       <div className="chatWrap">
//         <div className="chatHeader">
//           <h3>💬 Room Chat</h3>
//         </div>
//         <textarea
//           id="chatWindow"
//           className="chatArea textarea-style"
//           placeholder="Chat messages will appear here..."
//           disabled
//         ></textarea>
//         <div className="sendChatWrap">
//           <input
//             id="inputBox"
//             type="text"
//             placeholder="Type your message..."
//             className="inputField"
//             onKeyUp={handleInputEnter}
//           ></input>
//           <button className="btn sendBtn" onClick={sendMessage}>
//             Send
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default EditorPage;


import React, { useState, useRef, useEffect } from "react";
import ACTIONS from "../Actions";
import Client from "../components/Client";
import Editor from "../components/Editor";
import { initSocket } from "../socket";
import {
  Navigate,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import { toast } from "react-hot-toast";
import axios from "axios";

const EditorPage = () => {
  const socketRef = useRef(null);
  const codeRef = useRef("");
  const location = useLocation();
  const reactNavigator = useNavigate();
  const { roomId } = useParams();
  const [clients, setClients] = useState([]);

  useEffect(() => {
    const init = async () => {
      socketRef.current = await initSocket();

      socketRef.current.on("connect_error", (err) => handleErrors(err));
      socketRef.current.on("connect_failed", (err) => handleErrors(err));

      function handleErrors(e) {
        console.log("socket error", e);
        toast.error("Socket connection failed, try again later.");
        reactNavigator("/");
      }

      socketRef.current.emit(ACTIONS.JOIN, {
        roomId,
        username: location.state?.username,
      });

      // Listening for joined event
      socketRef.current.on(
        ACTIONS.JOINED,
        ({ clients, username, socketId }) => {
          if (username !== location.state?.username) {
            toast.success(`${username} joined the room.`);
            console.log(`${username} joined`);
          }
          setClients(clients);
          
          // Send current code to the newly joined user
          // Make sure we have some code to send (not empty or undefined)
          const currentCode = codeRef.current || "";
          socketRef.current.emit(ACTIONS.SYNC_CODE, {
            code: currentCode,
            socketId,
          });
        }
      );

      // Listening for disconnected
      socketRef.current.on(ACTIONS.DISCONNECTED, ({ socketId, username }) => {
        toast.success(`${username} left the room.`);
        setClients((prev) => {
          return prev.filter((client) => client.socketId !== socketId);
        });
      });

      // Listening for message
      socketRef.current.on(ACTIONS.SEND_MESSAGE, ({ message }) => {
        const chatWindow = document.getElementById("chatWindow");
        if (chatWindow) {
          const currText = chatWindow.value;
          chatWindow.value = currText + message;
          chatWindow.scrollTop = chatWindow.scrollHeight;
        }
      });
    };
    
    init();
    
    return () => {
      if (socketRef.current) {
        socketRef.current.off(ACTIONS.JOINED);
        socketRef.current.off(ACTIONS.DISCONNECTED);
        socketRef.current.off(ACTIONS.SEND_MESSAGE);
        socketRef.current.disconnect();
      }
    };
  }, []);

  async function copyRoomId() {
    try {
      await navigator.clipboard.writeText(roomId);
      toast.success("Room ID has been copied to your clipboard");
    } catch (err) {
      toast.error("Could not copy the room id");
      console.error(err);
    }
  }

  function leaveRoom() {
    reactNavigator("/");
  }

  if (!location.state) {
    return <Navigate to="/" />;
  }

  const inputClicked = () => {
    const inputArea = document.getElementById("input");
    if (inputArea) {
      inputArea.placeholder = "Enter your input here";
      inputArea.value = "";
      inputArea.disabled = false;
    }
    const inputLabel = document.getElementById("inputLabel");
    const outputLabel = document.getElementById("outputLabel");
    if (inputLabel && outputLabel) {
      inputLabel.classList.remove("notClickedLabel");
      inputLabel.classList.add("clickedLabel");
      outputLabel.classList.remove("clickedLabel");
      outputLabel.classList.add("notClickedLabel");
    }
  };

  const outputClicked = () => {
    const inputArea = document.getElementById("input");
    if (inputArea) {
      inputArea.placeholder = "Your output will appear here, Click 'Run code' to see it";
      inputArea.value = "";
      inputArea.disabled = true;
    }
    const inputLabel = document.getElementById("inputLabel");
    const outputLabel = document.getElementById("outputLabel");
    if (inputLabel && outputLabel) {
      inputLabel.classList.remove("clickedLabel");
      inputLabel.classList.add("notClickedLabel");
      outputLabel.classList.remove("notClickedLabel");
      outputLabel.classList.add("clickedLabel");
    }
  };

  const runCode = () => {
    const langSelect = document.getElementById("languageOptions");
    const inputArea = document.getElementById("input");
    
    if (!langSelect || !inputArea) {
      toast.error("UI elements not found");
      return;
    }

    const lang = langSelect.value;
    const input = inputArea.value;
    const code = codeRef.current;

    if (!code || code.trim() === "") {
      toast.error("Please write some code first");
      return;
    }

    toast.loading("Running Code....");

    const languageMap = {
      '1': { language: 'csharp', version: '6.12.0', filename: 'main.cs' },
      '4': { language: 'java', version: '15.0.2', filename: 'Main.java' },
      '5': { language: 'python', version: '3.10.0', filename: 'main.py' },
      '6': { language: 'c', version: '10.2.0', filename: 'main.c' },
      '7': { language: 'cpp', version: '10.2.0', filename: 'main.cpp' },
      '8': { language: 'php', version: '8.2.3', filename: 'main.php' },
      '11': { language: 'haskell', version: '9.2.0', filename: 'main.hs' },
      '12': { language: 'ruby', version: '3.0.1', filename: 'main.rb' },
      '13': { language: 'perl', version: '5.34.0', filename: 'main.pl' },
      '17': { language: 'javascript', version: '18.15.0', filename: 'main.js' },
      '20': { language: 'go', version: '1.16.2', filename: 'main.go' },
      '21': { language: 'scala', version: '3.2.2', filename: 'main.scala' },
      '37': { language: 'swift', version: '5.3.3', filename: 'main.swift' },
      '38': { language: 'bash', version: '5.2.0', filename: 'main.sh' },
      '43': { language: 'kotlin', version: '1.9.0', filename: 'main.kt' },
      '60': { language: 'typescript', version: '5.0.3', filename: 'main.ts' }
    };

    const langConfig = languageMap[lang] || languageMap['17'];

    const requestData = {
      language: langConfig.language,
      version: langConfig.version,
      files: [
        {
          name: langConfig.filename,
          content: code
        }
      ],
      stdin: input
    };

    const options = {
      method: 'POST',
      url: 'https://emkc.org/api/v2/piston/execute',
      headers: {
        'Content-Type': 'application/json'
      },
      data: requestData
    };

    axios
      .request(options)
      .then(function (response) {
        console.log("API Response:", response.data);
        const result = response.data.run;
        let message = '';
        
        if (result.output) {
          message = result.output;
        } else if (result.stderr) {
          message = `Error: ${result.stderr}`;
        } else {
          message = 'No output received';
        }
        
        outputClicked();
        document.getElementById("input").value = message;
        toast.dismiss();
        toast.success("Code execution complete");
      })
      .catch(function (error) {
        console.error("API Error:", error);
        toast.dismiss();
        toast.error("Code execution failed");
        document.getElementById("input").value = "Something went wrong. Please check your code and input.";
      });
  };

  const sendMessage = () => {
    const inputBox = document.getElementById("inputBox");
    if (!inputBox || inputBox.value === "") return;
    
    const message = `> ${location.state.username}:\n${inputBox.value}\n`;
    const chatWindow = document.getElementById("chatWindow");
    if (chatWindow) {
      const currText = chatWindow.value;
      chatWindow.value = currText + message;
      chatWindow.scrollTop = chatWindow.scrollHeight;
    }
    inputBox.value = "";
    
    if (socketRef.current) {
      socketRef.current.emit(ACTIONS.SEND_MESSAGE, { roomId, message });
    }
  };

  const handleInputEnter = (e) => {
    if (e.code === "Enter") {
      sendMessage();
    }
  };

  return (
    <div className="mainWrap">
      <div className="asideWrap">
        <div className="asideInner">
          <div className="logo">
            <img className="logoImage" src="/code-sync.png" alt="logo" />
            <h1>CodeSync</h1>
          </div>
          
          <div className="clientsSection">
            <h3>Connected Users</h3>
            <div className="clientsList">
              {clients.map((client) => (
                <Client key={client.socketId} username={client.username} />
              ))}
            </div>
          </div>
        </div>

        <div className="controlsSection">
          <div className="controlGroup">
            <label>Programming Language</label>
            <select id="languageOptions" className="seLang" defaultValue="17">
              <option value="1">C#</option>
              <option value="4">Java</option>
              <option value="5">Python</option>
              <option value="6">C (gcc)</option>
              <option value="7">C++ (gcc)</option>
              <option value="8">PHP</option>
              <option value="11">Haskell</option>
              <option value="12">Ruby</option>
              <option value="13">Perl</option>
              <option value="17">JavaScript</option>
              <option value="20">Golang</option>
              <option value="21">Scala</option>
              <option value="37">Swift</option>
              <option value="38">Bash</option>
              <option value="43">Kotlin</option>
              <option value="60">TypeScript</option>
            </select>
          </div>

          <button className="btn runBtn" onClick={runCode}>
            <span>▶</span> Run Code
          </button>
          <button className="btn copyBtn" onClick={copyRoomId}>
            <span>📋</span> Copy Room ID
          </button>
          <button className="btn leaveBtn" onClick={leaveRoom}>
            <span>🚪</span> Leave Room
          </button>
        </div>
      </div>

      <div className="editorWrap">
        <div className="editorContainer">
          <Editor
            socketRef={socketRef}
            roomId={roomId}
            onCodeChange={(code) => {
              codeRef.current = code;
            }}
          />
        </div>
        <div className="ioSection">
          <div className="IO-container">
            <label
              id="inputLabel"
              className="clickedLabel"
              onClick={inputClicked}
            >
              Input
            </label>
            <label
              id="outputLabel"
              className="notClickedLabel"
              onClick={outputClicked}
            >
              Output
            </label>
          </div>
          <textarea
            id="input"
            className="inputArea textarea-style"
            placeholder="Enter your input here"
          ></textarea>
        </div>
      </div>

      <div className="chatWrap">
        <div className="chatHeader">
          <h3>💬 Room Chat</h3>
        </div>
        <textarea
          id="chatWindow"
          className="chatArea textarea-style"
          placeholder="Chat messages will appear here..."
          disabled
        ></textarea>
        <div className="sendChatWrap">
          <input
            id="inputBox"
            type="text"
            placeholder="Type your message..."
            className="inputField"
            onKeyUp={handleInputEnter}
          ></input>
          <button className="btn sendBtn" onClick={sendMessage}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditorPage;