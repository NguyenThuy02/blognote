"use client";
import Header from "../components/Header";
import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import toast, { Toaster } from "react-hot-toast";
import { useRouter } from "next/navigation";
import { ArrowLeftOutlined } from "@ant-design/icons";

const Sketch = dynamic(() => import("react-p5").then((mod) => mod.default), {
  ssr: false,
});

export default function Home() {
  const router = useRouter();
  const [brushColor, setBrushColor] = useState("#6A5ACD");
  const [brushSize, setBrushSize] = useState(5);
  const [fillColor, setFillColor] = useState("#87CEEB");
  const [fillEnabled, setFillEnabled] = useState(false);
  const [brushOpacity, setBrushOpacity] = useState(255);
  const [fillOpacity, setFillOpacity] = useState(255);
  const [drawings, setDrawings] = useState([]);
  const [blogNote, setBlogNote] = useState("");
  const [blogNotes, setBlogNotes] = useState([]);
  const [isEraser, setIsEraser] = useState(false);
  const [brushStyle, setBrushStyle] = useState("normal");
  const [textToDraw, setTextToDraw] = useState("");
  const [drawingText, setDrawingText] = useState(false);
  const [shapeMode, setShapeMode] = useState("none");
  const [startPoint, setStartPoint] = useState(null);
  const [curvePoints, setCurvePoints] = useState([]);
  const [freehandPoints, setFreehandPoints] = useState([]);
  const [objects, setObjects] = useState([]);
  const [isDirty, setIsDirty] = useState(false);
  const [polygonSides, setPolygonSides] = useState(5);
  const [isP5Ready, setIsP5Ready] = useState(false);
  const p5Ref = useRef();
  const [editNoteIndex, setEditNoteIndex] = useState(null);
  const [editNoteText, setEditNoteText] = useState("");
  const dashStateRef = useRef({ totalDistance: 0, isDash: true });

  const colorPalette = [
    "#BA55D3",
    "#87CEEB",
    "#9932CC",
    "#4682B4",
    "#6A5ACD",
    "#00B7EB",
  ];

  // Debounce utility for performance optimization
  const debounce = (func, wait) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  };

  const debouncedSetFreehandPoints = debounce(setFreehandPoints, 10);
  const debouncedSetCurvePoints = debounce(setCurvePoints, 10);
  // New: Debounce eraser for performance
  const debouncedErase = debounce((p5) => erase(p5), 50);

  // Load state from localStorage
  useEffect(() => {
    const savedObjects = localStorage.getItem("canvasObjects");
    const savedDrawings = localStorage.getItem("canvasDrawings");
    const savedBlogNotes = localStorage.getItem("canvasBlogNotes");
    if (savedObjects) setObjects(JSON.parse(savedObjects));
    if (savedDrawings) setDrawings(JSON.parse(savedDrawings));
    if (savedBlogNotes) setBlogNotes(JSON.parse(savedBlogNotes));
  }, []);

  // Save state to localStorage
  useEffect(() => {
    localStorage.setItem("canvasObjects", JSON.stringify(objects));
    localStorage.setItem("canvasDrawings", JSON.stringify(drawings));
    localStorage.setItem("canvasBlogNotes", JSON.stringify(blogNotes));
  }, [objects, drawings, blogNotes]);

  // Hex to RGB conversion
  const hexToRgb = (hex) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return [r, g, b];
  };

  // Safe draw utility
  const safeDraw = (callback) => {
    if (!p5Ref.current || !p5Ref.current.buffer || !p5Ref.current.canvas) {
      console.warn("p5 hoặc buffer chưa sẵn sàng");
      return;
    }
    callback(p5Ref.current, p5Ref.current.buffer);
  };

  // Setup canvas
  const setup = (p5, canvasParentRef) => {
    p5Ref.current = p5;
    if (!p5.createCanvas) {
      console.error("p5.createCanvas không khả dụng. Vui lòng kiểm tra p5.js.");
      return;
    }
    const baseWidth = 800;
    const baseHeight = 400;
    p5.createCanvas(baseWidth, baseHeight).parent(canvasParentRef);
    p5.pixelDensity(1);
    p5.background(255);
    p5Ref.current.buffer = p5.createGraphics(baseWidth, baseHeight);
    p5Ref.current.buffer.background(255);
    p5Ref.current.showGrid = false;
    setIsP5Ready(true);
    redrawCanvas();
  };

  // Redraw canvas with buffer
  const redrawCanvas = () => {
    safeDraw((p5, buffer) => {
      buffer.clear();
      buffer.background(255);

      if (p5Ref.current.showGrid) {
        buffer.push();
        buffer.stroke(200);
        buffer.strokeWeight(0.3);
        for (let x = 0; x < p5.width; x += 10) {
          buffer.line(x, 0, x, p5.height);
        }
        for (let y = 0; y < p5.height; y += 10) {
          buffer.line(0, y, p5.width, y);
        }
        buffer.pop();
      }

      objects.forEach((obj) => {
        buffer.push();
        const [r, g, b] = hexToRgb(obj.color);
        buffer.stroke(r, g, b, obj.opacity);
        buffer.strokeWeight(obj.size);
        if (obj.fill) {
          const [fr, fg, fb] = hexToRgb(obj.fill);
          buffer.fill(fr, fg, fb, obj.fillOpacity || 255);
        } else {
          buffer.noFill();
        }
        if (obj.type === "circle") {
          const r = Math.hypot(
            obj.endPoint.x - obj.startPoint.x,
            obj.endPoint.y - obj.startPoint.y
          );
          buffer.ellipse(obj.startPoint.x, obj.startPoint.y, r * 2);
        } else if (obj.type === "rectangle") {
          buffer.rect(
            obj.startPoint.x,
            obj.startPoint.y,
            obj.endPoint.x - obj.startPoint.x,
            obj.endPoint.y - obj.startPoint.y
          );
        } else if (obj.type === "triangle") {
          buffer.triangle(
            obj.startPoint.x,
            obj.startPoint.y,
            obj.endPoint.x,
            obj.endPoint.y,
            obj.startPoint.x - (obj.endPoint.x - obj.startPoint.x),
            obj.endPoint.y
          );
        } else if (obj.type === "star") {
          const r1 = Math.hypot(
            obj.endPoint.x - obj.startPoint.x,
            obj.endPoint.y - obj.startPoint.y
          );
          const r2 = r1 / 2;
          buffer.beginShape();
          for (let i = 0; i < 10; i++) {
            const angle = (buffer.PI / 5) * i;
            const r = i % 2 === 0 ? r1 : r2;
            buffer.vertex(
              obj.startPoint.x + r * Math.cos(angle),
              obj.startPoint.y + r * Math.sin(angle)
            );
          }
          buffer.endShape(buffer.CLOSE);
        } else if (obj.type === "polygon") {
          const sides = obj.sides;
          const r = Math.hypot(
            obj.endPoint.x - obj.startPoint.x,
            obj.endPoint.y - obj.startPoint.y
          );
          buffer.beginShape();
          for (let i = 0; i <= sides; i++) {
            const angle = (buffer.TWO_PI / sides) * i;
            buffer.vertex(
              obj.startPoint.x + r * Math.cos(angle),
              obj.startPoint.y + r * Math.sin(angle)
            );
          }
          buffer.endShape(buffer.CLOSE);
        } else if (obj.type === "arrow") {
          buffer.line(
            obj.startPoint.x,
            obj.startPoint.y,
            obj.endPoint.x,
            obj.endPoint.y
          );
          const angle = Math.atan2(
            obj.endPoint.y - obj.startPoint.y,
            obj.endPoint.x - obj.startPoint.x
          );
          const size = 10;
          buffer.line(
            obj.endPoint.x,
            obj.endPoint.y,
            obj.endPoint.x - size * Math.cos(angle - Math.PI / 6),
            obj.endPoint.y - size * Math.sin(angle - Math.PI / 6)
          );
          buffer.line(
            obj.endPoint.x,
            obj.endPoint.y,
            obj.endPoint.x - size * Math.cos(angle + Math.PI / 6),
            obj.endPoint.y - size * Math.sin(angle + Math.PI / 6)
          );
        } else if (obj.type === "curve" && obj.points.length >= 2) {
          buffer.noFill();
          buffer.beginShape();
          buffer.curveVertex(obj.points[0].x, obj.points[0].y);
          for (let i = 0; i < obj.points.length; i++) {
            buffer.curveVertex(obj.points[i].x, obj.points[i].y);
          }
          buffer.curveVertex(
            obj.points[obj.points.length - 1].x,
            obj.points[obj.points.length - 1].y
          );
          buffer.endShape();
        } else if (obj.type === "text") {
          buffer.fill(r, g, b, obj.opacity);
          buffer.noStroke();
          buffer.textSize(obj.size * 3);
          buffer.text(obj.text, obj.x, obj.y);
        } else if (obj.type === "freehand" && obj.points.length > 0) {
          buffer.noFill();
          buffer.stroke(r, g, b, obj.opacity);
          buffer.strokeWeight(obj.size);
          buffer.strokeCap(buffer.ROUND);
          if (obj.brushStyle === "normal") {
            buffer.beginShape();
            for (let i = 0; i < obj.points.length; i++) {
              buffer.vertex(obj.points[i].x, obj.points[i].y);
            }
            buffer.endShape();
          } else if (obj.brushStyle === "dotted") {
            for (let i = 0; i < obj.points.length; i++) {
              if (i % 2 === 0) {
                buffer.point(obj.points[i].x, obj.points[i].y);
              }
            }
          } else if (obj.brushStyle === "dashed") {
            let totalDistance = 0;
            const dashLength = obj.size * 2;
            const gapLength = obj.size * 1.5;
            for (let i = 1; i < obj.points.length; i++) {
              const dist = buffer.dist(
                obj.points[i - 1].x,
                obj.points[i - 1].y,
                obj.points[i].x,
                obj.points[i].y
              );
              totalDistance += dist;
              const segmentPos = totalDistance % (dashLength + gapLength);
              if (segmentPos < dashLength) {
                buffer.line(
                  obj.points[i - 1].x,
                  obj.points[i - 1].y,
                  obj.points[i].x,
                  obj.points[i].y
                );
              }
            }
          } else if (obj.brushStyle === "spray") {
            for (let i = 0; i < obj.points.length; i++) {
              if (i % 2 === 0) {
                for (let j = 0; j < 4; j++) {
                  const offsetX = buffer.random(-obj.size, obj.size);
                  const offsetY = buffer.random(-obj.size, obj.size);
                  buffer.point(
                    obj.points[i].x + offsetX,
                    obj.points[i].y + offsetY
                  );
                }
              }
            }
          } else if (obj.brushStyle === "feather") {
            buffer.strokeWeight(obj.size / 2);
            buffer.stroke(r, g, b, obj.opacity * 0.5);
            buffer.beginShape();
            for (let i = 0; i < obj.points.length; i++) {
              buffer.vertex(obj.points[i].x, obj.points[i].y);
            }
            buffer.endShape();
          } else if (obj.brushStyle === "grid") {
            for (let i = 0; i < obj.points.length; i++) {
              if (i % 3 === 0) {
                buffer.noFill();
                buffer.rect(
                  obj.points[i].x - obj.size / 2,
                  obj.points[i].y - obj.size / 2,
                  obj.size,
                  obj.size
                );
              }
            }
          }
        }
        buffer.pop();
      });

      p5.image(buffer, 0, 0);
    });
  };

  // New: Eraser function to handle both text and drawings uniformly
  const erase = (p5) => {
    const eraserRadius = brushSize * 3;
    setObjects((prevObjects) =>
      prevObjects.filter((obj) => {
        if (obj.type === "text") {
          // Estimate text bounding box (approximation)
          const textWidth = obj.text.length * obj.size * 1.5; // Rough estimate
          const textHeight = obj.size * 3;
          const textLeft = obj.x;
          const textRight = obj.x + textWidth;
          const textTop = obj.y - textHeight;
          const textBottom = obj.y;
          return !(
            p5.mouseX >= textLeft - eraserRadius &&
            p5.mouseX <= textRight + eraserRadius &&
            p5.mouseY >= textTop - eraserRadius &&
            p5.mouseY <= textBottom + eraserRadius
          );
        } else if (obj.type === "freehand" || obj.type === "curve") {
          const radius =
            obj.brushStyle === "spray" || obj.brushStyle === "feather"
              ? eraserRadius * 1.5
              : eraserRadius;
          return !obj.points.some(
            (point) => p5.dist(point.x, point.y, p5.mouseX, p5.mouseY) < radius
          );
        } else if (
          obj.type === "circle" ||
          obj.type === "rectangle" ||
          obj.type === "triangle" ||
          obj.type === "star" ||
          obj.type === "polygon" ||
          obj.type === "arrow"
        ) {
          const centerX = (obj.startPoint.x + obj.endPoint.x) / 2;
          const centerY = (obj.startPoint.y + obj.endPoint.y) / 2;
          return p5.dist(centerX, centerY, p5.mouseX, p5.mouseY) > eraserRadius;
        }
        return true;
      })
    );
    setIsDirty(true);
    redrawCanvas();
  };

  // Draw function
  const draw = (p5) => {
    safeDraw((p5, buffer) => {
      p5.background(255);
      p5.image(buffer, 0, 0);

      if (
        p5.mouseX >= 0 &&
        p5.mouseX <= p5.width &&
        p5.mouseY >= 0 &&
        p5.mouseY <= p5.height &&
        !drawingText
      ) {
        p5.push();
        p5.noFill();
        p5.stroke(100, 100, 100, 100);
        p5.strokeWeight(1);
        p5.ellipse(
          p5.mouseX,
          p5.mouseY,
          isEraser
            ? brushSize * 6
            : brushStyle === "spray" || brushStyle === "grid"
            ? brushSize * 2
            : brushSize
        );
        p5.pop();
      }

      // Modified: Use debounced eraser
      if (
        p5.mouseIsPressed &&
        isEraser &&
        p5.mouseX >= 0 &&
        p5.mouseX <= p5.width &&
        p5.mouseY >= 0 &&
        p5.mouseY <= p5.height
      ) {
        debouncedErase(p5);
      }

      if (
        p5.mouseIsPressed &&
        !drawingText &&
        shapeMode === "none" &&
        brushStyle !== "curve" &&
        p5.mouseX >= 0 &&
        p5.mouseX <= p5.width &&
        p5.mouseY >= 0 &&
        p5.mouseY <= p5.height &&
        !isEraser
      ) {
        p5.push();
        buffer.push();
        const [r, g, b] = hexToRgb(brushColor);
        p5.stroke(r, g, b, brushOpacity);
        p5.strokeWeight(brushSize);
        p5.strokeCap(p5.ROUND);
        p5.noFill();
        buffer.stroke(r, g, b, brushOpacity);
        buffer.strokeWeight(brushSize);
        buffer.strokeCap(buffer.ROUND);
        buffer.noFill();

        const currentPoint = { x: p5.mouseX, y: p5.mouseY };
        const lastPoint = freehandPoints[freehandPoints.length - 1] || {
          x: p5.pmouseX,
          y: p5.pmouseY,
        };
        const distance = p5.dist(
          lastPoint.x,
          lastPoint.y,
          currentPoint.x,
          currentPoint.y
        );

        debouncedSetFreehandPoints((prev) => [...prev, currentPoint]);

        if (brushStyle === "normal") {
          p5.line(lastPoint.x, lastPoint.y, p5.mouseX, p5.mouseY);
          buffer.line(lastPoint.x, lastPoint.y, p5.mouseX, p5.mouseY);
        } else if (brushStyle === "dotted") {
          if (distance > brushSize * 0.5) {
            p5.point(p5.mouseX, p5.mouseY);
            buffer.point(p5.mouseX, p5.mouseY);
          }
        } else if (brushStyle === "dashed") {
          if (distance > brushSize / 2) {
            dashStateRef.current.totalDistance += distance;
            const dashLength = brushSize * 2;
            const gapLength = brushSize * 1.5;
            const segmentPos =
              dashStateRef.current.totalDistance % (dashLength + gapLength);
            if (segmentPos < dashLength) {
              p5.line(lastPoint.x, lastPoint.y, p5.mouseX, p5.mouseY);
              buffer.line(lastPoint.x, lastPoint.y, p5.mouseX, p5.mouseY);
            }
          }
        } else if (brushStyle === "spray") {
          if (distance > brushSize / 2) {
            for (let i = 0; i < 4; i++) {
              const offsetX = p5.random(-brushSize, brushSize);
              const offsetY = p5.random(-brushSize, brushSize);
              p5.point(p5.mouseX + offsetX, p5.mouseY + offsetY);
              buffer.point(p5.mouseX + offsetX, p5.mouseY + offsetY);
            }
          }
        } else if (brushStyle === "feather") {
          p5.strokeWeight(brushSize / 2);
          p5.stroke(r, g, b, brushOpacity * 0.5);
          p5.line(lastPoint.x, lastPoint.y, p5.mouseX, p5.mouseY);
          buffer.strokeWeight(brushSize / 2);
          buffer.stroke(r, g, b, brushOpacity * 0.5);
          buffer.line(lastPoint.x, lastPoint.y, p5.mouseX, p5.mouseY);
        } else if (brushStyle === "grid") {
          if (distance > brushSize) {
            p5.noFill();
            p5.rect(
              p5.mouseX - brushSize / 2,
              p5.mouseY - brushSize / 2,
              brushSize,
              brushSize
            );
            buffer.noFill();
            buffer.rect(
              p5.mouseX - brushSize / 2,
              p5.mouseY - brushSize / 2,
              brushSize,
              brushSize
            );
          }
        }
        p5.pop();
        buffer.pop();
        setIsDirty(true);
      }

      if (
        p5.mouseIsPressed &&
        !drawingText &&
        shapeMode === "none" &&
        brushStyle === "curve" &&
        p5.mouseX >= 0 &&
        p5.mouseX <= p5.width &&
        p5.mouseY >= 0 &&
        p5.mouseY <= p5.height &&
        !isEraser
      ) {
        p5.push();
        buffer.push();
        const [r, g, b] = hexToRgb(brushColor);
        p5.stroke(r, g, b, brushOpacity);
        p5.strokeWeight(brushSize);
        p5.noFill();
        buffer.stroke(r, g, b, brushOpacity);
        buffer.strokeWeight(brushSize);
        buffer.noFill();
        const currentPoint = { x: p5.mouseX, y: p5.mouseY };
        const lastPoint = curvePoints[curvePoints.length - 1] || currentPoint;
        const distance = p5.dist(
          lastPoint.x,
          lastPoint.y,
          currentPoint.x,
          currentPoint.y
        );
        if (distance > brushSize * 0.3) {
          debouncedSetCurvePoints((prev) => [...prev, currentPoint]);
        }
        if (curvePoints.length >= 1) {
          p5.beginShape();
          p5.curveVertex(curvePoints[0].x, curvePoints[0].y);
          for (let i = 0; i < curvePoints.length; i++) {
            p5.curveVertex(curvePoints[i].x, curvePoints[i].y);
          }
          p5.curveVertex(
            curvePoints[curvePoints.length - 1].x,
            curvePoints[curvePoints.length - 1].y
          );
          p5.endShape();
          buffer.beginShape();
          buffer.curveVertex(curvePoints[0].x, curvePoints[0].y);
          for (let i = 0; i < curvePoints.length; i++) {
            buffer.curveVertex(curvePoints[i].x, curvePoints[i].y);
          }
          buffer.curveVertex(
            curvePoints[curvePoints.length - 1].x,
            curvePoints[curvePoints.length - 1].y
          );
          buffer.endShape();
        }
        p5.pop();
        buffer.pop();
        setIsDirty(true);
      }

      if (
        p5.mouseIsPressed &&
        startPoint &&
        shapeMode !== "none" &&
        p5.mouseX >= 0 &&
        p5.mouseX <= p5.width &&
        p5.mouseY >= 0 &&
        p5.mouseY <= p5.height
      ) {
        p5.push();
        const [r, g, b] = hexToRgb(brushColor);
        p5.stroke(r, g, b, brushOpacity);
        p5.strokeWeight(brushSize);
        if (fillEnabled) {
          const [fr, fg, fb] = hexToRgb(fillColor);
          p5.fill(fr, fg, fb, fillOpacity);
        } else {
          p5.noFill();
        }
        const endX = p5.mouseX;
        const endY = p5.mouseY;
        if (shapeMode === "circle") {
          const r = Math.hypot(endX - startPoint.x, endY - startPoint.y);
          p5.ellipse(startPoint.x, startPoint.y, r * 2);
        } else if (shapeMode === "rectangle") {
          p5.rect(
            startPoint.x,
            startPoint.y,
            endX - startPoint.x,
            endY - startPoint.y
          );
        } else if (shapeMode === "triangle") {
          p5.triangle(
            startPoint.x,
            startPoint.y,
            endX,
            endY,
            startPoint.x - (endX - startPoint.x),
            endY
          );
        } else if (shapeMode === "star") {
          const r1 = Math.hypot(endX - startPoint.x, endY - startPoint.y);
          const r2 = r1 / 2;
          p5.beginShape();
          for (let i = 0; i < 10; i++) {
            const angle = (p5.PI / 5) * i;
            const r = i % 2 === 0 ? r1 : r2;
            p5.vertex(
              startPoint.x + r * Math.cos(angle),
              startPoint.y + r * Math.sin(angle)
            );
          }
          p5.endShape(p5.CLOSE);
        } else if (shapeMode === "polygon") {
          const sides = polygonSides;
          const r = Math.hypot(endX - startPoint.x, endY - startPoint.y);
          p5.beginShape();
          for (let i = 0; i <= sides; i++) {
            const angle = (p5.TWO_PI / sides) * i;
            p5.vertex(
              startPoint.x + r * Math.cos(angle),
              startPoint.y + r * Math.sin(angle)
            );
          }
          p5.endShape(p5.CLOSE);
        } else if (shapeMode === "arrow") {
          p5.line(startPoint.x, startPoint.y, endX, endY);
          const angle = Math.atan2(endY - startPoint.y, endX - startPoint.x);
          const size = 10;
          p5.line(
            endX,
            endY,
            endX - size * Math.cos(angle - Math.PI / 6),
            endY - size * Math.sin(angle - Math.PI / 6)
          );
          p5.line(
            endX,
            endY,
            endX - size * Math.cos(angle + Math.PI / 6),
            endY - size * Math.sin(angle + Math.PI / 6)
          );
        }
        p5.pop();
      }
    });
  };

  // Mouse pressed handler
  const mousePressed = (p5) => {
    if (
      !p5Ref.current ||
      p5.mouseX < 0 ||
      p5.mouseX > p5.width ||
      p5.mouseY < 0 ||
      p5.mouseY > p5.height
    ) {
      return;
    }
    if (drawingText && textToDraw.trim() !== "") {
      p5.push();
      const [r, g, b] = hexToRgb(brushColor);
      p5.fill(r, g, b, brushOpacity);
      p5.noStroke();
      p5.textSize(brushSize * 3);
      p5.text(textToDraw, p5.mouseX, p5.mouseY);
      p5.pop();
      setObjects([
        ...objects,
        {
          type: "text",
          text: textToDraw,
          x: p5.mouseX,
          y: p5.mouseY,
          color: brushColor,
          size: brushSize,
          opacity: brushOpacity,
        },
      ]);
      setIsDirty(true);
      redrawCanvas();
    } else if (shapeMode !== "none") {
      setStartPoint({ x: p5.mouseX, y: p5.mouseY });
    } else if (!isEraser && shapeMode === "none" && !drawingText) {
      if (brushStyle === "curve") {
        setCurvePoints([{ x: p5.mouseX, y: p5.mouseY }]);
      } else {
        setFreehandPoints([{ x: p5.mouseX, y: p5.mouseY }]);
        if (brushStyle === "dashed") {
          dashStateRef.current = { totalDistance: 0, isDash: true };
        }
      }
    }
  };

  // Mouse released handler
  const mouseReleased = (p5) => {
    if (!p5Ref.current || !p5.width) {
      return;
    }
    if (startPoint && shapeMode !== "none") {
      const endX = p5.mouseX;
      const endY = p5.mouseY;
      const newObject = {
        type: shapeMode,
        startPoint: { x: startPoint.x, y: startPoint.y },
        endPoint: { x: endX, y: endY },
        color: brushColor,
        size: brushSize,
        fill: fillEnabled ? fillColor : null,
        fillOpacity: fillEnabled ? fillOpacity : null,
        opacity: brushOpacity,
        sides: shapeMode === "polygon" ? polygonSides : null,
      };
      setObjects([...objects, newObject]);
      setStartPoint(null);
      setIsDirty(true);
      redrawCanvas();
    }
    if (brushStyle === "curve" && curvePoints.length >= 2 && !isEraser) {
      setObjects([
        ...objects,
        {
          type: "curve",
          points: [...curvePoints],
          color: brushColor,
          size: brushSize,
          opacity: brushOpacity,
        },
      ]);
      setIsDirty(true);
      redrawCanvas();
    }
    if (
      freehandPoints.length >= 1 &&
      !isEraser &&
      shapeMode === "none" &&
      !drawingText &&
      brushStyle !== "curve"
    ) {
      setObjects([
        ...objects,
        {
          type: "freehand",
          points: [...freehandPoints],
          color: brushColor,
          size: brushSize,
          opacity: brushOpacity,
          brushStyle: brushStyle,
        },
      ]);
      setIsDirty(true);
      redrawCanvas();
    }
    setFreehandPoints([]);
    setCurvePoints([]);
    if (brushStyle === "dashed") {
      dashStateRef.current = { totalDistance: 0, isDash: true };
    }
  };

  // Undo last action
  const undoLastAction = () => {
    setObjects((prev) => prev.slice(0, -1));
    setIsDirty(true);
    redrawCanvas();
    toast.success("Đã hoàn tác hành động cuối!");
  };

  // Clear canvas and objects
  const clearCanvasAndObjects = () => {
    safeDraw((p5, buffer) => {
      p5.clear();
      p5.background(255);
      buffer.clear();
      buffer.background(255);
      setObjects([]);
      setIsDirty(true);
      redrawCanvas();
      toast.success("Đã xóa toàn bộ canvas!");
    });
  };

  // Save to collection
  const saveToCollection = () => {
    safeDraw((p5) => {
      const img = p5.canvas.toDataURL("image/png");
      setDrawings([...drawings, img]);
      setIsDirty(false);
      toast.success("Lưu bản vẽ thành công!");
    });
  };

  // Download drawing
  const downloadDrawing = () => {
    safeDraw((p5) => {
      const link = document.createElement("a");
      link.download = "myDrawing.png";
      link.href = p5.canvas.toDataURL("image/png");
      link.click();
    });
  };

  // Save blog note
  const saveBlogNote = () => {
    safeDraw((p5) => {
      if (blogNote.trim() !== "") {
        const img = p5.canvas.toDataURL("image/png");
        const newNote = { note: blogNote, drawing: img };
        setBlogNotes([...blogNotes, newNote]);
        setBlogNote("");
        setIsDirty(true);
        toast.success("Nội dung và hình ảnh đã được lưu!");
      } else {
        toast.error("Vui lòng nhập nội dung tranh vẽ.");
      }
    });
  };

  // Take snapshot
  const takeSnapshot = () => {
    safeDraw((p5) => {
      const img = p5.canvas.toDataURL("image/png");
      setDrawings([...drawings, img]);
      setIsDirty(true);
      toast.success("Chụp ảnh nhanh thành công!");
    });
  };

  // Random color
  const randomColor = () => {
    return colorPalette[Math.floor(Math.random() * colorPalette.length)];
  };

  // Edit note
  const handleEditNote = (index, noteText) => {
    setEditNoteIndex(index);
    setEditNoteText(noteText);
  };

  // Save edited note
  const handleSaveEditNote = (index) => {
    if (editNoteText.trim() !== "") {
      const updatedNotes = [...blogNotes];
      updatedNotes[blogNotes.length - 1 - index] = {
        ...updatedNotes[blogNotes.length - 1 - index],
        note: editNoteText,
      };
      setBlogNotes(updatedNotes);
      setEditNoteIndex(null);
      setEditNoteText("");
      setIsDirty(true);
      toast.success("Nội dung bản vẽ đã được cập nhật!");
    } else {
      toast.error("Không được để trống.");
    }
  };

