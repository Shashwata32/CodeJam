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
  const lastChange = useRef(null);

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
          lineWrapping: true,
        }
      );

      editorRef.current.on("change", (instance, changes) => {
        const { origin } = changes;
        const code = instance.getValue();
        onCodeChange(code);
        
        // Only emit changes if they are from the local user
        if (origin !== "setValue" && !isRemoteChange.current) {
          // Store the last change for potential conflict resolution
          lastChange.current = {
            changes: changes,
            timestamp: Date.now()
          };
          
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

      // Handle cursor activity to show multiple cursors
      editorRef.current.on("cursorActivity", (instance) => {
        if (!isRemoteChange.current) {
          // Could emit cursor position for multi-cursor display
          // This is advanced feature for later implementation
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
          
          // Get current state before applying changes
          const currentCode = editorRef.current.getValue();
          const cursor = editorRef.current.getCursor();
          const scrollInfo = editorRef.current.getScrollInfo();
          const selections = editorRef.current.listSelections();
          
          if (changes && currentCode !== code) {
            // Try to apply changes incrementally if possible
            try {
              // Apply the remote changes
              editorRef.current.setValue(code);
              
              // Try to preserve cursor position intelligently
              if (cursor) {
                // Simple heuristic: if codes are similar, try to keep cursor position
                const currentLines = currentCode.split('\n');
                const newLines = code.split('\n');
                
                if (currentLines.length === newLines.length) {
                  // Same number of lines, try to keep same position
                  const newLine = Math.min(cursor.line, newLines.length - 1);
                  const newCh = Math.min(cursor.ch, newLines[newLine]?.length || 0);
                  editorRef.current.setCursor({ line: newLine, ch: newCh });
                } else {
                  // Different number of lines, put cursor at a safe position
                  const safeLine = Math.min(cursor.line, newLines.length - 1);
                  const safeCh = Math.min(cursor.ch, newLines[safeLine]?.length || 0);
                  editorRef.current.setCursor({ line: safeLine, ch: safeCh });
                }
              }
              
              // Restore selections if any
              if (selections && selections.length > 0) {
                editorRef.current.setSelections(selections);
              }
              
              // Restore scroll position
              editorRef.current.scrollTo(scrollInfo.left, scrollInfo.top);
              
            } catch (error) {
              console.error("Error applying incremental changes:", error);
              // Fallback: full replacement
              editorRef.current.setValue(code);
            }
          } else {
            // Fallback to full replacement
            editorRef.current.setValue(code);
          }
        }
      });

      // Handle code synchronization when new user joins
      socketRef.current.on(ACTIONS.SYNC_CODE, ({ code, socketId }) => {
        if (code != null && socketId === socketRef.current.id) {
          isRemoteChange.current = true;
          editorRef.current.setValue(code);
        }
      });
    }
    
    return () => {
      if (socketRef.current) {
        socketRef.current.off(ACTIONS.CODE_CHANGE);
        socketRef.current.off(ACTIONS.SYNC_CODE);
      }
    };
  }, [socketRef.current]);

  return <textarea id="realtimeEditor"></textarea>;
};

export default Editor;
