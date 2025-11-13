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

  useEffect(() => {
    async function init() {
      editorRef.current = CodeMirror.fromTextArea(
        document.getElementById("realtimeEditor"),
        {
          mode: { name: "javascript", json: true },
          theme: "dracula",
          autoCloseTags: true,
          autoCloseBrackets: true,
          lineNumbers: true,
        }
      );

      editorRef.current.on("change", (instance, changes) => {
        const { origin } = changes;
        const code = instance.getValue();
        onCodeChange(code);
        
        // Only emit changes if they are from the local user
        if (origin !== "setValue" && !isRemoteChange.current) {
          socketRef.current.emit(ACTIONS.CODE_CHANGE, {
            roomId,
            code,
            changes: changes
          });
        }
        
        // Reset the flag after processing
        if (isRemoteChange.current) {
          isRemoteChange.current = false;
        }
      });
    }
    init();
  }, []);

  useEffect(() => {
    if (socketRef.current) {
      socketRef.current.on(ACTIONS.CODE_CHANGE, ({ code, changes }) => {
        if (code != null) {
          // Set flag to indicate this is a remote change
          isRemoteChange.current = true;
          
          // Get current cursor position and scroll position
          const cursor = editorRef.current.getCursor();
          const scrollInfo = editorRef.current.getScrollInfo();
          
          // Apply the changes
          editorRef.current.setValue(code);
          
          // Restore cursor position and scroll position
          editorRef.current.setCursor(cursor);
          editorRef.current.scrollTo(scrollInfo.left, scrollInfo.top);
        }
      });
    }
    return () => {
      socketRef.current.off(ACTIONS.CODE_CHANGE);
    };
  }, [socketRef.current]);

  return <textarea id="realtimeEditor"></textarea>;
};

export default Editor;

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
//   const pendingChanges = useRef([]);
//   const revision = useRef(0);

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
//           lineWrapping: true,
//         }
//       );

//       editorRef.current.on("change", (instance, changes) => {
//         const { origin } = changes;
//         const code = instance.getValue();
//         onCodeChange(code);
        
//         if (origin !== "setValue" && !isRemoteChange.current) {
//           // Create a change object
//           const changeObj = {
//             from: changes.from,
//             to: changes.to,
//             text: changes.text,
//             removed: changes.removed,
//             origin: changes.origin,
//             timestamp: Date.now(),
//             revision: revision.current++
//           };
          
//           // Add to pending changes
//           pendingChanges.current.push(changeObj);
          
//           // Emit the change
//           socketRef.current.emit(ACTIONS.CODE_CHANGE, {
//             roomId,
//             change: changeObj,
//             fullCode: code // Fallback
//           });
//         }
        
//         if (isRemoteChange.current) {
//           isRemoteChange.current = false;
//         }
//       });
//     }
//     init();
//   }, []);

//   useEffect(() => {
//     if (socketRef.current) {
//       socketRef.current.on(ACTIONS.CODE_CHANGE, ({ change, fullCode }) => {
//         if (change) {
//           isRemoteChange.current = true;
          
//           try {
//             // Apply the remote change
//             editorRef.current.replaceRange(
//               change.text.join('\n'), 
//               change.from, 
//               change.to
//             );
            
//             // Update revision
//             revision.current = Math.max(revision.current, change.revision) + 1;
            
//           } catch (error) {
//             console.error("Failed to apply operational transform, using fallback:", error);
//             // Fallback to full code replacement
//             if (fullCode) {
//               isRemoteChange.current = true;
//               editorRef.current.setValue(fullCode);
//             }
//           }
//         } else if (fullCode) {
//           // Fallback: full code replacement
//           isRemoteChange.current = true;
//           editorRef.current.setValue(fullCode);
//         }
//       });

//       socketRef.current.on(ACTIONS.SYNC_CODE, ({ code, socketId }) => {
//         if (code != null && socketId === socketRef.current.id) {
//           isRemoteChange.current = true;
//           editorRef.current.setValue(code);
//           // Reset revision on sync
//           revision.current = 0;
//           pendingChanges.current = [];
//         }
//       });
//     }
    
//     return () => {
//       if (socketRef.current) {
//         socketRef.current.off(ACTIONS.CODE_CHANGE);
//         socketRef.current.off(ACTIONS.SYNC_CODE);
//       }
//     };
//   }, [socketRef.current]);

//   return <textarea id="realtimeEditor"></textarea>;
// };

// export default Editor;