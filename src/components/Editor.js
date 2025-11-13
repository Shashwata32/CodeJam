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
//         if (origin !== "setValue") {
//           socketRef.current.emit(ACTIONS.CODE_CHANGE, {
//             roomId,
//             code,
//           });
//         }
//       });
//     }
//     init();
//   }, []);

//   useEffect(() => {
//     if (socketRef.current) {
//       socketRef.current.on(ACTIONS.CODE_CHANGE, ({ code }) => {
//         if (code != null) {
//           editorRef.current.setValue(code);
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
