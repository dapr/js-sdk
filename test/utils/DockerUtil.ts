import { exec } from "child_process";

export function executeDockerCommand(cmd: string): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!cmd) {
      return reject("CMD_SHOULD_NOT_BE_EMPTY");
    }

    exec(`docker exec ${cmd}`, (err, stdout, stderr) => {
      if (err) {
        return reject(err);
      }

      if (stderr) {
        return reject(stderr);
      }

      return resolve(stdout);
    })
  });
}