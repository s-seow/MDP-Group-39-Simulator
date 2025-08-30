import React from "react";
import { useState, useEffect } from "react";
import QueryAPI from "./QueryAPI";

const Direction = {
  NORTH: 0,
  EAST: 2,
  SOUTH: 4,
  WEST: 6,
  SKIP: 8,
};

const ObDirection = {
  NORTH: 0,
  EAST: 2,
  SOUTH: 4,
  WEST: 6,
  SKIP: 8,
};

const DirectionToString = {
  0: "Up",
  2: "Right",
  4: "Down",
  6: "Left",
  8: "None",
};

const transformCoord = (x, y) => {
  // Change the coordinate system from (0, 0) at top left to (0, 0) at bottom left
  return { x: 19 - y, y: x };
};

const CELL_SIZE_PX = 32; // This should match your cell's rendered size (w-8 h-8 means 32px by default for Tailwind)

const GRID_DIMENSION = 20; // 20x20 grid

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

export default function Simulator() {
  const [robotState, setRobotState] = useState({
    x: 1,
    y: 1,
    d: Direction.NORTH,
    s: -1,
  });
  const [robotX, setRobotX] = useState(1);
  const [robotY, setRobotY] = useState(1);
  const [robotDir, setRobotDir] = useState(0);
  const [obstacles, setObstacles] = useState([]);
  const [obXInput, setObXInput] = useState(0);
  const [obYInput, setObYInput] = useState(0);
  const [directionInput, setDirectionInput] = useState(ObDirection.NORTH);
  const [isComputing, setIsComputing] = useState(false);
  const [path, setPath] = useState([]);
  const [commands, setCommands] = useState([]);
  const [movementDirections, setMovementDirections] = useState([]);
  const [page, setPage] = useState(0);
  const [visitedPath, setVisitedPath] = useState([]); // to draw the moving path

  const generateNewID = () => {
    while (true) {
      let new_id = Math.floor(Math.random() * 10) + 1; // just try to generate an id;
      let ok = true;
      for (const ob of obstacles) {
        if (ob.id === new_id) {
          ok = false;
          break;
        }
      }
      if (ok) {
        return new_id;
      }
    }
  };

  const generateRobotCells = () => {
    const robotCells = [];
    let markerX = 0;
    let markerY = 0;

    if (Number(robotState.d) === Direction.NORTH) {
      markerY++;
    } else if (Number(robotState.d) === Direction.EAST) {
      markerX++;
    } else if (Number(robotState.d) === Direction.SOUTH) {
      markerY--;
    } else if (Number(robotState.d) === Direction.WEST) {
      markerX--;
    }

    // Go from i = -1 to i = 1
    for (let i = -1; i < 2; i++) {
      // Go from j = -1 to j = 1
      for (let j = -1; j < 2; j++) {
        // Transform the coordinates to our coordinate system where (0, 0) is at the bottom left
        const coord = transformCoord(robotState.x + i, robotState.y + j);
        // If the cell is the marker cell, add the robot state to the cell
        if (markerX === i && markerY === j) {
          robotCells.push({
            x: coord.x,
            y: coord.y,
            d: robotState.d,
            s: robotState.s,
          });
        } else {
          robotCells.push({
            x: coord.x,
            y: coord.y,
            d: null,
            s: -1,
          });
        }
      }
    }

    return robotCells;
  };

  const onChangeX = (event) => {
    // If the input is an integer and is in the range [0, 19], set ObXInput to the input
    if (Number.isInteger(Number(event.target.value))) {
      const nb = Number(event.target.value);
      if (0 <= nb && nb < 20) {
        setObXInput(nb);
        return;
      }
    }
    // If the input is not an integer or is not in the range [0, 19], set the input to 0
    setObXInput(0);
  };

  const onChangeY = (event) => {
    // If the input is an integer and is in the range [0, 19], set ObYInput to the input
    if (Number.isInteger(Number(event.target.value))) {
      const nb = Number(event.target.value);
      if (0 <= nb && nb <= 19) {
        setObYInput(nb);
        return;
      }
    }
    // If the input is not an integer or is not in the range [0, 19], set the input to 0
    setObYInput(0);
  };

  const onChangeRobotX = (event) => {
    // If the input is an integer and is in the range [1, 18], set RobotX to the input
    if (Number.isInteger(Number(event.target.value))) {
      const nb = Number(event.target.value);
      if (1 <= nb && nb < 19) {
        setRobotX(nb);
        return;
      }
    }
    // If the input is not an integer or is not in the range [1, 18], set the input to 1
    setRobotX(1);
  };

  const onChangeRobotY = (event) => {
    // If the input is an integer and is in the range [1, 18], set RobotY to the input
    if (Number.isInteger(Number(event.target.value))) {
      const nb = Number(event.target.value);
      if (1 <= nb && nb < 19) {
        setRobotY(nb);
        return;
      }
    }
    // If the input is not an integer or is not in the range [1, 18], set the input to 1
    setRobotY(1);
  };

  const onClickObstacle = () => {
    // If the input is not valid, return
    if (!obXInput && !obYInput) return;
    // Create a new array of obstacles
    const newObstacles = [...obstacles];
    // Add the new obstacle to the array
    newObstacles.push({
      x: obXInput,
      y: obYInput,
      d: directionInput,
      id: generateNewID(),
    });
    // Set the obstacles to the new array
    setObstacles(newObstacles);
  };

  const onClickRobot = () => {
    // Set the robot state to the input

    setRobotState({ x: robotX, y: robotY, d: robotDir, s: -1 });
  };

  const onDirectionInputChange = (event) => {
    // Set the direction input to the input
    setDirectionInput(Number(event.target.value));
  };

  const onRobotDirectionInputChange = (event) => {
    // Set the robot direction to the input
    setRobotDir(event.target.value);
  };

  const onRemoveObstacle = (ob) => {
    // If the path is not empty or the algorithm is computing, return
    if (path.length > 0 || isComputing) return;
    // Create a new array of obstacles
    const newObstacles = [];
    // Add all the obstacles except the one to remove to the new array
    for (const o of obstacles) {
      if (o.x === ob.x && o.y === ob.y) continue;
      newObstacles.push(o);
    }
    // Set the obstacles to the new array
    setObstacles(newObstacles);
  };

  const compute = () => {
    // Set computing to true, act like a lock
    setIsComputing(true);
    // Call the query function from the API
    QueryAPI.query(obstacles, robotX, robotY, robotDir, (data, err) => {
      if (data) {
        // If the data is valid, set the path
        setPath(data.data.path);
        // Set the commands
        const commands = [];
        // Store movement direction
        const movementDirections = [];
        for (let x of data.data.commands) {
          // If the command is a snapshot, skip it
          if (x.startsWith("SNAP")) {
            continue;
          }
          commands.push(x);

          // Parse movement direction for the path
          if (x.startsWith("FW")) {
            movementDirections.push('FW');
          } else if (x.startsWith("BW")) {
            movementDirections.push('BW');
          } else {
            movementDirections.push(null); // No movement command for this step (e.g., BR, BL)
          }
        }
        setCommands(commands);
        setMovementDirections(movementDirections);
      }
      // Set computing to false, release the lock
      setIsComputing(false);
    });
  };

  const onResetAll = () => {
    // Reset all the states
    setRobotX(1);
    setRobotDir(0);
    setRobotY(1);
    setRobotState({ x: 1, y: 1, d: Direction.NORTH, s: -1 });
    setPath([]);
    setCommands([]);
    setMovementDirections([]);
    setPage(0);
    setVisitedPath([]);
    setObstacles([]);
  };

  const onReset = () => {
    // Reset all the states
    setRobotX(1);
    setRobotDir(0);
    setRobotY(1);
    setRobotState({ x: 1, y: 1, d: Direction.NORTH, s: -1 });
    setPath([]);
    setCommands([]);
    setMovementDirections([]);
    setPage(0);
    setVisitedPath([]);
  };

  const onSkipToStart = () => {
    setPage(0);
  };

  const onSkipToEnd = () => {
    setPage(path.length - 1);
  };

  const renderGrid = () => {
    // Initialize the empty rows array
    const rows = [];

    const baseStyle = {
      width: 25,
      height: 25,
      borderStyle: "solid",
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderLeftWidth: 1,
      borderRightWidth: 1,
      padding: 0,
    };

    // Generate robot cells
    const robotCells = generateRobotCells();

    // Generate the grid
    for (let i = 0; i < 20; i++) {
      const cells = [
        // Header cells
        <td key={i} className="w-8 h-8">
          <span className="text-sky-900 font-bold text-[0.6rem] md:text-base ">
            {19 - i}
          </span>
        </td>,
      ];

      for (let j = 0; j < 20; j++) {
        let foundOb = null;
        let foundRobotCell = null;

        for (const ob of obstacles) {
          const transformed = transformCoord(ob.x, ob.y);
          if (transformed.x === i && transformed.y === j) {
            foundOb = ob;
            break;
          }
        }

        if (!foundOb) {
          for (const cell of robotCells) {
            if (cell.x === i && cell.y === j) {
              foundRobotCell = cell;
              break;
            }
          }
        }

        if (foundOb) {
          if (foundOb.d === Direction.WEST) {
            cells.push(
              <td className="border border-l-4 border-l-red-500 w-5 h-5 md:w-8 md:h-8 bg-blue-700" />
            );
          } else if (foundOb.d === Direction.EAST) {
            cells.push(
              <td className="border border-r-4 border-r-red-500 w-5 h-5 md:w-8 md:h-8 bg-blue-700" />
            );
          } else if (foundOb.d === Direction.NORTH) {
            cells.push(
              <td className="border border-t-4 border-t-red-500 w-5 h-5 md:w-8 md:h-8 bg-blue-700" />
            );
          } else if (foundOb.d === Direction.SOUTH) {
            cells.push(
              <td className="border border-b-4 border-b-red-500 w-5 h-5 md:w-8 md:h-8 bg-blue-700" />
            );
          } else if (foundOb.d === Direction.SKIP) {
            cells.push(
              <td className="border w-5 h-5 md:w-8 md:h-8 bg-blue-700" />
            );
          }
        } else if (foundRobotCell) {
          if (foundRobotCell.d !== null) {
            cells.push(
              <td
                className={`border w-8 h-8 ${
                  foundRobotCell.s != -1 ? "bg-red-500" : "bg-yellow-300"
                }`}
              />
            );
          } else {
            cells.push(
              <td className="bg-green-600 border-white border w-8 h-8" />
            );
          }
        } else {
          cells.push(
            <td className="border-black border w-8 h-8" />
          );
        }
      }

      rows.push(<tr key={19 - i}>{cells}</tr>);
    }

    const yAxis = [<td key={0} />];
    for (let i = 0; i < 20; i++) {
      yAxis.push(
        <td className="w-8 h-8">
          <span className="text-sky-900 font-bold text-[0.6rem] md:text-base ">
            {i}
          </span>
        </td>
      );
    }
    rows.push(<tr key={20}>{yAxis}</tr>);
    return rows;
  };

  useEffect(() => {
    if (page >= path.length) return;
    setRobotState(path[page]);
  }, [page, path]); // This effect runs when page changes to update the robot state

  useEffect(() => {
    // If a path exists, store only the center (x, y) for each step up to the current page
    if (path.length > 0) {
      setVisitedPath(path.slice(0, page + 1).map(step => ({ x: step.x, y: step.y }))); // <<< MODIFIED LINE
    } else {
      // Clear the visited path if the main path is reset
      setVisitedPath([]);
    }
  }, [page, path]);

  const generatePathAndMarkers = (path, commands, cellSize, gridDimension, markerDensity = 0.5) => { // Added commands & markerDensity
    if (!path || path.length < 2) {
      return { d: "", markers: [] };
    }

    const screenPoints = path.map(point => ({
      x: point.x * cellSize + cellSize / 2,
      y: (gridDimension - 1 - point.y) * cellSize + cellSize / 2,
    }));

    let d = `M ${screenPoints[0].x} ${screenPoints[0].y}`;
    const markers = []; // To store marker data

    // Loop to draw main path (same as before) and gather marker points
    for (let i = 1; i < screenPoints.length - 1; i++) {
      const p_prev = screenPoints[i-1];
      const p_curr = screenPoints[i];
      const p_next = screenPoints[i+1];

      const midpoint1 = { x: (p_prev.x + p_curr.x) / 2, y: (p_prev.y + p_curr.y) / 2 };
      const midpoint2 = { x: (p_curr.x + p_next.x) / 2, y: (p_curr.y + p_next.y) / 2 };
      
      d += ` L ${midpoint1.x} ${midpoint1.y}`;
      d += ` Q ${p_curr.x} ${p_curr.y} ${midpoint2.x} ${midpoint2.y}`;
    }
    d += ` L ${screenPoints[screenPoints.length - 1].x} ${screenPoints[screenPoints.length - 1].y}`;

    // Generate markers
    // Iterate through path segments, not individual points, as commands refer to segments
    for (let i = 0; i < screenPoints.length - 1; i++) {
        const startPoint = screenPoints[i];
        const endPoint = screenPoints[i + 1];
        const command = commands[i]; // Get command for this segment

        if (!command || (command !== 'FW' && command !== 'BW')) {
            continue; // Only add markers for FW/BW movements
        }

        // Calculate a point along the segment for the marker
        // You can adjust markerDensity to place markers closer or further apart
        const markerPoint = {
            x: startPoint.x + (endPoint.x - startPoint.x) * markerDensity,
            y: startPoint.y + (endPoint.y - startPoint.y) * markerDensity,
        };

        // Calculate the angle of the segment for arrow rotation
        var angle = Math.atan2(endPoint.y - startPoint.y, endPoint.x - startPoint.x) * 180 / Math.PI;
        
        if (command === 'BW') {
          angle += 180; // Rotate 180 degrees for backward movement
        }

        markers.push({
            point: markerPoint,
            angle: angle,
            direction: command // 'FW' or 'BW'
        });
    }

    return { d, markers };
  };

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="flex flex-col items-center text-center bg-sky-200 rounded-xl shadow-xl mb-8">
        <h2 className="card-title text-black pt-4">Algorithm Simulator</h2>
      </div>

      <div className="flex flex-col items-center text-center bg-sky-200 rounded-xl shadow-xl">
        <div className="card-body items-center text-center p-4">
          <h2 className="card-title text-black">Robot Position</h2>
          <div className="form-control">
            <label className="input-group input-group-horizontal">
              <span className="bg-primary p-2">X</span>
              <input
                onChange={onChangeRobotX}
                type="number"
                placeholder="1"
                min="1"
                max="18"
                className="input input-bordered  text-blue-900 w-20"
              />
              <span className="bg-primary p-2">Y</span>
              <input
                onChange={onChangeRobotY}
                type="number"
                placeholder="1"
                min="1"
                max="18"
                className="input input-bordered  text-blue-900 w-20"
              />
              <span className="bg-primary p-2">D</span>
              <select
                onChange={onRobotDirectionInputChange}
                value={robotDir}
                className="select text-blue-900 py-2 pl-2 pr-6"
              >
                <option value={ObDirection.NORTH}>Up</option>
                <option value={ObDirection.SOUTH}>Down</option>
                <option value={ObDirection.WEST}>Left</option>
                <option value={ObDirection.EAST}>Right</option>
              </select>
              <button className="btn btn-success p-2" onClick={onClickRobot}>
                Set
              </button>
            </label>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center text-center bg-sky-200 p-4 rounded-xl shadow-xl m-8">
        <h2 className="card-title text-black pb-2">Add Obstacles</h2>
        <div className="form-control">
          <label className="input-group input-group-horizontal">
            <span className="bg-primary p-2">X</span>
            <input
              onChange={onChangeX}
              type="number"
              placeholder="1"
              min="0"
              max="19"
              className="input input-bordered  text-blue-900 w-20"
            />
            <span className="bg-primary p-2">Y</span>
            <input
              onChange={onChangeY}
              type="number"
              placeholder="1"
              min="0"
              max="19"
              className="input input-bordered  text-blue-900 w-20"
            />
            <span className="bg-primary p-2">D</span>
            <select
              onChange={onDirectionInputChange}
              value={directionInput}
              className="select text-blue-900 py-2 pl-2 pr-6"
            >
              <option value={ObDirection.NORTH}>Up</option>
              <option value={ObDirection.SOUTH}>Down</option>
              <option value={ObDirection.WEST}>Left</option>
              <option value={ObDirection.EAST}>Right</option>
              <option value={ObDirection.SKIP}>None</option>
            </select>
            <button className="btn btn-success p-2" onClick={onClickObstacle}>
              Add
            </button>
          </label>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-x-2 gap-y-4 items-center">
        {obstacles.map((ob) => {
          return (
            <div
              key={ob}
              className="badge flex flex-row text-black bg-sky-100 rounded-xl text-xs md:text-sm h-max border-cyan-500"
            >
              <div flex flex-col>
                <div>X: {ob.x}</div>
                <div>Y: {ob.y}</div>
                <div>D: {DirectionToString[ob.d]}</div>
              </div>
              <div>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  className="inline-block w-4 h-4 stroke-current"
                  onClick={() => onRemoveObstacle(ob)}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  ></path>
                </svg>
              </div>
            </div>
          );
        })}
      </div>
      <div className="btn-group btn-group-horizontal py-4">
        <button className="btn btn-error" onClick={onResetAll}>
          Reset All
        </button>
        <button className="btn btn-warning" onClick={onReset}>
          Reset Robot
        </button>
        <button className="btn btn-success" onClick={compute}>
          Submit
        </button>
      </div>

      {path.length > 0 && (
        <div className="flex flex-row items-center text-center bg-sky-200 p-4 rounded-xl shadow-xl my-8">
          <button
            className="btn btn-circle pt-2 pl-1"
            disabled={page === 0}
            onClick={onSkipToStart}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
              />
            </svg>
          </button>

          <button
            className="btn btn-circle pt-2 pl-1"
            disabled={page === 0}
            onClick={() => {
              setPage(page - 1);
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z"
              />
            </svg>
          </button>

          <span className="mx-5 text-black">
            Step: {page + 1} / {path.length}
          </span>
          <span className="mx-5 text-black">{commands[page]}</span>
          <button
            className="btn btn-circle pt-2 pl-2"
            disabled={page === path.length - 1}
            onClick={() => {
              setPage(page + 1);
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z"
              />
            </svg>
          </button>

          <button
            className="btn btn-circle pt-2 pl-2"
            disabled={page === path.length - 1}
            onClick={onSkipToEnd}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 5l7 7-7 7M6 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>
      )}
      
      <div style={{ position: 'relative', width: CELL_SIZE_PX * (GRID_DIMENSION + 1), height: CELL_SIZE_PX * (GRID_DIMENSION + 1)}}>
        <table className="border-collapse border-none border-black ">
          <tbody>{renderGrid()}</tbody>
        </table>
        {visitedPath.length > 1 && ( // Only draw if there are at least two points
          <svg
            style={{
              position: 'absolute',
              // The SVG should be offset by one cell size to align over the grid area
              top: 0,
              left: CELL_SIZE_PX,
              // The SVG area covers the 20x20 grid itself
              width: CELL_SIZE_PX * GRID_DIMENSION,
              height: CELL_SIZE_PX * GRID_DIMENSION,
              pointerEvents: 'none',
            }}
          >
            {(() => {
              const { d, markers } = generatePathAndMarkers(
                visitedPath,
                movementDirections, // Pass the movementDirections array
                CELL_SIZE_PX,
                GRID_DIMENSION
              );
              return (
                <>
                  <path
                    d={d}
                    fill="none"
                    stroke="red"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {markers.map((marker, index) => (
                    <polygon
                      key={`marker-${index}`}
                      points="-8,8 12,0 -8,-8" // Small triangle pointing right (local coordinates)
                      fill={marker.direction === 'FW' ? 'green' : 'blue'} // Green for FW, Blue for BW
                      transform={`translate(${marker.point.x}, ${marker.point.y}) rotate(${marker.angle})`}
                    />
                  ))}
                </>
              );
            })()}
          </svg>
        )}
      </div>
    </div>
  );
}
