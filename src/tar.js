import { Step } from 'kronos-step';

const tar = require('tar-stream');

/**
 * Tar Step
 */
export class TarStep extends Step {
  static get name() {
    return 'kronos-tar';
  }
  static get description() {
    return 'composes entries into a tar archive';
  }
  static get endpoints() {
    return {
      in: {
        in: true
      },
      out: {
        out: true
      }
    };
  }

  async _start() {
    let current;

    this.endpoints.in.receive = request =>
      new Promise((resolve, reject) => {
        if (request.payload) {
          if (!current) {
            // start a new archive

            // what we need to handle one incoming request
            current = {
              requests: [request],
              pack: tar.pack()
            };

            current.reponse = this.endpoints.out.receive(
              {
                info: {},
                payload: current.pack
              },
              request
            );
          }

          // append entry
          const entry = current.pack.entry(
            {
              name: request.info.name
            },
            err => {
              if (err) {
                this.error(err);
                reject(err);

                if (current) {
                  current.pack.finalize();
                }
              }
            }
          );

          request.payload.pipe(entry);
        } else {
          // no stream so probably a separator request -> ready

          if (current) {
            current.pack.finalize();
            resolve(current.response);
            current = undefined;
          }
        }
      });
  }
}

import { UnTarStep } from './untar';
export { UnTarStep };

export async function registerWithManager(manager) {
  await manager.registerStep(UnTarStep);
  await manager.registerStep(TarStep);
}