// Delete note
const handleDeleteNote = (index) => {
  toast.custom(
    (t) => (
    <div className="mt-75 fixed items-center justify-center z-50">
        <div className="flex flex-col items-center gap-3 p-5 bg-gradient-to-br from-purple-100 to-blue-100 rounded-lg shadow-lg border border-purple-300">
             <p className="text-base font-semibold text-purple-800">Bạn có chắc muốn xóa bản vẽ này?</p>
          <div className="flex gap-3">
            <button
              className="bg-gradient-to-r from-red-500 to-red-700 text-white px-4 py-2 rounded-full hover:from-red-600 hover:to-red-800 text-sm font-medium shadow-md"
              onClick={() => {
                const updatedNotes = [...blogNotes];
                updatedNotes.splice(blogNotes.length - 1 - index, 1);
                setBlogNotes(updatedNotes);
                setIsDirty(true);
                toast.success("Xóa thành công!", { duration: 2000 });
                toast.dismiss(t.id);
              }}
            >
              Xóa
            </button>
            <button
              className="bg-gradient-to-r from-blue-500 to-blue-700 text-white px-4 py-2 rounded-full hover:from-blue-600 hover:to-blue-800 text-sm font-medium shadow-md"
              onClick={() => toast.dismiss(t.id)}
            >
              Hủy
            </button>
          </div>
        </div>
      </div>
    ),
    { duration: Infinity, position: 'top-center' }
  );
};


