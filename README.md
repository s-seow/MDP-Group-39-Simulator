
<p align="center">
  
  <h1 align="center">
      SC2079 Multidisciplinary Project - Group 39 Algorithm Simulator
  </h1>
</p>

## Overview

This is the Algorithm Simulator for AY2025/26 Sem 1 MDP Group 39.

## Setup

```bash
npm install
```

To start the simulator:

```bash
npm run dev
```

The app will be running at `localhost:3000`.

## Usage

<div style="text-align:center"><img src="/images/00 Simulator Layout.png" alt="Interface" width=350 ></div>

1. Position the robot at the coordinates you want.
2. Click on the buttons to add obstacles at the coordinates you want. 
3. Click on `Start` to find the path, `Clear All` to clear the map and put the robot back to the starting position, `Clear Robot` to reset the robot to the starting position without clearing the map.

<div style="text-align:center"><img src="/images/01 Simulator Add Obstacles.png" alt="Interface" width=350 ></div>

You can also add obstacles without a symbol card by choosing the 'None' option for the direction.

<div style="text-align:center"><img src="/images/02 Simulator Directional Arrow.png" alt="Interface" width=350 ></div>

Use the left and right arrow buttons to go through the path step by step to see how the algorithm is working. Our build includes a directional arrow that shows you the robot path and when it takes pictures of obstacles.

The algorithm API server is running at a specified address in `BaseAPI.js`.