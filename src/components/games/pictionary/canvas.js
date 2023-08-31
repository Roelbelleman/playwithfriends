import React, { useRef, useEffect, useState } from "react";
import { socket } from "../../App";
import { getDatabase, ref, onValue, get } from "firebase/database";


const Canvas = () => {
  const canvasRef = useRef(null);
  const [roomName, setRoomName] = useState("");
  let context;
  const user = JSON.parse(localStorage.getItem("user"));
  const db = getDatabase();

  useEffect(() => {
    const fetchRoomName = async () => {
      const roomNameSnapshot = await get(
        ref(db, "users/" + user.uid + "/roomName")
      );
      const roomNameValue = roomNameSnapshot.val();
      setRoomName(roomNameValue);
    };

    fetchRoomName();

    const canvas = canvasRef.current;
    context = canvas.getContext("2d");
    context.strokeStyle = "black";
    context.lineWidth = 2;
    context.lineCap = "round";

    socket.on("draw", ({ x0, y0, x1, y1 }) => {
      drawRemote(x0, y0, x1, y1);
    });
  }, []);

  let isDrawing = false;
  let lastX = 0;
  let lastY = 0;

  const startDrawing = (e) => {
    isDrawing = true;
    [lastX, lastY] = [
      e.clientX - canvasRef.current.offsetLeft,
      e.clientY - canvasRef.current.offsetTop,
    ];
  };

  const draw = (e) => {
    if (!isDrawing) return;

    const x = e.clientX - canvasRef.current.offsetLeft;
    const y = e.clientY - canvasRef.current.offsetTop;

    drawLocal(lastX, lastY, x, y);
    socket.emit("draw", { x0: lastX, y0: lastY, x1: x, y1: y, roomName });

    [lastX, lastY] = [x, y];
  };

const drawLocal = (x0, y0, x1, y1) => {
  context?.beginPath();
  context?.moveTo(x0, y0);
  context?.lineTo(x1, y1);
  context?.stroke();
};


  const drawRemote = (x0, y0, x1, y1) => {
    drawLocal(x0, y0, x1, y1, );
  };

  const stopDrawing = () => {
    isDrawing = false;
  };

  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={600}
      onMouseDown={startDrawing}
      onMouseMove={draw}
      onMouseUp={stopDrawing}
      onMouseOut={stopDrawing}
    />
  );
};

export default Canvas;
