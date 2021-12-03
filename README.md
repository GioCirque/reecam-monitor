# ReeCam-Monitor

For monitoring ReeCam and SoSoCam IP camera devices on a local network.

## How To Use

1. Create a `.env` file locally with:

   ```sh
   REECAM_IP=192.168.1.122          # The IP Address of a camera on your network
   REECAM_PWD=<your_cam_password>   # The password for the specified camera on your network
   ```

2. `yarn install`
3. `yarn test`

   You should see something like:

   ```
   PASS  src/utils.test.ts
   PASS  src/reecam.test.ts
   -------------|---------|----------|---------|---------|-------------------
   File         | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
   -------------|---------|----------|---------|---------|-------------------
   All files    |   25.36 |    32.43 |   33.89 |   26.17 |
   index.ts     |       0 |        0 |       0 |       0 | 3-103
   monitor.ts   |       0 |        0 |       0 |       0 | 1-108
   recorder.ts  |       0 |        0 |       0 |       0 | 1-57
   reecam.ts    |   95.34 |    83.33 |   89.47 |   95.34 | 55-59
   utils.ts     |   91.66 |    66.66 |     100 |     100 | 12
   -------------|---------|----------|---------|---------|-------------------

   Test Suites: 2 passed, 2 total
   Tests:       16 passed, 16 total
   Snapshots:   0 total
   Time:        7.443 s
   Ran all test suites.
   ✨  Done in 8.62s.
   ```

4. `ipcams --help`

   You should see something like:

   ```
   Usage: ipcams [options] [command]

   Options:
     -V, --version    output the version number
     -h, --help       display help for command

   Commands:
     add <ip> <user>  Adds a configured camera. Password will be requested securely.
     list             Shows the configured IP cameras.
     remove <ip>      Removes a configured IP camera.
     monitor          Monitor online cameras
     help [command]   display help for command
   ```
5. `ipcams add <CAMERA_IP> admin|visitor`

   This will securely prompt your for a password and store the data encoded in a local file.

6. `ipcams monitor`

   This will start monitoring and producing event related content from camera alarm periods.

7. `yarn serve`

   This will start the monitor and local web server on port `8080`. You can navigate to the web app using `http://localhost:8080/app` in a browser or access the API at `http://localhost:8080/api`


8. `yarn start`

   This will start the monitor and local web server on port `8080` in a docker container, using the `docker-compose.yml` file. You can navigate to the web app using `http://localhost:8080/app` in a browser or access the API at `http://localhost:8080/api`

