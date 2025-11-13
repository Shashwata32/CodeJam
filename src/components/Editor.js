// import React, { useEffect, useRef } from "react";
// import CodeMirror from "codemirror";
// import "codemirror/lib/codemirror.css";
// import "codemirror/theme/dracula.css";
// import "codemirror/mode/javascript/javascript";
// import "codemirror/addon/edit/closetag";
// import "codemirror/addon/edit/closebrackets";
// import ACTIONS from "../Actions";

// const Editor = ({ socketRef, roomId, onCodeChange }) => {
//   const editorRef = useRef(null);
//   const isRemoteChange = useRef(false);

//   useEffect(() => {
//     async function init() {
//       editorRef.current = CodeMirror.fromTextArea(
//         document.getElementById("realtimeEditor"),
//         {
//           mode: { name: "javascript", json: true },
//           theme: "dracula",
//           autoCloseTags: true,
//           autoCloseBrackets: true,
//           lineNumbers: true,
//         }
//       );

//       editorRef.current.on("change", (instance, changes) => {
//         const { origin } = changes;
//         const code = instance.getValue();
//         onCodeChange(code);
        
//         // Only emit changes if they are from the local user
//         if (origin !== "setValue" && !isRemoteChange.current) {
//           socketRef.current.emit(ACTIONS.CODE_CHANGE, {
//             roomId,
//             code,
//             changes: changes
//           });
//         }
        
//         // Reset the flag after processing
//         if (isRemoteChange.current) {
//           isRemoteChange.current = false;
//         }
//       });
//     }
//     init();
//   }, []);

//   useEffect(() => {
//     if (socketRef.current) {
//       socketRef.current.on(ACTIONS.CODE_CHANGE, ({ code, changes }) => {
//         if (code != null) {
//           // Set flag to indicate this is a remote change
//           isRemoteChange.current = true;
          
//           // Get current cursor position and scroll position
//           const cursor = editorRef.current.getCursor();
//           const scrollInfo = editorRef.current.getScrollInfo();
          
//           // Apply the changes
//           editorRef.current.setValue(code);
          
//           // Restore cursor position and scroll position
//           editorRef.current.setCursor(cursor);
//           editorRef.current.scrollTo(scrollInfo.left, scrollInfo.top);
//         }
//       });
//     }
//     return () => {
//       socketRef.current.off(ACTIONS.CODE_CHANGE);
//     };
//   }, [socketRef.current]);

//   return <textarea id="realtimeEditor"></textarea>;
// };

// export default Editor;

import React, { useEffect, useRef } from "react";
import CodeMirror from "codemirror";
import "codemirror/lib/codemirror.css";
import "codemirror/theme/dracula.css";
import "codemirror/mode/javascript/javascript";
import "codemirror/addon/edit/closetag";
import "codemirror/addon/edit/closebrackets";
import ACTIONS from "../Actions";

const Editor = ({ socketRef, roomId, onCodeChange }) => {
  const editorRef = useRef(null);
  const isRemoteChange = useRef(false);
  const isInitialized = useRef(false);

  useEffect(() => {
    const init = async () => {
      editorRef.current = CodeMirror.fromTextArea(
        document.getElementById("realtimeEditor"),
        {
          mode: { name: "javascript", json: true },
          theme: "dracula",
          autoCloseTags: true,
          autoCloseBrackets: true,
          lineNumbers: true,
          lineWrapping: true,
        }
      );

      isInitialized.current = true;

      editorRef.current.on("change", (instance, changes) => {
        const { origin } = changes;
        const code = instance.getValue();
        onCodeChange(code);
        
        // Only emit changes if they are from the local user and not from remote sync
        if (origin !== "setValue" && !isRemoteChange.current) {
          socketRef.current.emit(ACTIONS.CODE_CHANGE, {
            roomId,
            code: code,
          });
        }
        
        // Reset the flag after processing
        if (isRemoteChange.current) {
          isRemoteChange.current = false;
        }
      });
    };

    init();

    return () => {
      if (editorRef.current) {
        editorRef.current.toTextArea();
      }
    };
  }, []);

  useEffect(() => {
    if (!socketRef.current || !isInitialized.current) return;

    const handleCodeChange = ({ code }) => {
      if (code != null && editorRef.current) {
        const currentCode = editorRef.current.getValue();
        
        // Only update if the code is actually different
        if (currentCode !== code) {
          isRemoteChange.current = true;
          
          // Save current cursor and scroll position
          const cursor = editorRef.current.getCursor();
          const scrollInfo = editorRef.current.getScrollInfo();
          
          // Apply the new code
          editorRef.current.setValue(code);
          
          // Try to restore cursor position
          try {
            // If the code structure is similar, try to maintain cursor position
            const currentLines = currentCode.split('\n');
            const newLines = code.split('\n');
            
            if (currentLines.length === newLines.length) {
              // Same number of lines, restore exact position
              editorRef.current.setCursor(cursor);
            } else {
              // Different number of lines, try to find a reasonable position
              const safeLine = Math.min(cursor.line, newLines.length - 1);
              const safeCh = Math.min(cursor.ch, newLines[safeLine]?.length || 0);
              editorRef.current.setCursor({ line: safeLine, ch: safeCh });
            }
          } catch (error) {
            // If cursor restoration fails, set to start
            editorRef.current.setCursor({ line: 0, ch: 0 });
          }
          
          // Restore scroll position
          editorRef.current.scrollTo(scrollInfo.left, scrollInfo.top);
        }
      }
    };

    const handleSyncCode = ({ code, socketId }) => {
      // Only sync if this message is intended for this socket
      if (code != null && socketId === socketRef.current.id && editorRef.current) {
        isRemoteChange.current = true;
        editorRef.current.setValue(code);
      }
    };

    // Set up event listeners
    socketRef.current.on(ACTIONS.CODE_CHANGE, handleCodeChange);
    socketRef.current.on(ACTIONS.SYNC_CODE, handleSyncCode);

    return () => {
      if (socketRef.current) {
        socketRef.current.off(ACTIONS.CODE_CHANGE, handleCodeChange);
        socketRef.current.off(ACTIONS.SYNC_CODE, handleSyncCode);
      }
    };
  }, [socketRef.current, roomId]);

  return <textarea id="realtimeEditor"></textarea>;
};

export default Editor;