// Delete drawing
const handleDeleteDrawing = (index) => {
  toast.custom(
    (t) => (
      <div className="mt-75 fixed items-center justify-center z-50">
        <div className="flex flex-col items-center gap-3 p-5 bg-gradient-to-br from-purple-100 to-blue-100 rounded-lg shadow-lg border border-purple-300">
          <p className="text-base font-semibold text-purple-800">Bạn có chắc muốn xóa bản vẽ này?</p>
          <div className="flex gap-3">
            <button
              className="bg-gradient-to-r from-red-500 to-red-700 text-white px-4 py-2 rounded-full hover:from-red-600 hover:to-red-800 text-sm font-medium shadow-md"
              onClick={() => {
                const updatedDrawings = [...drawings];
                updatedDrawings.splice(drawings.length - 1 - index, 1);
                setDrawings(updatedDrawings);
                setIsDirty(true);
                toast.success("Bản vẽ đã được xóa!", { duration: 2000 });
                toast.dismiss(t.id);
              }}
            >
              Xóa
            </button>
            <button
              className="bg-gradient-to-r from-blue-500 to-blue-700 text-white px-4 py-2 rounded-full hover:from-blue-600 hover:to-blue-800 text-sm font-medium shadow-md"
              onClick={() => toast.dismiss(t.id)}
            >
              Hủy
            </button>
          </div>
        </div>
      </div>
    ),
    { duration: Infinity, position: 'top-center' }
  );
};


  // Attach mouse events
  useEffect(() => {
    if (p5Ref.current && isP5Ready) {
      p5Ref.current.mousePressed = () => mousePressed(p5Ref.current);
      p5Ref.current.mouseReleased = () => mouseReleased(p5Ref.current);
      redrawCanvas();
    }
  }, [
    drawingText,
    textToDraw,
    brushColor,
    shapeMode,
    startPoint,
    objects,
    isP5Ready,
  ]);

  // Thêm hàm handleBack
  const handleBack = () => {
    router.back();
    toast.success("Đã quay lại trang trước!");
  };

  return (
    <div className="mt-21 min-h-screen bg-blue-50 flex flex-col items-center p-5">
      <Toaster position="top-right" reverseOrder={false} />
      <Header />
      <h1 className="text-3xl font-bold text-[#6A5ACD] mb-6 mt-6">Vẽ Tranh</h1>
      <div className="fixed bottom-4 right-4 z-10">
        <button
          onClick={handleBack}
          className="bg-blue-400 hover:bg-blue-500 text-white p-3 rounded-full flex items-center justify-center shadow-md"
        >
          <ArrowLeftOutlined />
        </button>
      </div>

      <div className="mb-6">
        {!isP5Ready && (
          <p className="text-[#6A5ACD]">Đang khởi động canvas...</p>
        )}
        <Sketch setup={setup} draw={draw} />
      </div>

      <div className="flex flex-col items-center mb-6 space-y-4">
        <div className="flex flex-wrap justify-center gap-3">
          <button
            onClick={saveToCollection}
            className="bg-gradient-to-r from-purple-300 to-blue-300 text-white px-4 py-2 rounded hover:from-purple-400 hover:to-blue-400"
            disabled={!isP5Ready}
          >
            Lưu bản vẽ
          </button>
          <button
            onClick={downloadDrawing}
            className="bg-gradient-to-r from-purple-300 to-blue-300 text-white px-4 py-2 rounded hover:from-purple-400 hover:to-blue-400"
            disabled={!isP5Ready}
          >
            Tải về
          </button>
          <button
            onClick={clearCanvasAndObjects}
            className="bg-gradient-to-r from-purple-300 to-blue-300 text-white px-4 py-2 rounded hover:from-purple-400 hover:to-blue-400"
            disabled={!isP5Ready}
          >
            Xóa
          </button>
          <button
            onClick={() => setIsEraser(!isEraser)}
            className="bg-gradient-to-r from-purple-300 to-blue-300 text-white px-4 py-2 rounded hover:from-purple-400 hover:to-blue-400"
            disabled={!isP5Ready}
          >
            {isEraser ? "Đang dùng tẩy" : "Dùng tẩy"}
          </button>
          <button
            onClick={takeSnapshot}
            className="bg-gradient-to-r from-purple-300 to-blue-300 text-white px-4 py-2 rounded hover:from-purple-400 hover:to-blue-400"
            disabled={!isP5Ready}
          >
            Chụp ảnh nhanh
          </button>
          <button
            onClick={() => {
              if (p5Ref.current) {
                p5Ref.current.showGrid = !p5Ref.current.showGrid;
                redrawCanvas();
              }
            }}
            className="bg-gradient-to-r from-purple-300 to-blue-300 text-white px-4 py-2 rounded hover:from-purple-400 hover:to-blue-400"
            disabled={!isP5Ready}
          >
            {p5Ref.current?.showGrid ? "Ẩn lưới" : "Hiện lưới"}
          </button>
          <button
            onClick={undoLastAction}
            className="bg-gradient-to-r from-purple-300 to-blue-300 text-white px-4 py-2 rounded hover:from-purple-400 hover:to-blue-400"
            disabled={!isP5Ready || objects.length === 0}
          >
            Hoàn tác
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <div className="flex flex-col items-center gap-2">
            <label className="flex items-center gap-2 text-[#6A5ACD]">
              🎨 Màu nét:
              <input
                type="color"
                value={brushColor}
                onChange={(e) => setBrushColor(e.target.value)}
                disabled={!isP5Ready}
              />
            </label>
            <div className="flex gap-1">
              {colorPalette.map((color, index) => (
                <input
                  key={index}
                  className="w-6 h-6 rounded-full border border-[#4682B4]"
                  style={{ backgroundColor: color }}
                  onClick={() => setBrushColor(color)}
                  disabled={!isP5Ready}
                />
              ))}
            </div>
            <button
              onClick={() => setBrushColor(randomColor())}
              className="bg-gradient-to-r from-purple-300 to-blue-300 text-white px-2 py-1 rounded hover:from-purple-400 hover:to-blue-400"
              disabled={!isP5Ready}
            >
              Màu ngẫu nhiên
            </button>
            <label className="flex items-center gap-2 text-[#6A5ACD]">
              🌫️ Độ trong suốt nét:
              <input
                type="range"
                min="0"
                max="255"
                value={brushOpacity}
                onChange={(e) => setBrushOpacity(+e.target.value)}
                disabled={!isP5Ready}
              />
            </label>
          </div>

          <div className="flex flex-col items-center gap-2">
            <label className="flex items-center gap-2 text-[#6A5ACD]">
              🖌️ Màu đổ:
              <input
                type="color"
                value={fillColor}
                onChange={(e) => setFillColor(e.target.value)}
                disabled={!isP5Ready}
              />
              <input
                type="checkbox"
                checked={fillEnabled}
                onChange={() => setFillEnabled(!fillEnabled)}
                disabled={!isP5Ready}
              />
              Bật đổ màu
            </label>
            <div className="flex gap-1">
              {colorPalette.map((color, index) => (
                <input
                  key={index}
                  className="w-6 h-6 rounded-full border border-[#4682B4]"
                  style={{ backgroundColor: color }}
                  onClick={() => setFillColor(color)}
                  disabled={!isP5Ready}
                />
              ))}
            </div>
            <button
              onClick={() => setFillColor(randomColor())}
              className="bg-gradient-to-r from-purple-300 to-blue-300 text-white px-2 py-1 rounded hover:from-purple-400 hover:to-blue-400"
              disabled={!isP5Ready}
            >
              Màu ngẫu nhiên
            </button>
            <label className="flex items-center gap-2 text-[#6A5ACD]">
              🌫️ Độ trong suốt đổ:
              <input
                type="range"
                min="0"
                max="255"
                value={fillOpacity}
                onChange={(e) => setFillOpacity(+e.target.value)}
                disabled={!isP5Ready}
              />
            </label>
          </div>

          <label className="flex items-center gap-2 text-[#6A5ACD]">
            ✏️ Kích cỡ:
            <input
              type="range"
              min="1"
              max="50"
              value={brushSize}
              onChange={(e) => setBrushSize(+e.target.value)}
              disabled={!isP5Ready}
            />
          </label>
          <label className="flex items-center gap-2 text-[#6A5ACD]">
            🖌️ Kiểu:
            <select
              value={brushStyle}
              onChange={(e) => setBrushStyle(e.target.value)}
              className="p-1 border border-[#4682B4] rounded bg-white"
              disabled={!isP5Ready}
            >
              <option value="normal">Bình thường</option>
              <option value="dotted">Chấm</option>
              <option value="dashed">Nét đứt</option>
              <option value="curve">Đường cong</option>
              <option value="spray">Bút phun</option>
              <option value="feather">Bút lông</option>
              <option value="grid">Kẻ ô</option>
            </select>
          </label>
          <label className="flex items-center gap-2 text-[#6A5ACD]">
            📐 Hình học:
            <select
              value={shapeMode}
              onChange={(e) => setShapeMode(e.target.value)}
              className="p-1 border border-[#4682B4] rounded bg-white"
              disabled={!isP5Ready}
            >
              <option value="none">Không</option>
              <option value="circle">Hình tròn</option>
              <option value="rectangle">Hình chữ nhật</option>
              <option value="triangle">Tam giác</option>
              <option value="star">Ngôi sao</option>
              <option value="polygon">Đa giác</option>
              <option value="arrow">Mũi tên</option>
            </select>
          </label>
          {shapeMode === "polygon" && (
            <label className="flex items-center gap-2 text-[#6A5ACD]">
              🔢 Số cạnh:
              <input
                type="number"
                min="3"
                max="10"
                value={polygonSides}
                onChange={(e) =>
                  setPolygonSides(Math.max(3, Math.min(10, +e.target.value)))
                }
                className="p-1 border border-[#4682B4] rounded w-16 bg-white"
                disabled={!isP5Ready}
              />
            </label>
          )}
        </div>

        <div className="flex items-center gap-2 mt-4">
          <input
            type="text"
            placeholder="Nhập chữ để vẽ"
            value={textToDraw}
            onChange={(e) => setTextToDraw(e.target.value)}
            className="p-2 border border-[#4682B4] rounded bg-white w-64"
            disabled={!isP5Ready}
          />
          <button
            onClick={() => setDrawingText(!drawingText)}
            className="bg-gradient-to-r from-purple-300 to-blue-300 text-white px-4 py-2 rounded hover:from-purple-400 hover:to-blue-400"
            disabled={!isP5Ready}
          >
            {drawingText ? "Đang vẽ chữ" : "Chế độ chữ"}
          </button>
          <button
            onClick={() => setTextToDraw("")}
            className="bg-gradient-to-r from-purple-300 to-blue-300 text-white px-4 py-2 rounded hover:from-purple-400 hover:to-blue-400"
            disabled={!isP5Ready}
          >
            Xóa chữ
          </button>
        </div>
      </div>

      <div className="w-full max-w-2xl mb-6">
        <h2 className="text-xl font-semibold text-[#6A5ACD] mb-2">
          📝 Nội dung tranh
        </h2>
        <textarea
          value={blogNote}
          onChange={(e) => setBlogNote(e.target.value)}
          placeholder="Nhập nội dung..."
          className="w-full p-2 border border-[#4682B4] rounded h-32 bg-white"
          disabled={!isP5Ready}
        />
        <button
          onClick={saveBlogNote}
          className="bg-gradient-to-r from-purple-300 to-blue-300 text-white px-4 py-2 rounded hover:from-purple-400 hover:to-blue-400 mt-2"
          disabled={!isP5Ready}
        >
          Lưu bản vẽ
        </button>
      </div>

      <div className="w-full max-w-2xl mb-6">
        <h2 className="text-xl font-semibold text-[#6A5ACD] mb-2">
          📜 Danh sách tranh vẽ
        </h2>
        {blogNotes.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {blogNotes
              .slice()
              .reverse()
              .map((note, index) => (
                <div
                  key={index}
                  className="p-4 border border-[#4682B4] rounded bg-white shadow-md flex flex-col items-center"
                >
                  {editNoteIndex === index ? (
                    <div className="w-full flex flex-col items-center gap-2">
                      <textarea
                        value={editNoteText}
                        onChange={(e) => setEditNoteText(e.target.value)}
                        className="w-full p-2 border border-[#4682B4] rounded bg-white"
                        placeholder="Chỉnh sửa nội dung..."
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSaveEditNote(index)}
                          className="bg-gradient-to-r from-green-300 to-green-500 text-white px-3 py-1 rounded hover:from-green-400 hover:to-green-600"
                        >
                          Lưu
                        </button>
                        <button
                          onClick={() => setEditNoteIndex(null)}
                          className="bg-gradient-to-r from-gray-300 to-gray-500 text-white px-3 py-1 rounded hover:from-gray-400 hover:to-gray-600"
                        >
                          Hủy
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="mb-2 text-[#6A5ACD] text-center">
                        {note.note}
                      </p>
                      {note.drawing && (
                        <div className="flex justify-center w-full">
                          <img
                            src={note.drawing}
                            alt={`Bản vẽ ${index + 1}`}
                            className="max-w-full w-auto h-auto rounded"
                            style={{ maxHeight: "200px" }}
                          />
                        </div>
                      )}
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => handleEditNote(index, note.note)}
                          className="bg-gradient-to-r from-blue-300 to-blue-500 text-white px-3 py-1 rounded hover:from-blue-400 hover:to-blue-600"
                        >
                          Chỉnh sửa
                        </button>
                        <button
                          onClick={() => handleDeleteNote(index)}
                          className="bg-gradient-to-r from-red-300 to-red-500 text-white px-3 py-1 rounded hover:from-red-400 hover:to-red-600"
                        >
                          Xóa
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
          </div>
        ) : (
          <p className="text-[#6A5ACD]">Chưa có tranh vẽ nào.</p>
        )}
      </div>

      <div className="w-full max-w-2xl mb-6">
        <h2 className="text-xl font-semibold text-[#6A5ACD] mb-2">
          🖼️ Bộ sưu tập
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {drawings
            .slice()
            .reverse()
            .map((img, index) => (
              <div
                key={index}
                className="relative p-2 border border-[#4682B4] rounded bg-white shadow-md flex flex-col items-center"
              >
                <img
                  src={img}
                  alt={`Bản vẽ ${index + 1}`}
                  className="max-w-full w-auto h-auto rounded"
                  style={{ maxHeight: "200px" }}
                />
                <button
                  onClick={() => handleDeleteDrawing(index)}
                  className="absolute top-2 right-2 bg-gradient-to-r from-red-300 to-red-500 text-white px-2 py-1 rounded hover:from-red-400 hover:to-red-600"
                >
                  Xóa
                </button>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
